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
  assert.deepEqual(savedPane.layout, { x: 120, y: 120, w: 720, h: 480, z: 1 });
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
  assert.deepEqual(pane.layout, { x: 0, y: 0, w: 720, h: 480, z: 0 });
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
  assert.deepEqual(secondPane.layout, { x: 240, y: 240, w: 720, h: 480, z: 2 });
  assert.deepEqual(thirdPane.layout, { x: 360, y: 360, w: 720, h: 480, z: 3 });
});

test('resizePane saves free world coordinates and allows overlap', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const secondPane = store.splitPane(paneId, 'horizontal');

  // grid-aligned world coordinates are stored as-is, without clamping to any bounds
  assert.equal(store.resizePane(paneId, { x: 1200, y: 840, w: 480, h: 360, z: 5 }), true);
  assert.deepEqual(store.findPane(paneId).pane.layout, { x: 1200, y: 840, w: 480, h: 360, z: 5 });

  // off-grid input snaps to the nearest dashed grid cell (30), which includes every solid line (120)
  assert.equal(store.resizePane(secondPane.id, { x: 610, y: 130, w: 500, h: 300, z: 6 }), true);
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { x: 600, y: 120, w: 510, h: 300, z: 6 });

  // a pane may rest on a dashed line that is not a solid grid line
  assert.equal(store.resizePane(secondPane.id, { x: 147, y: 152, w: 480, h: 360, z: 6 }), true);
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { x: 150, y: 150, w: 480, h: 360, z: 6 });

  // overlapping another pane is allowed on the whiteboard
  assert.equal(store.resizePane(secondPane.id, { x: 1200, y: 840, w: 480, h: 360, z: 7 }), true);
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { x: 1200, y: 840, w: 480, h: 360, z: 7 });
});

test('new PowerShell and files panes get cascaded world layouts', () => {
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
    // new pane sits on the whiteboard with a grid-aligned world-pixel box, stacked above the first
    assert.equal(newPane.layout.w, 720);
    assert.equal(newPane.layout.h, 480);
    assert.equal(newPane.layout.w % 120, 0);
    assert.equal(newPane.layout.h % 120, 0);
    assert.ok(newPane.layout.z > firstPane.layout.z);
    // creating a pane never mutates existing panes
    assert.deepEqual(firstPane.layout, firstLayout);
  }
});

test('loading legacy cell layouts migrates them to world pixels', () => {
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
  assert.deepEqual(
    store.state.sessions[0].tabs[0].panes.map((pane) => pane.layout),
    [
      { x: 0, y: 0, w: 720, h: 480, z: 0 },
      { x: 720, y: 0, w: 1440, h: 480, z: 0 },
      { x: 0, y: 480, w: 720, h: 960, z: 0 }
    ]
  );
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

test('camera state persists per tab and clamps invalid zoom', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].id;

  assert.equal(store.setCamera(tabId, { x: -320, y: 128, scale: 1.5 }), true);
  assert.deepEqual(store.state.sessions[0].tabs[0].camera, { x: -320, y: 128, scale: 1.5 });

  const restored = new StateStore(root, 100);
  restored.load();
  assert.deepEqual(restored.state.sessions[0].tabs[0].camera, { x: -320, y: 128, scale: 1.5 });

  // out-of-range zoom falls back to 1
  assert.equal(store.setCamera(tabId, { x: 0, y: 0, scale: 99 }), true);
  assert.equal(store.state.sessions[0].tabs[0].camera.scale, 1);
});

test('drawings persist per tab and drop unknown shapes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].id;

  assert.equal(store.setDrawings(tabId, [
    { id: 'a', type: 'rectangle', x: 120, y: 150, w: 240, h: 90 },
    { id: 'b', type: 'draw', x: 30, y: 30, w: 0, h: 0, points: [[0, 0], [12, 18]] },
    { id: 'c', type: 'text', x: 60, y: 60, w: 0, h: 0, text: 'note' },
    { id: 'd', type: 'sticker', x: 0, y: 0, w: 10, h: 10 }
  ]), true);

  const restored = new StateStore(root, 100);
  restored.load();
  const drawings = restored.state.sessions[0].tabs[0].drawings;
  assert.deepEqual(drawings.map((element) => element.id), ['a', 'b', 'c']);
  assert.deepEqual(drawings[0], {
    id: 'a', type: 'rectangle', x: 120, y: 150, w: 240, h: 90,
    strokeColor: 'auto', opacity: 100, backgroundColor: 'transparent', fillStyle: 'hachure',
    strokeWidth: 1, strokeStyle: 'solid', roundness: 'sharp'
  });
  assert.deepEqual(drawings[1].points, [[0, 0], [12, 18]]);
  assert.equal(drawings[2].text, 'note');
  assert.equal(store.setDrawings('missing-tab', []), false);
});

test('drawing styles are validated per element type', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].id;

  store.setDrawings(tabId, [
    { id: 'rect', type: 'rectangle', x: 0, y: 0, w: 10, h: 10, strokeColor: '#E03131', backgroundColor: '#B2F2BB', fillStyle: 'solid', strokeWidth: 4, strokeStyle: 'dashed', roundness: 'round', opacity: 55 },
    { id: 'bad', type: 'rectangle', x: 0, y: 0, w: 10, h: 10, strokeColor: 'notacolor', backgroundColor: 'nope', fillStyle: 'glitter', strokeWidth: 99, strokeStyle: 'zigzag', roundness: 'extreme', opacity: 500 },
    { id: 'arrow', type: 'arrow', x: 0, y: 0, w: 10, h: 10, startArrowhead: 'circle', endArrowhead: 'triangle_outline' },
    { id: 'line', type: 'line', x: 0, y: 0, w: 10, h: 10 },
    { id: 'text', type: 'text', x: 0, y: 0, w: 0, h: 0, text: 'hi', fontSize: 28, fontFamily: 'code', textAlign: 'center' },
    { id: 'ellipse', type: 'ellipse', x: 0, y: 0, w: 10, h: 10 }
  ]);

  const drawings = store.state.sessions[0].tabs[0].drawings;
  const byId = Object.fromEntries(drawings.map((element) => [element.id, element]));

  assert.equal(byId.rect.strokeColor, '#e03131');
  assert.equal(byId.rect.backgroundColor, '#b2f2bb');
  assert.equal(byId.rect.fillStyle, 'solid');
  assert.equal(byId.rect.strokeWidth, 4);
  assert.equal(byId.rect.strokeStyle, 'dashed');
  assert.equal(byId.rect.roundness, 'round');
  assert.equal(byId.rect.opacity, 55);

  // invalid values fall back to defaults rather than being dropped
  assert.equal(byId.bad.strokeColor, 'auto');
  assert.equal(byId.bad.backgroundColor, 'transparent');
  assert.equal(byId.bad.fillStyle, 'hachure');
  assert.equal(byId.bad.strokeWidth, 1);
  assert.equal(byId.bad.strokeStyle, 'solid');
  assert.equal(byId.bad.roundness, 'sharp');
  assert.equal(byId.bad.opacity, 100);

  assert.equal(byId.arrow.startArrowhead, 'circle');
  assert.equal(byId.arrow.endArrowhead, 'triangle_outline');
  // only "arrow" has arrowheads in Excalidraw; "line" has none at all
  assert.equal(byId.line.startArrowhead, undefined);
  assert.equal(byId.line.endArrowhead, undefined);
  assert.equal(byId.line.strokeWidth, 1);

  assert.equal(byId.text.fontSize, 28);
  assert.equal(byId.text.fontFamily, 'code');
  assert.equal(byId.text.textAlign, 'center');
  assert.equal(byId.text.backgroundColor, undefined);
  assert.equal(byId.text.fillStyle, undefined);

  assert.equal(byId.ellipse.roundness, undefined);
  assert.equal(byId.ellipse.fillStyle, 'hachure');

  // opacity clamps to [0, 100] instead of failing validation
  store.setDrawings(tabId, [{ id: 'clamp', type: 'rectangle', x: 0, y: 0, w: 10, h: 10, opacity: -20 }]);
  assert.equal(store.state.sessions[0].tabs[0].drawings[0].opacity, 0);
  store.setDrawings(tabId, [{ id: 'clamp2', type: 'rectangle', x: 0, y: 0, w: 10, h: 10, opacity: 250 }]);
  assert.equal(store.state.sessions[0].tabs[0].drawings[0].opacity, 100);
});

test('drawings without style fields (pre-existing data) round-trip with full defaults', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].id;

  store.setDrawings(tabId, [{ id: 'legacy', type: 'rectangle', x: 0, y: 0, w: 30, h: 30 }]);

  const restored = new StateStore(root, 100);
  restored.load();
  const element = restored.state.sessions[0].tabs[0].drawings[0];
  assert.equal(element.strokeColor, 'auto');
  assert.equal(element.backgroundColor, 'transparent');
  assert.equal(element.fillStyle, 'hachure');
  assert.equal(element.strokeWidth, 1);
  assert.equal(element.strokeStyle, 'solid');
  assert.equal(element.roundness, 'sharp');
  assert.equal(element.opacity, 100);
  assert.equal(element.groupId, undefined);
});

test('drawing groupId round-trips, is capped at 64 chars, and is omitted when absent', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const tabId = store.state.sessions[0].tabs[0].id;

  const longId = 'g'.repeat(100);
  store.setDrawings(tabId, [
    { id: 'a', type: 'rectangle', x: 0, y: 0, w: 10, h: 10, groupId: 'group-1' },
    { id: 'b', type: 'ellipse', x: 0, y: 0, w: 10, h: 10, groupId: 'group-1' },
    { id: 'c', type: 'diamond', x: 0, y: 0, w: 10, h: 10, groupId: longId },
    { id: 'd', type: 'line', x: 0, y: 0, w: 10, h: 10 },
    { id: 'e', type: 'text', x: 0, y: 0, w: 0, h: 0, text: 'hi', groupId: 42 }
  ]);

  const restored = new StateStore(root, 100);
  restored.load();
  const byId = Object.fromEntries(restored.state.sessions[0].tabs[0].drawings.map((el) => [el.id, el]));

  assert.equal(byId.a.groupId, 'group-1');
  assert.equal(byId.b.groupId, 'group-1');
  assert.equal(byId.c.groupId, longId.slice(0, 64));
  assert.equal(byId.c.groupId.length, 64);
  assert.equal(byId.d.groupId, undefined);
  // non-string groupId (e.g. a stray number) is ignored rather than coerced
  assert.equal(byId.e.groupId, undefined);
});
