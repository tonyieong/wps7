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
  assert.deepEqual(savedPane.layout, { x: 0, y: 0, cols: 1, rows: 1 });
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
  assert.deepEqual(pane.layout, { x: 0, y: 0, cols: 1, rows: 1 });
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
  assert.deepEqual(secondPane.layout, { x: 1, y: 0, cols: 1, rows: 1 });
  assert.deepEqual(thirdPane.layout, { x: 2, y: 0, cols: 1, rows: 1 });
});

test('pane layout resize rejects overlap and saves free grid layout', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100);
  store.load();
  const paneId = store.state.sessions[0].tabs[0].panes[0].id;
  const secondPane = store.splitPane(paneId, 'horizontal');

  assert.equal(store.resizePane(paneId, { x: 0, y: 0, cols: 2, rows: 1 }, 4, 3), false);
  assert.equal(store.resizePane(secondPane.id, { x: 3, y: 2, cols: 1, rows: 1 }, 4, 3), true);
  assert.deepEqual(store.findPane(paneId).pane.layout, { x: 0, y: 0, cols: 1, rows: 1 });
  assert.deepEqual(store.findPane(secondPane.id).pane.layout, { x: 3, y: 2, cols: 1, rows: 1 });
});

test('shared pane edge resize updates exactly two adjacent panes atomically', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
  const store = new StateStore(root, 100, 4, 4);
  store.load();
  const firstPane = store.state.sessions[0].tabs[0].panes[0];
  const secondPane = store.splitPane(firstPane.id, 'horizontal');
  const thirdPane = store.splitPane(secondPane.id, 'horizontal');
  firstPane.layout = { x: 0, y: 0, cols: 2, rows: 4 };
  secondPane.layout = { x: 2, y: 0, cols: 2, rows: 4 };
  thirdPane.layout = { x: 0, y: 0, cols: 1, rows: 1 };
  store.closePane(thirdPane.id);

  assert.equal(store.resizePanePair(
    firstPane.id,
    { x: 0, y: 0, cols: 3, rows: 4 },
    secondPane.id,
    { x: 3, y: 0, cols: 1, rows: 4 },
    4,
    4
  ), true);
  assert.deepEqual(firstPane.layout, { x: 0, y: 0, cols: 3, rows: 4 });
  assert.deepEqual(secondPane.layout, { x: 3, y: 0, cols: 1, rows: 4 });

  assert.equal(store.resizePanePair(
    firstPane.id,
    { x: 0, y: 0, cols: 4, rows: 4 },
    secondPane.id,
    { x: 4, y: 0, cols: 0, rows: 4 },
    4,
    4
  ), false);
  assert.deepEqual(firstPane.layout, { x: 0, y: 0, cols: 3, rows: 4 });
  assert.deepEqual(secondPane.layout, { x: 3, y: 0, cols: 1, rows: 4 });
});

test('new PowerShell and files panes make room inside a fully occupied grid', () => {
  for (const type of ['terminal', 'files']) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-state-'));
    const store = new StateStore(root, 100, 4, 3);
    store.load();
    const firstPane = store.state.sessions[0].tabs[0].panes[0];
    firstPane.layout = { x: 0, y: 0, cols: 4, rows: 3 };

    const newPane = type === 'terminal'
      ? store.splitPane(firstPane.id, 'horizontal')
      : store.createFilesPane(firstPane.id, 'C:\\');

    assert.ok(newPane);
    assert.deepEqual(newPane.layout, { x: 3, y: 0, cols: 1, rows: 1 });
    assert.deepEqual(firstPane.layout, { x: 0, y: 0, cols: 3, rows: 3 });
  }
});

test('loading legacy layouts assigns non-overlapping grid positions', () => {
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
          { id: 'pane-1', title: 'PowerShell', cwd: root, split: null, layout: { cols: 1, rows: 1 } },
          { id: 'pane-2', title: 'PowerShell', cwd: root, split: null, layout: { cols: 1, rows: 1 } },
          { id: 'pane-3', title: 'PowerShell', cwd: root, split: null, layout: { cols: 1, rows: 1 } }
        ]
      }]
    }]
  }));

  const store = new StateStore(root, 100, 4, 3);
  store.load();
  assert.deepEqual(
    store.state.sessions[0].tabs[0].panes.map((pane) => pane.layout),
    [
      { x: 0, y: 0, cols: 1, rows: 1 },
      { x: 1, y: 0, cols: 1, rows: 1 },
      { x: 2, y: 0, cols: 1, rows: 1 }
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
