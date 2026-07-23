const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeCwd } = require('./shell');

const DEFAULT_GRID_COLUMNS = 4;
const DEFAULT_GRID_ROWS = 3;
const PANE_TYPES = new Set(['terminal', 'files', 'browser', 'notepad']);
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
            layout: { x: 0, y: 0, cols: 1, rows: 1 },
            scrollback: []
          }
        ]
      }
    ]
  };
}

class StateStore {
  constructor(root, scrollbackLimit, gridColumns = DEFAULT_GRID_COLUMNS, gridRows = DEFAULT_GRID_ROWS) {
    this.root = root;
    this.dataDir = path.join(root, 'data');
    this.statePath = path.join(this.dataDir, 'state.json');
    this.scrollbackLimit = scrollbackLimit;
    this.gridColumns = positiveInteger(gridColumns, DEFAULT_GRID_COLUMNS);
    this.gridRows = positiveInteger(gridRows, DEFAULT_GRID_ROWS);
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
        layout: sanitizeLayout(pane.layout, this.gridColumns, this.gridRows),
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
      if (!isLayoutFree(panes, nextPane.id, nextPane.layout, this.gridColumns, this.gridRows)) {
        nextPane.layout = firstAvailableLayout(panes, this.gridColumns, this.gridRows, nextPane.layout) ||
          firstAvailableLayout(panes, this.gridColumns, this.gridRows, { x: 0, y: 0, cols: 1, rows: 1 }) ||
          { x: 0, y: 0, cols: 1, rows: 1 };
      }
      panes.push(nextPane);
    }
    return { ...tab, panes };
  }

  getPersistedState() {
    return {
      ...this.state,
      sessions: this.state.sessions.map((session) => ({
        ...session,
        tabs: session.tabs.map((tab) => ({
          ...tab,
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
            layout: sanitizeLayout(pane.layout, this.gridColumns, this.gridRows)
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
            layout: sanitizeLayout(pane.layout, this.gridColumns, this.gridRows)
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

    const layout = firstAvailableLayout(found.tab.panes, this.gridColumns, this.gridRows, { x: 0, y: 0, cols: 1, rows: 1 }) ||
      makeRoomForLayout(found.tab.panes, this.gridColumns, this.gridRows);
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
    const layout = firstAvailableLayout(found.tab.panes, this.gridColumns, this.gridRows, { x: 0, y: 0, cols: 1, rows: 1 }) ||
      makeRoomForLayout(found.tab.panes, this.gridColumns, this.gridRows);
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
    const layout = firstAvailableLayout(found.tab.panes, this.gridColumns, this.gridRows, { x: 0, y: 0, cols: 1, rows: 1 }) ||
      makeRoomForLayout(found.tab.panes, this.gridColumns, this.gridRows);
    if (!layout) {
      return null;
    }
    const pane = {
      id: crypto.randomUUID(),
      type,
      title: nextNumberedName(title, found.tab.panes.map((candidate) => candidate.title)),
      cwd: found.pane.cwd,
      [property]: String(value || ''),
      split: type,
      layout,
      scrollback: []
    };
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

  resizePane(paneId, layout, maxColumns, maxRows) {
    const found = this.findPane(paneId);
    if (!found) {
      return false;
    }

    const columns = positiveInteger(maxColumns, this.gridColumns);
    const rows = positiveInteger(maxRows, this.gridRows);
    const nextLayout = sanitizeLayout(layout, columns, rows);
    if (!isLayoutFree(found.tab.panes, paneId, nextLayout, columns, rows)) {
      return false;
    }

    found.pane.layout = nextLayout;
    this.save();
    return true;
  }

  resizePanePair(paneId, layout, adjacentPaneId, adjacentLayout, maxColumns, maxRows) {
    const found = this.findPane(paneId);
    const adjacent = this.findPane(adjacentPaneId);
    if (!found || !adjacent || found.tab !== adjacent.tab || paneId === adjacentPaneId) {
      return false;
    }

    const columns = positiveInteger(maxColumns, this.gridColumns);
    const rows = positiveInteger(maxRows, this.gridRows);
    if (!validLayoutSize(layout, columns, rows) || !validLayoutSize(adjacentLayout, columns, rows)) {
      return false;
    }
    const nextLayout = sanitizeLayout(layout, columns, rows);
    const nextAdjacentLayout = sanitizeLayout(adjacentLayout, columns, rows);
    if (layoutsOverlap(nextLayout, nextAdjacentLayout)) {
      return false;
    }
    const otherPanes = found.tab.panes.filter((pane) => pane.id !== paneId && pane.id !== adjacentPaneId);
    if (!isLayoutFree(otherPanes, '', nextLayout, columns, rows) ||
        !isLayoutFree(otherPanes, '', nextAdjacentLayout, columns, rows)) {
      return false;
    }

    found.pane.layout = nextLayout;
    adjacent.pane.layout = nextAdjacentLayout;
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
}

module.exports = {
  StateStore,
  defaultSession,
  nextNumberedName
};

function sanitizeLayout(layout, maxColumns = DEFAULT_GRID_COLUMNS, maxRows = DEFAULT_GRID_ROWS) {
  const columns = positiveInteger(maxColumns, DEFAULT_GRID_COLUMNS);
  const rows = positiveInteger(maxRows, DEFAULT_GRID_ROWS);
  const cols = Math.max(1, Math.min(columns, Number(layout?.cols) || 1));
  const rowSpan = Math.max(1, Math.min(rows, Number(layout?.rows) || 1));
  const x = Math.max(0, Math.min(columns - cols, Number(layout?.x) || 0));
  const y = Math.max(0, Math.min(rows - rowSpan, Number(layout?.y) || 0));
  return {
    x,
    y,
    cols,
    rows: rowSpan
  };
}

function validPaneFontSize(value) {
  const size = Number(value);
  return Number.isInteger(size) && size >= 8 && size <= 32;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function validLayoutSize(layout, maxColumns, maxRows) {
  const x = Number(layout?.x);
  const y = Number(layout?.y);
  const cols = Number(layout?.cols);
  const rows = Number(layout?.rows);
  return Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(cols) && Number.isInteger(rows) &&
    x >= 0 && y >= 0 && cols >= 1 && rows >= 1 && x + cols <= maxColumns && y + rows <= maxRows;
}

function firstAvailableLayout(panes, maxColumns, maxRows, preferred) {
  const size = sanitizeLayout(preferred, maxColumns, maxRows);
  for (let y = 0; y <= maxRows - size.rows; y += 1) {
    for (let x = 0; x <= maxColumns - size.cols; x += 1) {
      const layout = { ...size, x, y };
      if (isLayoutFree(panes, '', layout, maxColumns, maxRows)) {
        return layout;
      }
    }
  }
  return null;
}

function makeRoomForLayout(panes, maxColumns, maxRows) {
  const candidate = panes
    .map((pane) => ({ pane, layout: sanitizeLayout(pane.layout, maxColumns, maxRows) }))
    .filter(({ layout }) => layout.cols > 1 || layout.rows > 1)
    .sort((a, b) => (b.layout.cols * b.layout.rows) - (a.layout.cols * a.layout.rows))[0];
  if (!candidate) {
    return null;
  }

  if (candidate.layout.cols >= candidate.layout.rows && candidate.layout.cols > 1) {
    candidate.layout.cols -= 1;
  } else {
    candidate.layout.rows -= 1;
  }
  candidate.pane.layout = candidate.layout;
  return firstAvailableLayout(panes, maxColumns, maxRows, { x: 0, y: 0, cols: 1, rows: 1 });
}

function isLayoutFree(panes, paneId, layout, maxColumns = DEFAULT_GRID_COLUMNS, maxRows = DEFAULT_GRID_ROWS) {
  return !panes.some((pane) => pane.id !== paneId && layoutsOverlap(sanitizeLayout(pane.layout, maxColumns, maxRows), layout));
}

function layoutsOverlap(a, b) {
  return a.x < b.x + b.cols &&
    a.x + a.cols > b.x &&
    a.y < b.y + b.rows &&
    a.y + a.rows > b.y;
}
