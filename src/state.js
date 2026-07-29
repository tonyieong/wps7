const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeCwd } = require('./shell');

const GRID_UNIT = 120;
const GRID_MINOR_UNIT = 30;
const DEFAULT_PANE_WIDTH = 720;
const DEFAULT_PANE_HEIGHT = 480;
const PANE_CASCADE_STEP = GRID_UNIT;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 4;
const DRAW_TYPES = new Set(['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'draw', 'text']);
const MAX_DRAW_ELEMENTS = 2000;
const MAX_DRAW_POINTS = 4000;
const MAX_DRAW_TEXT_LENGTH = 2000;
const DRAW_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const DRAW_FILL_STYLES = new Set(['hachure', 'cross-hatch', 'solid']);
const DRAW_STROKE_WIDTHS = new Set([1, 2, 4]);
const DRAW_STROKE_STYLES = new Set(['solid', 'dashed', 'dotted']);
const DRAW_ROUNDNESS = new Set(['sharp', 'round']);
const DRAW_ARROWHEADS = new Set(['none', 'arrow', 'triangle', 'triangle_outline', 'diamond', 'diamond_outline', 'circle', 'circle_outline', 'bar']);
const DRAW_FONT_FAMILIES = new Set(['hand-drawn', 'normal', 'code']);
const DRAW_FONT_SIZES = new Set([16, 20, 28, 36]);
const DRAW_TEXT_ALIGNS = new Set(['left', 'center', 'right']);
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

function terminalTab(value = {}, fallback = {}) {
  return {
    id: value.id || crypto.randomUUID(),
    title: String(value.title || fallback.title || 'PowerShell').slice(0, 160),
    cwd: String(value.cwd || fallback.cwd || '')
  };
}

function terminalTabsForPane(pane, fallback) {
  const tabs = Array.isArray(pane.terminalTabs) && pane.terminalTabs.length
    ? pane.terminalTabs.slice(0, 50).map((tab) => terminalTab(tab, fallback))
    : [terminalTab({}, fallback)];
  const activeTerminalTabId = tabs.some((tab) => tab.id === pane.activeTerminalTabId)
    ? pane.activeTerminalTabId
    : tabs[0].id;
  return { tabs, activeTerminalTabId };
}

function filesTab(value = {}, fallbackPath = '') {
  return {
    id: value.id || crypto.randomUUID(),
    path: String(value.path || fallbackPath || '')
  };
}

function filesTabsForPane(pane) {
  const tabs = Array.isArray(pane.filesTabs) && pane.filesTabs.length
    ? pane.filesTabs.slice(0, 50).map((tab) => filesTab(tab))
    : [filesTab({ path: pane.path || '' })];
  const activeFilesTabId = tabs.some((tab) => tab.id === pane.activeFilesTabId)
    ? pane.activeFilesTabId
    : tabs[0].id;
  return { tabs, activeFilesTabId };
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

function notepadTabDefaults(defaults = {}) {
  return {
    wrap: Boolean(defaults.wrap),
    indentGuides: Boolean(defaults.indentGuides),
    autosave: Boolean(defaults.autosave)
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
  const firstTerminalTab = terminalTab({ title: paneTitle, cwd: process.cwd() });
  return {
    id: crypto.randomUUID(),
    name,
    activePaneId: paneId,
    tabs: [
      {
        id: crypto.randomUUID(),
        name: 'Main',
        activePaneId: paneId,
        drawings: [],
        panes: [
          {
            id: paneId,
            type: 'terminal',
            title: paneTitle,
            cwd: process.cwd(),
            split: null,
            layout: { x: GRID_UNIT, y: GRID_UNIT, w: DEFAULT_PANE_WIDTH, h: DEFAULT_PANE_HEIGHT, z: 1 },
            scrollback: [],
            terminalTabs: [{ ...firstTerminalTab, scrollback: [] }],
            activeTerminalTabId: firstTerminalTab.id
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
      if (nextPane.type === 'terminal') {
        const terminalState = terminalTabsForPane(pane, { title: nextPane.title, cwd: nextPane.cwd });
        nextPane.terminalTabs = terminalState.tabs.map((tab) => ({
          ...tab,
          cwd: normalizeCwd(tab.cwd, this.root),
          scrollback: []
        }));
        nextPane.activeTerminalTabId = terminalState.activeTerminalTabId;
      }
      if (nextPane.type === 'files') {
        const filesState = filesTabsForPane(pane);
        nextPane.filesTabs = filesState.tabs;
        nextPane.activeFilesTabId = filesState.activeFilesTabId;
        nextPane.path = nextPane.filesTabs.find((tab) => tab.id === nextPane.activeFilesTabId)?.path || '';
      }
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
    return { ...tab, panes, camera: sanitizeCamera(tab.camera), drawings: sanitizeDrawings(tab.drawings) };
  }

  getPersistedState() {
    return {
      ...this.state,
      sessions: this.state.sessions.map((session) => ({
        ...session,
        tabs: session.tabs.map((tab) => ({
          ...tab,
          camera: sanitizeCamera(tab.camera),
          drawings: sanitizeDrawings(tab.drawings),
          panes: tab.panes.map((pane) => ({
            id: pane.id,
            type: paneType(pane.type),
            title: pane.title,
            cwd: pane.cwd,
            path: pane.type === 'files' || pane.type === 'notepad' ? pane.path : undefined,
            url: pane.type === 'browser' ? pane.url : undefined,
            terminalTabs: pane.type === 'terminal' ? pane.terminalTabs.map((tab) => terminalTab(tab)) : undefined,
            activeTerminalTabId: pane.type === 'terminal' ? pane.activeTerminalTabId : undefined,
            filesTabs: pane.type === 'files' ? pane.filesTabs.map((tab) => filesTab(tab)) : undefined,
            activeFilesTabId: pane.type === 'files' ? pane.activeFilesTabId : undefined,
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
          drawings: sanitizeDrawings(tab.drawings),
          panes: tab.panes.map((pane) => ({
            id: pane.id,
            type: paneType(pane.type),
            title: pane.title,
            cwd: pane.cwd,
            path: pane.type === 'files' || pane.type === 'notepad' ? pane.path : undefined,
            url: pane.type === 'browser' ? pane.url : undefined,
            terminalTabs: pane.type === 'terminal' ? pane.terminalTabs.map((tab) => terminalTab(tab)) : undefined,
            activeTerminalTabId: pane.type === 'terminal' ? pane.activeTerminalTabId : undefined,
            filesTabs: pane.type === 'files' ? pane.filesTabs.map((tab) => filesTab(tab)) : undefined,
            activeFilesTabId: pane.type === 'files' ? pane.activeFilesTabId : undefined,
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

  findTerminalTab(tabId) {
    for (const session of this.state.sessions) {
      for (const tab of session.tabs) {
        for (const pane of tab.panes) {
          const terminalTabEntry = (pane.terminalTabs || []).find((candidate) => candidate.id === tabId);
          if (terminalTabEntry) {
            return { session, tab, pane, terminalTab: terminalTabEntry };
          }
        }
      }
    }
    return null;
  }

  appendScrollback(id, text) {
    const target = this.findTerminalTab(id)?.terminalTab || this.findPane(id)?.pane;
    if (!target) {
      return;
    }

    target.scrollback.push(text);
    if (target.scrollback.length > this.scrollbackLimit) {
      target.scrollback = target.scrollback.slice(-this.scrollbackLimit);
    }
  }

  clearScrollback(id) {
    const target = this.findTerminalTab(id)?.terminalTab || this.findPane(id)?.pane;
    if (target) {
      target.scrollback = [];
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
    const title = nextNumberedName('PowerShell', found.tab.panes.map((candidate) => candidate.title));
    const firstTab = { ...terminalTab({ title, cwd: found.pane.cwd }), scrollback: [] };
    const pane = {
      id: crypto.randomUUID(),
      type: 'terminal',
      title,
      cwd: found.pane.cwd,
      split: direction === 'vertical' ? 'vertical' : 'horizontal',
      layout,
      scrollback: [],
      terminalTabs: [firstTab],
      activeTerminalTabId: firstTab.id
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
    const firstTab = filesTab({ path: pathValue || '' });
    const pane = {
      id: crypto.randomUUID(),
      type: 'files',
      title: nextNumberedName('Files', found.tab.panes.map((candidate) => candidate.title)),
      cwd: found.pane.cwd,
      path: pathValue || '',
      split: 'files',
      layout,
      scrollback: [],
      filesTabs: [firstTab],
      activeFilesTabId: firstTab.id
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
    const activeTab = found.pane.filesTabs?.find((tab) => tab.id === found.pane.activeFilesTabId);
    if (activeTab) activeTab.path = found.pane.path;
    this.save();
    return true;
  }

  createFilesTab(paneId, pathValue = '') {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'files' || found.pane.filesTabs.length >= 50) return null;
    const tab = filesTab({ path: pathValue });
    found.pane.filesTabs.push(tab);
    found.pane.activeFilesTabId = tab.id;
    found.pane.path = tab.path;
    this.save();
    return tab;
  }

  activateFilesTab(paneId, tabId) {
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'files'
      ? found.pane.filesTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab) return false;
    found.pane.activeFilesTabId = tab.id;
    found.pane.path = tab.path;
    this.save();
    return true;
  }

  closeFilesTab(paneId, tabId) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'files') return false;
    const index = found.pane.filesTabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return false;
    if (found.pane.filesTabs.length === 1) {
      found.pane.filesTabs[0] = filesTab({ id: tabId });
    } else {
      found.pane.filesTabs.splice(index, 1);
    }
    if (!found.pane.filesTabs.some((tab) => tab.id === found.pane.activeFilesTabId)) {
      found.pane.activeFilesTabId = found.pane.filesTabs[Math.min(index, found.pane.filesTabs.length - 1)].id;
    }
    found.pane.path = found.pane.filesTabs.find((tab) => tab.id === found.pane.activeFilesTabId)?.path || '';
    this.save();
    return true;
  }

  createTerminalTab(paneId) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'terminal' || found.pane.terminalTabs.length >= 50) return null;
    const tab = {
      ...terminalTab({
        title: nextNumberedName('PowerShell', found.pane.terminalTabs.map((candidate) => candidate.title)),
        cwd: found.pane.cwd
      }),
      scrollback: []
    };
    found.pane.terminalTabs.push(tab);
    found.pane.activeTerminalTabId = tab.id;
    this.save();
    return tab;
  }

  activateTerminalTab(paneId, tabId) {
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'terminal'
      ? found.pane.terminalTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab) return false;
    found.pane.activeTerminalTabId = tab.id;
    this.save();
    return true;
  }

  renameTerminalTab(paneId, tabId, title) {
    const nextTitle = String(title || '').trim();
    const found = this.findPane(paneId);
    const tab = found?.pane.type === 'terminal'
      ? found.pane.terminalTabs.find((candidate) => candidate.id === tabId)
      : null;
    if (!tab || !nextTitle) return false;
    tab.title = nextTitle.slice(0, 160);
    this.save();
    return true;
  }

  closeTerminalTab(paneId, tabId) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'terminal') return null;
    const index = found.pane.terminalTabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return null;
    // Closing the last tab restarts the shell instead of leaving the pane empty.
    let replacement = null;
    if (found.pane.terminalTabs.length === 1) {
      replacement = {
        ...terminalTab({ title: found.pane.terminalTabs[0].title, cwd: found.pane.cwd }),
        scrollback: []
      };
      found.pane.terminalTabs[0] = replacement;
    } else {
      found.pane.terminalTabs.splice(index, 1);
    }
    if (!found.pane.terminalTabs.some((tab) => tab.id === found.pane.activeTerminalTabId)) {
      found.pane.activeTerminalTabId = found.pane.terminalTabs[Math.min(index, found.pane.terminalTabs.length - 1)].id;
    }
    this.save();
    return { replacement };
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

  createNotepadPane(paneId, pathValue = '', defaults = {}) {
    const pane = this.createUtilityPane(paneId, 'notepad', 'Notepad', pathValue, 'path');
    if (pane) {
      Object.assign(pane.notepadTabs[0], notepadTabDefaults(defaults));
      this.save();
    }
    return pane;
  }

  createUsagePane(paneId) {
    return this.createUtilityPane(paneId, 'usage', 'Usage');
  }

  createNotepadTab(paneId, pathValue = '', defaults = {}) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'notepad' || found.pane.notepadTabs.length >= 50) return null;
    const tab = notepadTab({ path: pathValue, ...notepadTabDefaults(defaults) });
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

  setDrawings(tabId, drawings) {
    for (const session of this.state.sessions) {
      const tab = session.tabs.find((candidate) => candidate.id === tabId);
      if (tab) {
        tab.drawings = sanitizeDrawings(drawings);
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

// Panes snap to the dashed minor grid, which also covers every solid grid line.
function snapUnit(value) {
  return Math.round(value / GRID_MINOR_UNIT) * GRID_MINOR_UNIT;
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

// strokeColor keeps 'auto' as a valid value (resolved to the --text theme token
// on the client) so drawings stay visible in both the light and dark themes.
function drawStrokeColor(value) {
  if (value === 'auto') {
    return 'auto';
  }
  return typeof value === 'string' && DRAW_COLOR_PATTERN.test(value) ? value.toLowerCase() : 'auto';
}

function drawBackgroundColor(value) {
  if (value === 'transparent') {
    return 'transparent';
  }
  return typeof value === 'string' && DRAW_COLOR_PATTERN.test(value) ? value.toLowerCase() : 'transparent';
}

function drawEnum(set, value, fallback) {
  return set.has(value) ? value : fallback;
}

function drawOpacity(value) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 100;
}

// Style fields are scoped per element type so e.g. a line can't carry a
// fillStyle and a text element can't carry an arrowhead.
function drawStyle(value, type) {
  const style = {
    strokeColor: drawStrokeColor(value?.strokeColor),
    opacity: drawOpacity(value?.opacity)
  };
  const strokeWidth = Math.round(Number(value?.strokeWidth));
  if (type === 'rectangle' || type === 'diamond' || type === 'ellipse') {
    style.backgroundColor = drawBackgroundColor(value?.backgroundColor);
    style.fillStyle = drawEnum(DRAW_FILL_STYLES, value?.fillStyle, 'hachure');
    style.strokeWidth = drawEnum(DRAW_STROKE_WIDTHS, strokeWidth, 1);
    style.strokeStyle = drawEnum(DRAW_STROKE_STYLES, value?.strokeStyle, 'solid');
  }
  if (type === 'rectangle' || type === 'diamond') {
    style.roundness = drawEnum(DRAW_ROUNDNESS, value?.roundness, 'sharp');
  }
  if (type === 'arrow' || type === 'line') {
    style.strokeWidth = drawEnum(DRAW_STROKE_WIDTHS, strokeWidth, 1);
    style.strokeStyle = drawEnum(DRAW_STROKE_STYLES, value?.strokeStyle, 'solid');
  }
  // Only "arrow" has arrowheads in Excalidraw (canHaveArrowheads = type => type === 'arrow');
  // "line" intentionally has none.
  if (type === 'arrow') {
    style.startArrowhead = drawEnum(DRAW_ARROWHEADS, value?.startArrowhead, 'none');
    style.endArrowhead = drawEnum(DRAW_ARROWHEADS, value?.endArrowhead, 'arrow');
  }
  if (type === 'draw') {
    style.strokeWidth = drawEnum(DRAW_STROKE_WIDTHS, strokeWidth, 1);
  }
  if (type === 'text') {
    style.fontSize = drawEnum(DRAW_FONT_SIZES, Math.round(Number(value?.fontSize)), 20);
    style.fontFamily = drawEnum(DRAW_FONT_FAMILIES, value?.fontFamily, 'normal');
    style.textAlign = drawEnum(DRAW_TEXT_ALIGNS, value?.textAlign, 'left');
  }
  return style;
}

function drawElement(value) {
  if (!DRAW_TYPES.has(value?.type)) {
    return null;
  }
  const type = value.type;
  const element = {
    id: String(value.id || crypto.randomUUID()).slice(0, 64),
    type,
    x: Math.round(Number(value.x)) || 0,
    y: Math.round(Number(value.y)) || 0,
    w: Math.round(Number(value.w)) || 0,
    h: Math.round(Number(value.h)) || 0,
    ...drawStyle(value, type)
  };
  if (typeof value.groupId === 'string' && value.groupId) {
    element.groupId = value.groupId.slice(0, 64);
  }
  if (type === 'draw') {
    element.points = (Array.isArray(value.points) ? value.points : [])
      .slice(0, MAX_DRAW_POINTS)
      .map((point) => [Math.round(Number(point?.[0])) || 0, Math.round(Number(point?.[1])) || 0]);
  }
  if (type === 'text') {
    element.text = String(value.text || '').slice(0, MAX_DRAW_TEXT_LENGTH);
  }
  return element;
}

function sanitizeDrawings(drawings) {
  return (Array.isArray(drawings) ? drawings : [])
    .slice(0, MAX_DRAW_ELEMENTS)
    .map(drawElement)
    .filter(Boolean);
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
