const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Terminal: HeadlessTerminal } = require('@xterm/headless');
const { SerializeAddon } = require('@xterm/addon-serialize');
const { StateStore } = require('../src/state');
const { buildPtySpawnOptions, createOutputSender, foregroundProcessIds, TerminalManager } = require('../src/terminal');

const windowsOnly = { skip: process.platform !== 'win32' ? 'ConPTY is Windows only' : false };

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createHeadlessRuntime() {
  const headless = new HeadlessTerminal({ allowProposedApi: true, cols: 100, rows: 30, scrollback: 2000 });
  const serializer = new SerializeAddon();
  headless.loadAddon(serializer);
  return {
    proc: { write() {}, kill() {} },
    headless,
    serializer,
    writeChain: Promise.resolve()
  };
}

test('terminal manager rejects files panes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const filesPane = store.createFilesPane(paneId, 'C:\\');
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: 'powershell.exe', args: [] }
  });

  assert.throws(() => manager.getOrCreate(filesPane.id), /Unknown terminal/);
});

test('terminal manager resolves runtimes by terminal tab id', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const pane = store.state.sessions[0].tabs[0].panes[0];
  const secondTab = store.createTerminalTab(pane.id);
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: 'powershell.exe', args: [] }
  });

  const target = manager.findTarget(secondTab.id);
  assert.equal(target.pane.id, pane.id);
  assert.equal(target.cwd, pane.cwd);
  assert.deepEqual(target.scrollback, []);

  store.appendScrollback(secondTab.id, 'tab output');
  assert.deepEqual(store.findTerminalTab(secondTab.id).terminalTab.scrollback, ['tab output']);
  assert.deepEqual(pane.terminalTabs[0].scrollback, []);
});

test('clearing a terminal drops the stored replay scrollback', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const pane = store.state.sessions[0].tabs[0].panes[0];
  const tabId = pane.activeTerminalTabId;

  store.appendScrollback(tabId, 'old output');
  assert.deepEqual(store.findTerminalTab(tabId).terminalTab.scrollback, ['old output']);

  store.clearScrollback(tabId);
  assert.deepEqual(store.findTerminalTab(tabId).terminalTab.scrollback, []);
});

test('terminal manager clears the headless replay buffer for a live runtime', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].panes[0].activeTerminalTabId;
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: process.platform === 'win32' ? 'powershell.exe' : 'sh', args: [] }
  });

  const runtime = createHeadlessRuntime();
  manager.processes.set(tabId, runtime);
  store.appendScrollback(tabId, 'old output');
  runtime.writeChain = runtime.writeChain.then(() => new Promise((resolve) => {
    runtime.headless.write('old output\r\n', resolve);
  }));
  await runtime.writeChain;
  assert.match(runtime.serializer.serialize(), /old output/);

  manager.clearTerminal(tabId);
  await runtime.writeChain;
  assert.doesNotMatch(runtime.serializer.serialize(), /old output/);
  assert.deepEqual(store.findTerminalTab(tabId).terminalTab.scrollback, []);

  manager.shutdown();
});

test('clearing a terminal clears the ConPTY screen buffer through the shell', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].panes[0].activeTerminalTabId;
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: process.platform === 'win32' ? 'powershell.exe' : 'sh', args: [] }
  });

  const runtime = createHeadlessRuntime();
  manager.processes.set(tabId, runtime);
  const written = [];
  runtime.proc.write = (data) => written.push(data);

  manager.clearTerminal(tabId);

  // Form feed: PSReadLine and readline both bind it to ClearScreen, which keeps
  // the half-typed input line and stays out of the shell history.
  assert.deepEqual(written, ['\f']);

  manager.shutdown();
});

test('terminal spawn options use the Windows system ConPTY', () => {
  const options = buildPtySpawnOptions({
    cols: 100,
    rows: 30,
    cwd: 'C:\\',
    env: { TERM: 'xterm-256color' }
  });

  assert.equal(options.name, 'xterm-256color');
  assert.equal(options.cols, 100);
  assert.equal(options.rows, 30);
  assert.equal(options.cwd, 'C:\\');
  if (process.platform === 'win32') {
    assert.equal(options.useConptyDll, false);
  } else {
    assert.equal(Object.prototype.hasOwnProperty.call(options, 'useConptyDll'), false);
  }
});

test('output sender coalesces terminal chunks', async () => {
  const sent = [];
  const ws = {
    OPEN: 1,
    readyState: 1,
    send(message) {
      sent.push(JSON.parse(message));
    }
  };
  const sender = createOutputSender(ws);

  sender.send('a');
  sender.send('b');
  sender.send('c');
  await new Promise((resolve) => setTimeout(resolve, 30));

  assert.equal(sent.length, 1);
  assert.deepEqual(sent[0], { type: 'output', data: 'abc' });
});

test('a pane with no live shell reports nothing running', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const pane = store.state.sessions[0].tabs[0].panes[0];
  const filesPane = store.createFilesPane(pane.id, 'C:\\');
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: 'powershell.exe', args: [] }
  });

  // No runtime has been created for the tab yet, so nothing can be running.
  assert.deepEqual(await manager.busyTerminalTabs(pane.id), []);
  assert.deepEqual(await manager.busyTerminalTabs(filesPane.id), []);
  assert.deepEqual(await manager.busyTerminalTabs('missing-pane'), []);
});

test('an exited runtime is never reported as running', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const pane = store.state.sessions[0].tabs[0].panes[0];
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: 'powershell.exe', args: [] }
  });

  const runtime = createHeadlessRuntime();
  runtime.status = 'exited';
  runtime.proc.pid = 1;
  manager.processes.set(pane.activeTerminalTabId, runtime);

  assert.deepEqual(await manager.busyTerminalTabs(pane.id), []);
});

test('a console with no such shell reports no foreground process', async () => {
  assert.deepEqual(await foregroundProcessIds(0), []);
  // 0xffff is above the Windows pid range used in practice, so nothing attaches.
  assert.deepEqual(await foregroundProcessIds(0xffffff), []);
});

test('a shell tells an idle prompt from a running command', windowsOnly, async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const pane = store.state.sessions[0].tabs[0].panes[0];
  const manager = new TerminalManager({
    config: {},
    root,
    store,
    shell: { command: 'powershell.exe', args: ['-NoLogo', '-NoExit'] }
  });

  const runtime = manager.getOrCreate(pane.activeTerminalTabId);
  runtime.proc.onData(() => {});
  await wait(2500);
  assert.deepEqual(await manager.busyTerminalTabs(pane.id), []);

  runtime.proc.write('ping -n 8 127.0.0.1\r');
  await wait(2000);
  const busy = await manager.busyTerminalTabs(pane.id);
  assert.equal(busy.length, 1);
  assert.equal(busy[0].id, pane.activeTerminalTabId);
  assert.equal(busy[0].title, pane.terminalTabs[0].title);

  manager.shutdown();
});

test('terminal status does not expose a separate history API', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const manager = new TerminalManager({
    config: { terminal: { reconnect_scrollback_lines: 2 } },
    root,
    store,
    shell: { command: 'powershell.exe', args: [] }
  });

  assert.equal(manager.getHistory, undefined);
  assert.equal(manager.getPaneStatus(paneId).status, 'idle');
});
