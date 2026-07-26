const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeCwd } = require('./shell');

const GRID_UNIT = 120;
const DEFAULT_PANE_WIDTH = 720;
const DEFAULT_PANE_HEIGHT = 480;
const PANE_CASCADE_STEP = GRID_UNIT;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const PANE_TYPES = new Set(['terminal', 'files', 'browser', 'notepad', 'usage']);
const NOTEPAD_ENCODINGS = new Set(['utf8', 'utf8-bom', 'utf16le', 'utf16be', 'latin1']);
const MAX_NOTEPAD_CONTENT_LENGTH = 10 * 1024 * 1024;

function paneType(value) {
  return PANE_TYPES.has(value) ? value : 'terminal';
}

function nextNumberedName(prefix, existingNames) {
  const names = new Set(existingNames);
  let index = 1;
  while (names.has(`${prefix} ${index}`)) {
    index += 1;
  }
  return `${prefix} ${index}`;
}

function browserEmulationMode(value) {
  return value === 'mobile' ? 'mobile' : 'desktop';
}

function browserTab(value = {}) {
  const zoom = Number(value.zoom);
  return {
    id: value.id || crypto.randomUUID(),
    title: String(value.title || 'New tab').slice(0, 160),
    url: String(value.url || ''),
    zoom: zoom >= 0.25 && zoom <= 3 ? zoom : 1,
    emulationMode: browserEmulationMode(value.emulationMode)
  };
}

function browserTabsForPane(pane) {
  const tabs = Array.isArray(pane.browserTabs) && pane.browserTabs.length
    ? pane.browserTabs.slice(0, 50).map(browserTab)
    : [browserTab({ url: pane.url || '' })];
  const activeBrowserTabId = tabs.some((tab) => tab.id === pane.activeBrowserTabId)
    ? pane.activeBrowserTabId
    : tabs[0].id;
  return { tabs, activeBrowserTabId };
}

function notepadTab(value = {}) {
  const pathValue = String(value.path || '');
  return {
    id: value.id || crypto.randomUUID(),
    title: String(value.title || 'Untitled').slice(0, 160),
    path: pathValue,
    content: pathValue ? '' : String(value.content || '').slice(0, MAX_NOTEPAD_CONTENT_LENGTH),
    encoding: NOTEPAD_ENCODINGS.has(value.encoding) ? value.encoding : 'utf8',
    wrap: Boolean(value.wrap),
    indentGuides: Boolean(value.indentGuides),
    autosave: Boolean(value.autosave),
    fontFamily: String(value.fontFamily || '').slice(0, 200)
  };
}

function notepadTabsForPane(pane) {
  const tabs = Array.isArray(pane.notepadTabs) && pane.notepadTabs.length
    ? pane.notepadTabs.slice(0, 50).map(notepadTab)
    : [notepadTab({ path: pane.path || '' })];
  const activeNotepadTabId = tabs.some((tab) => tab.id === pane.activeNotepadTabId)
    ? pane.activeNotepadTabId
    : tabs[0].id;
  return { tabs, activeNotepadTabId };
}

function defaultSession(name = 'Workspace 1', paneTitle = 'PowerShell 1') {
  const paneId = crypto.randomUUID();
  return {
    id: crypto.randomUUID(),
    name,
    activePaneId: paneId,
    tabs: [
      {
        id: crypto.randomUUID(),
        name: 'Main',
        activePaneId: paneId,
        panes: [
          {
            id: paneId,
            type: 'terminal',
            title: paneTitle,
            cwd: process.cwd(),
            split: null,
            layout: { x: GRID_UNIT, y: GRID_UNIT, w: DEFAULT_PANE_WIDTH, h: DEFAULT_PANE_HEIGHT, z: 1 },
            scrollback: []
          }
        ]
      }
    ]
  };
}

class StateStore {
  constructor(root, scrollbackLimit) {
    this.root = root;
    this.dataDir = path.join(root, 'data');
    this.statePath = path.join(this.dataDir, 'state.json');
    this.scrollbackLimit = scrollbackLimit;
    const session = defaultSession();
    this.state = {
      activeSessionId: session.id,
      sessions: [session],
      updatedAt: new Date().toISOString()
    };
  }

  load() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    if (fs.existsSync(this.statePath)) {
      this.state = this.hydrateState(JSON.parse(fs.readFileSync(this.statePath, 'utf8')));
      this.state.activeSessionId = this.state.activeSessionId || this.state.sessions[0]?.id || '';
    } else {
      this.save();
    }
    return this.state;
  }

  save() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.state.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.statePath, JSON.stringify(this.getPersistedState(), null, 2));
  }

  hydrateState(state) {
    return {
      ...state,
      sessions: (state.sessions || []).map((session) => ({
        ...session,
        tabs: (session.tabs || []).map((tab) => this.hydrateTab(tab))
      }))
    };
  }

  hydrateTab(tab) {
    const panes = [];
    for (const pane of tab.panes || []) {
      const nextPane = {
        id: pane.id,
        type: paneType(pane.type),
        title: pane.title || 'PowerShell 1',
        cwd: normalizeCwd(pane.cwd, this.root),
        path: pane.path || '',
        url: pane.url || '',
        fontSize: validPaneFontSize(pane.fontSize) ? Number(pane.fontSize) : undefined,
        split: pane.split || null,
        layout: migrateLayout(pane.layout),
        scrollback: []
      };
      if (nextPane.type === 'browser') {
        const browserState = browserTabsForPane(pane);
        nextPane.browserTabs = browserState.tabs;
        nextPane.activeBrowserTabId = browserState.activeBrowserTabId;
        nextPane.url = nextPane.browserTabs.find((tab) => tab.id === nextPane.activeBrowserTabId)?.url || '';
      }
      if (nextPane.type === 'notepad') {
        const notepadState = notepadTabsForPane(pane);
        nextPane.notepadTabs = notepadState.tabs;
        nextPane.activeNotepadTabId = notepadState.activeNotepadTabId;
        nextPane.path = nextPane.notepadTabs.find((tab) => tab.id === nextPane.activeNotepadTabId)?.path || '';
      }
      panes.push(nextPane);
    }
    return { ...tab, panes, camera: sanitizeCamera(tab.camera) };
  }

  getPersistedState() {
    return {
      ...this.state,
      sessions: this.state.sessions.map((session) => ({
        ...session,
        tabs: session.tabs.map((tab) => ({
          ...tab,
          camera: sanitizeCamera(tab.camera),
          panes: tab.panes.map((pane) => ({
            id: pane.id,
            type: paneType(pane.type),
            title: pane.title,
            cwd: pane.cwd,
            path: pane.type === 'files' || pane.type === 'notepad' ? pane.path : undefined,
            url: pane.type === 'browser' ? pane.url : undefined,
            browserTabs: pane.type === 'browser' ? pane.browserTabs.map((tab) => browserTab(tab)) : undefined,
            activeBrowserTabId: pane.type === 'browser' ? pane.activeBrowserTabId : undefined,
            notepadTabs: pane.type === 'notepad' ? pane.notepadTabs.map((tab) => notepadTab(tab)) : undefined,
            activeNotepadTabId: pane.type === 'notepad' ? pane.activeNotepadTabId : undefined,
            fontSize: validPaneFontSize(pane.fontSize) ? pane.fontSize : undefined,
            split: pane.split,
            layout: sanitizeLayout(pane.layout)
          }))
        }))
      }))
    };
  }

  getPublicState() {
    return {
      ...this.state,
      sessions: this.state.sessions.map((session) => ({
        ...session,
        tabs: session.tabs.map((tab) => ({
          ...tab,
          camera: sanitizeCamera(tab.camera),
          panes: tab.panes.map((pane) => ({
            id: pane.id,
            type: paneType(pane.type),
            title: pane.title,
            cwd: pane.cwd,
            path: pane.type === 'files' || pane.type === 'notepad' ? pane.path : undefined,
            url: pane.type === 'browser' ? pane.url : undefined,
            browserTabs: pane.type === 'browser' ? pane.browserTabs.map((tab) => browserTab(tab)) : undefined,
            activeBrowserTabId: pane.type === 'browser' ? pane.activeBrowserTabId : undefined,
            notepadTabs: pane.type === 'notepad' ? pane.notepadTabs.map((tab) => notepadTab(tab)) : undefined,
            activeNotepadTabId: pane.type === 'notepad' ? pane.activeNotepadTabId : undefined,
            fontSize: validPaneFontSize(pane.fontSize) ? pane.fontSize : undefined,
            split: pane.split,
            layout: sanitizeLayout(pane.layout)
          }))
        }))
      }))
    };
  }

  findPane(paneId) {
    for (const session of this.state.sessions) {
      for (const tab of session.tabs) {
        const pane = tab.panes.find((candidate) => candidate.id === paneId);
        if (pane) {
          return { session, tab, pane };
        }
      }
    }
    return null;
  }

  appendScrollback(paneId, text) {
    const found = this.findPane(paneId);
    if (!found) {
      return;
    }

    found.pane.scrollback.push(text);
    if (found.pane.scrollback.length > this.scrollbackLimit) {
      found.pane.scrollback = found.pane.scrollback.slice(-this.scrollbackLimit);
    }
  }

  createSession(name) {
    const sessionName = String(name || '').trim() ||
      nextNumberedName('Workspace', this.state.sessions.map((session) => session.name));
    const paneTitle = nextNumberedName('PowerShell', []);
    const session = defaultSession(sessionName, paneTitle);
    this.state.sessions.push(session);
    this.state.activeSessionId = session.id;
    this.save();
    return session;
  }

  closeSession(sessionId) {
    if (this.state.sessions.length <= 1) {
      return false;
    }

    const index = this.state.sessions.findIndex((session) => session.id === sessionId);
    if (index === -1) {
      return false;
    }

    this.state.sessions.splice(index, 1);
    if (this.state.activeSessionId === sessionId) {
      this.state.activeSessionId = this.state.sessions[Math.max(0, index - 1)].id;
    }
    this.save();
    return true;
  }

  renameSession(sessionId, name) {
    const nextName = String(name || '').trim();
    const session = this.state.sessions.find((candidate) => candidate.id === sessionId);
    if (!session || !nextName) {
      return false;
    }

    session.name = nextName;
    this.save();
    return true;
  }

  setActiveSession(sessionId) {
    if (!this.state.sessions.some((session) => session.id === sessionId)) {
      return false;
    }

    this.state.activeSessionId = sessionId;
    this.save();
    return true;
  }

  splitPane(paneId, direction) {
    const found = this.findPane(paneId);
    if (!found) {
      return null;
    }

    const layout = cascadeLayout(found.tab.panes);
    const pane = {
      id: crypto.randomUUID(),
      type: 'terminal',
      title: nextNumberedName('PowerShell', found.tab.panes.map((candidate) => candidate.title)),
      cwd: found.pane.cwd,
      split: direction === 'vertical' ? 'vertical' : 'horizontal',
      layout,
      scrollback: []
    };
    if (!pane.layout) {
      return null;
    }
    found.tab.panes.push(pane);
    found.tab.activePaneId = pane.id;
    found.session.activePaneId = pane.id;
    this.save();
    return pane;
  }

  createFilesPane(paneId, pathValue = '') {
    const found = this.findPane(paneId);
    if (!found) {
      return null;
    }
    const layout = cascadeLayout(found.tab.panes);
    const pane = {
      id: crypto.randomUUID(),
      type: 'files',
      title: nextNumberedName('Files', found.tab.panes.map((candidate) => candidate.title)),
      cwd: found.pane.cwd,
      path: pathValue || '',
      split: 'files',
      layout,
      scrollback: []
    };
    if (!pane.layout) {
      return null;
    }
    found.tab.panes.push(pane);
    found.tab.activePaneId = pane.id;
    found.session.activePaneId = pane.id;
    this.state.activeSessionId = found.session.id;
    this.save();
    return pane;
  }

  setFilesPanePath(paneId, pathValue) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'files') {
      return false;
    }
    found.pane.path = String(pathValue || '');
    this.save();
    return true;
  }

  createBrowserPane(paneId, urlValue = '', emulationMode = 'desktop') {
    return this.createUtilityPane(paneId, 'browser', 'Browser', urlValue, 'url', emulationMode);
  }

  setBrowserPaneUrl(paneId, urlValue) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'browser') {
      return false;
    }
    found.pane.url = String(urlValue || '');
    const activeTab = found.pane.browserTabs?.find((tab) => tab.id === found.pane.activeBrowserTabId);
    if (activeTab) activeTab.url = found.pane.url;
    this.save();
    return true;
  }

  createBrowserTab(paneId, urlValue = '', emulationMode = 'desktop') {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'browser' || found.pane.browserTabs.length >= 50) return null;
    const tab = browserTab({ url: urlValue, emulationMode });
    found.pane.browserTabs.push(tab);
    found.pane.activeBrowserTabId = tab.id;
    found.pane.url = tab.url;
    this.save();
    return tab;
  }

  activateBrowserTab(paneId, tabId) {
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'browser'
      ? found.pane.browserTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab) return false;
    found.pane.activeBrowserTabId = tab.id;
    found.pane.url = tab.url;
    this.save();
    return true;
  }

  updateBrowserTab(paneId, tabId, updates = {}) {
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'browser'
      ? found.pane.browserTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab) return false;
    if (Object.prototype.hasOwnProperty.call(updates, 'url')) tab.url = String(updates.url || '');
    if (Object.prototype.hasOwnProperty.call(updates, 'title')) tab.title = String(updates.title || 'New tab').slice(0, 160);
    if (Object.prototype.hasOwnProperty.call(updates, 'zoom')) {
      const zoom = Number(updates.zoom);
      if (zoom >= 0.25 && zoom <= 3) tab.zoom = zoom;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'emulationMode')) {
      tab.emulationMode = browserEmulationMode(updates.emulationMode);
    }
    if (found.pane.activeBrowserTabId === tab.id) found.pane.url = tab.url;
    this.save();
    return true;
  }

  closeBrowserTab(paneId, tabId) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'browser') return false;
    const index = found.pane.browserTabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return false;
    if (found.pane.browserTabs.length === 1) {
      found.pane.browserTabs[0] = browserTab({ id: tabId });
    } else {
      found.pane.browserTabs.splice(index, 1);
    }
    if (!found.pane.browserTabs.some((tab) => tab.id === found.pane.activeBrowserTabId)) {
      found.pane.activeBrowserTabId = found.pane.browserTabs[Math.min(index, found.pane.browserTabs.length - 1)].id;
    }
    const activeTab = found.pane.browserTabs.find((tab) => tab.id === found.pane.activeBrowserTabId);
    found.pane.url = activeTab?.url || '';
    this.save();
    return true;
  }

  createNotepadPane(paneId, pathValue = '') {
    return this.createUtilityPane(paneId, 'notepad', 'Notepad', pathValue, 'path');
  }

  createUsagePane(paneId) {
    return this.createUtilityPane(paneId, 'usage', 'Usage');
  }

  createNotepadTab(paneId, pathValue = '') {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'notepad' || found.pane.notepadTabs.length >= 50) return null;
    const tab = notepadTab({ path: pathValue });
    found.pane.notepadTabs.push(tab);
    found.pane.activeNotepadTabId = tab.id;
    found.pane.path = tab.path;
    this.save();
    return tab;
  }

  activateNotepadTab(paneId, tabId) {
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'notepad'
      ? found.pane.notepadTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab) return false;
    found.pane.activeNotepadTabId = tab.id;
    found.pane.path = tab.path;
    this.save();
    return true;
  }

  updateNotepadTab(paneId, tabId, updates = {}) {
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'notepad'
      ? found.pane.notepadTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab) return false;
    if (Object.prototype.hasOwnProperty.call(updates, 'path')) tab.path = String(updates.path || '');
    if (Object.prototype.hasOwnProperty.call(updates, 'title')) tab.title = String(updates.title || 'Untitled').slice(0, 160);
    if (Object.prototype.hasOwnProperty.call(updates, 'content') && !tab.path) {
      tab.content = String(updates.content || '').slice(0, MAX_NOTEPAD_CONTENT_LENGTH);
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'encoding') && NOTEPAD_ENCODINGS.has(updates.encoding)) {
      tab.encoding = updates.encoding;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'wrap')) tab.wrap = Boolean(updates.wrap);
    if (Object.prototype.hasOwnProperty.call(updates, 'indentGuides')) tab.indentGuides = Boolean(updates.indentGuides);
    if (Object.prototype.hasOwnProperty.call(updates, 'autosave')) tab.autosave = Boolean(updates.autosave);
    if (Object.prototype.hasOwnProperty.call(updates, 'fontFamily')) {
      tab.fontFamily = String(updates.fontFamily || '').slice(0, 200);
    }
    if (tab.path) tab.content = '';
    if (found.pane.activeNotepadTabId === tab.id) found.pane.path = tab.path;
    this.save();
    return true;
  }

  closeNotepadTab(paneId, tabId) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'notepad') return false;
    const index = found.pane.notepadTabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return false;
    if (found.pane.notepadTabs.length === 1) {
      found.pane.notepadTabs[0] = notepadTab({ id: tabId });
    } else {
      found.pane.notepadTabs.splice(index, 1);
    }
    if (!found.pane.notepadTabs.some((tab) => tab.id === found.pane.activeNotepadTabId)) {
      found.pane.activeNotepadTabId = found.pane.notepadTabs[Math.min(index, found.pane.notepadTabs.length - 1)].id;
    }
    const activeTab = found.pane.notepadTabs.find((tab) => tab.id === found.pane.activeNotepadTabId);
    found.pane.path = activeTab?.path || '';
    this.save();
    return true;
  }

  createUtilityPane(paneId, type, title, value, property, emulationMode = 'desktop') {
    const found = this.findPane(paneId);
    if (!found) {
      return null;
    }
    const layout = cascadeLayout(found.tab.panes);
    if (!layout) {
      return null;
    }
    const pane = {
      id: crypto.randomUUID(),
      type,
      title: nextNumberedName(title, found.tab.panes.map((candidate) => candidate.title)),
      cwd: found.pane.cwd,
      split: type,
      layout,
      scrollback: []
    };
    if (property) {
      pane[property] = String(value || '');
    }
    if (type === 'browser') {
      const tab = browserTab({ url: value, emulationMode });
      pane.browserTabs = [tab];
      pane.activeBrowserTabId = tab.id;
    }
    if (type === 'notepad') {
      const tab = notepadTab({ path: value });
      pane.notepadTabs = [tab];
      pane.activeNotepadTabId = tab.id;
    }
    found.tab.panes.push(pane);
    found.tab.activePaneId = pane.id;
    found.session.activePaneId = pane.id;
    this.state.activeSessionId = found.session.id;
    this.save();
    return pane;
  }

  closePane(paneId) {
    for (const session of this.state.sessions) {
      for (const tab of session.tabs) {
        if (tab.panes.length <= 1) {
          continue;
        }
        const index = tab.panes.findIndex((pane) => pane.id === paneId);
        if (index !== -1) {
          tab.panes.splice(index, 1);
          tab.activePaneId = tab.panes[0].id;
          session.activePaneId = tab.panes[0].id;
          this.save();
          return true;
        }
      }
    }
    return false;
  }

  renamePane(paneId, title) {
    const nextTitle = String(title || '').trim();
    const found = this.findPane(paneId);
    if (!found || !nextTitle) {
      return false;
    }

    found.pane.title = nextTitle;
    this.save();
    return true;
  }

  setPaneFontSize(paneId, fontSize) {
    const found = this.findPane(paneId);
    if (!found || !validPaneFontSize(fontSize)) {
      return false;
    }
    found.pane.fontSize = Number(fontSize);
    this.save();
    return true;
  }

  resizePane(paneId, layout) {
    const found = this.findPane(paneId);
    if (!found) {
      return false;
    }

    found.pane.layout = sanitizeLayout(layout);
    this.save();
    return true;
  }

  movePane(paneId, beforePaneId) {
    const found = this.findPane(paneId);
    if (!found) {
      return false;
    }

    const fromIndex = found.tab.panes.findIndex((pane) => pane.id === paneId);
    const toIndex = found.tab.panes.findIndex((pane) => pane.id === beforePaneId);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
      return false;
    }

    const [pane] = found.tab.panes.splice(fromIndex, 1);
    const nextIndex = found.tab.panes.findIndex((candidate) => candidate.id === beforePaneId);
    found.tab.panes.splice(nextIndex, 0, pane);
    found.tab.activePaneId = paneId;
    found.session.activePaneId = paneId;
    this.save();
    return true;
  }

  setActivePane(paneId) {
    const found = this.findPane(paneId);
    if (!found) {
      return false;
    }

    found.tab.activePaneId = paneId;
    found.session.activePaneId = paneId;
    this.state.activeSessionId = found.session.id;
    this.save();
    return true;
  }

  setCamera(tabId, camera) {
    for (const session of this.state.sessions) {
      const tab = session.tabs.find((candidate) => candidate.id === tabId);
      if (tab) {
        tab.camera = sanitizeCamera(camera);
        this.save();
        return true;
      }
    }
    return false;
  }
}

module.exports = {
  StateStore,
  defaultSession,
  nextNumberedName
};

function snapUnit(value) {
  return Math.round(value / GRID_UNIT) * GRID_UNIT;
}

function sanitizeLayout(layout) {
  const w = Math.max(GRID_UNIT, snapUnit(Math.round(Number(layout?.w)) || DEFAULT_PANE_WIDTH));
  const h = Math.max(GRID_UNIT, snapUnit(Math.round(Number(layout?.h)) || DEFAULT_PANE_HEIGHT));
  const x = snapUnit(Math.round(Number(layout?.x)) || 0);
  const y = snapUnit(Math.round(Number(layout?.y)) || 0);
  const z = Math.max(0, Math.round(Number(layout?.z)) || 0);
  return { x, y, w, h, z };
}

function migrateLayout(layout) {
  if (layout && (Number.isFinite(Number(layout.w)) || Number.isFinite(Number(layout.h)))) {
    return sanitizeLayout(layout);
  }
  const cols = Math.max(1, Math.round(Number(layout?.cols)) || 1);
  const rows = Math.max(1, Math.round(Number(layout?.rows)) || 1);
  const cellX = Math.round(Number(layout?.x)) || 0;
  const cellY = Math.round(Number(layout?.y)) || 0;
  return sanitizeLayout({
    x: cellX * DEFAULT_PANE_WIDTH,
    y: cellY * DEFAULT_PANE_HEIGHT,
    w: cols * DEFAULT_PANE_WIDTH,
    h: rows * DEFAULT_PANE_HEIGHT,
    z: 0
  });
}

function sanitizeCamera(camera) {
  const scale = Number(camera?.scale);
  return {
    x: Math.round(Number(camera?.x)) || 0,
    y: Math.round(Number(camera?.y)) || 0,
    scale: scale >= MIN_ZOOM && scale <= MAX_ZOOM ? scale : 1
  };
}

function nextPaneZ(panes) {
  return panes.reduce((max, pane) => Math.max(max, Number(pane.layout?.z) || 0), 0) + 1;
}

function cascadeLayout(panes) {
  const step = PANE_CASCADE_STEP * (panes.length % 6);
  return {
    x: PANE_CASCADE_STEP + step,
    y: PANE_CASCADE_STEP + step,
    w: DEFAULT_PANE_WIDTH,
    h: DEFAULT_PANE_HEIGHT,
    z: nextPaneZ(panes)
  };
}

function validPaneFontSize(value) {
  const size = Number(value);
  return Number.isInteger(size) && size >= 8 && size <= 32;
}
