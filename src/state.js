const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { normalizeCwd } = require('./shell');

const GRID_UNIT = 120;
const DEFAULT_PANE_WIDTH = 720;
const DEFAULT_PANE_HEIGHT = 480;
const MIN_COLUMN_WIDTH = GRID_UNIT;
const MAX_COLUMN_SLOTS = 6;
const PANE_TYPES = new Set(['terminal', 'files', 'browser', 'notepad', 'usage', 'whiteboard']);
const MAX_WHITEBOARD_LENGTH = 5 * 1024 * 1024;
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
        columns: [sanitizeColumn({ width: DEFAULT_PANE_WIDTH, slots: 1 })],
        panes: [
          {
            id: paneId,
            type: 'terminal',
            title: paneTitle,
            cwd: process.cwd(),
            split: null,
            layout: { column: 0, row: 0 },
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
  constructor(root, scrollbackLimit, defaultColumnSlots = 1) {
    this.root = root;
    this.dataDir = path.join(root, 'data');
    this.statePath = path.join(this.dataDir, 'state.json');
    this.scrollbackLimit = scrollbackLimit;
    this.defaultColumnSlots = sanitizeColumn({ slots: defaultColumnSlots }).slots;
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
        layout: pane.layout,
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
      if (nextPane.type === 'whiteboard') {
        nextPane.whiteboard = whiteboardContent(pane.whiteboard);
      }
      panes.push(nextPane);
    }
    // Column placement depends on every pane in the tab, so it is resolved once
    // here rather than per pane above.
    const migrated = migrateTabLayout(panes, tab.columns);
    panes.forEach((pane, index) => {
      pane.layout = migrated.layouts[index];
    });
    return { ...tab, panes, columns: migrated.columns };
  }

  getPersistedState() {
    return {
      ...this.state,
      sessions: this.state.sessions.map((session) => ({
        ...session,
        tabs: session.tabs.map((tab) => ({
          ...tab,
          columns: sanitizeColumns(tab.columns, tab.panes.map((pane) => sanitizeLayout(pane.layout))),
          panes: tab.panes.map((pane) => ({
            id: pane.id,
            type: paneType(pane.type),
            title: pane.title,
            cwd: pane.cwd,
            path: pane.type === 'files' || pane.type === 'notepad' ? pane.path : undefined,
            url: pane.type === 'browser' ? pane.url : undefined,
            whiteboard: pane.type === 'whiteboard' ? whiteboardContent(pane.whiteboard) : undefined,
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
          columns: sanitizeColumns(tab.columns, tab.panes.map((pane) => sanitizeLayout(pane.layout))),
          panes: tab.panes.map((pane) => ({
            id: pane.id,
            type: paneType(pane.type),
            title: pane.title,
            cwd: pane.cwd,
            path: pane.type === 'files' || pane.type === 'notepad' ? pane.path : undefined,
            url: pane.type === 'browser' ? pane.url : undefined,
            whiteboard: pane.type === 'whiteboard' ? whiteboardContent(pane.whiteboard) : undefined,
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

    const layout = appendLayout(found.tab, found.pane, direction, this.defaultColumnSlots);
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
    const layout = appendLayout(found.tab, found.pane, 'auto', this.defaultColumnSlots);
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

  createWhiteboardPane(paneId) {
    return this.createUtilityPane(paneId, 'whiteboard', 'Whiteboard', '{}', 'whiteboard');
  }

  setWhiteboard(paneId, content) {
    const found = this.findPane(paneId);
    if (!found || found.pane.type !== 'whiteboard') {
      return false;
    }
    found.pane.whiteboard = whiteboardContent(content);
    this.save();
    return true;
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
    const layout = appendLayout(found.tab, found.pane, 'auto', this.defaultColumnSlots);
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
          this.pruneColumns(tab);
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

  // Emptying a column would otherwise leave a gap the user cannot close, so
  // empty columns are dropped and the survivors renumbered.
  pruneColumns(tab) {
    const used = new Set(tab.panes.map((pane) => sanitizeLayout(pane.layout).column));
    const kept = [];
    const remap = new Map();
    tab.columns.forEach((column, index) => {
      if (used.has(index)) {
        remap.set(index, kept.length);
        kept.push(column);
      }
    });
    tab.columns = kept.length ? kept : [sanitizeColumn({ width: DEFAULT_PANE_WIDTH, slots: 1 })];
    tab.panes.forEach((pane) => {
      const layout = sanitizeLayout(pane.layout);
      pane.layout = { column: remap.get(layout.column) ?? 0, row: layout.row };
    });
  }

  placePane(paneId, layout) {
    const found = this.findPane(paneId);
    if (!found) {
      return false;
    }

    const next = sanitizeLayout(layout);
    // Dropping past the last column appends exactly one column instead of
    // leaving a run of empty ones behind.
    next.column = Math.min(next.column, found.tab.columns.length);
    if (next.column === found.tab.columns.length) {
      found.tab.columns.push(sanitizeColumn({ width: DEFAULT_PANE_WIDTH, slots: 1 }));
    }
    next.row = Math.min(next.row, found.tab.columns[next.column].slots - 1);
    found.pane.layout = next;
    this.pruneColumns(found.tab);
    this.save();
    return true;
  }

  setColumnWidth(tabId, index, width) {
    return this.updateColumn(tabId, index, (column) => sanitizeColumn({ ...column, width }));
  }

  setColumnSlots(tabId, index, slots) {
    return this.updateColumn(tabId, index, (column, tab) => {
      const next = sanitizeColumn({ ...column, slots });
      // Shrinking a column must not strand panes on rows that no longer exist.
      const occupied = tab.panes.reduce(
        (max, pane) => {
          const layout = sanitizeLayout(pane.layout);
          return layout.column === index ? Math.max(max, layout.row + 1) : max;
        },
        1
      );
      next.slots = Math.max(next.slots, occupied);
      return next;
    });
  }

  updateColumn(tabId, index, build) {
    for (const session of this.state.sessions) {
      const tab = session.tabs.find((candidate) => candidate.id === tabId);
      if (!tab) {
        continue;
      }
      const columnIndex = Math.round(Number(index));
      const column = tab.columns[columnIndex];
      if (!column) {
        return false;
      }
      tab.columns[columnIndex] = build(column, tab);
      this.save();
      return true;
    }
    return false;
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

// Column widths snap to the solid grid so neighbouring columns stay aligned.
function snapColumnWidth(value) {
  return Math.round(value / GRID_UNIT) * GRID_UNIT;
}

function sanitizeLayout(layout) {
  return {
    column: Math.max(0, Math.round(Number(layout?.column)) || 0),
    row: Math.max(0, Math.round(Number(layout?.row)) || 0)
  };
}

function sanitizeColumn(column) {
  const width = snapColumnWidth(Math.round(Number(column?.width)) || DEFAULT_PANE_WIDTH);
  const slots = Math.round(Number(column?.slots)) || 1;
  return {
    width: Math.max(MIN_COLUMN_WIDTH, width),
    slots: Math.min(MAX_COLUMN_SLOTS, Math.max(1, slots))
  };
}

// A column must cover every row its panes claim, otherwise a pane would sit
// outside the column that owns it.
function sanitizeColumns(columns, layouts) {
  const count = layouts.reduce((max, layout) => Math.max(max, layout.column + 1), 1);
  const list = [];
  for (let index = 0; index < count; index += 1) {
    const claimed = layouts.reduce(
      (max, layout) => (layout.column === index ? Math.max(max, layout.row + 1) : max),
      0
    );
    const source = Array.isArray(columns) ? columns[index] : undefined;
    list.push(sanitizeColumn({
      width: source?.width,
      slots: Math.max(Math.round(Number(source?.slots)) || 1, claimed)
    }));
  }
  return list;
}

function isColumnarLayout(layout) {
  return Boolean(layout) && Number.isFinite(Number(layout.column));
}

// Both older schemas reduce to world pixels first, so a single grouping pass
// below covers the freeform canvas and the cell grid that preceded it.
function worldLayout(layout) {
  if (layout && (Number.isFinite(Number(layout.w)) || Number.isFinite(Number(layout.h)))) {
    return {
      x: Math.round(Number(layout.x)) || 0,
      y: Math.round(Number(layout.y)) || 0,
      width: Math.max(MIN_COLUMN_WIDTH, Math.round(Number(layout.w)) || DEFAULT_PANE_WIDTH)
    };
  }
  const cols = Math.max(1, Math.round(Number(layout?.cols)) || 1);
  return {
    x: (Math.round(Number(layout?.x)) || 0) * DEFAULT_PANE_WIDTH,
    y: (Math.round(Number(layout?.y)) || 0) * DEFAULT_PANE_HEIGHT,
    width: cols * DEFAULT_PANE_WIDTH
  };
}

// Panes from the old freeform canvas become columns: each distinct x starts a
// new column, and ascending y becomes the row inside that column.
function migrateTabLayout(panes, columns) {
  const layouts = panes.map((pane) => pane.layout);
  if (layouts.every(isColumnarLayout)) {
    const sanitized = layouts.map(sanitizeLayout);
    return { layouts: sanitized, columns: sanitizeColumns(columns, sanitized) };
  }

  const grouped = new Map();
  panes
    .map((pane, index) => ({ ...worldLayout(pane.layout), index }))
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .forEach((item) => {
      if (!grouped.has(item.x)) {
        grouped.set(item.x, []);
      }
      grouped.get(item.x).push(item);
    });

  const nextLayouts = new Array(panes.length);
  const nextColumns = [];
  for (const items of grouped.values()) {
    const column = nextColumns.length;
    items.forEach((item, row) => {
      nextLayouts[item.index] = { column, row };
    });
    nextColumns.push(sanitizeColumn({
      width: items.reduce((max, item) => Math.max(max, item.width), 0),
      slots: items.length
    }));
  }
  return { layouts: nextLayouts, columns: sanitizeColumns(nextColumns, nextLayouts) };
}

// The board grows to the right, but a new pane first tries to fill a free slot
// of the column it came from, so the configured slots-per-column shape is what
// actually fills up. 'vertical' additionally grows a full column by one slot;
// 'horizontal' always starts a new column.
function appendLayout(tab, sourcePane, direction, defaultSlots = 1) {
  if ((direction === 'vertical' || direction === 'auto') && sourcePane) {
    const columnIndex = sanitizeLayout(sourcePane.layout).column;
    const column = tab.columns[columnIndex];
    if (column) {
      const used = new Set(
        tab.panes
          .filter((pane) => sanitizeLayout(pane.layout).column === columnIndex)
          .map((pane) => sanitizeLayout(pane.layout).row)
      );
      for (let row = 0; row < column.slots; row += 1) {
        if (!used.has(row)) {
          return { column: columnIndex, row };
        }
      }
      // An explicit vertical split still grows a column that is already full;
      // 'auto' leaves it alone and falls through to a new column.
      if (direction === 'vertical' && column.slots < MAX_COLUMN_SLOTS) {
        column.slots += 1;
        return { column: columnIndex, row: column.slots - 1 };
      }
    }
  }
  tab.columns.push(sanitizeColumn({ width: DEFAULT_PANE_WIDTH, slots: defaultSlots }));
  return { column: tab.columns.length - 1, row: 0 };
}

// Excalidraw owns this payload's shape, so it is stored verbatim as a JSON
// string; the server only checks that it parses and stays within its budget.
function whiteboardContent(value) {
  const json = typeof value === 'string' ? value : JSON.stringify(value ?? {});
  if (typeof json !== 'string' || json.length > MAX_WHITEBOARD_LENGTH) {
    return '{}';
  }
  try {
    JSON.parse(json);
    return json;
  } catch {
    return '{}';
  }
}

function validPaneFontSize(value) {
  const size = Number(value);
  return Number.isInteger(size) && size >= 8 && size <= 32;
}
