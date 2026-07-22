const pty = require('@homebridge/node-pty-prebuilt-multiarch');
const { Terminal: HeadlessTerminal } = require('@xterm/headless');
const { SerializeAddon } = require('@xterm/addon-serialize');
const { normalizeCwd } = require('./shell');

const OUTPUT_FLUSH_MS = 16;
const DEFAULT_COLS = 100;
const DEFAULT_ROWS = 30;

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

  getOrCreate(paneId) {
    if (this.processes.has(paneId)) {
      return this.processes.get(paneId);
    }

    const found = this.store.findPane(paneId);
    if (!found) {
      throw new Error(`Unknown pane: ${paneId}`);
    }
    if (found.pane.type !== 'terminal') {
      throw new Error(`Pane is not a terminal: ${paneId}`);
    }

    const runtime = this.createRuntime(paneId, found);
    this.processes.set(paneId, runtime);
    return runtime;
  }

  createRuntime(paneId, found) {
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
        cwd: normalizeCwd(found.pane.cwd, this.root),
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          COLORTERM: 'truecolor',
          FORCE_COLOR: '1'
        }
      })
    );
    runtime.proc = proc;

    proc.onData((data) => {
      this.store.appendScrollback(paneId, data);
      runtime.hasOutput = true;
      runtime.writeChain = runtime.writeChain.then(() => writeHeadless(headless, data)).catch(() => {});
    });

    proc.onExit(() => {
      runtime.status = 'exited';
      runtime.exitedAt = new Date().toISOString();
      runtime.headless.dispose();
      this.processes.delete(paneId);
    });

    return runtime;
  }

  attach(paneId, ws) {
    const found = this.store.findPane(paneId);
    if (!found) {
      ws.close(1008, 'Unknown pane');
      return;
    }
    if (found.pane.type !== 'terminal') {
      ws.close(1008, 'Pane is not a terminal');
      return;
    }

    if (this.config.terminal?.backend === 'xterm_pty') {
      this.attachReplay(paneId, found, ws);
      return;
    }

    const runtime = this.getOrCreate(paneId);
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

  attachReplay(paneId, found, ws) {
    const sender = createOutputSender(ws);
    for (const chunk of found.pane.scrollback || []) {
      sender.send(chunk);
    }

    const runtime = this.getOrCreate(paneId);
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

  getPaneStatus(paneId) {
    const found = this.store.findPane(paneId);
    if (!found || found.pane.type !== 'terminal') {
      return null;
    }
    const runtime = this.processes.get(paneId);
    return {
      id: found.pane.id,
      status: runtime?.status || 'idle',
      shell: this.shell.command
    };
  }

  killPane(paneId) {
    const runtime = this.processes.get(paneId);
    if (!runtime) {
      return;
    }

    runtime.proc.kill();
    runtime.headless.dispose();
    this.processes.delete(paneId);
  }

  killSession(session) {
    for (const tab of session.tabs) {
      for (const pane of tab.panes) {
        this.killPane(pane.id);
      }
    }
  }

  shutdown() {
    for (const paneId of [...this.processes.keys()]) {
      this.killPane(paneId);
    }
  }
}

module.exports = {
  buildPtySpawnOptions,
  createOutputSender,
  writeHeadless,
  TerminalManager
};

function writeHeadless(term, data) {
  return new Promise((resolve) => {
    term.write(data, resolve);
  });
}
