const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { StateStore } = require('../src/state');

test('public state omits pane scrollback payloads', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;

  store.appendScrollback(paneId, 'large terminal output');

  const publicState = store.getPublicState();
  assert.equal(publicState.sessions[0].tabs[0].panes[0].scrollback, undefined);
  assert.equal(store.findPane(paneId).pane.scrollback.length, 1);
});

test('saved state keeps layout only', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;

  store.appendScrollback(paneId, 'runtime output');
  store.findPane(paneId).pane.lastProgram = 'codex';
  store.save();

  const saved = JSON.parse(fs.readFileSync(path.join(root, 'data', 'state.json'), 'utf8'));
  const savedPane = saved.sessions[0].tabs[0].panes[0];
  assert.equal(savedPane.title, 'PowerShell 1');
  assert.equal(savedPane.scrollback, undefined);
  assert.equal(savedPane.lastProgram, undefined);
  assert.deepEqual(savedPane.layout, { column: 0, row: 0 });
});

test('pane font size is validated and persisted per pane', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;

  assert.equal(store.setPaneFontSize(paneId, 18), true);
  assert.equal(store.findPane(paneId).pane.fontSize, 18);
  assert.equal(store.setPaneFontSize(paneId, 40), false);

  const reloaded = new StateStore(root, 100);
  reloaded.load();
  assert.equal(reloaded.findPane(paneId).pane.fontSize, 18);
  assert.equal(reloaded.getPublicState().sessions[0].tabs[0].panes[0].fontSize, 18);
});

test('loading old state strips non-layout terminal data', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify({
    activeSessionId: 'session-1',
    updatedAt: new Date().toISOString(),
    sessions: [{
      id: 'session-1',
      name: 'Session 1',
      activePaneId: 'pane-1',
      tabs: [{
        id: 'tab-1',
        name: 'Main',
        activePaneId: 'pane-1',
        panes: [{
          id: 'pane-1',
          title: 'PowerShell',
          cwd: root,
          split: null,
          lastProgram: 'codex',
          scrollback: ['old output']
        }]
      }]
    }]
  }));

  const store = new StateStore(root, 100);
  store.load();
  const pane = store.findPane('pane-1').pane;
  assert.deepEqual(pane.scrollback, []);
  assert.equal(pane.lastProgram, undefined);
  assert.deepEqual(pane.layout, { column: 0, row: 0 });
});

test('new sessions and panes use unique default names', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();

  const secondSession = store.createSession();
  const thirdSession = store.createSession();
  assert.equal(secondSession.name, 'Workspace 2');
  assert.equal(thirdSession.name, 'Workspace 3');

  const paneId = thirdSession.tabs[0].panes[0].id;
  const secondPane = store.splitPane(paneId, 'horizontal');
  const thirdPane = store.splitPane(secondPane.id, 'vertical');
  assert.equal(secondPane.title, 'PowerShell 2');
  assert.equal(thirdPane.title, 'PowerShell 3');
  assert.deepEqual(secondPane.layout, { column: 1, row: 0 });
  assert.deepEqual(thirdPane.layout, { column: 1, row: 1 });
});

test('placePane moves panes between columns and prunes emptied ones', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const secondPane = store.splitPane(paneId, 'vertical');

  // a vertical split grows the column it came from instead of adding one
  assert.deepEqual(store.state.sessions[0].tabs[0].columns, [{ width: 720, slots: 2 }]);
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { column: 0, row: 1 });

  // dropping past the last column appends exactly one, never a run of empties
  assert.equal(store.placePane(secondPane.id, { column: 9, row: 0 }), true);
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { column: 1, row: 0 });
  assert.equal(store.state.sessions[0].tabs[0].columns.length, 2);

  // rows clamp to the slots the target column actually has, and the column the
  // pane left behind is dropped
  assert.equal(store.placePane(secondPane.id, { column: 0, row: 5 }), true);
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { column: 0, row: 1 });
  assert.equal(store.state.sessions[0].tabs[0].columns.length, 1);
});

test('column slots are configurable and never strand a pane', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].id;
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  store.splitPane(paneId, 'vertical');

  assert.equal(store.setColumnSlots(tabId, 0, 4), true);
  assert.equal(store.state.sessions[0].tabs[0].columns[0].slots, 4);

  // shrinking below the occupied rows keeps the rows that hold panes
  assert.equal(store.setColumnSlots(tabId, 0, 1), true);
  assert.equal(store.state.sessions[0].tabs[0].columns[0].slots, 2);

  assert.equal(store.setColumnWidth(tabId, 0, 470), true);
  assert.equal(store.state.sessions[0].tabs[0].columns[0].width, 480);
  assert.equal(store.setColumnWidth(tabId, 3, 480), false);
});

test('new panes open a fresh column to the right', () => {
  for (const type of ['terminal', 'files']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
    const store = new StateStore(root, 100);
    store.load();
    const firstPane = store.state.sessions[0].tabs[0].panes[0];
    const firstLayout = { ...firstPane.layout };

    const newPane = type === 'terminal'
      ? store.splitPane(firstPane.id, 'horizontal')
      : store.createFilesPane(firstPane.id, 'C:\\');

    assert.ok(newPane);
    assert.deepEqual(newPane.layout, { column: 1, row: 0 });
    assert.deepEqual(store.state.sessions[0].tabs[0].columns, [
      { width: 720, slots: 1 },
      { width: 720, slots: 1 }
    ]);
    // creating a pane never moves the panes already on the board
    assert.deepEqual(firstPane.layout, firstLayout);
  }
});

test('loading legacy cell layouts migrates them to columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify({
    activeSessionId: 'session-1',
    updatedAt: new Date().toISOString(),
    sessions: [{
      id: 'session-1',
      name: 'Session 1',
      activePaneId: 'pane-1',
      tabs: [{
        id: 'tab-1',
        name: 'Main',
        activePaneId: 'pane-1',
        panes: [
          { id: 'pane-1', title: 'PowerShell', cwd: root, split: null, layout: { x: 0, y: 0, cols: 1, rows: 1 } },
          { id: 'pane-2', title: 'PowerShell', cwd: root, split: null, layout: { x: 1, y: 0, cols: 2, rows: 1 } },
          { id: 'pane-3', title: 'PowerShell', cwd: root, split: null, layout: { x: 0, y: 1, cols: 1, rows: 2 } }
        ]
      }]
    }]
  }));

  const store = new StateStore(root, 100);
  store.load();
  const tab = store.state.sessions[0].tabs[0];
  // Cells become world pixels first, so pane-1/pane-3 share column 0 and pane-2
  // takes column 1 with the width its two-cell span implies.
  assert.deepEqual(
    tab.panes.map((pane) => pane.layout),
    [
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 0, row: 1 }
    ]
  );
  assert.deepEqual(tab.columns, [
    { width: 720, slots: 2 },
    { width: 1440, slots: 1 }
  ]);
});

test('loading freeform canvas layouts migrates them to columns', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify({
    activeSessionId: 'session-1',
    updatedAt: new Date().toISOString(),
    sessions: [{
      id: 'session-1',
      name: 'Session 1',
      activePaneId: 'pane-1',
      tabs: [{
        id: 'tab-1',
        name: 'Main',
        activePaneId: 'pane-1',
        camera: { x: -320, y: 128, scale: 1.5 },
        panes: [
          { id: 'pane-1', title: 'PowerShell', cwd: root, split: null, layout: { x: 960, y: 640, w: 480, h: 360, z: 3 } },
          { id: 'pane-2', title: 'PowerShell', cwd: root, split: null, layout: { x: 120, y: 120, w: 720, h: 480, z: 1 } },
          { id: 'pane-3', title: 'PowerShell', cwd: root, split: null, layout: { x: 960, y: 120, w: 480, h: 480, z: 2 } }
        ]
      }]
    }]
  }));

  const store = new StateStore(root, 100);
  store.load();
  const tab = store.state.sessions[0].tabs[0];
  // Columns follow ascending x; inside a column, rows follow ascending y.
  assert.deepEqual(
    tab.panes.map((pane) => pane.layout),
    [
      { column: 1, row: 1 },
      { column: 0, row: 0 },
      { column: 1, row: 0 }
    ]
  );
  assert.deepEqual(tab.columns, [
    { width: 720, slots: 1 },
    { width: 480, slots: 2 }
  ]);
});

test('pane move reorders panes inside its tab', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const secondPane = store.splitPane(paneId, 'horizontal');
  const thirdPane = store.splitPane(secondPane.id, 'vertical');

  assert.equal(store.movePane(thirdPane.id, paneId), true);
  assert.deepEqual(
    store.state.sessions[0].tabs[0].panes.map((pane) => pane.id),
    [thirdPane.id, paneId, secondPane.id]
  );
});

test('files panes persist type and path without scrollback', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const filesPane = store.createFilesPane(paneId, 'C:\\');
  store.appendScrollback(filesPane.id, 'ignored');
  store.save();

  const saved = JSON.parse(fs.readFileSync(path.join(root, 'data', 'state.json'), 'utf8'));
  const savedPane = saved.sessions[0].tabs[0].panes.find((pane) => pane.id === filesPane.id);
  assert.equal(savedPane.type, 'files');
  assert.equal(savedPane.path, 'C:\\');
  assert.equal(savedPane.scrollback, undefined);

  const publicPane = store.getPublicState().sessions[0].tabs[0].panes.find((pane) => pane.id === filesPane.id);
  assert.equal(publicPane.type, 'files');
  assert.equal(publicPane.path, 'C:\\');
});

test('allows more than one files pane in the same tab', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const store = new StateStore(root, 10, 4, 3);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;

  const first = store.createFilesPane(paneId, 'C:\\');
  const second = store.createFilesPane(first.id, 'D:\\');

  assert.notEqual(first.id, second.id);
  assert.equal(store.state.sessions[0].tabs[0].panes.filter((pane) => pane.type === 'files').length, 2);
});

test('usage panes persist as workspace panes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const usagePane = store.createUsagePane(firstPane.id);

  assert.equal(usagePane.type, 'usage');
  assert.equal(usagePane.title, 'Usage 1');
  store.save();

  const restored = new StateStore(root, 100);
  restored.load();
  const restoredPane = restored.findPane(usagePane.id).pane;
  assert.equal(restoredPane.type, 'usage');
  assert.equal(restoredPane.title, 'Usage 1');
});

test('browser and notepad panes persist their URL and file path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 4, 4);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const browser = store.createBrowserPane(firstPane.id, 'https://example.com');
  const notepad = store.createNotepadPane(browser.id, 'C:\\notes.txt');

  assert.equal(browser.type, 'browser');
  assert.equal(notepad.type, 'notepad');
  assert.equal(store.setBrowserPaneUrl(browser.id, 'https://openai.com'), true);
  assert.equal(store.updateNotepadTab(notepad.id, notepad.activeNotepadTabId, { path: 'C:\\updated.txt' }), true);
  store.save();

  const restored = new StateStore(root, 100, 4, 4);
  restored.load();
  const panes = restored.getPublicState().sessions[0].tabs[0].panes;
  assert.equal(panes.find((pane) => pane.id === browser.id).url, 'https://openai.com');
  assert.equal(panes.find((pane) => pane.id === notepad.id).path, 'C:\\updated.txt');
});

test('terminal panes persist multiple tabs and their active tab', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const pane = store.state.sessions[0].tabs[0].panes[0];

  assert.equal(pane.terminalTabs.length, 1);
  assert.equal(pane.activeTerminalTabId, pane.terminalTabs[0].id);

  const secondTab = store.createTerminalTab(pane.id);
  assert.equal(pane.terminalTabs.length, 2);
  assert.equal(pane.activeTerminalTabId, secondTab.id);
  assert.equal(secondTab.title, 'PowerShell 2');
  assert.equal(secondTab.cwd, pane.cwd);
  assert.equal(store.renameTerminalTab(pane.id, secondTab.id, 'Build'), true);
  assert.equal(store.activateTerminalTab(pane.id, pane.terminalTabs[0].id), true);
  store.save();

  const restored = new StateStore(root, 100);
  restored.load();
  const restoredPane = restored.findPane(pane.id).pane;
  assert.equal(restoredPane.terminalTabs.length, 2);
  assert.equal(restoredPane.terminalTabs[1].title, 'Build');
  assert.equal(restoredPane.activeTerminalTabId, restoredPane.terminalTabs[0].id);
  assert.deepEqual(restoredPane.terminalTabs[0].scrollback, []);

  assert.equal(restored.closeTerminalTab(pane.id, restoredPane.terminalTabs[1].id).replacement, null);
  assert.equal(restoredPane.terminalTabs.length, 1);

  // Closing the last tab restarts the shell under a new tab id instead of emptying the pane.
  const lastId = restoredPane.terminalTabs[0].id;
  const { replacement } = restored.closeTerminalTab(pane.id, lastId);
  assert.equal(restoredPane.terminalTabs.length, 1);
  assert.notEqual(replacement.id, lastId);
  assert.equal(restoredPane.activeTerminalTabId, replacement.id);
  assert.equal(restored.closeTerminalTab(pane.id, 'missing-tab'), null);
});

test('files panes persist multiple tabs and follow the active tab path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const filesPane = store.createFilesPane(firstPane.id, 'C:\\');

  assert.equal(filesPane.filesTabs.length, 1);
  assert.equal(filesPane.filesTabs[0].path, 'C:\\');

  const secondTab = store.createFilesTab(filesPane.id, 'C:\\Windows');
  assert.equal(filesPane.activeFilesTabId, secondTab.id);
  assert.equal(filesPane.path, 'C:\\Windows');

  assert.equal(store.setFilesPanePath(filesPane.id, 'C:\\Users'), true);
  assert.equal(secondTab.path, 'C:\\Users');

  assert.equal(store.activateFilesTab(filesPane.id, filesPane.filesTabs[0].id), true);
  assert.equal(filesPane.path, 'C:\\');
  store.save();

  const restored = new StateStore(root, 100);
  restored.load();
  const restoredPane = restored.findPane(filesPane.id).pane;
  assert.equal(restoredPane.filesTabs.length, 2);
  assert.equal(restoredPane.filesTabs[1].path, 'C:\\Users');
  assert.equal(restoredPane.path, 'C:\\');

  assert.equal(restored.closeFilesTab(filesPane.id, restoredPane.filesTabs[0].id), true);
  assert.equal(restoredPane.filesTabs.length, 1);
  assert.equal(restoredPane.path, 'C:\\Users');
});

test('browser panes persist multiple tabs and their active tab', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 4, 4);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const browser = store.createBrowserPane(firstPane.id, 'https://example.com', 'mobile');
  const secondTab = store.createBrowserTab(browser.id, 'https://openai.com', 'desktop');

  assert.equal(browser.browserTabs.length, 2);
  assert.equal(browser.browserTabs[0].emulationMode, 'mobile');
  assert.equal(secondTab.emulationMode, 'desktop');
  assert.equal(browser.activeBrowserTabId, secondTab.id);
  assert.equal(store.updateBrowserTab(browser.id, secondTab.id, { title: 'OpenAI', zoom: 1.25, emulationMode: 'mobile' }), true);
  assert.equal(store.activateBrowserTab(browser.id, browser.browserTabs[0].id), true);
  assert.equal(store.closeBrowserTab(browser.id, secondTab.id), true);
  store.save();

  const restored = new StateStore(root, 100, 4, 4);
  restored.load();
  const restoredBrowser = restored.findPane(browser.id).pane;
  assert.equal(restoredBrowser.browserTabs.length, 1);
  assert.equal(restoredBrowser.activeBrowserTabId, restoredBrowser.browserTabs[0].id);
  assert.equal(restoredBrowser.browserTabs[0].url, 'https://example.com');
  assert.equal(restoredBrowser.browserTabs[0].emulationMode, 'mobile');
});

test('new notepad panes and tabs adopt the configured editor defaults', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 4, 4);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const defaults = { wrap: true, indentGuides: true, autosave: true };
  const notepad = store.createNotepadPane(firstPane.id, 'C:\notes.txt', defaults);
  const extraTab = store.createNotepadTab(notepad.id, 'C:\todo.txt', defaults);

  assert.equal(notepad.notepadTabs[0].wrap, true);
  assert.equal(notepad.notepadTabs[0].indentGuides, true);
  assert.equal(notepad.notepadTabs[0].autosave, true);
  assert.equal(extraTab.wrap, true);
  assert.equal(extraTab.indentGuides, true);
  assert.equal(extraTab.autosave, true);

  const plain = store.createNotepadPane(firstPane.id, '');
  assert.equal(plain.notepadTabs[0].wrap, false);
  assert.equal(plain.notepadTabs[0].indentGuides, false);
  assert.equal(plain.notepadTabs[0].autosave, false);
});

test('notepad panes persist multiple tabs and their active tab', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 4, 4);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const notepad = store.createNotepadPane(firstPane.id, 'C:\\notes.txt');
  const secondTab = store.createNotepadTab(notepad.id, 'C:\\todo.txt');

  assert.equal(notepad.notepadTabs.length, 2);
  assert.equal(notepad.activeNotepadTabId, secondTab.id);
  assert.equal(store.updateNotepadTab(notepad.id, secondTab.id, { title: 'todo.txt' }), true);
  assert.equal(store.activateNotepadTab(notepad.id, notepad.notepadTabs[0].id), true);
  assert.equal(store.closeNotepadTab(notepad.id, secondTab.id), true);
  store.save();

  const restored = new StateStore(root, 100, 4, 4);
  restored.load();
  const restoredNotepad = restored.findPane(notepad.id).pane;
  assert.equal(restoredNotepad.notepadTabs.length, 1);
  assert.equal(restoredNotepad.activeNotepadTabId, restoredNotepad.notepadTabs[0].id);
  assert.equal(restoredNotepad.notepadTabs[0].path, 'C:\\notes.txt');
});

test('notepad autosave drafts and editor preferences persist without a file path', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 4, 4);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const notepad = store.createNotepadPane(firstPane.id);
  const tabId = notepad.activeNotepadTabId;

  assert.equal(store.updateNotepadTab(notepad.id, tabId, {
    content: 'server draft',
    encoding: 'utf8',
    wrap: true,
    indentGuides: true,
    autosave: true,
    fontFamily: '"Cascadia Mono", Consolas, monospace'
  }), true);

  const restored = new StateStore(root, 100, 4, 4);
  restored.load();
  const restoredTab = restored.findPane(notepad.id).pane.notepadTabs[0];
  assert.equal(restoredTab.path, '');
  assert.equal(restoredTab.content, 'server draft');
  assert.equal(restoredTab.encoding, 'utf8');
  assert.equal(restoredTab.wrap, true);
  assert.equal(restoredTab.indentGuides, true);
  assert.equal(restoredTab.autosave, true);
  assert.equal(restoredTab.fontFamily, '"Cascadia Mono", Consolas, monospace');

  assert.equal(restored.closeNotepadTab(notepad.id, tabId), true);
  const clearedTab = restored.findPane(notepad.id).pane.notepadTabs[0];
  assert.equal(clearedTab.content, '');
  assert.equal(clearedTab.autosave, false);
});

test('legacy terminal pane mode is discarded', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify({
    activeSessionId: 'session-1',
    sessions: [{
      id: 'session-1',
      name: 'Session 1',
      activePaneId: 'pane-1',
      tabs: [{
        id: 'tab-1',
        name: 'Main',
        activePaneId: 'pane-1',
        panes: [{ id: 'pane-1', title: 'PowerShell', mode: 'tui' }]
      }]
    }]
  }));
  const store = new StateStore(root, 100);
  store.load();
  assert.equal(store.state.sessions[0].tabs[0].panes[0].mode, undefined);
  assert.equal(store.getPublicState().sessions[0].tabs[0].panes[0].mode, undefined);
  store.save();

  const saved = JSON.parse(fs.readFileSync(path.join(root, 'data', 'state.json'), 'utf8'));
  assert.equal(saved.sessions[0].tabs[0].panes[0].mode, undefined);
});

test('loading state with a deleted or moved pane cwd falls back to the app root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const missingCwd = path.join(root, 'moved-away-folder');
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify({
    activeSessionId: 'session-1',
    sessions: [{
      id: 'session-1',
      name: 'Session 1',
      activePaneId: 'pane-1',
      tabs: [{
        id: 'tab-1',
        name: 'Main',
        activePaneId: 'pane-1',
        panes: [{ id: 'pane-1', title: 'PowerShell', cwd: missingCwd, split: null }]
      }]
    }]
  }));

  const store = new StateStore(root, 100);
  store.load();
  assert.equal(store.findPane('pane-1').pane.cwd, root);
});

test('loading legacy panes marks them as terminal', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify({
    activeSessionId: 'session-1',
    sessions: [{
      id: 'session-1',
      name: 'Session 1',
      activePaneId: 'pane-1',
      tabs: [{
        id: 'tab-1',
        name: 'Main',
        activePaneId: 'pane-1',
        panes: [{ id: 'pane-1', title: 'PowerShell', cwd: root, layout: { x: 0, y: 0, cols: 1, rows: 1 } }]
      }]
    }]
  }));
  const store = new StateStore(root, 10);
  store.load();
  assert.equal(store.state.sessions[0].tabs[0].panes[0].type, 'terminal');
});

test('auto placement fills a column to its configured slots before opening another', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 3);
  store.load();
  const columns = () => store.state.sessions[0].tabs[0].columns;
  const first = store.state.sessions[0].tabs[0].panes[0];

  // the seeded column holds one slot, so the next pane starts a 3-slot column
  const second = store.splitPane(first.id, 'auto');
  assert.deepEqual(second.layout, { column: 1, row: 0 });
  assert.deepEqual(columns()[1], { width: 720, slots: 3 });

  // the following panes fill that column rather than adding more
  const third = store.splitPane(second.id, 'auto');
  const fourth = store.splitPane(third.id, 'auto');
  assert.deepEqual(third.layout, { column: 1, row: 1 });
  assert.deepEqual(fourth.layout, { column: 1, row: 2 });
  assert.equal(columns().length, 2);

  // once full, auto moves on instead of growing past the configured size
  const fifth = store.splitPane(fourth.id, 'auto');
  assert.deepEqual(fifth.layout, { column: 2, row: 0 });
  assert.equal(columns()[1].slots, 3);

  // an explicit horizontal split always starts a column, even with slots free
  const sixth = store.splitPane(fifth.id, 'horizontal');
  assert.deepEqual(sixth.layout, { column: 3, row: 0 });
});

test('whiteboard panes store their Excalidraw scene as bounded JSON', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const terminalPaneId = store.state.sessions[0].tabs[0].panes[0].id;
  const pane = store.createWhiteboardPane(terminalPaneId);

  assert.equal(pane.type, 'whiteboard');
  assert.equal(pane.whiteboard, '{}');

  const scene = JSON.stringify({ elements: [{ id: 'a', type: 'rectangle' }], appState: { gridSize: 20 } });
  assert.equal(store.setWhiteboard(pane.id, scene), true);

  const reloaded = new StateStore(root, 100);
  reloaded.load();
  assert.equal(reloaded.findPane(pane.id).pane.whiteboard, scene);

  // a malformed payload falls back to an empty scene rather than being stored
  assert.equal(store.setWhiteboard(pane.id, 'not json'), true);
  assert.equal(store.findPane(pane.id).pane.whiteboard, '{}');
  // and only whiteboard panes accept one at all
  assert.equal(store.setWhiteboard(terminalPaneId, scene), false);
});
