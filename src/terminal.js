const path = require('path');
const { fork } = require('child_process');
const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const { Terminal: HeadlessTerminal } = require('@xterm/headless');
const { SerializeAddon } = require('@xterm/addon-serialize');
const { normalizeCwd, shellEnv } = require('./shell');

const OUTPUT_FLUSH_MS = 16;
const DEFAULT_COLS = 100;
const DEFAULT_ROWS = 30;
const CONSOLE_LIST_AGENT = path.join(__dirname, 'console-process-list.js');
const CONSOLE_LIST_TIMEOUT_MS = 3000;

// A shell sitting at its prompt owns its console alone. Anything else attached
// to that console is the command the user is still waiting on. The helper
// attaches to the console itself, so it shows up in its own answer.
function foregroundProcessIds(shellPid) {
  return new Promise((resolve) => {
    if (process.platform !== 'win32' || !shellPid) {
      resolve([]);
      return;
    }
    let agent = null;
    let settled = false;
    const finish = (pids) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      try {
        agent?.kill();
      } catch {
        // The helper usually exited on its own already.
      }
      resolve(pids);
    };
    const timer = setTimeout(() => finish([]), CONSOLE_LIST_TIMEOUT_MS);
    try {
      agent = fork(CONSOLE_LIST_AGENT, [String(shellPid)], { stdio: 'ignore', windowsHide: true });
    } catch {
      finish([]);
      return;
    }
    agent.on('message', (message) => {
      const pids = Array.isArray(message?.pids) ? message.pids : [];
      finish(pids.filter((pid) => pid !== shellPid && pid !== agent.pid));
    });
    agent.on('error', () => finish([]));
    agent.on('exit', () => finish([]));
  });
}

function buildPtySpawnOptions({ cols, rows, cwd, env }) {
  return {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env,
    ...(process.platform === 'win32' ? { useConptyDll: false } : {})
  };
}

function createOutputSender(ws) {
  let buffer = '';
  let timer = null;

  const flush = () => {
    timer = null;
    if (!buffer || ws.readyState !== ws.OPEN) {
      buffer = '';
      return;
    }
    const data = buffer;
    buffer = '';
    ws.send(JSON.stringify({ type: 'output', data }));
  };

  return {
    send(data) {
      if (ws.readyState !== ws.OPEN) {
        return;
      }
      buffer += data;
      if (!timer) {
        timer = setTimeout(flush, OUTPUT_FLUSH_MS);
      }
    },
    dispose() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (buffer && ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: 'output', data: buffer }));
      }
      buffer = '';
    }
  };
}

class TerminalManager {
  constructor({ config, root, store, shell }) {
    this.config = config;
    this.root = root;
    this.store = store;
    this.shell = shell;
    this.processes = new Map();
  }

  updateConfig(config, shell) {
    this.config = config;
    this.shell = shell;
  }

  findTarget(id) {
    const terminalTab = this.store.findTerminalTab(id);
    if (terminalTab) {
      return { pane: terminalTab.pane, cwd: terminalTab.terminalTab.cwd, scrollback: terminalTab.terminalTab.scrollback };
    }
    const found = this.store.findPane(id);
    if (!found || found.pane.type !== 'terminal') {
      return null;
    }
    return { pane: found.pane, cwd: found.pane.cwd, scrollback: found.pane.scrollback };
  }

  getOrCreate(terminalId) {
    if (this.processes.has(terminalId)) {
      return this.processes.get(terminalId);
    }

    const target = this.findTarget(terminalId);
    if (!target) {
      throw new Error(`Unknown terminal: ${terminalId}`);
    }

    const runtime = this.createRuntime(terminalId, target);
    this.processes.set(terminalId, runtime);
    return runtime;
  }

  createRuntime(terminalId, target) {
    const scrollback = Math.max(0, Number(this.config.terminal?.reconnect_scrollback_lines) || 2000);
    const headless = new HeadlessTerminal({
      allowProposedApi: true,
      cols: DEFAULT_COLS,
      rows: DEFAULT_ROWS,
      scrollback
    });
    const serializer = new SerializeAddon();
    headless.loadAddon(serializer);
    const runtime = {
      paneId: target.pane.id,
      proc: null,
      headless,
      serializer,
      writeChain: Promise.resolve(),
      cols: DEFAULT_COLS,
      rows: DEFAULT_ROWS,
      status: 'running',
      createdAt: Date.now(),
      hasOutput: false,
      exitedAt: ''
    };

    const proc = pty.spawn(
      this.shell.command,
      this.shell.args,
      buildPtySpawnOptions({
        cols: DEFAULT_COLS,
        rows: DEFAULT_ROWS,
        cwd: normalizeCwd(target.cwd, this.root),
        env: shellEnv(this.config, {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          FORCE_COLOR: '1'
        })
      })
    );
    runtime.proc = proc;

    proc.onData((data) => {
      this.store.appendScrollback(terminalId, data);
      runtime.hasOutput = true;
      runtime.writeChain = runtime.writeChain.then(() => writeHeadless(headless, data)).catch(() => {});
    });

    proc.onExit(() => {
      runtime.status = 'exited';
      runtime.exitedAt = new Date().toISOString();
      runtime.headless.dispose();
      this.processes.delete(terminalId);
    });

    return runtime;
  }

  // Three buffers hold the same output: the browser terminal, the replay copies
  // here, and the one ConPTY keeps for itself. Clearing fewer than all three
  // lets the old output reappear, because ConPTY repaints its screen after a
  // reconnect and that repaint refills the replay buffer. Form feed is what
  // clears ConPTY: PSReadLine and readline bind it to ClearScreen, so it keeps
  // a half-typed input line and never reaches the shell history.
  clearTerminal(terminalId) {
    this.store.clearScrollback(terminalId);
    const runtime = this.processes.get(terminalId);
    if (!runtime) {
      return;
    }
    runtime.proc.write('\f');
    runtime.writeChain = runtime.writeChain.then(() => runtime.headless.clear()).catch(() => {});
  }

  attach(terminalId, ws) {
    const target = this.findTarget(terminalId);
    if (!target) {
      ws.close(1008, 'Unknown terminal');
      return;
    }

    if (this.config.terminal?.backend === 'xterm_pty') {
      this.attachReplay(terminalId, target, ws);
      return;
    }

    const runtime = this.getOrCreate(terminalId);
    const sender = createOutputSender(ws);
    let snapshotSent = false;
    const sendSnapshot = async () => {
      if (snapshotSent || ws.readyState !== ws.OPEN) {
        return;
      }
      snapshotSent = true;
      await runtime.writeChain;
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'snapshot',
          data: runtime.serializer.serialize(),
          cols: runtime.cols,
          rows: runtime.rows
        }));
      }
    };
    let fallbackSnapshotTimer = setTimeout(() => {
      sendSnapshot().catch(() => {});
    }, 1000);

    const disposable = runtime.proc.onData((data) => {
      if (snapshotSent) {
        sender.send(data);
      }
    });

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (message.type === 'input') {
        runtime.proc.write(message.data);
      }
      if (message.type === 'clear') {
        this.clearTerminal(terminalId);
      }
      if (message.type === 'resize') {
        const cols = Number(message.cols);
        const rows = Number(message.rows);
        if (Number.isInteger(cols) && Number.isInteger(rows) && cols > 0 && rows > 0) {
          runtime.cols = cols;
          runtime.rows = rows;
          runtime.proc.resize(cols, rows);
          runtime.headless.resize(cols, rows);
          clearTimeout(fallbackSnapshotTimer);
          const age = Date.now() - runtime.createdAt;
          const startupDelay = age < 800 ? 800 - age : 0;
          fallbackSnapshotTimer = setTimeout(() => {
            sendSnapshot().catch(() => {});
          }, Math.max(startupDelay, runtime.hasOutput ? 0 : 250));
        }
      }
    });

    ws.on('close', () => {
      clearTimeout(fallbackSnapshotTimer);
      disposable.dispose();
      sender.dispose();
      this.store.save();
    });
  }

  attachReplay(terminalId, target, ws) {
    const sender = createOutputSender(ws);
    for (const chunk of target.scrollback || []) {
      sender.send(chunk);
    }

    const runtime = this.getOrCreate(terminalId);
    const disposable = runtime.proc.onData((data) => {
      sender.send(data);
    });

    ws.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (message.type === 'input') {
        runtime.proc.write(message.data);
      }
      if (message.type === 'clear') {
        this.clearTerminal(terminalId);
      }
      if (message.type === 'resize') {
        const cols = Number(message.cols);
        const rows = Number(message.rows);
        if (Number.isInteger(cols) && Number.isInteger(rows) && cols > 0 && rows > 0) {
          runtime.cols = cols;
          runtime.rows = rows;
          runtime.proc.resize(cols, rows);
          runtime.headless.resize(cols, rows);
        }
      }
    });

    ws.on('close', () => {
      disposable.dispose();
      sender.dispose();
      this.store.save();
    });
  }

  // Closing a pane kills every shell in it, so the pane asks first which of its
  // tabs still has a command running.
  async busyTerminalTabs(paneId) {
    const found = this.store.findPane(paneId);
    if (!found || found.pane.type !== 'terminal') {
      return [];
    }
    const checked = await Promise.all((found.pane.terminalTabs || []).map(async (tab) => {
      const runtime = this.processes.get(tab.id);
      if (!runtime || runtime.status !== 'running') {
        return null;
      }
      const running = await foregroundProcessIds(runtime.proc?.pid);
      return running.length ? { id: tab.id, title: tab.title } : null;
    }));
    return checked.filter(Boolean);
  }

  getPaneStatus(paneId) {
    const found = this.store.findPane(paneId);
    if (!found || found.pane.type !== 'terminal') {
      return null;
    }
    const runtime = this.processes.get(found.pane.activeTerminalTabId) || this.processes.get(paneId);
    return {
      id: found.pane.id,
      status: runtime?.status || 'idle',
      shell: this.shell.command
    };
  }

  killTerminal(terminalId) {
    const runtime = this.processes.get(terminalId);
    if (!runtime) {
      return;
    }

    runtime.proc.kill();
    runtime.headless.dispose();
    this.processes.delete(terminalId);
  }

  killPane(paneId) {
    this.killTerminal(paneId);
    for (const [terminalId, runtime] of [...this.processes.entries()]) {
      if (runtime.paneId === paneId) {
        this.killTerminal(terminalId);
      }
    }
  }

  killSession(session) {
    for (const tab of session.tabs) {
      for (const pane of tab.panes) {
        this.killPane(pane.id);
      }
    }
  }

  shutdown() {
    for (const terminalId of [...this.processes.keys()]) {
      this.killTerminal(terminalId);
    }
  }
}

module.exports = {
  buildPtySpawnOptions,
  createOutputSender,
  foregroundProcessIds,
  writeHeadless,
  TerminalManager
};

function writeHeadless(term, data) {
  return new Promise((resolve) => {
    term.write(data, resolve);
  });
}
