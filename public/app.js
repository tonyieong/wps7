(function () {
  const themePresets = {
    'wps-dark': { label: 'WPS7 Dark', mode: 'dark', ink: '#08131f', panel: '#0e1c2a', rail: '#0b1926', terminal: '#07131e', surfaceRaised: '#142536', surfaceSoft: '#102131', line: '#25394a', lineStrong: '#385064', text: '#f2f6f7', muted: '#91a3b2', accent: '#48d6b2', accentStrong: '#22b993', warn: '#f1b84b', danger: '#ff7474', shadow: 'rgba(0, 0, 0, .34)', terminalBg: '#06111b', terminalFg: '#eef5f4' },
    'wps-light': { label: 'WPS7 Light', mode: 'light', ink: '#f5f7f8', panel: '#ffffff', rail: '#f2f5f6', terminal: '#f8fafb', surfaceRaised: '#ffffff', surfaceSoft: '#edf3f3', line: '#d7e0e4', lineStrong: '#b9c8cf', text: '#14202b', muted: '#667582', accent: '#159d83', accentStrong: '#0d806a', warn: '#8a4f00', danger: '#c43d4b', shadow: 'rgba(31, 49, 61, .14)', terminalBg: '#ffffff', terminalFg: '#17232d' },
    'apple-dark': { label: 'Apple Dark', mode: 'dark', ink: '#101114', panel: '#1c1c1e', rail: '#161618', terminal: '#0b0c0f', surfaceRaised: '#242428', surfaceSoft: '#202024', line: '#38383d', lineStrong: '#54545b', text: '#f5f5f7', muted: '#a1a1a6', accent: '#0a84ff', accentStrong: '#409cff', warn: '#ffd60a', danger: '#ff453a', shadow: 'rgba(0, 0, 0, .34)', terminalBg: '#0b0c0f', terminalFg: '#f5f5f7' },
    'apple-light': { label: 'Apple Light', mode: 'light', ink: '#f2f2f7', panel: '#ffffff', rail: '#f7f7fa', terminal: '#fbfbfd', surfaceRaised: '#ffffff', surfaceSoft: '#e9e9ee', line: '#d1d1d6', lineStrong: '#aeaeb2', text: '#1c1c1e', muted: '#636366', accent: '#0066cc', accentStrong: '#004f9e', warn: '#7a4b00', danger: '#c9342f', shadow: 'rgba(31, 31, 35, .14)', terminalBg: '#ffffff', terminalFg: '#1c1c1e' },
    'claude-dark': { label: 'Claude Dark', mode: 'dark', ink: '#1f1b18', panel: '#29231f', rail: '#241f1b', terminal: '#171411', surfaceRaised: '#342c27', surfaceSoft: '#302823', line: '#4a3e36', lineStrong: '#685548', text: '#f5eee8', muted: '#b5a79b', accent: '#e58b55', accentStrong: '#f0a36d', warn: '#f2c14e', danger: '#ff7a70', shadow: 'rgba(20, 12, 7, .38)', terminalBg: '#171411', terminalFg: '#f5eee8' },
    'claude-light': { label: 'Claude Light', mode: 'light', ink: '#f7f3ee', panel: '#fffaf5', rail: '#f1ebe4', terminal: '#fffdf9', surfaceRaised: '#ffffff', surfaceSoft: '#eee5dc', line: '#d8cbc0', lineStrong: '#bca99b', text: '#2d2723', muted: '#6f6258', accent: '#b84f23', accentStrong: '#963d1c', warn: '#7f4d00', danger: '#b93434', shadow: 'rgba(72, 49, 34, .14)', terminalBg: '#fffdf9', terminalFg: '#2d2723' },
    'codex-dark': { label: 'Codex Dark', mode: 'dark', ink: '#111311', panel: '#181b18', rail: '#141714', terminal: '#0b0d0c', surfaceRaised: '#202420', surfaceSoft: '#1c201c', line: '#303730', lineStrong: '#465046', text: '#edf3ee', muted: '#9aa79d', accent: '#52d273', accentStrong: '#2fbd56', warn: '#f2b84b', danger: '#ff6b6b', shadow: 'rgba(0, 0, 0, .36)', terminalBg: '#0b0d0c', terminalFg: '#edf3ee' },
    'codex-light': { label: 'Codex Light', mode: 'light', ink: '#f3f5f2', panel: '#ffffff', rail: '#eef1ed', terminal: '#fcfdfb', surfaceRaised: '#ffffff', surfaceSoft: '#e7ece6', line: '#d0d7cf', lineStrong: '#aeb9ad', text: '#182019', muted: '#5d6b60', accent: '#147a36', accentStrong: '#0c652a', warn: '#7c4d00', danger: '#b7333e', shadow: 'rgba(28, 45, 31, .14)', terminalBg: '#fcfdfb', terminalFg: '#182019' }
  };
  const customThemeDefaults = {
    selected_light: 'wps-light', selected_dark: 'wps-dark', mode: 'dark',
    ink: '#0c1017', panel: '#161b24', rail: '#111721', surface: '#202735', line: '#394354', text: '#f4f7fa', muted: '#9aa7b8', accent: '#6ee7c2', warn: '#f0b35a', danger: '#ff7676', terminal_bg: '#080c12', terminal_fg: '#f4f7fa',
    light_ink: '#f5f7f8', light_panel: '#ffffff', light_rail: '#f2f5f6', light_surface: '#edf3f3', light_line: '#d7e0e4', light_text: '#14202b', light_muted: '#667582', light_accent: '#159d83', light_warn: '#8a4f00', light_danger: '#c43d4b', light_terminal_bg: '#ffffff', light_terminal_fg: '#17232d'
  };
  const customThemePaletteKeys = ['ink', 'panel', 'rail', 'surface', 'line', 'text', 'muted', 'accent', 'warn', 'danger', 'terminal_bg', 'terminal_fg'];
  const defaultMobileKeybarButtons = [
    { label: 'Esc', action: 'shortcut', value: 'Escape', enabled: true },
    { label: 'Tab', action: 'shortcut', value: 'Tab', enabled: true },
    { label: 'Ctrl', action: 'modifier', value: 'Control', enabled: true },
    { label: '←', action: 'shortcut', value: 'ArrowLeft', enabled: true },
    { label: '↓', action: 'shortcut', value: 'ArrowDown', enabled: true },
    { label: '↑', action: 'shortcut', value: 'ArrowUp', enabled: true },
    { label: '→', action: 'shortcut', value: 'ArrowRight', enabled: true },
    { label: '^C', action: 'shortcut', value: 'Ctrl+C', enabled: true },
    { label: '^D', action: 'shortcut', value: 'Ctrl+D', enabled: true },
    { label: '^Z', action: 'shortcut', value: 'Ctrl+Z', enabled: true },
    { label: '^L', action: 'shortcut', value: 'Ctrl+L', enabled: true },
    { label: '^R', action: 'shortcut', value: 'Ctrl+R', enabled: true }
  ];
  const savedSidebarOpen = localStorage.getItem('wps7.sidebarOpen');
  const savedSidebarPinned = localStorage.getItem('wps7.sidebarPinned');
  const state = {
    token: localStorage.getItem('wps7.token') || sessionStorage.getItem('wps7.token') || '',
    config: null,
    sessions: [],
    activeSessionId: '',
    activePaneId: '',
    sidebarOpen: savedSidebarOpen === null
      ? !window.matchMedia('(max-width: 760px)').matches
      : savedSidebarOpen === 'true',
    sidebarWidth: Number(localStorage.getItem('wps7.sidebarWidth')) || 0,
    sidebarPinned: savedSidebarPinned === 'true',
    terminals: new Map(),
    browserConnections: new Map(),
    browserZoomTimers: new Map(),
    browserAudioEnabled: localStorage.getItem('wps7.browserAudioEnabled') === 'true',
    terminalTitleTimers: new Map(),
    paneFontSizeTimers: new Map(),
    notepadAutosaveTimers: new Map(),
    themeTransitionFrame: 0,
    clickTimer: null,
    filePanelOpen: false,
    filePath: '',
    fileDrives: [],
    fileEntries: [],
    fileParent: '',
    fileError: '',
    selectedFiles: {},
    filePaneData: {},
    filePathHistory: loadFilePathHistory(),
    notepadTabData: {},
    displayMode: localStorage.getItem('wps7.displayMode') || 'auto',
    dismissedDesktopBanner: false,
    fileClipboard: null,
    mobileTerminalDensity: localStorage.getItem('wps7.mobileTerminalDensity') || 'readable',
    swipeStart: null,
    toastTimer: 0,
    shortcutsInstalled: false,
    lastSessionTap: null,
    suppressSessionClickUntil: 0,
    theme: ({ dark: 'wps-dark', light: 'wps-light', custom: 'custom-dark' })[localStorage.getItem('wps7.theme')] || localStorage.getItem('wps7.theme') || 'wps-dark',
    customThemeDraft: null,
    whiteboards: new Map()
  };

  const app = document.getElementById('app');
  document.addEventListener('pointerdown', closeFloatingSidebarFromOutside);
  document.addEventListener('pointerdown', closeNotepadPopoversFromOutside);
  window.visualViewport?.addEventListener('resize', updateVisualViewport);
  window.visualViewport?.addEventListener('scroll', updateVisualViewport);
  window.addEventListener('resize', updateVisualViewport);
  updateVisualViewport();

  function saveToken(token, remember) {
    localStorage.removeItem('wps7.token');
    sessionStorage.removeItem('wps7.token');
    (remember ? localStorage : sessionStorage).setItem('wps7.token', token);
  }

  function clearToken() {
    localStorage.removeItem('wps7.token');
    sessionStorage.removeItem('wps7.token');
    state.token = '';
  }

  function loadFilePathHistory() {
    try {
      const value = JSON.parse(localStorage.getItem('wps7.filePathHistory') || '[]');
      return Array.isArray(value) ? value.filter((path) => typeof path === 'string' && path) : [];
    } catch (error) {
      return [];
    }
  }

  function rememberFilePath(path) {
    if (!path) {
      return;
    }
    state.filePathHistory = [path, ...state.filePathHistory.filter((item) => item.toLowerCase() !== path.toLowerCase())];
    localStorage.setItem('wps7.filePathHistory', JSON.stringify(state.filePathHistory));
  }

  function friendlyFileError(message) {
    const raw = String(message || '').trim();
    if (!raw) {
      return '';
    }
    if (/ENOENT|no such file/i.test(raw)) {
      return 'This location does not exist or was moved.';
    }
    if (/EPERM|EACCES|denied|permission/i.test(raw)) {
      return 'Access to this location was denied.';
    }
    if (/ENOTDIR|not a directory/i.test(raw)) {
      return 'This path is not a folder.';
    }
    if (/EBUSY|resource busy|in use/i.test(raw)) {
      return 'This location is in use by another program.';
    }
    return raw.replace(/^[A-Z]+:\s*/, '');
  }

  function hexToRgba(hex, alpha) {
    const value = Number.parseInt(hex.slice(1), 16);
    return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }

  function customThemePalette(mode) {
    const custom = { ...customThemeDefaults, ...(state.config?.custom_theme || {}), ...(state.customThemeDraft || {}) };
    const prefix = mode === 'light' ? 'light_' : '';
    return {
      label: `Custom ${mode === 'light' ? 'Light' : 'Dark'}`, mode,
      ink: custom[`${prefix}ink`], panel: custom[`${prefix}panel`], rail: custom[`${prefix}rail`],
      terminal: custom[`${prefix}terminal_bg`], surfaceRaised: custom[`${prefix}panel`], surfaceSoft: custom[`${prefix}surface`],
      line: custom[`${prefix}line`], lineStrong: custom[`${prefix}line`], text: custom[`${prefix}text`], muted: custom[`${prefix}muted`],
      accent: custom[`${prefix}accent`], accentStrong: custom[`${prefix}accent`], warn: custom[`${prefix}warn`], danger: custom[`${prefix}danger`],
      shadow: mode === 'light' ? 'rgba(31, 49, 61, .14)' : 'rgba(0, 0, 0, .34)',
      terminalBg: custom[`${prefix}terminal_bg`], terminalFg: custom[`${prefix}terminal_fg`]
    };
  }

  function activeTheme() {
    if (state.theme === 'custom-light' || state.theme === 'custom-dark') {
      return customThemePalette(state.theme.endsWith('light') ? 'light' : 'dark');
    }
    return themePresets[state.theme] || themePresets['wps-dark'];
  }

  function themeMode() {
    return activeTheme().mode;
  }

  function selectedThemeForMode(mode) {
    const custom = { ...customThemeDefaults, ...(state.config?.custom_theme || {}), ...(state.customThemeDraft || {}) };
    return custom[`selected_${mode}`] || `wps-${mode}`;
  }

  function pairedThemeId() {
    return selectedThemeForMode(themeMode() === 'dark' ? 'light' : 'dark');
  }

  function applyTheme(theme = state.theme) {
    state.theme = themePresets[theme] || theme === 'custom-light' || theme === 'custom-dark' ? theme : 'wps-dark';
    localStorage.setItem('wps7.theme', state.theme);
    const palette = activeTheme();
    const root = document.documentElement;
    root.classList.add('theme-changing');
    window.cancelAnimationFrame(state.themeTransitionFrame);
    root.dataset.theme = palette.mode;
    root.dataset.themeId = state.theme;
    const variables = {
      ink: palette.ink, panel: palette.panel, rail: palette.rail, terminal: palette.terminal,
      'terminal-bg': palette.terminalBg, 'terminal-fg': palette.terminalFg,
      'surface-raised': palette.surfaceRaised, 'surface-soft': palette.surfaceSoft,
      line: palette.line, 'line-strong': palette.lineStrong, text: palette.text, muted: palette.muted,
      accent: palette.accent, 'accent-strong': palette.accentStrong,
      'accent-soft': hexToRgba(palette.accent, .12), warn: palette.warn, danger: palette.danger, shadow: palette.shadow
    };
    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(`--${name}`, value);
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.ink);
    state.themeTransitionFrame = window.requestAnimationFrame(() => {
      state.themeTransitionFrame = window.requestAnimationFrame(() => {
        root.classList.remove('theme-changing');
        state.themeTransitionFrame = 0;
      });
    });
  }

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }
    const response = await fetch(path, { ...options, headers });
    if (!response.ok) {
      let message = await response.text();
      try {
        message = JSON.parse(message).error || message;
      } catch (error) {
        // Keep the raw response text.
      }
      if (response.status === 401 && path !== '/api/login') {
        clearToken();
        showToast(message || 'Login expired. Please log in again.');
        renderLogin();
      }
      const requestError = new Error(message || `Request failed (${response.status}).`);
      requestError.status = response.status;
      throw requestError;
    }
    return response.json();
  }

  function showToast(message, type = 'error') {
    if (!message) {
      return;
    }
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.textContent = message;
    if (state.toastTimer) {
      window.clearTimeout(state.toastTimer);
    }
    state.toastTimer = window.setTimeout(() => toast.remove(), 4200);
  }

  function browserNotificationCapability() {
    if (window.isSecureContext === false) {
      return { available: false, state: 'insecure', message: 'Unavailable: this browser requires HTTPS or localhost for notifications.' };
    }
    if (!('Notification' in window)) {
      return { available: false, state: 'unsupported', message: 'Unavailable: this browser does not support notifications.' };
    }
    if (Notification.permission === 'denied') {
      return { available: false, state: 'denied', message: 'Blocked: allow notifications in this browser\'s site settings.' };
    }
    if (Notification.permission === 'granted') {
      return { available: true, state: 'granted', message: 'Available and allowed in this browser.' };
    }
    return { available: true, state: 'default', message: 'Available. The browser will ask for permission when enabled.' };
  }

  function requestBrowserNotificationPermission() {
    const capability = browserNotificationCapability();
    if (!capability.available) {
      return Promise.resolve(capability.state);
    }
    if (Notification.permission !== 'default') {
      return Promise.resolve(Notification.permission);
    }
    return Notification.requestPermission();
  }

  function showTerminalNotification(paneId, message = '', notificationTitle = '') {
    const found = findPaneState(paneId);
    if (!found) {
      return;
    }
    const label = `${found.session.name} / ${found.pane.title}`;
    const detail = String(message || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 180);
    const title = String(notificationTitle || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 80);
    showToast(detail ? `${label}: ${detail}` : `${label} needs attention.`, 'success');
    if (!state.config.terminal?.browser_notifications || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }
    const notification = new Notification(title || 'WPS7 terminal', {
      body: detail ? `${label}\n${detail}` : label,
      icon: '/icon.svg',
      tag: `wps7-terminal-${paneId}`
    });
    notification.onclick = () => {
      window.focus();
      setActivePane(paneId);
      notification.close();
    };
  }

  function handleTerminalOscNotification(paneId, code, data) {
    const payload = String(data || '').trim();
    if (code === 9 && (/^4;/.test(payload) || /^9;/.test(payload))) {
      return true;
    }
    let title = '';
    let message = payload;
    if (code === 777 && payload.startsWith('notify;')) {
      const parts = payload.split(';');
      title = parts[1] || '';
      message = parts.slice(2).join(';');
    } else if (code === 99) {
      message = payload.split(';').at(-1) || payload;
    }
    showTerminalNotification(paneId, message, title);
    return true;
  }

  function updatePaneTitleFromTerminal(paneId, terminalTabId, title) {
    const nextTitle = String(title || '').replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 80);
    const found = findPaneState(paneId);
    const tab = found?.pane.terminalTabs?.find((candidate) => candidate.id === terminalTabId);
    if (!nextTitle || !tab || tab.title === nextTitle) {
      return;
    }
    window.clearTimeout(state.terminalTitleTimers.get(terminalTabId));
    state.terminalTitleTimers.set(terminalTabId, window.setTimeout(async () => {
      state.terminalTitleTimers.delete(terminalTabId);
      try {
        await api(`/api/panes/${paneId}/terminal/tabs/${terminalTabId}`, {
          method: 'PATCH',
          body: JSON.stringify({ title: nextTitle })
        });
        const current = findPaneState(paneId);
        const currentTab = current?.pane.terminalTabs?.find((candidate) => candidate.id === terminalTabId);
        if (!currentTab) {
          return;
        }
        currentTab.title = nextTitle;
        updatePaneTabStrip(paneId);
      } catch (error) {
        // A title sequence must not interrupt the terminal session.
      }
    }, 250));
  }

  function applyUiTypography() {
    const systemFontSize = Number(state.config?.ui?.system_font_size) || 13;
    const filePaneFontSize = Number(state.config?.ui?.file_pane_font_size) || 13;
    document.documentElement.style.setProperty('--system-font-size', `${systemFontSize}px`);
    document.documentElement.style.setProperty('--file-pane-font-size', `${filePaneFontSize}px`);
  }

  function renderLogin() {
    disposeTerminals();
    document.querySelectorAll('.settings-overlay, .file-panel').forEach((element) => {
      element._disposeModal?.();
      element.remove();
    });
    applyTheme();
    applyUiTypography();
    app.innerHTML = `
      <main class="login">
        <div class="login-brand"><span class="brand-mark">›_</span><span>WPS7</span></div>
        <button class="theme-toggle login-theme-toggle" type="button" data-theme-toggle aria-label="Switch to ${themeMode() === 'dark' ? 'light' : 'dark'} mode" title="Switch theme">${themeMode() === 'dark' ? '☀' : '☾'}</button>
        <form class="login-panel">
          <div class="login-shield">⌾</div>
          <h1>Welcome back</h1>
          <p>Sign in to your terminal workspace</p>
          <label class="login-label">Password
            <span class="password-field"><input type="password" name="password" autocomplete="current-password" autofocus><span aria-hidden="true">●</span></span>
          </label>
          <label class="login-remember"><input name="remember" type="checkbox"> Keep me signed in for 30 days</label>
          <div class="login-error" data-login-error></div>
          <button class="primary login-submit" type="submit">Sign in</button>
          <div class="login-hint"><kbd>Enter</kbd><span>Press Enter to continue</span></div>
          <div class="restore-note">↻ <span>Your workspaces will be restored</span></div>
        </form>
        <div class="login-status"><span class="protected">◇ <b>Protected terminal access</b></span></div>
      </main>
    `;
    app.querySelector('[data-theme-toggle]').onclick = () => {
      applyTheme(pairedThemeId());
      renderLogin();
    };
    app.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const password = form.get('password');
      const remember = form.get('remember') === 'on';
      const error = app.querySelector('[data-login-error]');
      error.textContent = '';
      try {
        const result = await api('/api/login', { method: 'POST', body: JSON.stringify({ password, remember: form.get('remember') === 'on' }) });
        state.token = result.token;
        saveToken(state.token, remember);
        await load();
      } catch (loginError) {
        error.textContent = loginError.message || 'Login failed.';
      }
    });
  }

  function renderConnectionError(error) {
    disposeTerminals();
    applyTheme();
    applyUiTypography();
    app.innerHTML = `
      <main class="login">
        <section class="login-panel connection-error" role="alert">
          <div class="login-shield">!</div>
          <h1>Service unavailable</h1>
          <p>${escapeHtml(error?.message || 'WPS7 could not connect to the local service.')}</p>
          <button class="primary" type="button" data-retry>Retry connection</button>
        </section>
      </main>
    `;
    app.querySelector('[data-retry]').onclick = load;
  }

  function activeSession() {
    return state.sessions.find((session) => session.id === state.activeSessionId) ||
      state.sessions.find((session) => session.id === state.persistedActiveSessionId) ||
      state.sessions[0];
  }

  function activeTab(session) {
    return session && session.tabs[0];
  }

  // One flat row per pane: every row names its own workspace, so no row depends
  // on the one above it to be read.
  function sidebarPaneRows() {
    return state.sessions.flatMap((session) => session.tabs
      .flatMap((tab) => tab.panes)
      .map((pane) => ({ session, pane, label: `${session.name}/${pane.title}` })));
  }

  function renderSidebarPaneItem({ session, pane, label }) {
    return `
      <button class="session-item ${pane.id === state.activePaneId ? 'active' : ''}" data-pane-link="${pane.id}" data-session="${session.id}">
        <span data-pane-label>${escapeHtml(label)}</span>
      </button>
    `;
  }

  function renderSidebarPaneList() {
    const list = app.querySelector('.session-list');
    if (!list) {
      return;
    }
    list.innerHTML = sidebarPaneRows().map(renderSidebarPaneItem).join('');
    wirePaneLinks(list);
  }

  function paneItemStyle(pane) {
    const layout = normalizePaneLayout(pane.layout);
    const fontSize = Number(pane.fontSize);
    const fontStyle = Number.isInteger(fontSize) ? ` --pane-font-size: ${fontSize}px;` : '';
    return `grid-column: ${layout.x + 1} / span ${layout.w}; grid-row: ${layout.y + 1} / span ${layout.h};${fontStyle}`;
  }

  function paneFontSize(pane) {
    const savedSize = Number(pane?.fontSize);
    if (Number.isInteger(savedSize) && savedSize >= 8 && savedSize <= 32) {
      return savedSize;
    }
    return pane?.type === 'files'
      ? Number(state.config.ui?.file_pane_font_size) || 13
      : terminalFontSize();
  }

  function changePaneFontSize(paneId, delta) {
    const found = findPaneState(paneId);
    const paneElement = document.querySelector(`[data-pane="${paneId}"]`);
    if (!found || !paneElement) {
      return;
    }
    const previousSize = Math.round(paneFontSize(found.pane));
    const nextSize = Math.max(8, Math.min(32, previousSize + delta));
    if (nextSize === previousSize) {
      return;
    }
    found.pane.fontSize = nextSize;
    paneElement.style.setProperty('--pane-font-size', `${nextSize}px`);
    for (const terminal of paneTerminals(paneId)) {
      terminal.term.options.fontSize = nextSize;
      terminal.sendResize();
    }
    const notepadFontSizeValue = paneElement.querySelector('[data-notepad-font-size-value]');
    if (notepadFontSizeValue) notepadFontSizeValue.textContent = nextSize;
    const notepadFontSizeOutput = paneElement.querySelector('[data-notepad-font-size-output]');
    if (notepadFontSizeOutput) notepadFontSizeOutput.textContent = nextSize;
    const notepadEditor = paneElement.querySelector('.notepad-editor');
    if (notepadEditor) {
      syncNotepadRows(
        paneElement,
        notepadEditor,
        paneElement.querySelector('.notepad-gutter'),
        paneElement.querySelector('.notepad-indent-guides')
      );
    }
    window.clearTimeout(state.paneFontSizeTimers.get(paneId));
    state.paneFontSizeTimers.set(paneId, window.setTimeout(async () => {
      state.paneFontSizeTimers.delete(paneId);
      try {
        await api(`/api/panes/${paneId}`, {
          method: 'PATCH',
          body: JSON.stringify({ fontSize: nextSize })
        });
      } catch (error) {
        showToast(error.message);
      }
    }, 180));
  }

  function isMobileLayout() {
    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const narrow = window.matchMedia('(max-width: 760px)').matches;
    const touchDevice = window.matchMedia('(pointer: coarse)').matches && navigator.maxTouchPoints > 0;
    return state.displayMode === 'mobile' || (state.displayMode === 'auto' && (narrow || (touchDevice && viewportWidth <= 1024)));
  }

  function terminalFontSize() {
    if (!isMobileLayout()) {
      return Number(state.config.ui?.terminal_font_size) || 13;
    }
    const mobileSize = Number(state.config.ui?.mobile_terminal_font_size) || 12;
    const viewportWidth = window.visualViewport?.width || window.innerWidth || 390;
    const widthScale = Math.max(.9, Math.min(1.1, viewportWidth / 390));
    const densityScale = Math.max(.96, Math.min(1.04, Math.sqrt(window.devicePixelRatio || 1) / Math.sqrt(2)));
    const baseSize = state.mobileTerminalDensity === 'dense' ? Math.max(8, mobileSize - 2) : mobileSize;
    return Math.round(baseSize * widthScale * densityScale * 10) / 10;
  }

  function updateVisualViewport() {
    const viewport = window.visualViewport;
    const height = Math.round(viewport?.height || window.innerHeight);
    document.documentElement.style.setProperty('--app-height', `${height}px`);
    app.querySelector('.app')?.classList.toggle('mobile-device', isMobileLayout());
    updateDesktopModeBanner();
    if (!state.config) {
      return;
    }
    // A shrinking viewport can leave the active pane's column off screen.
    ensureActivePaneVisible('auto');
    if (!isMobileLayout()) {
      return;
    }
    const terminal = paneTerminal(state.activePaneId);
    if (!terminal) {
      return;
    }
    terminal.term.options.fontSize = paneFontSize(findPaneState(state.activePaneId)?.pane);
    terminal.sendResize();
    if (viewport && viewport.height < window.innerHeight * .8) {
      terminal.term.scrollToBottom();
    }
  }

  function terminalTheme() {
    const palette = activeTheme();
    return {
      background: palette.terminalBg,
      foreground: palette.terminalFg,
      cursor: palette.accent,
      selectionBackground: hexToRgba(palette.accent, .28),
      black: palette.mode === 'light' ? palette.text : '#111111',
      brightBlack: palette.muted,
      red: palette.danger,
      brightRed: palette.danger,
      green: palette.accentStrong,
      brightGreen: palette.accent,
      yellow: palette.warn,
      brightYellow: palette.warn,
      blue: palette.accent,
      brightBlue: palette.accentStrong
    };
  }

  function mobileKeybarButtons() {
    const configured = state.config?.terminal?.mobile_keybar_buttons;
    return (Array.isArray(configured) ? configured : defaultMobileKeybarButtons).filter((button) => button.enabled !== false);
  }

  function renderToolbarPageButton(direction) {
    const previous = direction === 'previous';
    const label = previous ? 'Previous toolbar buttons' : 'Next toolbar buttons';
    return `<button class="paged-toolbar-button" type="button" data-toolbar-page="${direction}" aria-label="${label}" title="${label}" hidden>${previous ? '&lt;&lt;' : '&gt;&gt;'}</button>`;
  }

  function renderMobileKeybar() {
    return `<div class="mobile-keybar" data-paged-toolbar aria-label="Terminal keys">${renderToolbarPageButton('previous')}${mobileKeybarButtons().map((button) => `
      <button type="button" data-toolbar-item data-terminal-action="${escapeAttr(button.action)}" data-terminal-value="${escapeAttr(button.value)}" aria-label="${escapeAttr(button.action === 'text' ? `Type ${button.label}` : button.value)}" ${button.action === 'modifier' ? 'aria-pressed="false"' : ''}>${escapeHtml(button.label)}</button>
    `).join('')}${renderToolbarPageButton('next')}</div>`;
  }

  function paneTabs(pane) {
    return (pane.type === 'files' ? pane.filesTabs : pane.terminalTabs) || [];
  }

  function paneTerminal(paneId) {
    const pane = findPaneState(paneId)?.pane;
    return pane ? state.terminals.get(activePaneTabId(pane)) : undefined;
  }

  function paneTerminals(paneId) {
    const pane = findPaneState(paneId)?.pane;
    return pane ? paneTabs(pane).map((tab) => state.terminals.get(tab.id)).filter(Boolean) : [];
  }

  function activePaneTabId(pane) {
    const tabs = paneTabs(pane);
    const activeId = pane.type === 'files' ? pane.activeFilesTabId : pane.activeTerminalTabId;
    return tabs.some((tab) => tab.id === activeId) ? activeId : tabs[0]?.id || '';
  }

  function paneTabLabel(pane, tab) {
    if (pane.type !== 'files') {
      return tab.title || 'PowerShell';
    }
    const trimmed = String(tab.path || '').replace(/[\\/]+$/, '');
    return trimmed ? trimmed.split(/[\\/]/).pop() || trimmed : 'This PC';
  }

  function renderPaneTabs(pane) {
    const tabs = paneTabs(pane);
    const activeId = activePaneTabId(pane);
    const uploadStatus = pane.type === 'files'
      ? `<span class="pane-upload-status" data-pane-upload-status="${pane.id}" aria-live="polite"></span>`
      : '';
    return `
      <span class="pane-kind-icon" aria-hidden="true">${fileActionIcon(pane.type === 'files' ? 'file' : 'terminal')}</span>
      <div class="pane-tab-list" role="tablist">
        ${tabs.map((tab) => {
          const label = paneTabLabel(pane, tab);
          return `
          <div class="pane-tab ${tab.id === activeId ? 'active' : ''}" role="tab" tabindex="0" aria-selected="${tab.id === activeId}" data-pane-tab="${tab.id}" title="${escapeAttr(pane.type === 'files' ? (tab.path || 'This PC') : label)}">
            <span class="pane-tab-label">${escapeHtml(label)}</span>
            <button class="pane-tab-close" type="button" aria-label="Close ${escapeAttr(label)}" data-pane-close-tab="${tab.id}">${fileActionIcon('close')}</button>
          </div>`;
        }).join('')}
      </div>
      ${uploadStatus}
      <button class="pane-new-tab" type="button" data-pane-new-tab aria-label="New tab" title="New tab">${fileActionIcon('add')}</button>`;
  }

  function renderTerminalSurfaces(pane) {
    const activeId = activePaneTabId(pane);
    return paneTabs(pane).map((tab) => `
      <div class="terminal" id="terminal-${tab.id}" data-terminal-tab="${tab.id}" ${tab.id === activeId ? '' : 'hidden'}></div>`).join('');
  }

  function renderPane(pane) {
    const body = pane.type === 'files' ? renderFilesPane(pane)
      : pane.type === 'browser' ? renderBrowserPane(pane)
        : pane.type === 'notepad' ? renderNotepadPane(pane)
          : pane.type === 'usage' ? renderUsagePane(pane)
            : pane.type === 'whiteboard' ? `<div class="whiteboard" id="whiteboard-${pane.id}" data-whiteboard="${pane.id}"></div>` : `
          ${renderMobileKeybar()}
          ${renderTerminalSurfaces(pane)}`;
    const header = pane.type === 'browser'
      ? `<div class="browser-tab-strip" data-browser-tab-strip data-pane-title="${pane.id}">
          ${renderBrowserTabs(pane)}
        </div>`
      : pane.type === 'notepad'
        ? `<div class="notepad-tab-strip" data-notepad-tab-strip data-pane-title="${pane.id}">
          <span class="pane-kind-icon" aria-hidden="true">${fileActionIcon('notepad')}</span>
          ${renderNotepadTabs(pane)}
        </div>`
        : pane.type === 'usage' || pane.type === 'whiteboard'
          ? `<div class="pane-title" data-pane-title="${pane.id}">
            <span class="pane-kind-icon" aria-hidden="true">${fileActionIcon(pane.type === 'whiteboard' ? 'line' : 'usage')}</span>
            <span data-rename-pane="${pane.id}">${escapeHtml(pane.title)}</span>
          </div>`
          : `<div class="pane-tab-strip" data-pane-tab-strip data-pane-title="${pane.id}">
          ${renderPaneTabs(pane)}
          </div>`;
    return `
      <section class="pane ${pane.id === state.activePaneId ? 'active' : ''}" data-pane="${pane.id}" data-pane-type="${pane.type || 'terminal'}" style="${paneItemStyle(pane)}">
        ${header}
        ${pane.type === 'usage' ? `<button class="pane-usage-refresh" type="button" data-usage-refresh aria-label="Refresh usage" title="Refresh usage">${fileActionIcon('refresh')}</button>` : ''}
        <button class="pane-close" data-close-pane="${pane.id}" title="Close pane">${fileActionIcon('close')}</button>
        ${body}
        ${['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'].map((direction) => `
        <div class="pane-resize pane-resize-${direction}" data-pane-resize="${pane.id}" data-pane-resize-direction="${direction}"></div>`).join('')}
      </section>
    `;
  }

  function filesPaneData(paneId) {
    if (!state.filePaneData[paneId]) {
      state.filePaneData[paneId] = {
        drives: [],
        entries: [],
        parent: '',
        error: '',
        showHidden: Boolean(state.config.file_manager?.show_hidden),
        selectionAnchor: -1,
        filter: '',
        filterOpen: false,
        sortKey: 'name',
        sortDirection: 'asc',
        columnWidths: { name: 150, modified: 130, size: 72 },
        bookmarks: []
      };
    }
    return state.filePaneData[paneId];
  }

  const fileActionIcons = {
    add: '<path d="M12 5v14M5 12h14"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    'chevron-down': '<path d="m7 10 5 5 5-5"/>',
    terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/>',
    appearance: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    workspace: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>',
    persistence: '<path d="M4 5h13l3 3v11H4z"/><path d="M8 5v6h8V5M8 19v-5h8v5"/>',
    shell: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>',
    server: '<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M7 7h.01M7 17h.01M11 7h7M11 17h7"/>',
    security: '<path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6z"/><path d="m9 12 2 2 4-4"/>',
    usage: '<path d="M4 19V9M10 19V5M16 19v-7M22 19V3"/>',
    pin: '<path d="M9 3h6l1 7 3 3v2H5v-2l3-3zM12 15v6"/>',
    'pin-off': '<path d="M9 3h6l1 7 3 3v2H8M12 15v6M4 4l16 16"/>',
    up: '<path d="M9 6 4 11l5 5"/><path d="M4 11h10a6 6 0 0 1 6 6v1"/>',
    refresh: '<g class="refresh-shape"><path class="refresh-arc" d="M4 9a8.5 8.5 0 0 1 14.4-3.7v3.1h-3.1"/><path class="refresh-arc" d="M20 15a8.5 8.5 0 0 1-14.4 3.7v-3.1h3.1"/></g>',
    'new-folder': '<path d="M3 6h7l2 2h9v11H3z"/><path d="M12 11v5M9.5 13.5h5"/>',
    'upload-file': '<path d="M12 16V4M7.5 8.5 12 4l4.5 4.5"/><path d="M5 14v6h14v-6"/>',
    'upload-folder': '<path d="M3 7h7l2 2h9v10H3z"/><path d="M12 17v-6M9.5 13.5 12 11l2.5 2.5"/>',
    download: '<path d="M12 4v12M7.5 11.5 12 16l4.5-4.5"/><path d="M5 20h14"/>',
    copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h2"/>',
    rename: '<path d="m4 20 4.2-1 10.9-10.9-3.2-3.2L5 15.8z"/><path d="m14.5 6.5 3 3"/>',
    delete: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    'select-all': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 2.5 2.5L16 9"/>',
    'deselect-all': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 12h8"/>',
    hidden: '<path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"/><circle cx="12" cy="12" r="2.5"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z"/>',
    drive: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 14h18M16 17h2"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/>',
    folder: '<path d="M3 6h7l2 2h9v11H3z"/>',
    browser: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/>',
    desktop: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M8 21h8M12 17v4"/>',
    mobile: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 5h4M11 19h2"/>',
    volume: '<path d="M5 10v4h4l5 4V6l-5 4zM17 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    'volume-off': '<path d="M5 10v4h4l5 4V6l-5 4zM17 10l4 4M21 10l-4 4"/>',
    'browser-back': '<path d="m10 6-6 6 6 6M4 12h16"/>',
    'browser-forward': '<path d="m14 6 6 6-6 6M20 12H4"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/><path d="M7.5 10.5h6"/>',
    subtract: '<path d="M5 12h14"/>',
    reset: '<path d="M4 8V4h4M4.8 5.2A8 8 0 1 1 4 15"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    notepad: '<path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/>',
    save: '<path d="M5 3h12l2 2v16H5zM8 3v6h8V3M8 21v-8h8v8"/>',
    cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 8.5 20 20M8.5 15.5 20 4"/>',
    paste: '<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2" width="6" height="4" rx="1"/>',
    replace: '<path d="M7 7h10M7 7l3-3M7 7l3 3M17 17H7M17 17l-3-3M17 17l-3 3"/>',
    'replace-all': '<path d="M5 6h10M5 6l3-3M5 6l3 3M19 11H9M19 11l-3-3M19 11l-3 3M5 18h10M5 18l3-3M5 18l3 3"/>',
    wrap: '<path d="M4 7h16M4 12h11a3 3 0 1 1 0 6h-3M4 17h5"/><path d="m14 15 3 3-3 3"/>',
    indent: '<path d="M4 4v16M9 4v16M4 8h5M4 16h5"/>',
    autosave: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    font: '<path d="M6 20 11 4h2l5 16M8 14h8"/>',
    line: '<path d="M4 20 20 4"/>',
    text: '<path d="M5 7V4h14v3M12 4v16M9 20h6"/>'
  };

  function fileActionIcon(name) {
    return `<svg class="file-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${fileActionIcons[name] || ''}</svg>`;
  }

  function renderFilePathOption(path, kind, bookmarkPaths) {
    const bookmarked = Boolean(path) && bookmarkPaths.has(path.toLowerCase());
    return `
      <div class="file-path-option ${kind === 'Current' ? 'current' : ''}" role="option" data-path-kind="${kind}" aria-selected="${kind === 'Current'}">
        <button class="file-path-choice" type="button" data-file-path-choice="${escapeAttr(path)}" title="${escapeAttr(path || 'This PC')}">
          <span class="file-path-value">${escapeHtml(path || 'This PC')}</span>
        </button>
        <button class="file-path-star ${bookmarked ? 'bookmarked' : ''}" type="button" data-path-bookmark="${escapeAttr(path)}" aria-label="${bookmarked ? 'Remove' : 'Add'} bookmark ${escapeAttr(path || 'This PC')}" title="${bookmarked ? 'Remove bookmark' : 'Add bookmark'}" ${path ? '' : 'disabled'}>${fileActionIcon('star')}</button>
      </div>
    `;
  }

  function renderFilePathOptions(pane) {
    const bookmarks = filesPaneData(pane.id).bookmarks || [];
    const bookmarkPaths = new Set(bookmarks.map((bookmark) => bookmark.path.toLowerCase()));
    const currentPath = (pane.path || '').toLowerCase();
    const history = state.filePathHistory
      .filter((path) => path.toLowerCase() !== currentPath)
      .slice(0, 5);
    return `
      <div class="file-path-group" role="group" aria-labelledby="file-path-current-${pane.id}">
        <div class="file-path-heading" id="file-path-current-${pane.id}">Current</div>
        ${renderFilePathOption(pane.path || '', 'Current', bookmarkPaths)}
      </div>
      <div class="file-path-divider" role="separator"></div>
      <div class="file-path-group" role="group" aria-labelledby="file-path-history-${pane.id}">
        <div class="file-path-heading" id="file-path-history-${pane.id}">History</div>
        ${history.map((path) => renderFilePathOption(path, 'History', bookmarkPaths)).join('')}
      </div>
      <div class="file-path-divider" role="separator"></div>
      <div class="file-path-group" role="group" aria-labelledby="file-path-bookmark-${pane.id}">
        <div class="file-path-heading" id="file-path-bookmark-${pane.id}">Bookmark</div>
        ${bookmarks.map((bookmark) => renderFilePathOption(bookmark.path, 'Bookmark', bookmarkPaths)).join('')}
      </div>
    `;
  }

  function sortedFileEntries(paneId) {
    const paneData = filesPaneData(paneId);
    const direction = paneData.sortDirection === 'desc' ? -1 : 1;
    const filterText = (paneData.filter || '').toLowerCase();
    return paneData.entries
      .filter((entry) => paneData.showHidden || !entry.hidden)
      .filter((entry) => !filterText || entry.name.toLowerCase().includes(filterText))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        let comparison;
        if (paneData.sortKey === 'modified') {
          comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
        } else if (paneData.sortKey === 'size') {
          comparison = Number(a.size) - Number(b.size);
        } else {
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        }
        return comparison === 0 ? a.name.localeCompare(b.name) : comparison * direction;
      });
  }

  function fileSortIndicator(paneData, key) {
    return paneData.sortKey === key ? `<span aria-hidden="true">${paneData.sortDirection === 'asc' ? '↑' : '↓'}</span>` : '';
  }

  function formatModified(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false });
  }

  function renderFilesPane(pane) {
    const paneData = filesPaneData(pane.id);
    const columnWidths = { name: 150, modified: 130, size: 72, ...paneData.columnWidths };
    const tableWidth = columnWidths.name + columnWidths.modified + columnWidths.size;
    const showingDrives = !pane.path;
    const selectedPaths = selectedFileList(pane.id);
    const entries = sortedFileEntries(pane.id);
    const allSelected = allVisibleFilesSelected(pane.id);
    return `
      <div class="files-pane" data-files-pane="${pane.id}" style="--file-column-template: ${columnWidths.name}px ${columnWidths.modified}px ${columnWidths.size}px; --file-table-width: ${tableWidth}px">
        <form class="file-toolbar" data-file-path-form>
          <div class="file-location-row">
            <button class="file-command-button" type="button" data-file-up aria-label="Up one level" title="Up one level" ${pane.path ? '' : 'disabled'}>${fileActionIcon('up')}</button>
            <div class="file-path-control" data-file-path-control>
              <input class="file-path-input" name="path" value="${escapeAttr(pane.path)}" placeholder="This PC or C:\\path" autocomplete="off" aria-controls="file-path-menu-${pane.id}" aria-expanded="false">
              <button class="file-path-toggle" type="button" data-file-path-toggle aria-label="Show path history and bookmarks" aria-expanded="false" aria-controls="file-path-menu-${pane.id}">${fileActionIcon('chevron-down')}</button>
              <div class="file-path-menu" id="file-path-menu-${pane.id}" data-file-path-menu role="listbox" aria-label="Current, recent and bookmarked paths" hidden>
                ${renderFilePathOptions(pane)}
              </div>
            </div>
            <button class="file-command-button" type="button" data-file-refresh aria-label="Refresh" title="Refresh">${fileActionIcon('refresh')}</button>
          </div>
          <div class="file-command-bar" data-paged-toolbar aria-label="File actions">
            ${renderToolbarPageButton('previous')}
            <button class="file-command-button" type="button" data-toolbar-item data-file-new-file aria-label="New file" title="New file" ${pane.path ? '' : 'disabled'}>${fileActionIcon('file')}</button>
            <button class="file-command-button" type="button" data-toolbar-item data-file-new-folder aria-label="New folder" title="New folder" ${pane.path ? '' : 'disabled'}>${fileActionIcon('new-folder')}</button>
            <label class="file-command-button file-upload" data-toolbar-item data-file-upload-trigger role="button" tabindex="${pane.path ? '0' : '-1'}" aria-disabled="${pane.path ? 'false' : 'true'}" title="Upload files" aria-label="Upload files">${fileActionIcon('upload-file')}<input type="file" multiple tabindex="-1" data-file-upload ${pane.path ? '' : 'disabled'}></label>
            <label class="file-command-button file-upload" data-toolbar-item data-file-upload-trigger role="button" tabindex="${pane.path ? '0' : '-1'}" aria-disabled="${pane.path ? 'false' : 'true'}" title="Upload folder" aria-label="Upload folder">${fileActionIcon('upload-folder')}<input type="file" multiple webkitdirectory directory tabindex="-1" data-folder-upload ${pane.path ? '' : 'disabled'}></label>
            <button class="file-command-button" type="button" data-toolbar-item data-file-download-selected aria-label="Download selected" title="Download selected" ${selectedPaths.length ? '' : 'disabled'}>${fileActionIcon('download')}</button>
            <button class="file-command-button" type="button" data-toolbar-item data-file-copy-selected aria-label="Copy selected paths" title="Copy selected paths" ${selectedPaths.length ? '' : 'disabled'}>${fileActionIcon('copy')}</button>
            <button class="file-command-button" type="button" data-toolbar-item data-file-rename-selected aria-label="Rename selected" title="Rename selected" ${selectedPaths.length === 1 ? '' : 'disabled'}>${fileActionIcon('rename')}</button>
            <button class="file-command-button" type="button" data-toolbar-item data-file-delete-selected aria-label="Delete selected" title="Delete selected" ${selectedPaths.length ? '' : 'disabled'}>${fileActionIcon('delete')}</button>
            <button class="file-command-button ${allSelected ? 'active' : ''}" type="button" data-toolbar-item data-file-select-all aria-label="${allSelected ? 'Deselect all' : 'Select all'}" aria-pressed="${allSelected}" title="${allSelected ? 'Deselect all' : 'Select all'}">${fileActionIcon(allSelected ? 'deselect-all' : 'select-all')}</button>
            <button class="file-command-button ${paneData.filterOpen ? 'active' : ''}" type="button" data-toolbar-item data-file-filter-toggle aria-label="Search this folder" aria-pressed="${paneData.filterOpen}" title="Search this folder" ${pane.path ? '' : 'disabled'}>${fileActionIcon('search')}</button>
            <button class="file-command-button ${paneData.showHidden ? 'active' : ''}" type="button" data-toolbar-item data-file-show-hidden aria-label="Show hidden files" aria-pressed="${paneData.showHidden}" title="Show hidden files">${fileActionIcon('hidden')}</button>
            ${renderToolbarPageButton('next')}
          </div>
          <div class="file-filter-row" data-file-filter-row ${paneData.filterOpen && pane.path ? '' : 'hidden'}>
            ${fileActionIcon('search')}
            <input class="file-filter-input" type="search" data-file-filter placeholder="Filter by name" aria-label="Filter files by name" value="${escapeAttr(paneData.filter)}" autocomplete="off">
            <button class="file-command-button" type="button" data-file-filter-clear aria-label="Clear filter" title="Clear filter">×</button>
          </div>
        </form>
        <div class="file-error">${escapeHtml(paneData.error)}</div>
        <div class="file-list" role="listbox" aria-label="Files" aria-multiselectable="true">
          ${showingDrives ? paneData.drives.map((drive) => `
            <button class="file-row file-row-button" role="option" aria-selected="false" data-file-open="${escapeAttr(drive.path)}">
              ${fileActionIcon('drive')}<span>${escapeHtml(drive.name)}</span>
            </button>
          `).join('') : `
            <div class="file-column-header" role="row" aria-label="Sort files">
              <div class="file-column-heading"><button type="button" data-file-sort="name" aria-label="Sort by name" aria-pressed="${paneData.sortKey === 'name'}">Name ${fileSortIndicator(paneData, 'name')}</button><span class="file-column-resizer" data-file-column-resize="name" role="separator" aria-label="Resize Name column" aria-orientation="vertical" tabindex="0"></span></div>
              <div class="file-column-heading"><button type="button" data-file-sort="modified" aria-label="Sort by modified date" aria-pressed="${paneData.sortKey === 'modified'}">Modified ${fileSortIndicator(paneData, 'modified')}</button><span class="file-column-resizer" data-file-column-resize="modified" role="separator" aria-label="Resize Modified column" aria-orientation="vertical" tabindex="0"></span></div>
              <div class="file-column-heading"><button type="button" data-file-sort="size" aria-label="Sort by size" aria-pressed="${paneData.sortKey === 'size'}">Size ${fileSortIndicator(paneData, 'size')}</button><span class="file-column-resizer" data-file-column-resize="size" role="separator" aria-label="Resize Size column" aria-orientation="vertical" tabindex="0"></span></div>
            </div>
            <button class="file-row compact-file-row file-parent-row" type="button" role="option" aria-selected="false" data-file-parent="${escapeAttr(paneData.parent)}" aria-label="Up one level, ${entries.length} ${entries.length === 1 ? 'item' : 'items'} in current directory">
              <span class="file-name">${fileActionIcon('up')}<span>..</span></span>
              <small></small>
              <small class="file-item-count">${selectedPaths.length ? `${selectedPaths.length}/${entries.length} items` : `${entries.length} items`}</small>
            </button>
          ${entries.map((entry, index) => `
            <div class="file-row compact-file-row ${selectedPaths.includes(entry.path) ? 'selected' : ''} ${entry.hidden ? 'hidden-entry' : ''} ${state.fileClipboard?.paths?.includes(entry.path) ? 'cut-pending' : ''}" role="option" aria-selected="${selectedPaths.includes(entry.path)}" data-file-row="${escapeAttr(entry.path)}" data-file-index="${index}" tabindex="0">
              <div class="file-name" data-file-open="${escapeAttr(entry.path)}" data-file-type="${entry.type}">
                ${entry.type === 'directory' ? fileActionIcon('folder') : fileActionIcon('file')}<span>${escapeHtml(entry.name)}</span>
              </div>
              <small class="file-modified">${escapeHtml(formatModified(entry.modifiedAt))}</small>
              <small class="file-size">${entry.type === 'file' ? formatBytes(entry.size) : 'Folder'}</small>
            </div>
          `).join('')}
          ${entries.length ? '' : `
            <div class="file-empty-state" role="note">
              ${fileActionIcon(paneData.error ? 'hidden' : (paneData.filter ? 'search' : 'folder'))}
              <p>${escapeHtml(paneData.error || (paneData.filter ? 'No files match your search.' : 'This folder is empty.'))}</p>
            </div>`}`}
        </div>
        <div class="file-drop-overlay" aria-hidden="true">Drop files or folders to upload</div>
      </div>
    `;
  }

  function renderBrowserUrlOption(url, kind, bookmarkUrls) {
    const bookmarked = Boolean(url) && bookmarkUrls.has(url);
    return `
      <div class="file-path-option ${kind === 'Current' ? 'current' : ''}" role="option">
        <button class="file-path-choice" type="button" data-browser-url-choice="${escapeAttr(url)}" title="${escapeAttr(url)}"><span class="file-path-value">${escapeHtml(url || 'Enter a website')}</span></button>
        <button class="file-path-star ${bookmarked ? 'bookmarked' : ''}" type="button" data-browser-bookmark="${escapeAttr(url)}" aria-label="${bookmarked ? 'Remove' : 'Add'} bookmark" ${url ? '' : 'disabled'}>${fileActionIcon('star')}</button>
      </div>`;
  }

  function renderBrowserUrlOptions(pane) {
    const currentUrl = activeBrowserTab(pane).url || '';
    const bookmarks = state.config.browser?.bookmarks || [];
    const bookmarkUrls = new Set(bookmarks.map((bookmark) => bookmark.url));
    const history = (state.config.browser?.history || []).slice(0, 5);
    return `
      <div class="file-path-group"><div class="file-path-heading">Current</div>${renderBrowserUrlOption(currentUrl, 'Current', bookmarkUrls)}</div>
      <div class="file-path-divider" role="separator"></div>
      <div class="file-path-group"><div class="file-path-heading">History</div>${history.length ? history.map((url) => renderBrowserUrlOption(url, 'History', bookmarkUrls)).join('') : '<div class="browser-menu-empty">No history yet</div>'}</div>
      <div class="file-path-divider" role="separator"></div>
      <div class="file-path-group"><div class="file-path-heading">Bookmark</div>${bookmarks.length ? bookmarks.map((bookmark) => renderBrowserUrlOption(bookmark.url, 'Bookmark', bookmarkUrls)).join('') : '<div class="browser-menu-empty">No bookmarks yet</div>'}</div>`;
  }

  function activeBrowserTab(pane) {
    const tabs = pane.browserTabs || [];
    return tabs.find((tab) => tab.id === pane.activeBrowserTabId) || tabs[0] || {
      id: '', title: 'New tab', url: pane.url || '', zoom: 1, emulationMode: 'desktop'
    };
  }

  function renderBrowserTabs(pane) {
    const active = activeBrowserTab(pane);
    return `
      <span class="pane-kind-icon" aria-hidden="true">${fileActionIcon('browser')}</span>
      <div class="browser-tab-list" role="tablist">
        ${(pane.browserTabs || [active]).map((tab) => `
          <div class="browser-tab ${tab.id === active.id ? 'active' : ''}" role="tab" tabindex="0" aria-selected="${tab.id === active.id}" data-browser-tab="${tab.id}" title="${escapeAttr(tab.title || tab.url || 'New tab')}">
            <span class="browser-tab-label">${escapeHtml(tab.title || 'New tab')}</span>
            <button class="browser-tab-close" type="button" aria-label="Close ${escapeAttr(tab.title || 'tab')}" data-browser-close-tab="${tab.id}">${fileActionIcon('close')}</button>
          </div>`).join('')}
      </div>
      <button class="browser-new-tab" type="button" data-browser-new-tab aria-label="New tab" title="New tab">${fileActionIcon('add')}</button>`;
  }

  function renderBrowserPane(pane) {
    const active = activeBrowserTab(pane);
    return `
      <div class="browser-pane" data-browser-pane="${pane.id}">
        <form class="file-toolbar browser-toolbar" data-browser-url-form>
          <div class="file-location-row">
            <button class="file-command-button" type="button" data-browser-back aria-label="Back" title="Back">${fileActionIcon('browser-back')}</button>
            <button class="file-command-button" type="button" data-browser-forward aria-label="Forward" title="Forward">${fileActionIcon('browser-forward')}</button>
            <div class="file-path-control" data-browser-url-control>
              <input class="file-path-input" name="url" type="text" inputmode="url" value="${escapeAttr(active.url || '')}" placeholder="Search or enter website" autocomplete="off" autocapitalize="none" spellcheck="false">
              <button class="file-path-toggle" type="button" data-browser-url-toggle aria-label="Show website history and bookmarks" aria-expanded="false">${fileActionIcon('chevron-down')}</button>
              <div class="file-path-menu" data-browser-url-menu role="listbox" aria-label="Current, recent and bookmarked websites" hidden>${renderBrowserUrlOptions(pane)}</div>
            </div>
            <button class="file-command-button" type="button" data-browser-refresh aria-label="Refresh" title="Refresh">${fileActionIcon('refresh')}</button>
            <button class="file-command-button" type="button" data-browser-stop aria-label="Stop loading" title="Stop loading" hidden>${fileActionIcon('stop')}</button>
            <button class="file-command-button" type="button" data-browser-find aria-label="Find in page" title="Find in page">${fileActionIcon('search')}</button>
            <div class="browser-zoom-control" data-browser-zoom-control>
              <button class="file-command-button" type="button" data-browser-zoom-toggle aria-label="Zoom controls" aria-expanded="false" title="Zoom controls">${fileActionIcon('zoom')}</button>
              <div class="browser-zoom-popover" data-browser-zoom-popover role="dialog" aria-label="Page zoom" hidden>
                <button type="button" data-browser-zoom-out aria-label="Zoom out" title="Zoom out">${fileActionIcon('subtract')}</button>
                <output data-browser-zoom-value>${Math.round((active.zoom || 1) * 100)}%</output>
                <button type="button" data-browser-zoom-in aria-label="Zoom in" title="Zoom in">${fileActionIcon('add')}</button>
                <button type="button" data-browser-zoom-reset aria-label="Reset zoom" title="Reset zoom">${fileActionIcon('reset')}</button>
              </div>
            </div>
            <button class="file-command-button ${active.emulationMode === 'mobile' ? 'active' : ''}" type="button" data-browser-emulation-mode aria-label="${active.emulationMode === 'mobile' ? 'Switch to desktop mode' : 'Switch to mobile mode'}" aria-pressed="${active.emulationMode === 'mobile'}" title="${active.emulationMode === 'mobile' ? 'Mobile mode' : 'Desktop mode'}">${fileActionIcon(active.emulationMode === 'mobile' ? 'mobile' : 'desktop')}</button>
            <button class="file-command-button" type="button" data-browser-audio-toggle aria-label="Enable browser audio" aria-pressed="false" title="Audio unavailable while checking stream" disabled>${fileActionIcon('volume-off')}</button>
            <button class="file-command-button" type="button" data-browser-external aria-label="Open in new tab" title="Open in new tab" ${active.url ? '' : 'disabled'}>${fileActionIcon('external')}</button>
          </div>
        </form>
        <div class="browser-find-bar" data-browser-find-bar hidden>
          <input type="search" data-browser-find-input placeholder="Find in page" aria-label="Find in page">
          <span data-browser-find-result aria-live="polite"></span>
          <button type="button" data-browser-find-previous aria-label="Previous match">↑</button>
          <button type="button" data-browser-find-next aria-label="Next match">↓</button>
          <button type="button" data-browser-find-close aria-label="Close find">×</button>
        </div>
        <div class="browser-viewport" data-browser-viewport>
          <canvas class="browser-surface" data-browser-surface aria-hidden="true"></canvas>
          <video class="browser-video" data-browser-video autoplay playsinline muted hidden></video>
          <div class="browser-input-surface" data-browser-input-surface tabindex="0" role="application" aria-label="Remote browser"></div>
          <textarea class="browser-keyboard-capture" data-browser-keyboard aria-label="Browser keyboard input" autocomplete="off" autocapitalize="none" spellcheck="false"></textarea>
          <input type="file" data-browser-file-input hidden>
          <div class="browser-context-menu" data-browser-context-menu role="menu" hidden>
            <button type="button" role="menuitem" data-browser-copy>Copy</button>
            <button type="button" role="menuitem" data-browser-paste>Paste</button>
            <button type="button" role="menuitem" data-browser-select-all>Select all</button>
          </div>
          <div class="browser-status" data-browser-status>${active.url ? 'Connecting…' : 'Enter a website above'}</div>
          <div class="browser-download-status" data-browser-download-status hidden></div>
        </div>
      </div>`;
  }

  const notepadFontOptions = [
    { label: 'Consolas', value: 'Consolas, "Cascadia Mono", monospace' },
    { label: 'Cascadia Mono', value: '"Cascadia Mono", Consolas, monospace' },
    { label: 'Cascadia Code', value: '"Cascadia Code", Consolas, monospace' },
    { label: 'JetBrains Mono', value: '"JetBrains Mono", Consolas, monospace' },
    { label: 'Fira Code', value: '"Fira Code", Consolas, monospace' },
    { label: 'Lucida Console', value: '"Lucida Console", monospace' }
  ];

  function findNotepadTab(tabId) {
    for (const session of state.sessions) {
      for (const tab of session.tabs || []) {
        for (const pane of tab.panes || []) {
          const notepadTab = pane.notepadTabs?.find((candidate) => candidate.id === tabId);
          if (notepadTab) return notepadTab;
        }
      }
    }
    return null;
  }

  function notepadTabData(tabId) {
    if (!state.notepadTabData[tabId]) {
      const tab = findNotepadTab(tabId);
      state.notepadTabData[tabId] = {
        content: tab?.content || '', encoding: tab?.encoding || 'utf8', dirty: false, loadedPath: '', error: '',
        wrap: Boolean(tab?.wrap), indentGuides: Boolean(tab?.indentGuides),
        autosave: Boolean(tab?.autosave), fontFamily: tab?.fontFamily || ''
      };
    }
    return state.notepadTabData[tabId];
  }

  function notepadActiveTab(pane) {
    const tabs = pane.notepadTabs || [];
    return tabs.find((tab) => tab.id === pane.activeNotepadTabId) || tabs[0];
  }

  function lineCount(content) {
    return String(content || '').split(/\r\n|\r|\n/).length;
  }

  function lineNumbers(content) {
    const count = lineCount(content);
    return Array.from({ length: count }, (_, index) => index + 1).join('\n');
  }

  function renderNotepadIndentGuides(content) {
    return String(content || '').split(/\r\n|\r|\n/).map((line) => {
      const spaces = line.match(/^( +)(?=\S)/)?.[1].length || 0;
      const columns = Math.floor(spaces / 4) * 4;
      return `<span class="notepad-indent-guide-line" style="--notepad-guide-columns:${columns}"></span>`;
    }).join('');
  }

  function notepadTabLabel(tab) {
    const pathLabel = String(tab?.path || '').split(/[\\/]/).filter(Boolean).pop();
    return pathLabel || tab?.title || 'Untitled';
  }

  function renderNotepadTabs(pane) {
    const tabs = pane.notepadTabs || [];
    return `
      <div class="notepad-tab-list" role="tablist">
        ${tabs.map((tab) => {
          const data = notepadTabData(tab.id);
          const label = notepadTabLabel(tab);
          return `
          <div class="notepad-tab ${tab.id === pane.activeNotepadTabId ? 'active' : ''}" role="tab" tabindex="0" aria-selected="${tab.id === pane.activeNotepadTabId}" data-notepad-tab="${tab.id}" title="${escapeAttr(tab.path || label)}">
            <span class="notepad-tab-label">${data.dirty ? '<span class="notepad-tab-modified">*</span>' : ''}${escapeHtml(label)}</span>
            <button class="notepad-tab-close" type="button" aria-label="Close ${escapeAttr(label)}" data-notepad-close-tab="${tab.id}">${fileActionIcon('close')}</button>
          </div>`;
        }).join('')}
      </div>
      <button class="notepad-new-tab" type="button" data-notepad-new-tab aria-label="New file" title="New file (Ctrl+N)">${fileActionIcon('add')}</button>`;
  }

  function renderNotepadPane(pane) {
    const tab = notepadActiveTab(pane);
    const data = notepadTabData(tab.id);
    const fontFamily = data.fontFamily || notepadFontOptions[0].value;
    return `
      <div class="notepad-pane" data-notepad-pane="${pane.id}" data-notepad-active-tab="${tab.id}">
        <div class="notepad-toolbar" data-paged-toolbar>
          ${renderToolbarPageButton('previous')}
          <button class="file-command-button" type="button" data-toolbar-item data-notepad-new aria-label="New file" title="New file (Ctrl+N)">${fileActionIcon('add')}</button>
          <button class="file-command-button" type="button" data-toolbar-item data-notepad-save aria-label="Save" title="Save (Ctrl+S)">${fileActionIcon('save')}</button>
          <div class="notepad-popover-control" data-toolbar-item>
            <button class="file-command-button" type="button" data-notepad-font-toggle aria-label="Font" aria-expanded="false" title="Font">${fileActionIcon('font')}</button>
            <div class="notepad-popover notepad-font-popover" data-notepad-font-popover role="dialog" aria-label="Choose font" hidden>
              ${notepadFontOptions.map((option) => `<button type="button" data-notepad-font="${escapeAttr(option.value)}" aria-pressed="${option.value === fontFamily}">${escapeHtml(option.label)}</button>`).join('')}
            </div>
          </div>
          <div class="notepad-popover-control" data-toolbar-item>
            <button class="file-command-button notepad-font-size-toggle" type="button" data-notepad-font-size-toggle aria-label="Font size" aria-expanded="false" title="Font size (Ctrl+scroll or Ctrl+/-)"><span class="notepad-font-size-value" data-notepad-font-size-value>${paneFontSize(pane)}</span></button>
            <div class="notepad-popover notepad-font-size-popover" data-notepad-font-size-popover role="dialog" aria-label="Font size" hidden>
              <button type="button" data-notepad-font-size-out aria-label="Decrease font size">−</button>
              <output data-notepad-font-size-output>${paneFontSize(pane)}</output>
              <button type="button" data-notepad-font-size-in aria-label="Increase font size">+</button>
              <button type="button" data-notepad-font-size-reset aria-label="Reset font size" title="Reset font size">${fileActionIcon('reset')}</button>
            </div>
          </div>
          <button class="file-command-button" type="button" data-toolbar-item data-notepad-cut aria-label="Cut" title="Cut (Ctrl+X)">${fileActionIcon('cut')}</button>
          <button class="file-command-button" type="button" data-toolbar-item data-notepad-copy aria-label="Copy" title="Copy (Ctrl+C)">${fileActionIcon('copy')}</button>
          <button class="file-command-button" type="button" data-toolbar-item data-notepad-paste aria-label="Paste" title="Paste (Ctrl+V)">${fileActionIcon('paste')}</button>
          <div class="notepad-popover-control notepad-find-control" data-toolbar-item>
            <button class="file-command-button" type="button" data-notepad-find aria-label="Find" aria-expanded="false" title="Find (Ctrl+F)">${fileActionIcon('search')}</button>
            <div class="notepad-popover notepad-find-popover" data-notepad-find-popover role="dialog" aria-label="Find" hidden>
              <div class="notepad-popover-header" data-notepad-popover-drag>
                <span class="notepad-popover-title">Find</span>
                <button type="button" class="notepad-popover-close" data-notepad-popover-close aria-label="Close find">×</button>
              </div>
              <input type="text" data-notepad-find-input placeholder="Find" aria-label="Find">
              <button type="button" data-notepad-find-prev aria-label="Previous match" title="Previous match">${fileActionIcon('browser-back')}</button>
              <button type="button" data-notepad-find-next aria-label="Next match" title="Next match">${fileActionIcon('browser-forward')}</button>
            </div>
          </div>
          <div class="notepad-popover-control notepad-replace-control" data-toolbar-item>
            <button class="file-command-button" type="button" data-notepad-replace aria-label="Replace" aria-expanded="false" title="Replace (Ctrl+H)">${fileActionIcon('replace')}</button>
            <div class="notepad-popover notepad-replace-popover" data-notepad-replace-popover role="dialog" aria-label="Replace" hidden>
              <div class="notepad-popover-header" data-notepad-popover-drag>
                <span class="notepad-popover-title">Replace</span>
                <button type="button" class="notepad-popover-close" data-notepad-popover-close aria-label="Close replace">×</button>
              </div>
              <input type="text" data-notepad-replace-find-input placeholder="Find" aria-label="Find">
              <button type="button" data-notepad-replace-prev aria-label="Previous match" title="Previous match">${fileActionIcon('browser-back')}</button>
              <button type="button" data-notepad-replace-next aria-label="Next match" title="Next match">${fileActionIcon('browser-forward')}</button>
              <input type="text" data-notepad-replace-input placeholder="Replace" aria-label="Replace">
              <button type="button" data-notepad-replace-one aria-label="Replace" title="Replace">${fileActionIcon('replace')}</button>
              <button type="button" data-notepad-replace-all aria-label="Replace all" title="Replace all">${fileActionIcon('replace-all')}</button>
            </div>
          </div>
          <button class="file-command-button ${data.wrap ? 'active' : ''}" type="button" data-toolbar-item data-notepad-wrap aria-label="Word wrap" aria-pressed="${data.wrap}" title="Word wrap">${fileActionIcon('wrap')}</button>
          <button class="file-command-button ${data.indentGuides ? 'active' : ''}" type="button" data-toolbar-item data-notepad-indent aria-label="Indent guides" aria-pressed="${data.indentGuides}" title="Indent guides">${fileActionIcon('indent')}</button>
          <button class="file-command-button ${data.autosave ? 'active' : ''}" type="button" data-toolbar-item data-notepad-autosave aria-label="Auto save" aria-pressed="${data.autosave}" title="Auto save">${fileActionIcon('autosave')}</button>
          <span class="notepad-status" data-notepad-status>${escapeHtml(data.error || data.encoding.toUpperCase())}</span>
          ${renderToolbarPageButton('next')}
        </div>
        <div class="notepad-editor-shell ${data.wrap ? 'wrap-on' : ''} ${data.indentGuides ? 'indent-guides-on' : ''}">
          <pre class="notepad-gutter" aria-hidden="true" style="font-family: ${escapeAttr(fontFamily)};">${lineNumbers(data.content)}</pre>
          <div class="notepad-editor-stage">
            <div class="notepad-indent-guides" aria-hidden="true" style="font-family: ${escapeAttr(fontFamily)};">${renderNotepadIndentGuides(data.content)}</div>
            <div class="notepad-wrap-measure" aria-hidden="true"></div>
            <textarea class="notepad-editor" aria-label="Text editor" spellcheck="false" wrap="${data.wrap ? 'soft' : 'off'}" style="font-family: ${escapeAttr(fontFamily)};">${escapeHtml(data.content)}</textarea>
          </div>
        </div>
      </div>`;
  }

  function mountPaneContent(pane) {
    if ((pane.type || 'terminal') === 'terminal') mountTerminal(pane.id, activePaneTabId(pane));
    else if (pane.type === 'browser') mountRemoteBrowser(pane.id);
    else if (pane.type === 'notepad') {
      const tab = notepadActiveTab(pane);
      loadNotepadTab(pane.id, tab?.id, tab?.path || '');
    }
    else if (pane.type === 'usage') loadUsagePane(pane.id);
    else if (pane.type === 'whiteboard') mountWhiteboard(pane);
    else {
      loadFilesPane(pane);
    }
  }

  // Excalidraw and React are 4 MB of vendor code, so they are only fetched once
  // a whiteboard pane actually exists.
  let excalidrawLoader = null;
  function loadExcalidraw() {
    if (!excalidrawLoader) {
      // Excalidraw resolves its fonts and vendor chunk against this path. Left
      // unset it falls back to unpkg.com, which breaks an offline install.
      window.EXCALIDRAW_ASSET_PATH = '/vendor/excalidraw/';
      excalidrawLoader = ['react.js', 'react-dom.js', 'jsx-runtime.js', 'excalidraw.js']
        .reduce(
          (chain, file) => chain.then(() => loadVendorScript(`/vendor/excalidraw/${file}`)),
          Promise.resolve()
        );
    }
    return excalidrawLoader;
  }

  function loadVendorScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function parseWhiteboard(content) {
    try {
      const data = JSON.parse(content || '{}');
      return { elements: data.elements || [], appState: data.appState || {} };
    } catch {
      return { elements: [], appState: {} };
    }
  }

  async function mountWhiteboard(pane) {
    const host = document.getElementById(`whiteboard-${pane.id}`);
    if (!host || state.whiteboards.has(pane.id)) {
      return;
    }
    try {
      await loadExcalidraw();
    } catch (error) {
      host.textContent = error.message;
      return;
    }
    if (!document.body.contains(host)) {
      return; // the pane was closed while the vendor bundle was loading
    }
    const root = window.ReactDOM.createRoot(host);
    state.whiteboards.set(pane.id, root);
    root.render(window.React.createElement(window.ExcalidrawLib.Excalidraw, {
      initialData: parseWhiteboard(pane.whiteboard),
      theme: state.theme.includes('light') ? 'light' : 'dark',
      // appState carries live-session values (collaborators is a Map), so only
      // the few fields worth restoring are persisted.
      onChange: (elements, appState) => saveWhiteboardSoon(pane.id, {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          gridSize: appState.gridSize
        }
      })
    }));
  }

  const whiteboardSaveTimers = new Map();
  function saveWhiteboardSoon(paneId, data) {
    window.clearTimeout(whiteboardSaveTimers.get(paneId));
    whiteboardSaveTimers.set(paneId, window.setTimeout(() => {
      const found = findPaneState(paneId);
      const whiteboard = JSON.stringify(data);
      if (found) {
        found.pane.whiteboard = whiteboard;
      }
      api(`/api/panes/${paneId}/whiteboard`, {
        method: 'PATCH',
        body: JSON.stringify({ whiteboard })
      }).catch(() => {});
    }, 600));
  }

  function disposeWhiteboards() {
    for (const root of state.whiteboards.values()) {
      root.unmount();
    }
    state.whiteboards.clear();
  }

  function render() {
    const session = activeSession();
    const tab = activeTab(session);
    if (!session || !tab) {
      return;
    }
    state.activeSessionId = session.id;
    state.activePaneId = state.activePaneId || tab.activePaneId || tab.panes[0].id;
    const sidebarWidth = state.sidebarWidth || Number(state.config.ui?.sidebar_width) || 286;

    applyTheme();
    applyUiTypography();
    disposeTerminals();
    disposeBrowsers();
    disposeWhiteboards();
    app.innerHTML = `
      <main class="app ${state.sidebarOpen ? '' : 'sidebar-closed'} ${state.sidebarPinned ? 'sidebar-pinned' : ''} ${isMobileLayout() ? 'mobile-device' : ''} mode-${state.displayMode} density-${state.mobileTerminalDensity}" style="--sidebar-width: ${sidebarWidth}px">
        <aside class="sidebar">
          <nav class="menu-rail" aria-label="Workspace navigation">
            <div class="sidebar-brand-row">
              <button class="rail-button sidebar-brand" data-action="toggle" aria-label="Toggle sidebar" aria-expanded="${state.sidebarOpen}" title="${state.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}"><span class="rail-brand-mark" aria-hidden="true">W7</span><span class="rail-label">WPS7</span></button>
              <button class="sidebar-pin" type="button" data-sidebar-pin aria-label="${state.sidebarPinned ? 'Unpin' : 'Pin'} sidebar" aria-pressed="${state.sidebarPinned}" title="${state.sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}"><span class="rail-icon" aria-hidden="true">${fileActionIcon(state.sidebarPinned ? 'pin-off' : 'pin')}</span></button>
            </div>
            <button class="rail-button" data-action="new-powershell" aria-label="New PowerShell" title="New PowerShell">
              <span class="rail-icon" aria-hidden="true">${fileActionIcon('terminal')}</span><span class="rail-label">New PowerShell</span>
            </button>
            <button class="rail-button" data-action="files" aria-label="New file" title="New file">
              <span class="rail-icon" aria-hidden="true">${fileActionIcon('file')}</span><span class="rail-label">New file</span>
            </button>
            <button class="rail-button" data-action="browser" aria-label="New browser" title="New browser">
              <span class="rail-icon" aria-hidden="true">${fileActionIcon('browser')}</span><span class="rail-label">New browser</span>
            </button>
            <button class="rail-button" data-action="notepad" aria-label="New notepad" title="New notepad">
              <span class="rail-icon" aria-hidden="true">${fileActionIcon('notepad')}</span><span class="rail-label">New notepad</span>
            </button>
            <button class="rail-button" data-action="usage" aria-label="New usage pane" title="New usage pane"><span class="rail-icon" aria-hidden="true">${fileActionIcon('usage')}</span><span class="rail-label">Usage pane</span></button>
            <button class="rail-button" data-action="whiteboard" aria-label="New whiteboard" title="New whiteboard"><span class="rail-icon" aria-hidden="true">${fileActionIcon('line')}</span><span class="rail-label">New whiteboard</span></button>
          </nav>
          <div class="sidebar-inner">
            <div class="sidebar-divider" aria-hidden="true"></div>
            <div class="session-list" aria-label="Workspace list">
              ${sidebarPaneRows().map(renderSidebarPaneItem).join('')}
            </div>
          </div>
          <footer class="sidebar-footer">
            <button class="rail-button" data-action="settings" aria-label="Settings" title="Settings"><span class="rail-icon">⚙</span><span class="rail-label">Settings</span></button>
            <button class="rail-button" type="button" data-theme-toggle aria-label="Switch to ${themeMode() === 'dark' ? 'light' : 'dark'} mode" title="Switch theme"><span class="rail-icon">${themeMode() === 'dark' ? '☾' : '☀'}</span><span class="rail-label">${themeMode() === 'dark' ? 'Dark mode' : 'Light mode'}</span></button>
          </footer>
          <div class="sidebar-resizer" data-action="resize-sidebar"></div>
        </aside>
        <section class="workspace">
          <header class="tabs">
            <div class="mobile-actions">
              <button class="mobile-brand" data-action="toggle" aria-label="Toggle sidebar" aria-expanded="${state.sidebarOpen}" title="${state.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}"><span class="rail-brand-mark" aria-hidden="true">W7</span></button>
            </div>
            ${state.sessions.map((item) => `
              <button class="tab ${item.id === session.id ? 'active' : ''}" data-tab-session="${item.id}">
                <span data-rename-session="${item.id}">${escapeHtml(item.name)}</span>
                <span class="tab-close" data-close-session="${item.id}" title="Close workspace">×</span>
              </button>
            `).join('')}
            <button class="tab tab-add" data-action="new-session" title="New workspace" aria-label="New workspace">${fileActionIcon('add')}</button>
            ${state.config.shell.usingFallback ? '<span class="shell-warning">PowerShell 7 not found</span>' : ''}
          </header>
          <div class="desktop-mode-banner" data-desktop-mode-banner role="status" hidden>
            <span class="desktop-mode-banner-text">Panes are cramped on this narrow screen.</span>
            <button type="button" class="primary" data-switch-mobile>Switch to Mobile</button>
            <button type="button" class="desktop-mode-banner-dismiss" data-dismiss-banner aria-label="Keep desktop layout" title="Keep desktop layout">×</button>
          </div>
          <div class="pane-grid" data-pane-grid style="${boardStyle()}">
            ${tab.panes.map((pane) => renderPane(pane)).join('')}
          </div>
        </section>
      </main>
    `;

    wireControls();
    ensureActivePaneVisible('auto');
    updateDesktopModeBanner();
    for (const pane of tab.panes) {
      mountPaneContent(pane);
    }
  }

  function narrowViewport() {
    return window.matchMedia('(max-width: 760px)').matches;
  }

  function updateDesktopModeBanner() {
    const banner = app.querySelector('[data-desktop-mode-banner]');
    if (!banner) {
      return;
    }
    banner.hidden = !(state.displayMode === 'desktop' && narrowViewport() && !state.dismissedDesktopBanner);
  }

  function setDisplayMode(mode, persist = true) {
    state.displayMode = mode;
    if (persist) {
      localStorage.setItem('wps7.displayMode', mode);
    }
    state.dismissedDesktopBanner = false;
    const appElement = document.querySelector('.app');
    appElement?.classList.remove('mode-auto', 'mode-mobile', 'mode-desktop');
    appElement?.classList.add(`mode-${mode}`);
    updateVisualViewport();
    applyConfigLive();
    updateDesktopModeBanner();
  }

  function setTerminalDensity(density, persist = true) {
    state.mobileTerminalDensity = density;
    if (persist) {
      localStorage.setItem('wps7.mobileTerminalDensity', density);
    }
    const appElement = document.querySelector('.app');
    appElement?.classList.remove('density-readable', 'density-dense');
    appElement?.classList.add(`density-${density}`);
    applyConfigLive();
  }

  function wireControls() {
    app.querySelectorAll('[data-action="toggle"]').forEach((button) => button.onclick = () => setSidebarOpen(!state.sidebarOpen));
    app.querySelector('[data-sidebar-pin]').onclick = () => setSidebarPinned(!state.sidebarPinned);
    app.querySelectorAll('[data-action="new-session"]').forEach((button) => button.onclick = async () => {
      const session = await api('/api/sessions', { method: 'POST', body: JSON.stringify({}) });
      state.activeSessionId = session.id;
      state.activePaneId = '';
      await loadState();
    });
    app.querySelectorAll('[data-action="new-powershell"]').forEach((button) => button.onclick = () => createPane());
    app.querySelectorAll('[data-action="files"]').forEach((button) => button.onclick = openFilesPane);
    app.querySelectorAll('[data-action="browser"]').forEach((button) => button.onclick = openBrowserPane);
    app.querySelectorAll('[data-action="notepad"]').forEach((button) => button.onclick = () => openNotepadPane());
    app.querySelectorAll('[data-action="usage"]').forEach((button) => button.onclick = openUsagePane);
    app.querySelectorAll('[data-action="whiteboard"]').forEach((button) => button.onclick = openWhiteboardPane);
    app.querySelectorAll('[data-action="settings"]').forEach((button) => button.onclick = openSettings);
    app.querySelector('[data-action="resize-sidebar"]').onpointerdown = startSidebarResize;
    app.querySelector('[data-switch-mobile]')?.addEventListener('click', () => setDisplayMode('mobile'));
    app.querySelector('[data-dismiss-banner]')?.addEventListener('click', () => {
      state.dismissedDesktopBanner = true;
      updateDesktopModeBanner();
    });
    app.querySelector('[data-theme-toggle]').onclick = () => setThemeLive(pairedThemeId(), true);
    app.querySelector('.sidebar').addEventListener('click', closeMobileSidebarAfterAction);
    wireMobileKeybarButtons(app);
    wirePaneGrid(app);
    app.querySelectorAll('[data-tab-session]').forEach((button) => {
      button.onclick = (event) => {
        if (Date.now() < state.suppressSessionClickUntil) {
          event.preventDefault();
          return;
        }
        scheduleClick(event, async () => {
          state.activeSessionId = button.dataset.tabSession;
          state.activePaneId = '';
          await api(`/api/sessions/${state.activeSessionId}/activate`, { method: 'POST' });
          await loadState();
        });
      };
      button.onauxclick = async (event) => {
        if (event.button !== 1) {
          return;
        }
        event.preventDefault();
        await closeSession(button.dataset.tabSession);
      };
      button.ondblclick = (event) => {
        cancelClick();
        event.stopPropagation();
        const label = button.querySelector('[data-rename-session]');
        if (label) {
          renameSession(button.dataset.tabSession, label.textContent);
        }
      };
      installSessionTabTouchRename(button);
    });
    app.querySelectorAll('[data-close-session]').forEach((button) => {
      button.onclick = async (event) => {
        event.stopPropagation();
        await closeSession(button.dataset.closeSession);
      };
    });
    wirePaneControls(app);
    wirePaneLinks(app);
    wireFilesPane(app);
    wireBrowserPane(app);
    wireNotepadPane(app);
    wirePaneTabStrips(app);
    app.querySelectorAll('[data-rename-session]').forEach((label) => {
      label.ondblclick = (event) => {
        cancelClick();
        event.stopPropagation();
        renameSession(label.dataset.renameSession, label.textContent);
      };
    });
  }

  function wireMobileKeybarButtons(root) {
    wirePagedToolbars(root);
    findAll(root, '.mobile-keybar').forEach((keybar) => {
      keybar.querySelectorAll('button').forEach((button) => {
        button.onpointerdown = (event) => event.preventDefault();
      });
    });
    root.querySelectorAll('[data-terminal-action]').forEach((button) => {
      button.onclick = () => sendMobileTerminalKey(button);
    });
  }

  function updatePagedToolbar(toolbar) {
    const items = Array.from(toolbar.children).filter((child) => child.hasAttribute('data-toolbar-item'));
    const previous = toolbar.querySelector('[data-toolbar-page="previous"]');
    const next = toolbar.querySelector('[data-toolbar-page="next"]');
    if (!items.length || !previous || !next || !toolbar.clientWidth) {
      return;
    }
    const fixed = Array.from(toolbar.children).filter((child) => !child.hasAttribute('data-toolbar-item') && !child.hasAttribute('data-toolbar-page'));
    const gap = Number.parseFloat(getComputedStyle(toolbar).gap) || 0;
    items.forEach((item) => item.hidden = false);
    previous.hidden = true;
    next.hidden = true;
    const visibleWithoutPaging = [...items, ...fixed];
    const fullWidth = visibleWithoutPaging.reduce((total, item) => total + item.offsetWidth, 0)
      + Math.max(0, visibleWithoutPaging.length - 1) * gap;
    if (fullWidth <= toolbar.clientWidth) {
      toolbar.dataset.toolbarPageIndex = '0';
      return;
    }
    previous.hidden = false;
    next.hidden = false;
    const fixedWidth = fixed.reduce((total, item) => total + item.offsetWidth, 0);
    const availableWidth = toolbar.clientWidth - previous.offsetWidth - next.offsetWidth
      - fixedWidth - (fixed.length + 2) * gap;
    const pages = [];
    let page = [];
    let usedWidth = 0;
    items.forEach((item) => {
      const itemWidth = item.offsetWidth + (page.length ? gap : 0);
      if (page.length && usedWidth + itemWidth > availableWidth) {
        pages.push(page);
        page = [];
        usedWidth = 0;
      }
      page.push(item);
      usedWidth += item.offsetWidth + (page.length > 1 ? gap : 0);
    });
    if (page.length) {
      pages.push(page);
    }
    const pageIndex = Math.min(Number(toolbar.dataset.toolbarPageIndex) || 0, pages.length - 1);
    toolbar.dataset.toolbarPageIndex = String(pageIndex);
    const visibleItems = new Set(pages[pageIndex]);
    items.forEach((item) => item.hidden = !visibleItems.has(item));
    previous.disabled = pageIndex === 0;
    next.disabled = pageIndex === pages.length - 1;
  }

  function activatePagedToolbarPane(toolbar, event) {
    event.stopPropagation();
    const pane = toolbar.closest('[data-pane]');
    if (pane && pane.dataset.pane !== state.activePaneId) {
      setActivePane(pane.dataset.pane, false);
    }
  }

  function wirePagedToolbars(root) {
    if (!root) {
      return;
    }
    findAll(root, '[data-paged-toolbar]').forEach((toolbar) => {
      const previous = toolbar.querySelector('[data-toolbar-page="previous"]');
      const next = toolbar.querySelector('[data-toolbar-page="next"]');
      previous.onclick = (event) => {
        activatePagedToolbarPane(toolbar, event);
        toolbar.dataset.toolbarPageIndex = String(Math.max(0, (Number(toolbar.dataset.toolbarPageIndex) || 0) - 1));
        updatePagedToolbar(toolbar);
      };
      next.onclick = (event) => {
        activatePagedToolbarPane(toolbar, event);
        toolbar.dataset.toolbarPageIndex = String((Number(toolbar.dataset.toolbarPageIndex) || 0) + 1);
        updatePagedToolbar(toolbar);
      };
      toolbar._pagedToolbarObserver?.disconnect();
      toolbar._pagedToolbarObserver = new ResizeObserver(() => updatePagedToolbar(toolbar));
      toolbar._pagedToolbarObserver.observe(toolbar);
      requestAnimationFrame(() => updatePagedToolbar(toolbar));
    });
  }

  function installKeyboardShortcuts() {
    if (state.shortcutsInstalled) {
      return;
    }
    state.shortcutsInstalled = true;
    document.addEventListener('keydown', async (event) => {
      const key = event.key.toLowerCase();
      if (event.ctrlKey && !event.altKey && !event.metaKey && (key === '+' || key === '=' || key === '-')) {
        event.preventDefault();
        changePaneFontSize(state.activePaneId, key === '-' ? -1 : 1);
        return;
      }
      if (event.target.closest?.('input, textarea, select, .inline-rename')) {
        return;
      }
      if (event.ctrlKey && event.shiftKey && key === 't') {
        event.preventDefault();
        app.querySelector('[data-action="new-session"]')?.click();
      } else if (event.ctrlKey && event.shiftKey && key === 'n') {
        event.preventDefault();
        await createPane();
      } else if (event.ctrlKey && event.shiftKey && key === 'w') {
        event.preventDefault();
        await closePane(state.activePaneId);
      } else if (event.ctrlKey && event.altKey && key === 'arrowright') {
        event.preventDefault();
        switchPaneByOffset(1);
      } else if (event.ctrlKey && event.altKey && key === 'arrowleft') {
        event.preventDefault();
        switchPaneByOffset(-1);
      } else if (event.key === 'F2') {
        event.preventDefault();
        const found = findPaneState(state.activePaneId);
        if (found?.pane.type === 'terminal') {
          renamePaneTab(found.pane.id, activePaneTabId(found.pane));
        } else if (found) {
          renamePane(found.pane.id, found.pane.title);
        }
      }
    });
  }

  // Shared modal behaviour: labelled dialog semantics, Escape to close, focus
  // moved into the panel and trapped there, focus restored to the opener.
  // Returns the disposer the caller must run when it actually closes.
  function wireModal(panel, requestClose, labelledBy) {
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (labelledBy) {
      panel.setAttribute('aria-labelledby', labelledBy);
    }
    const opener = document.activeElement;
    const focusable = () => [...panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => element.offsetWidth || element.offsetHeight);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        requestClose();
        return;
      }
      if (event.key !== 'Tab') {
        return;
      }
      const items = focusable();
      if (!items.length) {
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    requestAnimationFrame(() => focusable()[0]?.focus());
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (opener?.isConnected) {
        opener.focus();
      }
    };
  }

  function discardOverlay(selector) {
    const existing = document.querySelector(selector);
    if (!existing) {
      return;
    }
    existing._disposeModal?.();
    existing.remove();
  }

  async function toggleFilePanel() {
    state.filePanelOpen = !state.filePanelOpen;
    if (state.filePanelOpen && !state.filePath) {
      await loadDrives();
    }
    renderFilePanel();
  }

  async function openFilesPane() {
    const session = activeSession();
    const tab = activeTab(session);
    const basePaneId = state.activePaneId || tab?.activePaneId || tab?.panes[0]?.id;
    if (!session || !tab || !basePaneId) {
      return;
    }
    try {
      const pane = await api(`/api/panes/${basePaneId}/files`, {
        method: 'POST',
        body: JSON.stringify({ path: '' })
      });
      appendPaneToWorkspace(session, tab, pane);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function openUsagePane() {
    const session = activeSession();
    const tab = activeTab(session);
    const basePaneId = state.activePaneId || tab?.activePaneId || tab?.panes[0]?.id;
    if (!session || !tab || !basePaneId) return;
    try {
      const pane = await api(`/api/panes/${basePaneId}/usage`, { method: 'POST' });
      appendPaneToWorkspace(session, tab, pane);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function openWhiteboardPane() {
    const session = activeSession();
    const tab = activeTab(session);
    const basePaneId = state.activePaneId || tab?.activePaneId || tab?.panes[0]?.id;
    if (!session || !tab || !basePaneId) return;
    try {
      const pane = await api(`/api/panes/${basePaneId}/whiteboard`, { method: 'POST' });
      appendPaneToWorkspace(session, tab, pane);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function openBrowserPane() {
    const session = activeSession();
    const tab = activeTab(session);
    const basePaneId = state.activePaneId || tab?.activePaneId || tab?.panes[0]?.id;
    if (!session || !tab || !basePaneId) return;
    try {
      const pane = await api(`/api/panes/${basePaneId}/browser`, {
        method: 'POST', body: JSON.stringify({ url: '', emulationMode: isMobileLayout() ? 'mobile' : 'desktop' })
      });
      appendPaneToWorkspace(session, tab, pane);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function openNotepadPane(path = '') {
    const session = activeSession();
    const tab = activeTab(session);
    const basePaneId = state.activePaneId || tab?.activePaneId || tab?.panes[0]?.id;
    if (!session || !tab || !basePaneId) return;
    try {
      const pane = await api(`/api/panes/${basePaneId}/notepad`, {
        method: 'POST', body: JSON.stringify({ path })
      });
      appendPaneToWorkspace(session, tab, pane);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function setBrowserPaneUrl(paneId, value) {
    const connection = state.browserConnections.get(paneId);
    if (!connection) {
      showToast('Remote browser is still connecting.');
      return;
    }
    connection.send({ type: 'navigate', url: String(value || '').trim() });
  }

  function updateBrowserPane(paneId) {
    const found = findPaneState(paneId);
    const container = document.querySelector(`[data-pane="${paneId}"]`);
    const existing = container?.querySelector('.browser-pane');
    if (!found || !existing) return;
    existing.outerHTML = renderBrowserPane(found.pane);
    wireBrowserPane(container);
  }

  function updateBrowserMenu(paneId) {
    const found = findPaneState(paneId);
    const paneElement = document.querySelector(`[data-browser-pane="${paneId}"]`);
    const menu = paneElement?.querySelector('[data-browser-url-menu]');
    if (found && menu) menu.innerHTML = renderBrowserUrlOptions(found.pane);
    if (paneElement) wireBrowserMenu(paneElement, paneId);
  }

  function updateBrowserTabStrip(paneId) {
    const found = findPaneState(paneId);
    const paneElement = document.querySelector(`[data-pane="${paneId}"]`);
    const strip = paneElement?.querySelector('[data-browser-tab-strip]');
    if (!found || !strip) return;
    strip.innerHTML = renderBrowserTabs(found.pane);
    wireBrowserTabs(paneElement, paneId);
    const active = activeBrowserTab(found.pane);
    const input = paneElement.querySelector('[name="url"]');
    const zoom = paneElement.querySelector('[data-browser-zoom-value]');
    const external = paneElement.querySelector('[data-browser-external]');
    const modeButton = paneElement.querySelector('[data-browser-emulation-mode]');
    if (input) input.value = active.url || '';
    if (zoom) zoom.textContent = `${Math.round((active.zoom || 1) * 100)}%`;
    if (external) external.disabled = !active.url;
    if (modeButton) {
      const mobile = active.emulationMode === 'mobile';
      modeButton.classList.toggle('active', mobile);
      modeButton.setAttribute('aria-pressed', String(mobile));
      modeButton.setAttribute('aria-label', mobile ? 'Switch to desktop mode' : 'Switch to mobile mode');
      modeButton.title = mobile ? 'Mobile mode' : 'Desktop mode';
      modeButton.innerHTML = fileActionIcon(mobile ? 'mobile' : 'desktop');
    }
    updateBrowserMenu(paneId);
  }

  async function toggleBrowserBookmark(url, paneId) {
    if (!url) return;
    const bookmarked = (state.config.browser?.bookmarks || []).some((bookmark) => bookmark.url === url);
    try {
      const result = await api('/api/browser/bookmarks', {
        method: bookmarked ? 'DELETE' : 'POST',
        body: JSON.stringify({ url })
      });
      state.config.browser = { ...state.config.browser, bookmarks: result.bookmarks || [] };
      updateBrowserMenu(paneId);
    } catch (error) {
      showToast(error.message);
    }
  }

  function setBrowserZoomPopover(paneId, open) {
    const paneElement = document.querySelector(`[data-browser-pane="${paneId}"]`);
    const popover = paneElement?.querySelector('[data-browser-zoom-popover]');
    const toggle = paneElement?.querySelector('[data-browser-zoom-toggle]');
    if (!popover || !toggle) return;
    popover.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  function showBrowserZoomPopover(paneId) {
    window.clearTimeout(state.browserZoomTimers.get(paneId));
    setBrowserZoomPopover(paneId, true);
    state.browserZoomTimers.set(paneId, window.setTimeout(() => {
      setBrowserZoomPopover(paneId, false);
      state.browserZoomTimers.delete(paneId);
    }, 1000));
  }

  function wireBrowserPane(root) {
    const browserPane = root?.querySelector?.('.browser-pane') || (root?.matches?.('.browser-pane') ? root : null);
    if (!browserPane) return;
    const paneElement = browserPane.closest('[data-pane]') || browserPane;
    const paneId = browserPane.dataset.browserPane;
    const found = findPaneState(paneId);
    if (!found) return;
    const menu = paneElement.querySelector('[data-browser-url-menu]');
    const toggle = paneElement.querySelector('[data-browser-url-toggle]');
    const control = paneElement.querySelector('[data-browser-url-control]');
    const zoomControl = paneElement.querySelector('[data-browser-zoom-control]');
    const zoomToggle = paneElement.querySelector('[data-browser-zoom-toggle]');
    const zoomPopover = paneElement.querySelector('[data-browser-zoom-popover]');
    const setMenuOpen = (open) => {
      if (!menu || !toggle) return;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle?.addEventListener('click', () => {
      setMenuOpen(menu.hidden);
    });
    control?.addEventListener('focusout', (event) => {
      if (!control.contains(event.relatedTarget)) setMenuOpen(false);
    });
    const setZoomOpen = (open) => {
      window.clearTimeout(state.browserZoomTimers.get(paneId));
      state.browserZoomTimers.delete(paneId);
      setBrowserZoomPopover(paneId, open);
    };
    zoomToggle?.addEventListener('click', () => setZoomOpen(zoomPopover.hidden));
    zoomControl?.addEventListener('focusout', (event) => {
      if (!zoomControl.contains(event.relatedTarget)) setZoomOpen(false);
    });
    zoomControl?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setZoomOpen(false);
        zoomToggle.focus();
      }
    });
    paneElement.querySelector('[data-browser-url-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      setBrowserPaneUrl(paneId, new FormData(event.currentTarget).get('url'));
    });
    wireBrowserMenu(paneElement, paneId, setMenuOpen);
    paneElement.querySelector('[data-browser-refresh]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'reload' });
    });
    paneElement.querySelector('[data-browser-stop]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'stop' });
    });
    paneElement.querySelector('[data-browser-find]')?.addEventListener('click', () => showBrowserFind(paneElement));
    paneElement.querySelector('[data-browser-zoom-out]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'zoom', delta: -0.1 });
    });
    paneElement.querySelector('[data-browser-zoom-in]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'zoom', delta: 0.1 });
    });
    paneElement.querySelector('[data-browser-zoom-reset]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'zoom', reset: true });
    });
    paneElement.querySelector('[data-browser-external]')?.addEventListener('click', () => {
      const url = activeBrowserTab(found.pane).url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    });
    paneElement.querySelector('[data-browser-back]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'back' });
    });
    paneElement.querySelector('[data-browser-forward]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'forward' });
    });
    paneElement.querySelector('[data-browser-emulation-mode]')?.addEventListener('click', () => {
      const active = activeBrowserTab(findPaneState(paneId)?.pane || {});
      state.browserConnections.get(paneId)?.send({
        type: 'setEmulationMode',
        emulationMode: active.emulationMode === 'mobile' ? 'desktop' : 'mobile'
      });
    });
    paneElement.querySelector('[data-browser-audio-toggle]')?.addEventListener('click', () => {
      state.browserAudioEnabled = !state.browserAudioEnabled;
      localStorage.setItem('wps7.browserAudioEnabled', String(state.browserAudioEnabled));
      state.browserConnections.get(paneId)?.setAudio(state.browserAudioEnabled);
    });
    wireBrowserTabs(paneElement, paneId);
    wireBrowserFind(paneElement, paneId);
  }

  function wireBrowserTabs(paneElement, paneId) {
    paneElement.querySelectorAll('[data-browser-tab]').forEach((button) => {
      button.onclick = (event) => {
        if (event.target.closest('[data-browser-close-tab]')) return;
        state.browserConnections.get(paneId)?.send({ type: 'activateTab', tabId: button.dataset.browserTab });
      };
      button.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          state.browserConnections.get(paneId)?.send({ type: 'activateTab', tabId: button.dataset.browserTab });
        }
      };
    });
    paneElement.querySelectorAll('[data-browser-close-tab]').forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        state.browserConnections.get(paneId)?.send({ type: 'closeTab', tabId: button.dataset.browserCloseTab });
      };
    });
    paneElement.querySelector('[data-browser-new-tab]')?.addEventListener('click', () => {
      state.browserConnections.get(paneId)?.send({ type: 'newTab', emulationMode: isMobileLayout() ? 'mobile' : 'desktop' });
    });
  }

  function showBrowserFind(paneElement) {
    const bar = paneElement.querySelector('[data-browser-find-bar]');
    if (!bar) return;
    bar.hidden = false;
    const input = bar.querySelector('[data-browser-find-input]');
    input.focus();
    input.select();
  }

  function browserViewportSize(viewport) {
    const rect = viewport.getBoundingClientRect();
    return {
      width: Math.max(320, Math.min(3840, Math.round(rect.width || 1280))),
      height: Math.max(240, Math.min(2160, Math.round(rect.height || 720)))
    };
  }

  function wireBrowserFind(paneElement, paneId) {
    const bar = paneElement.querySelector('[data-browser-find-bar]');
    const input = bar?.querySelector('[data-browser-find-input]');
    const find = (backwards = false) => {
      state.browserConnections.get(paneId)?.send({ type: 'find', query: input.value, backwards });
    };
    input?.addEventListener('input', () => find(false));
    input?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        find(event.shiftKey);
      } else if (event.key === 'Escape') {
        bar.hidden = true;
        paneElement.querySelector('[data-browser-input-surface]')?.focus();
      }
    });
    bar?.querySelector('[data-browser-find-previous]')?.addEventListener('click', () => find(true));
    bar?.querySelector('[data-browser-find-next]')?.addEventListener('click', () => find(false));
    bar?.querySelector('[data-browser-find-close]')?.addEventListener('click', () => { bar.hidden = true; });
  }

  function wireBrowserMenu(paneElement, paneId, closeMenu = () => {}) {
    paneElement.querySelectorAll('[data-browser-url-choice]').forEach((button) => {
      button.onclick = () => {
        closeMenu(false);
        setBrowserPaneUrl(paneId, button.dataset.browserUrlChoice);
      };
    });
    paneElement.querySelectorAll('[data-browser-bookmark]').forEach((button) => {
      button.onclick = () => toggleBrowserBookmark(button.dataset.browserBookmark, paneId);
    });
  }

  function browserKeyCode(event) {
    const known = { Enter: 13, Backspace: 8, Tab: 9, Escape: 27, Delete: 46, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Home: 36, End: 35, PageUp: 33, PageDown: 34 };
    return known[event.key] || (event.key.length === 1 ? event.key.toUpperCase().charCodeAt(0) : 0);
  }

  function browserModifiers(event) {
    return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0);
  }

  function mountRemoteBrowser(paneId) {
    const paneElement = document.querySelector(`[data-browser-pane="${paneId}"]`);
    const canvas = paneElement?.querySelector('[data-browser-surface]');
    const video = paneElement?.querySelector('[data-browser-video]');
    const inputSurface = paneElement?.querySelector('[data-browser-input-surface]');
    const viewport = paneElement?.querySelector('[data-browser-viewport]');
    const keyboard = paneElement?.querySelector('[data-browser-keyboard]');
    const contextMenu = paneElement?.querySelector('[data-browser-context-menu]');
    const status = paneElement?.querySelector('[data-browser-status]');
    const fileInput = paneElement?.querySelector('[data-browser-file-input]');
    if (!paneElement || !canvas || !video || !inputSurface || !viewport || state.browserConnections.has(paneId)) return;
    const context = canvas.getContext('2d', { alpha: false });
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let socket;
    let disposed = false;
    let reconnectTimer = 0;
    let reconnectDelay = 500;
    let frameNumber = 0;
    let pendingNavigation = '';
    let selectedText = '';
    let hasFrame = false;
    let resizeFrame = 0;
    let paneZoomKeydown = null;
    let rtcPeer = null;
    let rtcPeerId = '';
    let streamMode = 'jpeg';
    let remoteViewport = browserViewportSize(viewport);
    let pendingRtcCandidates = [];
    let pendingRtcPeerId = '';
    const activeTouches = new Map();
    const hideContextMenu = () => { if (contextMenu) contextMenu.hidden = true; };
    const closeContextMenu = (event) => {
      if (!contextMenu?.contains(event.target)) hideContextMenu();
    };
    document.addEventListener('pointerdown', closeContextMenu);
    const updateAudio = (enabled = state.browserAudioEnabled) => {
      const button = paneElement.querySelector('[data-browser-audio-toggle]');
      const available = streamMode === 'webrtc' && video.srcObject && video.srcObject.getAudioTracks().length > 0;
      video.muted = !enabled;
      if (!button) return;
      button.disabled = !available;
      button.classList.toggle('active', available && enabled);
      button.setAttribute('aria-pressed', String(available && enabled));
      button.setAttribute('aria-label', available && enabled ? 'Mute browser audio' : 'Enable browser audio');
      button.title = available ? (enabled ? 'Browser audio on' : 'Browser audio off') : 'Audio unavailable in JPEG fallback';
      button.innerHTML = fileActionIcon(available && enabled ? 'volume' : 'volume-off');
      if (available && enabled) video.play().catch(() => {});
    };
    const closeRtcPeer = () => {
      rtcPeer?.close();
      rtcPeer = null;
      rtcPeerId = '';
      pendingRtcCandidates = [];
      pendingRtcPeerId = '';
      if (video.srcObject) {
        video.srcObject = null;
      }
    };
    const connection = {
      send(message) {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
        else if (message.type === 'navigate') pendingNavigation = message.url;
      },
      setAudio(enabled) {
        updateAudio(enabled);
      },
      dispose() {
        disposed = true;
        clearTimeout(reconnectTimer);
        window.clearTimeout(state.browserZoomTimers.get(paneId));
        state.browserZoomTimers.delete(paneId);
        cancelAnimationFrame(resizeFrame);
        document.removeEventListener('pointerdown', closeContextMenu);
        paneElement.removeEventListener('keydown', paneZoomKeydown, true);
        resizeObserver.disconnect();
        closeRtcPeer();
        socket?.close();
      }
    };
    state.browserConnections.set(paneId, connection);

    paneZoomKeydown = (event) => {
      const shortcut = (event.ctrlKey || event.metaKey) ? event.key.toLowerCase() : '';
      const delta = shortcut === '+' || shortcut === '=' ? 0.1 : shortcut === '-' ? -0.1 : 0;
      if (!delta && shortcut !== '0') return;
      event.preventDefault();
      event.stopPropagation();
      connection.send(shortcut === '0' ? { type: 'zoom', reset: true } : { type: 'zoom', delta });
      showBrowserZoomPopover(paneId);
    };
    paneElement.addEventListener('keydown', paneZoomKeydown, true);

    const sendResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        const size = browserViewportSize(viewport);
        connection.send({
          type: 'resize',
          width: size.width,
          height: size.height,
          deviceScaleFactor: Math.max(1, Math.min(2, window.devicePixelRatio || 1))
        });
      });
    };
    const resizeObserver = new ResizeObserver(sendResize);
    resizeObserver.observe(viewport);

    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(`${protocol}//${location.host}/ws?mode=browser&paneId=${encodeURIComponent(paneId)}&token=${encodeURIComponent(state.token)}`);
      socket.onopen = () => {
        reconnectDelay = 500;
        status.textContent = 'Loading…';
        const size = browserViewportSize(viewport);
        connection.send({
          type: 'clientCapabilities',
          webrtc: typeof RTCPeerConnection === 'function',
          deviceMode: isMobileLayout() ? 'mobile' : 'desktop',
          width: size.width,
          height: size.height,
          deviceScaleFactor: Math.max(1, Math.min(2, window.devicePixelRatio || 1))
        });
        if (pendingNavigation) {
          connection.send({ type: 'navigate', url: pendingNavigation });
          pendingNavigation = '';
        }
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'frame') {
          remoteViewport = {
            width: Number(message.viewportWidth) || remoteViewport.width,
            height: Number(message.viewportHeight) || remoteViewport.height
          };
          const currentFrame = ++frameNumber;
          const image = new Image();
          image.onload = () => {
            if (disposed || currentFrame !== frameNumber) return;
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            context.drawImage(image, 0, 0);
            hasFrame = true;
            status.hidden = true;
            if (streamMode !== 'webrtc') {
              canvas.hidden = false;
              video.hidden = true;
            }
          };
          image.src = `data:image/jpeg;base64,${message.data}`;
        } else if (message.type === 'webrtcOffer') {
          const queuedCandidates = pendingRtcPeerId === message.peerId ? pendingRtcCandidates.slice() : [];
          closeRtcPeer();
          rtcPeerId = message.peerId;
          pendingRtcPeerId = message.peerId;
          pendingRtcCandidates = queuedCandidates;
          remoteViewport = {
            width: Number(message.viewportWidth) || remoteViewport.width,
            height: Number(message.viewportHeight) || remoteViewport.height
          };
          rtcPeer = new RTCPeerConnection({ iceServers: [] });
          rtcPeer.onicecandidate = (candidateEvent) => {
            if (candidateEvent.candidate) connection.send({
              type: 'rtcIceCandidate', peerId: rtcPeerId, candidate: candidateEvent.candidate
            });
          };
          rtcPeer.ontrack = (trackEvent) => {
            const stream = trackEvent.streams[0] || new MediaStream([trackEvent.track]);
            if (video.srcObject !== stream) video.srcObject = stream;
            video.hidden = false;
            canvas.hidden = true;
            video.play().catch(() => {});
            updateAudio();
          };
          rtcPeer.setRemoteDescription(message.description).then(async () => {
            for (const candidate of pendingRtcCandidates.splice(0)) await rtcPeer.addIceCandidate(candidate);
            const answer = await rtcPeer.createAnswer();
            await rtcPeer.setLocalDescription(answer);
            connection.send({ type: 'rtcAnswer', peerId: rtcPeerId, description: rtcPeer.localDescription });
          }).catch(() => {});
        } else if (message.type === 'webrtcIceCandidate') {
          if (!message.candidate || (rtcPeerId && message.peerId !== rtcPeerId)) return;
          if (!rtcPeerId) pendingRtcPeerId = message.peerId;
          if (rtcPeer?.remoteDescription) rtcPeer.addIceCandidate(message.candidate).catch(() => {});
          else pendingRtcCandidates.push(message.candidate);
        } else if (message.type === 'streamMode') {
          streamMode = message.mode;
          paneElement.dataset.streamMode = streamMode;
          if (streamMode === 'webrtc') {
            video.hidden = false;
            canvas.hidden = true;
            status.hidden = true;
          } else if (streamMode === 'jpeg') {
            closeRtcPeer();
            video.hidden = true;
            canvas.hidden = false;
            if (message.reason && message.reason !== 'Checking WebRTC support.') {
              status.title = message.reason;
            }
          }
          updateAudio();
        } else if (message.type === 'viewportOwner') {
          paneElement.dataset.viewportOwner = message.mine ? 'true' : 'false';
        } else if (message.type === 'navigation') {
          const found = findPaneState(paneId);
          if (found) {
            const tab = found.pane.browserTabs?.find((candidate) => candidate.id === message.tabId);
            if (tab) tab.url = message.url;
            if (found.pane.activeBrowserTabId === message.tabId) found.pane.url = message.url;
          }
          state.config.browser = { ...state.config.browser, history: message.history || [] };
          const input = paneElement.querySelector('[name="url"]');
          if (input) input.value = message.url;
          updateBrowserMenu(paneId);
        } else if (message.type === 'status') {
          const loading = message.state === 'loading';
          paneElement.classList.toggle('browser-loading', loading);
          paneElement.querySelector('[data-browser-refresh]').hidden = loading;
          paneElement.querySelector('[data-browser-stop]').hidden = !loading;
          status.hidden = hasFrame || loading;
          status.textContent = loading ? 'Loading…' : 'Connected';
        } else if (message.type === 'error') {
          status.hidden = false;
          status.textContent = message.message;
        } else if (message.type === 'selection') {
          selectedText = message.text || '';
        } else if (message.type === 'copy') {
          selectedText = message.text || '';
          copyBrowserText(selectedText);
        } else if (message.type === 'tabs') {
          const found = findPaneState(paneId);
          if (found) {
            found.pane.browserTabs = message.tabs || [];
            found.pane.activeBrowserTabId = message.activeTabId;
            found.pane.url = activeBrowserTab(found.pane).url || '';
            updateBrowserTabStrip(paneId);
            sendResize();
          }
        } else if (message.type === 'findResult') {
          const result = paneElement.querySelector('[data-browser-find-result]');
          if (result) result.textContent = message.empty ? '' : message.found ? 'Match' : 'No match';
        } else if (message.type === 'dialog') {
          handleBrowserDialog(connection, message);
        } else if (message.type === 'fileChooser') {
          fileInput.multiple = Boolean(message.multiple);
          fileInput.dataset.tabId = message.tabId;
          fileInput.dataset.nodeId = message.nodeId;
          fileInput.value = '';
          fileInput.click();
        } else if (message.type === 'download') {
          updateBrowserDownload(paneElement, message.download);
        }
      };
      socket.onclose = (event) => {
        if (disposed) return;
        closeRtcPeer();
        streamMode = 'jpeg';
        updateAudio();
        if (event.code === 1008 && event.reason === 'Login required') {
          clearToken();
          renderLogin();
          return;
        }
        status.hidden = false;
        status.textContent = 'Reconnecting…';
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 10000);
      };
    };

    const pointerPosition = (event) => {
      const rect = inputSurface.getBoundingClientRect();
      const contentWidth = Math.max(1, remoteViewport.width);
      const contentHeight = Math.max(1, remoteViewport.height);
      return {
        x: Math.max(0, Math.min(contentWidth, (event.clientX - rect.left) / Math.max(1, rect.width) * contentWidth)),
        y: Math.max(0, Math.min(contentHeight, (event.clientY - rect.top) / Math.max(1, rect.height) * contentHeight))
      };
    };
    const sendMouse = (eventName, event, extra = {}) => {
      const point = pointerPosition(event);
      connection.send({ type: 'mouse', event: eventName, ...point, modifiers: browserModifiers(event), ...extra });
    };
    const touchPoints = () => [...activeTouches.values()];
    const updateTouch = (event) => {
      const point = pointerPosition(event);
      activeTouches.set(event.pointerId, {
        id: event.pointerId,
        ...point,
        radiusX: Math.max(1, event.width / 2),
        radiusY: Math.max(1, event.height / 2),
        force: event.pressure || .5
      });
    };
    inputSurface.onpointerdown = (event) => {
      event.preventDefault();
      hideContextMenu();
      inputSurface.setPointerCapture(event.pointerId);
      inputSurface.focus({ preventScroll: true });
      if (event.button === 2) return;
      if (event.pointerType === 'touch') {
        updateTouch(event);
        connection.send({ type: 'touch', event: 'touchStart', touchPoints: touchPoints(), modifiers: browserModifiers(event) });
        return;
      }
      sendMouse('mousePressed', event, { button: event.button === 2 ? 'right' : event.button === 1 ? 'middle' : 'left', buttons: event.buttons, clickCount: event.detail || 1 });
    };
    inputSurface.onpointermove = (event) => {
      if (event.pointerType === 'touch') {
        if (!activeTouches.has(event.pointerId)) return;
        updateTouch(event);
        connection.send({ type: 'touch', event: 'touchMove', touchPoints: touchPoints(), modifiers: browserModifiers(event) });
        return;
      }
      sendMouse('mouseMoved', event, { button: event.buttons & 1 ? 'left' : 'none', buttons: event.buttons });
    };
    inputSurface.onpointerup = (event) => {
      if (event.pointerType === 'touch') {
        activeTouches.delete(event.pointerId);
        connection.send({ type: 'touch', event: 'touchEnd', touchPoints: touchPoints(), modifiers: browserModifiers(event) });
        if (isMobileLayout()) keyboard.focus({ preventScroll: true });
        return;
      }
      if (event.button !== 2) {
        sendMouse('mouseReleased', event, { button: event.button === 1 ? 'middle' : 'left', buttons: 0, clickCount: event.detail || 1 });
        connection.send({ type: 'selection' });
      }
      if (isMobileLayout()) keyboard.focus({ preventScroll: true });
    };
    inputSurface.onpointercancel = (event) => {
      if (event.pointerType !== 'touch') return;
      activeTouches.delete(event.pointerId);
      connection.send({ type: 'touch', event: 'touchCancel', touchPoints: touchPoints(), modifiers: browserModifiers(event) });
    };
    inputSurface.oncontextmenu = (event) => {
      event.preventDefault();
      if (!contextMenu) return;
      const rect = viewport.getBoundingClientRect();
      contextMenu.style.left = `${Math.max(4, Math.min(event.clientX - rect.left, rect.width - 120))}px`;
      contextMenu.style.top = `${Math.max(4, Math.min(event.clientY - rect.top, rect.height - 104))}px`;
      contextMenu.hidden = false;
    };
    inputSurface.onwheel = (event) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        connection.send({ type: 'zoom', delta: event.deltaY < 0 ? 0.1 : -0.1 });
        showBrowserZoomPopover(paneId);
        return;
      }
      sendMouse('mouseWheel', event, { button: 'none', deltaX: event.deltaX, deltaY: event.deltaY });
    };
    const sendKey = (type, event, text = '') => connection.send({
      type: 'key', event: type, key: event.key, code: event.code, text,
      windowsVirtualKeyCode: browserKeyCode(event), modifiers: browserModifiers(event)
    });
    const keydown = (event) => {
      const shortcut = (event.ctrlKey || event.metaKey) ? event.key.toLowerCase() : '';
      if (shortcut === 'l') {
        event.preventDefault();
        const input = paneElement.querySelector('[name="url"]');
        input.focus();
        input.select();
        return;
      }
      if (shortcut === 'f') {
        event.preventDefault();
        showBrowserFind(paneElement);
        return;
      }
      if (shortcut === 't') {
        event.preventDefault();
        connection.send({ type: 'newTab', emulationMode: isMobileLayout() ? 'mobile' : 'desktop' });
        return;
      }
      if (shortcut === 'w') {
        event.preventDefault();
        const found = findPaneState(paneId);
        connection.send({ type: 'closeTab', tabId: found?.pane.activeBrowserTabId });
        return;
      }
      if (shortcut === 'tab') {
        event.preventDefault();
        const found = findPaneState(paneId);
        const tabs = found?.pane.browserTabs || [];
        const index = tabs.findIndex((tab) => tab.id === found?.pane.activeBrowserTabId);
        const offset = event.shiftKey ? -1 : 1;
        const next = tabs[(index + offset + tabs.length) % tabs.length];
        if (next) connection.send({ type: 'activateTab', tabId: next.id });
        return;
      }
      if (shortcut === 'c') {
        event.preventDefault();
        if (selectedText) copyBrowserText(selectedText);
        else connection.send({ type: 'copy' });
        return;
      }
      if (shortcut === 'v') {
        if (pasteBrowserText(connection, keyboard)) event.preventDefault();
        return;
      }
      if (shortcut === 'a') {
        event.preventDefault();
        connection.send({ type: 'selectAll' });
        return;
      }
      event.preventDefault();
      sendKey('keyDown', event, event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey ? event.key : '');
    };
    const keyup = (event) => {
      event.preventDefault();
      sendKey('keyUp', event);
    };
    inputSurface.onkeydown = keydown;
    inputSurface.onkeyup = keyup;
    keyboard.onkeydown = (event) => {
      if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) return;
      keydown(event);
    };
    keyboard.onkeyup = keyup;
    keyboard.onbeforeinput = (event) => {
      if (event.data) connection.send({ type: 'text', text: event.data });
      event.preventDefault();
    };
    keyboard.onpaste = (event) => {
      const text = event.clipboardData?.getData('text/plain') || '';
      if (text) connection.send({ type: 'text', text });
      event.preventDefault();
    };
    keyboard.oninput = () => { keyboard.value = ''; };
    contextMenu?.querySelector('[data-browser-copy]')?.addEventListener('click', () => {
      hideContextMenu();
      if (selectedText) copyBrowserText(selectedText);
      else connection.send({ type: 'copy' });
    });
    contextMenu?.querySelector('[data-browser-paste]')?.addEventListener('click', () => {
      hideContextMenu();
      pasteBrowserText(connection, keyboard);
    });
    contextMenu?.querySelector('[data-browser-select-all]')?.addEventListener('click', () => {
      hideContextMenu();
      connection.send({ type: 'selectAll' });
      inputSurface.focus();
    });
    fileInput.onchange = () => uploadBrowserFiles(fileInput);
    fileInput.oncancel = () => uploadBrowserFiles(fileInput);
    connect();
  }

  function copyBrowserText(text) {
    if (!text) {
      showToast('No text selected.');
      return;
    }
    const fallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) showToast('Clipboard access is unavailable.');
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(fallback);
    else fallback();
  }

  function pasteBrowserText(connection, keyboard) {
    if (navigator.clipboard?.readText) {
      navigator.clipboard.readText().then(
        (text) => { if (text) connection.send({ type: 'text', text }); },
        () => keyboard.focus()
      );
      return true;
    }
    const needsFocus = document.activeElement !== keyboard;
    keyboard.focus();
    if (needsFocus) showToast('Press Ctrl+V again to paste.');
    return false;
  }

  function handleBrowserDialog(connection, message) {
    if (message.dialogType === 'alert') {
      window.alert(message.message);
      connection.send({ type: 'dialog', accept: true });
      return;
    }
    if (message.dialogType === 'confirm') {
      connection.send({ type: 'dialog', accept: window.confirm(message.message) });
      return;
    }
    const value = window.prompt(message.message, message.defaultPrompt || '');
    connection.send({ type: 'dialog', accept: value !== null, promptText: value || '' });
  }

  async function uploadBrowserFiles(input) {
    const form = new FormData();
    for (const file of input.files || []) form.append('files', file, file.name);
    try {
      const response = await fetch(`/api/browser/upload?tabId=${encodeURIComponent(input.dataset.tabId)}&nodeId=${encodeURIComponent(input.dataset.nodeId)}`, {
        method: 'POST',
        headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
        body: form
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Upload failed.');
    } catch (error) {
      showToast(error.message);
    }
  }

  function updateBrowserDownload(paneElement, download) {
    const status = paneElement.querySelector('[data-browser-download-status]');
    if (!status || !download) return;
    const percent = download.totalBytes > 0
      ? `${Math.min(100, Math.round(download.receivedBytes / download.totalBytes * 100))}%`
      : 'Downloading';
    status.hidden = false;
    status.textContent = download.state === 'completed' ? `${download.filename} · Ready` : `${download.filename} · ${percent}`;
    if (download.state === 'completed') {
      fetchBrowserDownload(download).finally(() => setTimeout(() => { status.hidden = true; }, 2400));
    } else if (download.state === 'canceled') {
      status.textContent = `${download.filename} · Canceled`;
    }
  }

  async function fetchBrowserDownload(download) {
    try {
      const response = await fetch(`/api/browser/downloads/${encodeURIComponent(download.guid)}`, {
        headers: state.token ? { Authorization: `Bearer ${state.token}` } : {}
      });
      if (!response.ok) throw new Error('Download is not ready.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = download.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      showToast(error.message);
    }
  }

  function disposeBrowsers() {
    for (const connection of state.browserConnections.values()) connection.dispose();
    state.browserConnections.clear();
  }

  async function loadNotepadTab(paneId, tabId, filePath) {
    const container = document.querySelector(`[data-pane="${paneId}"]`);
    if (!filePath) {
      wireNotepadPane(container);
      return;
    }
    const data = notepadTabData(tabId);
    if (data.loadedPath === filePath && !data.error) {
      wireNotepadPane(container);
      return;
    }
    try {
      const result = await api(`/api/files/text?path=${encodeURIComponent(filePath)}`);
      Object.assign(data, { content: result.content, encoding: result.encoding, loadedPath: result.path, dirty: false, error: '' });
      const found = findPaneState(paneId);
      const tab = found?.pane.notepadTabs?.find((candidate) => candidate.id === tabId);
      if (tab) tab.path = result.path;
    } catch (error) {
      data.error = error.message;
    }
    updateNotepadPane(paneId);
  }

  function updateNotepadPane(paneId) {
    const found = findPaneState(paneId);
    const container = document.querySelector(`[data-pane="${paneId}"]`);
    const existing = container?.querySelector('.notepad-pane');
    if (!found || !existing) return;
    existing._notepadResizeObserver?.disconnect();
    existing.outerHTML = renderNotepadPane(found.pane);
    updateNotepadTabStrip(paneId);
    wireNotepadPane(container);
  }

  function updateNotepadTabStrip(paneId) {
    const found = findPaneState(paneId);
    const container = document.querySelector(`[data-pane="${paneId}"]`);
    const strip = container?.querySelector('[data-notepad-tab-strip]');
    if (!found || !strip) return;
    strip.innerHTML = `<span class="pane-kind-icon" aria-hidden="true">${fileActionIcon('notepad')}</span>${renderNotepadTabs(found.pane)}`;
    wireNotepadTabs(container, paneId);
  }

  async function activateNotepadTabClient(paneId, tabId) {
    const found = findPaneState(paneId);
    if (!found || found.pane.activeNotepadTabId === tabId) return;
    try {
      await api(`/api/panes/${paneId}/notepad/tabs/${tabId}/activate`, { method: 'POST' });
    } catch (error) {
      showToast(error.message);
      return;
    }
    found.pane.activeNotepadTabId = tabId;
    const tab = found.pane.notepadTabs.find((candidate) => candidate.id === tabId);
    updateNotepadPane(paneId);
    if (tab?.path) await loadNotepadTab(paneId, tabId, tab.path);
  }

  async function addNotepadTab(paneId, filePath = '') {
    try {
      const result = await api(`/api/panes/${paneId}/notepad/tabs`, {
        method: 'POST', body: JSON.stringify({ path: filePath })
      });
      const found = findPaneState(paneId);
      if (!found) return;
      found.pane.notepadTabs.push(result.tab);
      found.pane.activeNotepadTabId = result.tab.id;
      updateNotepadPane(paneId);
      if (result.tab.path) await loadNotepadTab(paneId, result.tab.id, result.tab.path);
    } catch (error) {
      showToast(error.message);
    }
  }

  async function closeNotepadTabClient(paneId, tabId) {
    const found = findPaneState(paneId);
    if (!found) return;
    if (notepadTabData(tabId).dirty && !window.confirm('This file has unsaved changes. Close anyway?')) {
      return;
    }
    try {
      await api(`/api/panes/${paneId}/notepad/tabs/${tabId}`, { method: 'DELETE' });
    } catch (error) {
      showToast(error.message);
      return;
    }
    const tabs = found.pane.notepadTabs;
    const index = tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;
    window.clearTimeout(state.notepadAutosaveTimers.get(tabId));
    state.notepadAutosaveTimers.delete(tabId);
    if (tabs.length === 1) {
      tabs[0] = { id: tabId, title: 'Untitled', path: '' };
      delete state.notepadTabData[tabId];
    } else {
      tabs.splice(index, 1);
      delete state.notepadTabData[tabId];
    }
    if (!tabs.some((tab) => tab.id === found.pane.activeNotepadTabId)) {
      found.pane.activeNotepadTabId = tabs[Math.min(index, tabs.length - 1)].id;
    }
    updateNotepadPane(paneId);
  }

  async function setNotepadTabPath(paneId, tabId, filePath) {
    try {
      await api(`/api/panes/${paneId}/notepad/tabs/${tabId}`, {
        method: 'PATCH', body: JSON.stringify({ path: filePath })
      });
      const found = findPaneState(paneId);
      const tab = found?.pane.notepadTabs?.find((candidate) => candidate.id === tabId);
      if (tab) tab.path = filePath;
      notepadTabData(tabId).loadedPath = '';
      if (found?.pane.activeNotepadTabId === tabId) {
        await loadNotepadTab(paneId, tabId, filePath);
      } else {
        updateNotepadTabStrip(paneId);
      }
    } catch (error) {
      showToast(error.message);
    }
  }

  function editNotepadTabPath(paneId, tabId) {
    const tabElement = document.querySelector(`[data-notepad-tab="${tabId}"]`);
    const found = findPaneState(paneId);
    const tab = found?.pane.notepadTabs?.find((candidate) => candidate.id === tabId);
    const label = tabElement?.querySelector('.notepad-tab-label');
    if (!label || !tab || tabElement.querySelector('input')) return;
    const input = document.createElement('input');
    input.className = 'notepad-tab-path-input';
    input.setAttribute('aria-label', 'Notepad file path');
    input.value = tab.path || tab.title;
    label.replaceWith(input);
    input.focus();
    input.select();
    input.addEventListener('click', (event) => event.stopPropagation());
    let committed = false;
    const commit = async () => {
      if (committed) return;
      committed = true;
      const filePath = input.value.trim();
      if (filePath && filePath !== (tab.path || tab.title)) {
        await setNotepadTabPath(paneId, tabId, filePath);
      } else {
        updateNotepadTabStrip(paneId);
      }
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        committed = true;
        updateNotepadTabStrip(paneId);
      }
    });
    input.addEventListener('blur', commit);
  }

  function wireNotepadTabs(paneElement, paneId) {
    paneElement.querySelectorAll('[data-notepad-tab]').forEach((tabElement) => {
      tabElement.onclick = (event) => {
        if (event.target.closest('[data-notepad-close-tab]')) return;
        activateNotepadTabClient(paneId, tabElement.dataset.notepadTab);
      };
      tabElement.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateNotepadTabClient(paneId, tabElement.dataset.notepadTab);
        }
      };
      tabElement.ondblclick = (event) => {
        event.stopPropagation();
        editNotepadTabPath(paneId, tabElement.dataset.notepadTab);
      };
    });
    paneElement.querySelectorAll('[data-notepad-close-tab]').forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        closeNotepadTabClient(paneId, button.dataset.notepadCloseTab);
      };
    });
    const newTabButton = paneElement.querySelector('[data-notepad-new-tab]');
    if (newTabButton) newTabButton.onclick = () => addNotepadTab(paneId, '');
  }

  function paneTabKind(pane) {
    return pane.type === 'files' ? 'files' : 'terminal';
  }

  function updatePaneTabStrip(paneId) {
    const found = findPaneState(paneId);
    const strip = document.querySelector(`[data-pane="${paneId}"] [data-pane-tab-strip]`);
    if (!found || !strip) return;
    strip.innerHTML = renderPaneTabs(found.pane);
    wirePaneTabs(strip, paneId);
  }

  function showActiveTerminalTab(paneId) {
    const found = findPaneState(paneId);
    const paneElement = document.querySelector(`[data-pane="${paneId}"]`);
    if (!found || !paneElement) return;
    const activeId = activePaneTabId(found.pane);
    paneElement.querySelectorAll('[data-terminal-tab]').forEach((element) => {
      element.hidden = element.dataset.terminalTab !== activeId;
    });
    mountTerminal(paneId, activeId);
    const terminal = state.terminals.get(activeId);
    terminal?.sendResize();
    terminal?.term.focus();
  }

  async function activatePaneTabClient(paneId, tabId) {
    const found = findPaneState(paneId);
    if (!found || activePaneTabId(found.pane) === tabId) return;
    try {
      await api(`/api/panes/${paneId}/${paneTabKind(found.pane)}/tabs/${tabId}/activate`, { method: 'POST' });
    } catch (error) {
      showToast(error.message);
      return;
    }
    if (found.pane.type === 'files') {
      found.pane.activeFilesTabId = tabId;
      found.pane.path = found.pane.filesTabs.find((tab) => tab.id === tabId)?.path || '';
      updatePaneTabStrip(paneId);
      await loadFilesPane(found.pane);
    } else {
      found.pane.activeTerminalTabId = tabId;
      updatePaneTabStrip(paneId);
      showActiveTerminalTab(paneId);
    }
  }

  async function addPaneTab(paneId) {
    const found = findPaneState(paneId);
    if (!found) return;
    let result;
    try {
      result = await api(`/api/panes/${paneId}/${paneTabKind(found.pane)}/tabs`, {
        method: 'POST', body: JSON.stringify({})
      });
    } catch (error) {
      showToast(error.message);
      return;
    }
    if (found.pane.type === 'files') {
      found.pane.filesTabs.push(result.tab);
      found.pane.activeFilesTabId = result.tab.id;
      found.pane.path = result.tab.path;
      updatePaneTabStrip(paneId);
      await loadFilesPane(found.pane);
      return;
    }
    found.pane.terminalTabs.push(result.tab);
    found.pane.activeTerminalTabId = result.tab.id;
    const surfaces = document.querySelectorAll(`[data-pane="${paneId}"] [data-terminal-tab]`);
    surfaces[surfaces.length - 1]?.insertAdjacentHTML('afterend', `<div class="terminal" id="terminal-${result.tab.id}" data-terminal-tab="${result.tab.id}" hidden></div>`);
    updatePaneTabStrip(paneId);
    showActiveTerminalTab(paneId);
  }

  async function closePaneTabClient(paneId, tabId) {
    const found = findPaneState(paneId);
    if (!found) return;
    let result;
    try {
      result = await api(`/api/panes/${paneId}/${paneTabKind(found.pane)}/tabs/${tabId}`, { method: 'DELETE' });
    } catch (error) {
      showToast(error.message);
      return;
    }
    const tabs = paneTabs(found.pane);
    const index = tabs.findIndex((tab) => tab.id === tabId);
    if (index === -1) return;
    if (found.pane.type === 'files') {
      if (tabs.length === 1) {
        tabs[0] = { id: tabId, path: '' };
      } else {
        tabs.splice(index, 1);
      }
      if (!tabs.some((tab) => tab.id === found.pane.activeFilesTabId)) {
        found.pane.activeFilesTabId = tabs[Math.min(index, tabs.length - 1)].id;
      }
      found.pane.path = tabs.find((tab) => tab.id === found.pane.activeFilesTabId)?.path || '';
      updatePaneTabStrip(paneId);
      await loadFilesPane(found.pane);
      return;
    }
    if (result.tab) {
      tabs[index] = result.tab;
    } else {
      tabs.splice(index, 1);
    }
    if (!tabs.some((tab) => tab.id === found.pane.activeTerminalTabId)) {
      found.pane.activeTerminalTabId = tabs[Math.min(index, tabs.length - 1)].id;
    }
    disposeTerminal(tabId);
    const surface = document.getElementById(`terminal-${tabId}`);
    if (result.tab && surface) {
      surface.id = `terminal-${result.tab.id}`;
      surface.dataset.terminalTab = result.tab.id;
      surface.innerHTML = '';
    } else {
      surface?.remove();
    }
    updatePaneTabStrip(paneId);
    showActiveTerminalTab(paneId);
  }

  function renamePaneTab(paneId, tabId) {
    const found = findPaneState(paneId);
    const tab = found?.pane.terminalTabs?.find((candidate) => candidate.id === tabId);
    const tabElement = document.querySelector(`[data-pane="${paneId}"] [data-pane-tab="${tabId}"]`);
    const label = tabElement?.querySelector('.pane-tab-label');
    if (!label || !tab || tabElement.querySelector('input')) return;
    const input = document.createElement('input');
    input.className = 'pane-tab-rename-input';
    input.setAttribute('aria-label', 'Terminal tab name');
    input.value = tab.title;
    label.replaceWith(input);
    input.focus();
    input.select();
    input.addEventListener('click', (event) => event.stopPropagation());
    let committed = false;
    const commit = async () => {
      if (committed) return;
      committed = true;
      const title = input.value.trim();
      if (title && title !== tab.title) {
        try {
          await api(`/api/panes/${paneId}/terminal/tabs/${tabId}`, {
            method: 'PATCH', body: JSON.stringify({ title })
          });
          tab.title = title;
        } catch (error) {
          showToast(error.message);
        }
      }
      updatePaneTabStrip(paneId);
    };
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        commit();
      } else if (event.key === 'Escape') {
        committed = true;
        updatePaneTabStrip(paneId);
      }
    });
    input.addEventListener('blur', commit);
  }

  function wirePaneTabs(root, paneId) {
    root.querySelectorAll('[data-pane-tab]').forEach((tabElement) => {
      tabElement.onclick = (event) => {
        if (event.target.closest('[data-pane-close-tab]')) return;
        activatePaneTabClient(paneId, tabElement.dataset.paneTab);
      };
      tabElement.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activatePaneTabClient(paneId, tabElement.dataset.paneTab);
        }
      };
      tabElement.ondblclick = (event) => {
        event.stopPropagation();
        renamePaneTab(paneId, tabElement.dataset.paneTab);
      };
    });
    root.querySelectorAll('[data-pane-close-tab]').forEach((button) => {
      button.onclick = (event) => {
        event.stopPropagation();
        closePaneTabClient(paneId, button.dataset.paneCloseTab);
      };
    });
    root.querySelector('[data-pane-new-tab]')?.addEventListener('click', () => addPaneTab(paneId));
  }

  function wirePaneTabStrips(root) {
    findAll(root, '[data-pane-tab-strip]').forEach((strip) => wirePaneTabs(strip, strip.dataset.paneTitle));
  }

  function localPathDirectory(filePath) {
    const value = String(filePath || '').replace(/[\\/]+$/, '');
    const separator = Math.max(value.lastIndexOf('\\'), value.lastIndexOf('/'));
    if (separator < 0) return '';
    if (separator === 2 && /^[A-Za-z]:/.test(value)) return value.slice(0, 3);
    return value.slice(0, separator);
  }

  function joinLocalPath(directory, name) {
    return `${String(directory || '').replace(/[\\/]+$/, '')}\\${name}`;
  }

  function openNotepadSaveDialog(paneId, tabId) {
    return new Promise((resolve) => {
      document.querySelector('.app-modal-overlay')?.remove();
      const found = findPaneState(paneId);
      const tab = found?.pane.notepadTabs?.find((candidate) => candidate.id === tabId);
      if (!found || !tab) {
        resolve(null);
        return;
      }
      const previousFocus = document.activeElement;
      const startLocation = tab.path ? localPathDirectory(tab.path) : found.pane.cwd;
      const startName = notepadTabLabel(tab) === 'Untitled' ? 'Untitled.txt' : notepadTabLabel(tab);
      const overlay = document.createElement('div');
      overlay.className = 'app-modal-overlay';
      overlay.innerHTML = `
        <div class="app-modal notepad-save-dialog" role="dialog" aria-modal="true" aria-label="Save file">
          <header class="app-modal-header">Save file</header>
          <div class="app-modal-body">
            <div class="notepad-save-location">
              <button class="file-command-button" type="button" data-notepad-save-up aria-label="Up one level" title="Up one level">${fileActionIcon('up')}</button>
              <input type="text" data-notepad-save-location value="${escapeAttr(startLocation)}" aria-label="Save location" autocomplete="off" autocapitalize="off" spellcheck="false">
              <button class="file-command-button" type="button" data-notepad-save-refresh aria-label="Refresh" title="Refresh">${fileActionIcon('refresh')}</button>
            </div>
            <div class="notepad-save-directory-list" data-notepad-save-directories role="listbox" aria-label="Folders"></div>
            <label class="app-modal-field">
              <span>File name</span>
              <input data-notepad-save-name value="${escapeAttr(startName)}" autocomplete="off" autocapitalize="off" spellcheck="false">
            </label>
            <div class="app-modal-error" data-modal-error role="alert"></div>
          </div>
          <footer class="app-modal-footer">
            <button type="button" class="secondary" data-modal-cancel>Cancel</button>
            <button type="button" class="primary" data-modal-confirm>Save</button>
          </footer>
        </div>`;
      document.body.appendChild(overlay);
      const locationInput = overlay.querySelector('[data-notepad-save-location]');
      const nameInput = overlay.querySelector('[data-notepad-save-name]');
      const list = overlay.querySelector('[data-notepad-save-directories]');
      const errorElement = overlay.querySelector('[data-modal-error]');
      const confirmButton = overlay.querySelector('[data-modal-confirm]');
      const upButton = overlay.querySelector('[data-notepad-save-up]');
      let currentLocation = startLocation;
      let parentLocation = '';
      let loading = false;
      let locationError = '';

      const validate = () => {
        const error = locationError || validateFileName(nameInput.value) || (!currentLocation ? 'Choose a folder.' : '');
        errorElement.textContent = error;
        confirmButton.disabled = Boolean(error) || loading;
        return !error && !loading;
      };
      const close = (result) => {
        document.removeEventListener('keydown', onKey, true);
        overlay.remove();
        previousFocus?.focus?.();
        resolve(result);
      };
      const renderLocations = (items) => {
        list.innerHTML = items.length ? items.map((item) => `
          <button type="button" role="option" data-notepad-save-directory="${escapeAttr(item.path)}" title="${escapeAttr(item.path)}">
            ${fileActionIcon(item.drive ? 'drive' : 'folder')}
            <span>${escapeHtml(item.name)}</span>
          </button>`).join('') : '<div class="notepad-save-empty">No folders here</div>';
        list.querySelectorAll('[data-notepad-save-directory]').forEach((button) => {
          button.onclick = () => loadLocation(button.dataset.notepadSaveDirectory);
        });
      };
      const loadLocation = async (location) => {
        loading = true;
        locationError = '';
        list.innerHTML = '<div class="notepad-save-empty">Loading…</div>';
        validate();
        try {
          if (!location) {
            const result = await api('/api/files/drives');
            currentLocation = '';
            parentLocation = '';
            locationInput.value = '';
            renderLocations((result.drives || []).map((drive) => ({ ...drive, drive: true })));
          } else {
            const result = await api(`/api/files?path=${encodeURIComponent(location)}`);
            currentLocation = result.path;
            parentLocation = result.parent || '';
            locationInput.value = currentLocation;
            renderLocations((result.entries || []).filter((entry) => entry.type === 'directory'));
          }
        } catch (error) {
          currentLocation = '';
          parentLocation = '';
          locationError = error.message;
          list.innerHTML = '<div class="notepad-save-empty">Location unavailable</div>';
        } finally {
          loading = false;
          upButton.disabled = !currentLocation;
          validate();
        }
      };
      const commit = () => {
        if (validate()) close(joinLocalPath(currentLocation, nameInput.value.trim()));
      };
      const onKey = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close(null);
        } else if (event.key === 'Enter' && event.target === locationInput) {
          event.preventDefault();
          loadLocation(locationInput.value.trim());
        } else if (event.key === 'Enter' && event.target === nameInput) {
          event.preventDefault();
          commit();
        }
      };

      document.addEventListener('keydown', onKey, true);
      overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) close(null);
      });
      upButton.onclick = () => loadLocation(parentLocation);
      overlay.querySelector('[data-notepad-save-refresh]').onclick = () => loadLocation(currentLocation);
      overlay.querySelector('[data-modal-cancel]').onclick = () => close(null);
      confirmButton.onclick = commit;
      nameInput.oninput = validate;
      locationInput.oninput = () => {
        if (locationInput.value.trim() !== currentLocation) {
          currentLocation = '';
          parentLocation = '';
          locationError = 'Press Enter to open this location.';
          validate();
        }
      };
      loadLocation(startLocation);
      nameInput.focus();
      nameInput.select();
    });
  }

  async function saveNotepadTab(paneId, tabId, silent = false) {
    const found = findPaneState(paneId);
    const tab = found?.pane.notepadTabs?.find((candidate) => candidate.id === tabId);
    if (!found || !tab) return;
    const data = notepadTabData(tabId);
    if (!tab.path && silent) {
      try {
        await persistNotepadTabState(paneId, tabId, {
          content: data.content,
          encoding: data.encoding
        });
        data.dirty = false;
        updateNotepadTabStrip(paneId);
      } catch (error) {
        data.error = error.message;
      }
      return;
    }
    let savePath = tab.path;
    if (!savePath) {
      const selectedPath = await openNotepadSaveDialog(paneId, tabId);
      if (!selectedPath) return;
      savePath = selectedPath;
    }
    try {
      const result = await api('/api/files/text', {
        method: 'PUT',
        body: JSON.stringify({ path: savePath, content: data.content, encoding: data.encoding })
      });
      data.loadedPath = result.path;
      data.encoding = result.encoding;
      data.dirty = false;
      data.error = '';
      if (tab.path !== result.path) {
        await api(`/api/panes/${paneId}/notepad/tabs/${tabId}`, {
          method: 'PATCH', body: JSON.stringify({ path: result.path })
        });
        tab.path = result.path;
      }
      updateNotepadPane(paneId);
      if (!silent) showToast('File saved.', 'success');
    } catch (error) {
      if (!silent) showToast(error.message);
    }
  }

  async function persistNotepadTabState(paneId, tabId, updates = {}) {
    const data = notepadTabData(tabId);
    const payload = {
      wrap: data.wrap,
      indentGuides: data.indentGuides,
      autosave: data.autosave,
      fontFamily: data.fontFamily,
      ...updates
    };
    await api(`/api/panes/${paneId}/notepad/tabs/${tabId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    const tab = findNotepadTab(tabId);
    if (tab) Object.assign(tab, payload);
  }

  function scheduleNotepadAutosave(paneId, tabId) {
    window.clearTimeout(state.notepadAutosaveTimers.get(tabId));
    state.notepadAutosaveTimers.set(tabId, window.setTimeout(() => {
      state.notepadAutosaveTimers.delete(tabId);
      saveNotepadTab(paneId, tabId, true);
    }, 1500));
  }

  async function notepadCopySelection(editor) {
    const text = editor.value.slice(editor.selectionStart, editor.selectionEnd);
    if (!text) return '';
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      showToast('Clipboard access is unavailable.');
    }
    return text;
  }

  async function notepadCut(editor) {
    const text = await notepadCopySelection(editor);
    if (!text) return;
    editor.setRangeText('', editor.selectionStart, editor.selectionEnd, 'end');
    editor.dispatchEvent(new Event('input'));
    editor.focus();
  }

  async function notepadPaste(editor) {
    try {
      const text = await navigator.clipboard.readText();
      editor.setRangeText(text, editor.selectionStart, editor.selectionEnd, 'end');
      editor.dispatchEvent(new Event('input'));
      editor.focus();
    } catch (error) {
      showToast('Clipboard access is unavailable.');
    }
  }

  function notepadFindNext(editor, query, backward) {
    if (!query) return false;
    const text = editor.value;
    let index;
    if (backward) {
      index = text.lastIndexOf(query, Math.max(0, editor.selectionStart - 1));
      if (index === -1) index = text.lastIndexOf(query);
    } else {
      index = text.indexOf(query, editor.selectionEnd);
      if (index === -1) index = text.indexOf(query);
    }
    if (index === -1) return false;
    editor.focus();
    editor.setSelectionRange(index, index + query.length);
    return true;
  }

  function setNotepadPopoverOpen(paneElement, popover, open) {
    paneElement.querySelectorAll('.notepad-popover').forEach((candidate) => {
      const candidateOpen = candidate === popover && open;
      candidate.hidden = !candidateOpen;
      candidate.parentElement.querySelector('[aria-expanded]')?.setAttribute('aria-expanded', String(candidateOpen));
      if (candidateOpen && candidate.querySelector('[data-notepad-popover-drag]')) {
        placeNotepadPopover(candidate);
      }
    });
  }

  function closeNotepadPopoversFromOutside(event) {
    document.querySelectorAll('.notepad-font-popover:not([hidden]), .notepad-font-size-popover:not([hidden])').forEach((popover) => {
      const control = popover.closest('.notepad-popover-control');
      if (!control?.contains(event.target)) {
        setNotepadPopoverOpen(popover.closest('.notepad-pane'), popover, false);
      }
    });
  }

  function clampNotepadPopover(popover, left, top) {
    const area = popover.closest('.notepad-pane')?.querySelector('.notepad-editor-shell');
    if (!area) return { left, top };
    const maxLeft = Math.max(area.offsetLeft, area.offsetLeft + area.offsetWidth - popover.offsetWidth);
    const maxTop = Math.max(area.offsetTop, area.offsetTop + area.offsetHeight - popover.offsetHeight);
    return {
      left: Math.max(area.offsetLeft, Math.min(maxLeft, left)),
      top: Math.max(area.offsetTop, Math.min(maxTop, top))
    };
  }

  // The pane canvas is scaled, so client pixels must be divided by the zoom to become pane pixels.
  function placeNotepadPopover(popover) {
    const parent = popover.offsetParent;
    if (!parent || popover.hidden) return null;
    const parentRect = parent.getBoundingClientRect();
    const rect = popover.getBoundingClientRect();
    const scale = parentRect.width / parent.offsetWidth || 1;
    const position = clampNotepadPopover(
      popover,
      (rect.left - parentRect.left) / scale,
      (rect.top - parentRect.top) / scale
    );
    popover.style.transform = 'none';
    popover.style.right = 'auto';
    popover.style.left = `${position.left}px`;
    popover.style.top = `${position.top}px`;
    return { ...position, scale };
  }

  function wireNotepadPopoverDrag(popover) {
    const handle = popover.querySelector('[data-notepad-popover-drag]');
    if (!handle) return;
    handle.onpointerdown = (event) => {
      if (event.button !== 0 || event.target.closest('[data-notepad-popover-close]')) return;
      event.preventDefault();
      const start = placeNotepadPopover(popover);
      if (!start) return;
      const startX = event.clientX;
      const startY = event.clientY;
      handle.setPointerCapture(event.pointerId);
      const onMove = (moveEvent) => {
        if (!handle.hasPointerCapture(moveEvent.pointerId)) return;
        const position = clampNotepadPopover(
          popover,
          start.left + (moveEvent.clientX - startX) / start.scale,
          start.top + (moveEvent.clientY - startY) / start.scale
        );
        popover.style.left = `${position.left}px`;
        popover.style.top = `${position.top}px`;
      };
      const onUp = (upEvent) => {
        if (handle.hasPointerCapture(upEvent.pointerId)) handle.releasePointerCapture(upEvent.pointerId);
        handle.removeEventListener('pointermove', onMove);
        handle.removeEventListener('pointerup', onUp);
      };
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
    };
  }

  function showNotepadFindPopover(paneElement, replace) {
    const popover = paneElement.querySelector(replace ? '[data-notepad-replace-popover]' : '[data-notepad-find-popover]');
    if (!popover) return;
    setNotepadPopoverOpen(paneElement, popover, true);
    popover.querySelector('input')?.focus();
  }

  function hideNotepadPopovers(paneElement, focusEditor = false) {
    setNotepadPopoverOpen(paneElement, null, false);
    if (focusEditor) paneElement.querySelector('.notepad-editor')?.focus();
  }

  function wireNotepadFindPopovers(paneElement, editor) {
    const findInput = paneElement.querySelector('[data-notepad-find-input]');
    const replaceFindInput = paneElement.querySelector('[data-notepad-replace-find-input]');
    const replaceInput = paneElement.querySelector('[data-notepad-replace-input]');
    const onFindKeydown = (input) => (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        notepadFindNext(editor, input.value, event.shiftKey);
      } else if (event.key === 'Escape') {
        hideNotepadPopovers(paneElement, true);
      }
    };
    if (findInput) findInput.onkeydown = onFindKeydown(findInput);
    if (replaceFindInput) replaceFindInput.onkeydown = onFindKeydown(replaceFindInput);
    if (replaceInput) {
      replaceInput.onkeydown = (event) => {
        if (event.key === 'Escape') hideNotepadPopovers(paneElement, true);
      };
    }
    const onClick = (selector, handler) => {
      const button = paneElement.querySelector(selector);
      if (button) button.onclick = handler;
    };
    onClick('[data-notepad-find-prev]', () => notepadFindNext(editor, findInput.value, true));
    onClick('[data-notepad-find-next]', () => notepadFindNext(editor, findInput.value, false));
    onClick('[data-notepad-replace-prev]', () => notepadFindNext(editor, replaceFindInput.value, true));
    onClick('[data-notepad-replace-next]', () => notepadFindNext(editor, replaceFindInput.value, false));
    onClick('[data-notepad-replace-one]', () => {
      const query = replaceFindInput.value;
      if (query && editor.value.slice(editor.selectionStart, editor.selectionEnd) === query) {
        editor.setRangeText(replaceInput.value, editor.selectionStart, editor.selectionEnd, 'end');
        editor.dispatchEvent(new Event('input'));
      }
      notepadFindNext(editor, query, false);
    });
    onClick('[data-notepad-replace-all]', () => {
      const query = replaceFindInput.value;
      if (!query) return;
      editor.value = editor.value.split(query).join(replaceInput.value);
      editor.dispatchEvent(new Event('input'));
    });
  }

  function syncNotepadRows(paneElement, editor, gutter, guides) {
    if (!paneElement || !editor || !gutter || !guides) return;
    const lines = editor.value.split(/\r\n|\r|\n/);
    const wrapped = paneElement.querySelector('.notepad-editor-shell')?.classList.contains('wrap-on');
    const computed = getComputedStyle(editor);
    const lineHeight = Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.5;
    const heights = lines.map(() => lineHeight);
    const measure = paneElement.querySelector('.notepad-wrap-measure');
    if (wrapped && measure && editor.clientWidth) {
      measure.style.width = `${editor.clientWidth}px`;
      measure.style.fontFamily = computed.fontFamily;
      measure.style.fontSize = computed.fontSize;
      measure.style.lineHeight = computed.lineHeight;
      measure.replaceChildren(...lines.map((line) => {
        const row = document.createElement('span');
        row.textContent = line || '\u200b';
        return row;
      }));
      Array.from(measure.children).forEach((row, index) => {
        heights[index] = Math.max(lineHeight, row.getBoundingClientRect().height);
      });
    }
    gutter.replaceChildren(...lines.map((line, index) => {
      const row = document.createElement('span');
      row.className = 'notepad-gutter-line';
      row.style.height = `${heights[index]}px`;
      row.textContent = String(index + 1);
      return row;
    }));
    guides.replaceChildren(...lines.map((line, index) => {
      const row = document.createElement('span');
      row.className = 'notepad-indent-guide-line';
      row.style.height = `${heights[index]}px`;
      const spaces = line.match(/^( +)(?=\S)/)?.[1].length || 0;
      row.style.setProperty('--notepad-guide-columns', String(Math.floor(spaces / 4) * 4));
      return row;
    }));
    gutter.scrollTop = editor.scrollTop;
    guides.style.transform = `translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`;
  }

  function wireNotepadPane(root) {
    wirePagedToolbars(root);
    const paneElement = root?.querySelector?.('.notepad-pane') || (root?.matches?.('.notepad-pane') ? root : null);
    if (!paneElement) return;
    const paneId = paneElement.dataset.notepadPane;
    const tabId = paneElement.dataset.notepadActiveTab;
    const editor = paneElement.querySelector('.notepad-editor');
    const gutter = paneElement.querySelector('.notepad-gutter');
    const guides = paneElement.querySelector('.notepad-indent-guides');
    const status = paneElement.querySelector('[data-notepad-status]');
    const data = notepadTabData(tabId);

    const newButton = paneElement.querySelector('[data-notepad-new]');
    const saveButton = paneElement.querySelector('[data-notepad-save]');
    const cutButton = paneElement.querySelector('[data-notepad-cut]');
    const copyButton = paneElement.querySelector('[data-notepad-copy]');
    const pasteButton = paneElement.querySelector('[data-notepad-paste]');
    const wrapButton = paneElement.querySelector('[data-notepad-wrap]');
    const indentButton = paneElement.querySelector('[data-notepad-indent]');
    const autosaveButton = paneElement.querySelector('[data-notepad-autosave]');

    if (newButton) newButton.onclick = () => addNotepadTab(paneId, '');
    if (saveButton) saveButton.onclick = () => saveNotepadTab(paneId, tabId);
    const wirePopover = (toggleSelector, popoverSelector, persistent = false) => {
      const toggle = paneElement.querySelector(toggleSelector);
      const popover = paneElement.querySelector(popoverSelector);
      const control = toggle?.closest('.notepad-popover-control');
      if (!toggle || !popover || !control) return;
      toggle.onclick = () => {
        const open = popover.hidden;
        setNotepadPopoverOpen(paneElement, popover, open);
        if (open) popover.querySelector('input')?.focus();
      };
      if (!persistent) {
        control.onfocusout = (event) => {
          if (!control.contains(event.relatedTarget)) setNotepadPopoverOpen(paneElement, popover, false);
        };
      }
      control.onkeydown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setNotepadPopoverOpen(paneElement, popover, false);
          toggle.focus();
        }
      };
      if (persistent) {
        wireNotepadPopoverDrag(popover);
        const closeButton = popover.querySelector('[data-notepad-popover-close]');
        if (closeButton) {
          closeButton.onclick = () => {
            setNotepadPopoverOpen(paneElement, popover, false);
            toggle.focus();
          };
        }
      }
    };
    wirePopover('[data-notepad-font-toggle]', '[data-notepad-font-popover]');
    wirePopover('[data-notepad-font-size-toggle]', '[data-notepad-font-size-popover]');
    wirePopover('[data-notepad-find]', '[data-notepad-find-popover]', true);
    wirePopover('[data-notepad-replace]', '[data-notepad-replace-popover]', true);
    paneElement.querySelectorAll('[data-notepad-font]').forEach((button) => {
      button.onclick = () => {
        data.fontFamily = button.dataset.notepadFont;
        editor.style.fontFamily = data.fontFamily;
        gutter.style.fontFamily = data.fontFamily;
        guides.style.fontFamily = data.fontFamily;
        paneElement.querySelectorAll('[data-notepad-font]').forEach((option) => {
          option.setAttribute('aria-pressed', String(option === button));
        });
        syncNotepadRows(paneElement, editor, gutter, guides);
        persistNotepadTabState(paneId, tabId).catch((error) => showToast(error.message));
        setNotepadPopoverOpen(paneElement, paneElement.querySelector('[data-notepad-font-popover]'), false);
      };
    });
    const fontSizeOutButton = paneElement.querySelector('[data-notepad-font-size-out]');
    const fontSizeInButton = paneElement.querySelector('[data-notepad-font-size-in]');
    const fontSizeResetButton = paneElement.querySelector('[data-notepad-font-size-reset]');
    if (fontSizeOutButton) fontSizeOutButton.onclick = () => changePaneFontSize(paneId, -1);
    if (fontSizeInButton) fontSizeInButton.onclick = () => changePaneFontSize(paneId, 1);
    if (fontSizeResetButton) {
      fontSizeResetButton.onclick = () => {
        changePaneFontSize(
          paneId,
          Math.round(terminalFontSize()) - Math.round(paneFontSize(findPaneState(paneId)?.pane))
        );
      };
    }
    if (cutButton) cutButton.onclick = () => notepadCut(editor);
    if (copyButton) copyButton.onclick = () => notepadCopySelection(editor);
    if (pasteButton) pasteButton.onclick = () => notepadPaste(editor);
    if (wrapButton) {
      wrapButton.onclick = () => {
        data.wrap = !data.wrap;
        persistNotepadTabState(paneId, tabId).catch((error) => showToast(error.message));
        updateNotepadPane(paneId);
      };
    }
    if (indentButton) {
      indentButton.onclick = () => {
        data.indentGuides = !data.indentGuides;
        persistNotepadTabState(paneId, tabId).catch((error) => showToast(error.message));
        updateNotepadPane(paneId);
      };
    }
    if (autosaveButton) {
      autosaveButton.onclick = () => {
        data.autosave = !data.autosave;
        const tab = findNotepadTab(tabId);
        const draft = data.autosave && !tab?.path ? { content: data.content, encoding: data.encoding } : {};
        persistNotepadTabState(paneId, tabId, draft).catch((error) => showToast(error.message));
        updateNotepadPane(paneId);
      };
    }

    if (editor) {
      editor.oninput = () => {
        data.content = editor.value;
        data.dirty = true;
        syncNotepadRows(paneElement, editor, gutter, guides);
        status.textContent = data.encoding.toUpperCase();
        const label = document.querySelector(`[data-notepad-tab="${tabId}"] .notepad-tab-label`);
        if (label && !label.querySelector('.notepad-tab-modified')) {
          label.insertAdjacentHTML('afterbegin', '<span class="notepad-tab-modified">*</span>');
        }
        if (data.autosave) scheduleNotepadAutosave(paneId, tabId);
      };
      editor.onscroll = () => {
        gutter.scrollTop = editor.scrollTop;
        guides.style.transform = `translate(${-editor.scrollLeft}px, ${-editor.scrollTop}px)`;
      };
      editor.onkeydown = (event) => {
        const key = event.key.toLowerCase();
        if (event.ctrlKey && !event.altKey && !event.metaKey && (key === '+' || key === '=' || key === '-')) {
          event.preventDefault();
          event.stopPropagation();
          changePaneFontSize(paneId, key === '-' ? -1 : 1);
          setNotepadPopoverOpen(paneElement, paneElement.querySelector('[data-notepad-font-size-popover]'), true);
        } else if (event.ctrlKey && !event.altKey && !event.metaKey && key === '0') {
          event.preventDefault();
          event.stopPropagation();
          changePaneFontSize(
            paneId,
            Math.round(terminalFontSize()) - Math.round(paneFontSize(findPaneState(paneId)?.pane))
          );
          setNotepadPopoverOpen(paneElement, paneElement.querySelector('[data-notepad-font-size-popover]'), true);
        } else if (event.ctrlKey && key === 's') {
          event.preventDefault();
          saveNotepadTab(paneId, tabId);
        } else if (event.ctrlKey && key === 'n') {
          event.preventDefault();
          addNotepadTab(paneId, '');
        } else if (event.ctrlKey && key === 'f') {
          event.preventDefault();
          showNotepadFindPopover(paneElement, false);
        } else if (event.ctrlKey && key === 'h') {
          event.preventDefault();
          showNotepadFindPopover(paneElement, true);
        } else if (event.key === 'Tab') {
          event.preventDefault();
          const start = editor.selectionStart;
          editor.setRangeText('    ', start, editor.selectionEnd, 'end');
          editor.dispatchEvent(new Event('input'));
        }
      };
    }

    wireNotepadFindPopovers(paneElement, editor);
    syncNotepadRows(paneElement, editor, gutter, guides);
    paneElement._notepadResizeObserver?.disconnect();
    paneElement._notepadResizeObserver = new ResizeObserver(() => {
      syncNotepadRows(paneElement, editor, gutter, guides);
      paneElement.querySelectorAll('.notepad-popover:not([hidden])').forEach((popover) => {
        if (popover.querySelector('[data-notepad-popover-drag]')) placeNotepadPopover(popover);
      });
    });
    paneElement._notepadResizeObserver.observe(editor);
    wireNotepadTabs(paneElement.closest('.pane') || paneElement, paneId);
  }

  function samePath(left, right) {
    const normalize = (value) => String(value || '').replace(/[\\/]+/g, '\\').replace(/\\+$/, '').toLowerCase();
    return Boolean(normalize(left)) && normalize(left) === normalize(right);
  }

  function findOpenNotepadTab(tab, path) {
    for (const pane of tab?.panes || []) {
      if (pane.type !== 'notepad') continue;
      const notepadTab = (pane.notepadTabs || []).find((candidate) => samePath(candidate.path, path));
      if (notepadTab) return { pane, notepadTab };
    }
    return null;
  }

  async function openNotepadForFile(path) {
    const session = activeSession();
    const tab = activeTab(session);
    const opened = findOpenNotepadTab(tab, path);
    if (opened) {
      await setActivePane(opened.pane.id, false);
      await activateNotepadTabClient(opened.pane.id, opened.notepadTab.id);
      return;
    }
    const existing = tab?.panes.find((candidate) => candidate.type === 'notepad');
    if (existing) {
      await addNotepadTab(existing.id, path);
      await setActivePane(existing.id, false);
      return;
    }
    await openNotepadPane(path);
  }

  async function loadDrives() {
    try {
      state.fileError = '';
      const result = await api('/api/files/drives');
      state.fileDrives = result.drives || [];
      state.fileEntries = [];
      state.fileParent = '';
    } catch (error) {
      state.fileError = error.message;
    }
  }

  async function loadFiles(path) {
    try {
      state.fileError = '';
      const result = await api(`/api/files?path=${encodeURIComponent(path)}`);
      state.filePath = result.path;
      state.fileEntries = result.entries || [];
      state.fileParent = result.parent || '';
    } catch (error) {
      state.fileError = error.message;
    }
    renderFilePanel();
  }

  async function loadFilesPane(pane) {
    if (!pane) {
      return;
    }
    const paneData = filesPaneData(pane.id);
    paneData.error = '';
    paneData.entries = [];
    paneData.drives = [];
    updateFilesPane(pane.id);
    try {
      if (pane.path) {
        const [result, bookmarkResult] = await Promise.all([
          api(`/api/files?path=${encodeURIComponent(pane.path)}`),
          api('/api/files/bookmarks')
        ]);
        pane.path = result.path;
        paneData.entries = result.entries || [];
        paneData.parent = result.parent || '';
        paneData.drives = [];
        paneData.bookmarks = bookmarkResult.bookmarks || [];
        rememberFilePath(pane.path);
      } else {
        const [result, bookmarkResult] = await Promise.all([
          api('/api/files/drives'),
          api('/api/files/bookmarks')
        ]);
        paneData.drives = result.drives || [];
        paneData.entries = [];
        paneData.parent = '';
        paneData.bookmarks = bookmarkResult.bookmarks || [];
      }
    } catch (error) {
      paneData.entries = [];
      paneData.drives = [];
      paneData.error = friendlyFileError(error.message);
    }
    updateFilesPane(pane.id);
  }

  async function setFilesPanePath(paneId, path) {
    const found = findPaneState(paneId);
    if (!found || found.pane.type !== 'files') {
      return;
    }
    try {
      const result = await api(`/api/panes/${paneId}/files/path`, {
        method: 'PATCH',
        body: JSON.stringify({ path })
      });
      found.pane.path = result.path || '';
      const activeTab = found.pane.filesTabs?.find((tab) => tab.id === found.pane.activeFilesTabId);
      if (activeTab) activeTab.path = found.pane.path;
      updatePaneTabStrip(paneId);
      state.selectedFiles[paneId] = [];
      filesPaneData(paneId).selectionAnchor = -1;
      await loadFilesPane(found.pane);
    } catch (error) {
      filesPaneData(paneId).error = error.message;
      showToast(error.message);
      updateFilesPane(paneId);
    }
  }

  function updateFilesPane(paneId) {
    const found = findPaneState(paneId);
    const container = document.querySelector(`[data-pane="${paneId}"]`);
    if (!found || !container) {
      return;
    }
    const existing = container.querySelector('.files-pane');
    if (existing) {
      existing.outerHTML = renderFilesPane(found.pane);
      wireFilesPane(container);
    }
  }

  function setFileColumnWidth(paneElement, paneData, column, value) {
    const minimums = { name: 90, modified: 90, size: 54 };
    const widths = { name: 150, modified: 130, size: 72, ...paneData.columnWidths };
    widths[column] = Math.max(minimums[column], Math.min(640, Math.round(value)));
    paneData.columnWidths = widths;
    paneElement.style.setProperty('--file-column-template', `${widths.name}px ${widths.modified}px ${widths.size}px`);
    paneElement.style.setProperty('--file-table-width', `${widths.name + widths.modified + widths.size}px`);
    return widths[column];
  }

  function wireFilesPane(root) {
    wirePagedToolbars(root);
    const paneElement = root.querySelector?.('.files-pane') || (root.matches?.('.files-pane') ? root : null);
    if (!paneElement) {
      return;
    }
    const paneId = paneElement.dataset.filesPane;
    const found = findPaneState(paneId);
    if (!found) {
      return;
    }
    const paneData = filesPaneData(paneId);
    const pathControl = paneElement.querySelector('[data-file-path-control]');
    const pathMenu = paneElement.querySelector('[data-file-path-menu]');
    const pathInput = paneElement.querySelector('.file-path-input');
    const pathToggle = paneElement.querySelector('[data-file-path-toggle]');
    const setPathMenuOpen = (open) => {
      if (!pathMenu || !pathToggle || !pathInput) {
        return;
      }
      pathMenu.hidden = !open;
      pathToggle.setAttribute('aria-expanded', String(open));
      pathInput.setAttribute('aria-expanded', String(open));
    };
    pathToggle?.addEventListener('click', () => setPathMenuOpen(pathMenu.hidden));
    pathInput?.addEventListener('focus', () => setPathMenuOpen(true));
    pathInput?.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setPathMenuOpen(true);
        pathMenu.querySelector('[data-file-path-choice]')?.focus();
      } else if (event.key === 'Escape') {
        setPathMenuOpen(false);
      }
    });
    pathControl?.addEventListener('focusout', (event) => {
      if (!pathControl.contains(event.relatedTarget)) {
        setPathMenuOpen(false);
      }
    });
    paneElement.querySelectorAll('[data-file-path-choice]').forEach((button) => {
      button.onclick = () => setFilesPanePath(paneId, button.dataset.filePathChoice);
    });
    paneElement.querySelectorAll('[data-path-bookmark]').forEach((button) => {
      button.onclick = () => togglePathBookmark(button.dataset.pathBookmark, paneId);
    });
    paneElement.querySelector('[data-file-path-form]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      setFilesPanePath(paneId, new FormData(event.currentTarget).get('path'));
    });
    paneElement.querySelector('[data-file-refresh]')?.addEventListener('click', () => loadFilesPane(found.pane));
    paneElement.querySelector('[data-file-up]')?.addEventListener('click', () => {
      if (paneData.parent) {
        setFilesPanePath(paneId, paneData.parent);
      } else {
        setFilesPanePath(paneId, '');
      }
    });
    paneElement.querySelector('[data-file-new-file]')?.addEventListener('click', () => createFile(paneId));
    paneElement.querySelector('[data-file-new-folder]')?.addEventListener('click', () => createFolder(paneId));
    paneElement.querySelector('[data-file-upload]')?.addEventListener('change', (event) => uploadFiles(event, paneId));
    paneElement.querySelector('[data-folder-upload]')?.addEventListener('change', (event) => uploadFiles(event, paneId));
    paneElement.querySelectorAll('[data-file-upload-trigger]').forEach((trigger) => {
      trigger.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
          return;
        }
        event.preventDefault();
        if (trigger.getAttribute('aria-disabled') === 'true') {
          return;
        }
        trigger.querySelector('input[type="file"]')?.click();
      });
    });
    paneElement.querySelectorAll('[data-file-sort]').forEach((button) => {
      button.onclick = () => {
        const key = button.dataset.fileSort;
        if (paneData.sortKey === key) {
          paneData.sortDirection = paneData.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          paneData.sortKey = key;
          paneData.sortDirection = 'asc';
        }
        paneData.selectionAnchor = -1;
        updateFilesPane(paneId);
      };
    });
    paneElement.querySelectorAll('[data-file-column-resize]').forEach((handle) => {
      const column = handle.dataset.fileColumnResize;
      handle.onpointerdown = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const startX = event.clientX;
        const startWidth = paneData.columnWidths?.[column] || { name: 150, modified: 130, size: 72 }[column];
        handle.setPointerCapture(event.pointerId);
        handle.onpointermove = (moveEvent) => {
          if (!handle.hasPointerCapture(moveEvent.pointerId)) return;
          const width = setFileColumnWidth(paneElement, paneData, column, startWidth + moveEvent.clientX - startX);
          handle.setAttribute('aria-valuenow', String(width));
        };
        handle.onpointerup = (upEvent) => {
          if (handle.hasPointerCapture(upEvent.pointerId)) handle.releasePointerCapture(upEvent.pointerId);
          handle.onpointermove = null;
          handle.onpointerup = null;
        };
      };
      handle.onkeydown = (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        const current = paneData.columnWidths?.[column] || { name: 150, modified: 130, size: 72 }[column];
        const width = setFileColumnWidth(paneElement, paneData, column, current + (event.key === 'ArrowRight' ? 10 : -10));
        handle.setAttribute('aria-valuenow', String(width));
      };
    });
    let dragDepth = 0;
    paneElement.addEventListener('dragenter', (event) => {
      if (!found.pane.path || !Array.from(event.dataTransfer?.types || []).includes('Files')) return;
      event.preventDefault();
      dragDepth += 1;
      paneElement.classList.add('drop-target');
    });
    paneElement.addEventListener('dragover', (event) => {
      if (!found.pane.path || !Array.from(event.dataTransfer?.types || []).includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });
    paneElement.addEventListener('dragleave', () => {
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) paneElement.classList.remove('drop-target');
    });
    paneElement.addEventListener('drop', async (event) => {
      if (!found.pane.path) return;
      event.preventDefault();
      dragDepth = 0;
      paneElement.classList.remove('drop-target');
      await uploadDroppedFiles(event.dataTransfer, paneId);
    });
    paneElement.querySelector('[data-file-download-selected]')?.addEventListener('click', () => downloadFiles(selectedFileList(paneId), paneId));
    paneElement.querySelector('[data-file-copy-selected]')?.addEventListener('click', () => copyFilePaths(selectedFileList(paneId)));
    paneElement.querySelector('[data-file-select-all]')?.addEventListener('click', () => {
      state.selectedFiles[paneId] = allVisibleFilesSelected(paneId) ? [] : visibleFilePaths(paneId);
      syncFileSelectionUi(paneElement, paneId);
    });
    paneElement.querySelector('[data-file-show-hidden]')?.addEventListener('click', async () => {
      const showHidden = !paneData.showHidden;
      await setShowHiddenFiles(showHidden);
      if (!showHidden) {
        const visible = new Set(visibleFilePaths(paneId));
        state.selectedFiles[paneId] = selectedFileList(paneId).filter((path) => visible.has(path));
      }
      paneData.selectionAnchor = -1;
    });
    paneElement.querySelector('[data-file-filter-toggle]')?.addEventListener('click', () => {
      paneData.filterOpen = !paneData.filterOpen;
      if (!paneData.filterOpen) {
        paneData.filter = '';
      }
      paneData.selectionAnchor = -1;
      updateFilesPane(paneId);
      if (paneData.filterOpen) {
        document.querySelector(`[data-files-pane="${paneId}"] [data-file-filter]`)?.focus();
      }
    });
    const filterInput = paneElement.querySelector('[data-file-filter]');
    if (filterInput) {
      filterInput.addEventListener('input', () => {
        paneData.filter = filterInput.value;
        paneData.selectionAnchor = -1;
        const visible = new Set(visibleFilePaths(paneId));
        state.selectedFiles[paneId] = selectedFileList(paneId).filter((path) => visible.has(path));
        updateFilesPane(paneId);
        const nextInput = document.querySelector(`[data-files-pane="${paneId}"] [data-file-filter]`);
        if (nextInput) {
          nextInput.focus();
          const caret = nextInput.value.length;
          nextInput.setSelectionRange(caret, caret);
        }
      });
      filterInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          paneData.filterOpen = false;
          paneData.filter = '';
          updateFilesPane(paneId);
        }
      });
    }
    paneElement.querySelector('[data-file-filter-clear]')?.addEventListener('click', () => {
      paneData.filter = '';
      updateFilesPane(paneId);
      document.querySelector(`[data-files-pane="${paneId}"] [data-file-filter]`)?.focus();
    });
    paneElement.querySelector('[data-file-rename-selected]')?.addEventListener('click', () => {
      const selected = selectedFileList(paneId);
      if (selected.length === 1) {
        renameFile(selected[0], paneId);
      }
    });
    paneElement.querySelector('[data-file-delete-selected]')?.addEventListener('click', () => {
      const selected = selectedFileList(paneId);
      if (selected.length) {
        deleteFiles(selected, paneId);
      }
    });
    paneElement.querySelectorAll('[data-file-row]').forEach((row) => {
      row.onmousedown = (event) => {
        if (event.button === 1) {
          event.preventDefault();
          copyFilePath(row.dataset.fileRow);
          return;
        }
        if (event.shiftKey) {
          event.preventDefault();
        }
      };
      row.onclick = (event) => {
        selectFileRow(paneElement, paneId, row, event);
      };
      row.ondblclick = (event) => {
        event.preventDefault();
        openFileRow(row, paneId);
      };
      row.onkeydown = (event) => {
        if (event.key === ' ') {
          event.preventDefault();
          selectFileRow(paneElement, paneId, row, event);
        } else if (event.key === 'Enter') {
          event.preventDefault();
          openFileRow(row, paneId);
        }
      };
      row.onauxclick = (event) => {
        if (event.button !== 1) {
          return;
        }
        event.preventDefault();
      };
      row.oncontextmenu = (event) => {
        event.preventDefault();
        openFileContextMenu(paneId, row.dataset.fileRow, event.clientX, event.clientY);
      };
    });
    paneElement.querySelector('.file-list')?.addEventListener('contextmenu', (event) => {
      if (event.target.closest('[data-file-row]') || !found.pane.path) {
        return;
      }
      event.preventDefault();
      openFileContextMenu(paneId, '', event.clientX, event.clientY);
    });
    paneElement.querySelectorAll('.file-row-button[data-file-open]').forEach((button) => {
      button.onclick = () => setFilesPanePath(paneId, button.dataset.fileOpen);
    });
    paneElement.querySelectorAll('[data-file-parent]').forEach((button) => {
      button.ondblclick = (event) => {
        event.preventDefault();
        setFilesPanePath(paneId, button.dataset.fileParent);
      };
      button.onkeydown = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          setFilesPanePath(paneId, button.dataset.fileParent);
        }
      };
    });
    paneElement.querySelectorAll('[data-file-rename]').forEach((button) => {
      button.onclick = () => renameFile(button.dataset.fileRename, paneId);
    });
    paneElement.querySelectorAll('[data-file-delete]').forEach((button) => {
      button.onclick = () => deleteFile(button.dataset.fileDelete, paneId);
    });
    paneElement.onkeydown = (event) => {
      if (event.target.closest('input')) {
        return;
      }
      const key = event.key.toLowerCase();
      const selected = selectedFileList(paneId);
      if ((event.ctrlKey || event.metaKey) && key === 'a') {
        event.preventDefault();
        state.selectedFiles[paneId] = visibleFilePaths(paneId);
        syncFileSelectionUi(paneElement, paneId);
      } else if ((event.ctrlKey || event.metaKey) && key === 'x') {
        if (selected.length) {
          event.preventDefault();
          cutFiles(selected, paneId);
        }
      } else if ((event.ctrlKey || event.metaKey) && key === 'v') {
        if (state.fileClipboard?.paths?.length) {
          event.preventDefault();
          pasteFiles(paneId);
        }
      } else if (event.key === 'F2') {
        if (selected.length === 1) {
          event.preventDefault();
          renameFile(selected[0], paneId);
        }
      } else if (event.key === 'Delete') {
        if (selected.length) {
          event.preventDefault();
          deleteFiles(selected, paneId);
        }
      }
    };
  }

  function selectedFileList(paneId) {
    return Array.isArray(state.selectedFiles[paneId]) ? state.selectedFiles[paneId] : [];
  }

  function setFileSelected(paneId, path, selected) {
    const current = selectedFileList(paneId).filter((item) => item !== path);
    if (selected) {
      current.push(path);
    }
    state.selectedFiles[paneId] = current;
  }

  function visibleFilePaths(paneId) {
    return sortedFileEntries(paneId).map((entry) => entry.path);
  }

  function allVisibleFilesSelected(paneId) {
    const visible = visibleFilePaths(paneId);
    const selected = new Set(selectedFileList(paneId));
    return visible.length > 0 && visible.every((path) => selected.has(path));
  }

  function selectFileRange(paneId, paths, fromIndex, toIndex, additive) {
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);
    const range = paths.slice(start, end + 1);
    state.selectedFiles[paneId] = additive
      ? Array.from(new Set([...selectedFileList(paneId), ...range]))
      : range;
  }

  function selectFileRow(container, paneId, row, event) {
    if (!row) {
      return;
    }
    if (state.activePaneId !== paneId) {
      setActivePane(paneId, false);
    }
    const paneData = filesPaneData(paneId);
    const paths = Array.from(container.querySelectorAll('[data-file-row]')).map((item) => item.dataset.fileRow);
    const index = Number(row.dataset.fileIndex);
    const additive = event.ctrlKey || event.metaKey;
    if (event.shiftKey && paneData.selectionAnchor >= 0) {
      selectFileRange(paneId, paths, paneData.selectionAnchor, index, additive);
    } else if (additive) {
      setFileSelected(paneId, row.dataset.fileRow, !selectedFileList(paneId).includes(row.dataset.fileRow));
      paneData.selectionAnchor = index;
    } else {
      state.selectedFiles[paneId] = [row.dataset.fileRow];
      paneData.selectionAnchor = index;
    }
    syncFileSelectionUi(container, paneId);
  }

  function copyFilePaths(paths) {
    const text = paths.join('\n');
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    const succeeded = () => showToast(paths.length === 1 ? 'Path copied.' : `${paths.length} paths copied.`, 'success');
    if (copied) {
      succeeded();
      return;
    }
    if (!navigator.clipboard?.writeText) {
      showToast('Could not copy path.');
      return;
    }
    navigator.clipboard.writeText(text).then(succeeded, () => showToast('Could not copy path.'));
  }

  function copyFilePath(path) {
    copyFilePaths([path]);
  }

  async function setShowHiddenFiles(showHidden) {
    try {
      state.config = await api('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ file_manager: { show_hidden: showHidden } })
      });
      Object.values(state.filePaneData).forEach((paneData) => {
        paneData.showHidden = showHidden;
      });
      document.querySelectorAll('[data-files-pane]').forEach((paneElement) => updateFilesPane(paneElement.dataset.filesPane));
    } catch (error) {
      showToast(error.message);
    }
  }

  async function openFileRow(row, paneId) {
    const opener = row.querySelector('[data-file-open]');
    if (opener.dataset.fileType === 'file') {
      const path = opener.dataset.fileOpen;
      try {
        await api(`/api/files/text?path=${encodeURIComponent(path)}`);
        await openNotepadForFile(path);
      } catch (error) {
        if (error.status === 415) {
          await downloadFiles([path], paneId);
        } else {
          showToast(error.message);
        }
      }
    } else {
      setFilesPanePath(paneId, opener.dataset.fileOpen);
    }
  }

  function syncFileSelectionUi(container, paneId) {
    const selected = selectedFileList(paneId);
    container.querySelectorAll('[data-file-row]').forEach((row) => {
      const selectedRow = selected.includes(row.dataset.fileRow);
      row.classList.toggle('selected', selectedRow);
      row.setAttribute('aria-selected', String(selectedRow));
    });
    const renameButton = container.querySelector('[data-file-rename-selected]');
    const downloadButton = container.querySelector('[data-file-download-selected]');
    const copyButton = container.querySelector('[data-file-copy-selected]');
    const deleteButton = container.querySelector('[data-file-delete-selected]');
    if (renameButton) {
      renameButton.disabled = selected.length !== 1;
    }
    if (deleteButton) {
      deleteButton.disabled = selected.length === 0;
    }
    if (downloadButton) {
      downloadButton.disabled = selected.length === 0;
    }
    if (copyButton) {
      copyButton.disabled = selected.length === 0;
    }
    const selectAllButton = container.querySelector('[data-file-select-all]');
    if (selectAllButton) {
      const allSelected = allVisibleFilesSelected(paneId);
      selectAllButton.classList.toggle('active', allSelected);
      selectAllButton.setAttribute('aria-label', allSelected ? 'Deselect all' : 'Select all');
      selectAllButton.setAttribute('aria-pressed', String(allSelected));
      selectAllButton.title = allSelected ? 'Deselect all' : 'Select all';
      selectAllButton.innerHTML = fileActionIcon(allSelected ? 'deselect-all' : 'select-all');
    }
    const itemCount = container.querySelector('.file-item-count');
    if (itemCount) {
      const total = visibleFilePaths(paneId).length;
      itemCount.textContent = selected.length ? `${selected.length}/${total} items` : `${total} items`;
    }
  }

  function clearFileSelections() {
    Object.keys(state.selectedFiles).forEach((paneId) => {
      state.selectedFiles[paneId] = [];
      filesPaneData(paneId).selectionAnchor = -1;
    });
    document.querySelectorAll('[data-files-pane]').forEach((paneElement) => syncFileSelectionUi(paneElement, paneElement.dataset.filesPane));
  }

  function renderFilePanel() {
    document.querySelector('.file-panel')?.remove();
    if (!state.filePanelOpen) {
      return;
    }
    const panel = document.createElement('aside');
    panel.className = 'file-panel';
    const showingDrives = !state.filePath;
    panel.innerHTML = `
      <header class="file-header">
        <div class="brand">Files</div>
        <button class="icon-button" data-file-close title="Close">×</button>
      </header>
      <div class="file-path">${escapeHtml(state.filePath || 'This PC')}</div>
      <div class="file-actions">
        ${state.filePath ? '<button class="secondary" data-file-up>Up</button><button class="secondary" data-file-new-folder>New folder</button><label class="secondary file-upload">Upload<input type="file" multiple data-file-upload></label>' : '<button class="secondary" data-file-refresh>Refresh</button>'}
      </div>
      <div class="file-error">${escapeHtml(state.fileError)}</div>
      <div class="file-list">
        ${showingDrives ? state.fileDrives.map((drive) => `
          <button class="file-row" data-file-open="${escapeAttr(drive.path)}">
            <span class="file-icon">▣</span><span>${escapeHtml(drive.name)}</span>
          </button>
        `).join('') : state.fileEntries.map((entry) => `
          <div class="file-row" data-file-row="${escapeAttr(entry.path)}">
            <button data-file-open="${escapeAttr(entry.path)}" ${entry.type === 'file' ? 'data-file-download' : ''}>
              <span class="file-icon">${entry.type === 'directory' ? '▣' : '□'}</span>
              <span>${escapeHtml(entry.name)}</span>
            </button>
            <small>${entry.type === 'file' ? formatBytes(entry.size) : 'Folder'}</small>
            <button class="icon-button" data-file-rename="${escapeAttr(entry.path)}" title="Rename">✎</button>
            <button class="icon-button" data-file-delete="${escapeAttr(entry.path)}" title="Delete">×</button>
          </div>
        `).join('')}
      </div>
    `;
    document.body.appendChild(panel);
    panel.querySelector('[data-file-close]').onclick = () => {
      state.filePanelOpen = false;
      renderFilePanel();
    };
    panel.querySelector('[data-file-refresh]')?.addEventListener('click', loadDrives);
    panel.querySelector('[data-file-up]')?.addEventListener('click', () => {
      if (state.fileParent) {
        loadFiles(state.fileParent);
      } else {
        state.filePath = '';
        loadDrives().then(renderFilePanel);
      }
    });
    panel.querySelector('[data-file-new-folder]')?.addEventListener('click', createFolder);
    panel.querySelector('[data-file-upload]')?.addEventListener('change', uploadFiles);
    panel.querySelectorAll('[data-file-open]').forEach((button) => {
      button.onclick = () => {
        if (button.hasAttribute('data-file-download')) {
          downloadFile(button.dataset.fileOpen);
        } else {
          loadFiles(button.dataset.fileOpen);
        }
      };
    });
    panel.querySelectorAll('[data-file-rename]').forEach((button) => {
      button.onclick = () => renameFile(button.dataset.fileRename);
    });
    panel.querySelectorAll('[data-file-delete]').forEach((button) => {
      button.onclick = () => deleteFile(button.dataset.fileDelete);
    });
  }

  const INVALID_FILENAME_CHARS = /[<>:"/|?*]/;

  function validateFileName(name) {
    const value = String(name || '').trim();
    if (!value) {
      return 'Enter a name.';
    }
    if (value === '.' || value === '..') {
      return 'Choose a different name.';
    }
    if (INVALID_FILENAME_CHARS.test(value) || value.includes(String.fromCharCode(92))) {
      return 'Avoid these characters: < > : " / \\ | ? *';
    }
    if (/[. ]$/.test(value)) {
      return 'Names cannot end with a space or period.';
    }
    return '';
  }

  function openAppModal({ title, message = '', fields = [], confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false, validate }) {
    return new Promise((resolve) => {
      document.querySelector('.app-modal-overlay')?.remove();
      const previousFocus = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'app-modal-overlay';
      overlay.innerHTML = `
        <div class="app-modal" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
          <header class="app-modal-header">${escapeHtml(title)}</header>
          <div class="app-modal-body">
            ${message ? `<p class="app-modal-message">${escapeHtml(message)}</p>` : ''}
            ${fields.map((field) => `
              <label class="app-modal-field">
                <span>${escapeHtml(field.label)}</span>
                <input data-modal-field="${escapeAttr(field.name)}" value="${escapeAttr(field.value || '')}" autocomplete="off" autocapitalize="off" spellcheck="false">
              </label>`).join('')}
            <div class="app-modal-error" data-modal-error role="alert"></div>
          </div>
          <footer class="app-modal-footer">
            <button type="button" class="secondary" data-modal-cancel>${escapeHtml(cancelLabel)}</button>
            <button type="button" class="${danger ? 'app-modal-danger' : 'primary'}" data-modal-confirm>${escapeHtml(confirmLabel)}</button>
          </footer>
        </div>`;
      document.body.appendChild(overlay);
      const inputs = Array.from(overlay.querySelectorAll('[data-modal-field]'));
      const errorEl = overlay.querySelector('[data-modal-error]');
      const confirmButton = overlay.querySelector('[data-modal-confirm]');
      const values = () => Object.fromEntries(inputs.map((input) => [input.dataset.modalField, input.value.trim()]));
      const runValidate = () => {
        const error = validate ? validate(values()) : '';
        errorEl.textContent = error || '';
        confirmButton.disabled = Boolean(error);
        return !error;
      };
      const close = (result) => {
        overlay.remove();
        document.removeEventListener('keydown', onKey, true);
        previousFocus?.focus?.();
        resolve(result);
      };
      const commit = () => {
        if (runValidate()) {
          close(fields.length ? values() : true);
        }
      };
      const onKey = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close(null);
        } else if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          commit();
        }
      };
      document.addEventListener('keydown', onKey, true);
      overlay.addEventListener('mousedown', (event) => {
        if (event.target === overlay) {
          close(null);
        }
      });
      inputs.forEach((input) => input.addEventListener('input', runValidate));
      overlay.querySelector('[data-modal-cancel]').onclick = () => close(null);
      confirmButton.onclick = commit;
      runValidate();
      (inputs[0] || confirmButton).focus();
      if (inputs[0]) {
        const value = inputs[0].value;
        const dot = value.lastIndexOf('.');
        inputs[0].setSelectionRange(0, dot > 0 ? dot : value.length);
      }
    });
  }

  function confirmDialog(title, message, { danger = false, confirmLabel = 'Delete' } = {}) {
    return openAppModal({ title, message, confirmLabel, danger }).then((result) => result === true);
  }

  async function saveResponseAsFile(response, fallbackName) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers.get('Content-Disposition') || '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    link.download = encodedName ? decodeURIComponent(encodedName) : (plainName || fallbackName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function createFolder(paneId = '') {
    const found = paneId ? findPaneState(paneId) : null;
    const result = await openAppModal({
      title: 'New folder',
      fields: [{ name: 'name', label: 'Folder name', value: '' }],
      confirmLabel: 'Create',
      validate: (form) => validateFileName(form.name)
    });
    if (!result) {
      return;
    }
    try {
      await api('/api/files/folder', {
        method: 'POST',
        body: JSON.stringify({ path: found?.pane.path || state.filePath, name: result.name })
      });
      if (found) {
        await loadFilesPane(found.pane);
      } else {
        await loadFiles(state.filePath);
      }
    } catch (error) {
      if (found) {
        filesPaneData(paneId).error = friendlyFileError(error.message);
      } else {
        state.fileError = error.message;
      }
      showToast(error.message);
      found ? updateFilesPane(paneId) : renderFilePanel();
    }
  }

  async function createFile(paneId) {
    const found = findPaneState(paneId);
    if (!found?.pane.path) {
      return;
    }
    const result = await openAppModal({
      title: 'New file',
      fields: [{ name: 'name', label: 'File name', value: '' }],
      confirmLabel: 'Create',
      validate: (form) => validateFileName(form.name)
    });
    if (!result) {
      return;
    }
    try {
      await api('/api/files/file', {
        method: 'POST',
        body: JSON.stringify({ path: found.pane.path, name: result.name })
      });
      await loadFilesPane(found.pane);
    } catch (error) {
      filesPaneData(paneId).error = friendlyFileError(error.message);
      showToast(error.message);
      updateFilesPane(paneId);
    }
  }

  async function renameFile(path, paneId = '') {
    const found = paneId ? findPaneState(paneId) : null;
    const currentName = path.split(/[\\/]/).pop() || '';
    const result = await openAppModal({
      title: 'Rename',
      fields: [{ name: 'name', label: 'New name', value: currentName }],
      confirmLabel: 'Rename',
      validate: (form) => validateFileName(form.name)
    });
    if (!result || result.name === currentName) {
      return;
    }
    try {
      await api('/api/files/rename', {
        method: 'PATCH',
        body: JSON.stringify({ path, name: result.name })
      });
      if (found) {
        await loadFilesPane(found.pane);
      } else {
        await loadFiles(state.filePath);
      }
    } catch (error) {
      if (found) {
        filesPaneData(paneId).error = friendlyFileError(error.message);
      } else {
        state.fileError = error.message;
      }
      showToast(error.message);
      found ? updateFilesPane(paneId) : renderFilePanel();
    }
  }

  async function deleteFile(path, paneId = '') {
    const found = paneId ? findPaneState(paneId) : null;
    const name = path.split(/[\\/]/).pop() || 'this item';
    const confirmed = await confirmDialog('Delete item', `Delete "${name}" permanently? This cannot be undone.`, { danger: true });
    if (!confirmed) {
      return;
    }
    try {
      await api('/api/files', {
        method: 'DELETE',
        body: JSON.stringify({ path })
      });
      if (found) {
        await loadFilesPane(found.pane);
      } else {
        await loadFiles(state.filePath);
      }
    } catch (error) {
      if (found) {
        filesPaneData(paneId).error = friendlyFileError(error.message);
      } else {
        state.fileError = error.message;
      }
      showToast(error.message);
      found ? updateFilesPane(paneId) : renderFilePanel();
    }
  }

  async function deleteFiles(paths, paneId) {
    const found = findPaneState(paneId);
    if (!found || !paths.length) {
      return;
    }
    const confirmed = await confirmDialog('Delete items', `Delete ${paths.length} selected item(s) permanently? This cannot be undone.`, { danger: true });
    if (!confirmed) {
      return;
    }
    try {
      const { results } = await api('/api/files/delete-bulk', {
        method: 'POST',
        body: JSON.stringify({ paths })
      });
      const failed = (results || []).filter((item) => !item.ok);
      state.selectedFiles[paneId] = failed.map((item) => item.path);
      await loadFilesPane(found.pane);
      if (failed.length) {
        filesPaneData(paneId).error = `${failed.length} of ${paths.length} item(s) could not be deleted.`;
        updateFilesPane(paneId);
        showToast(`${failed.length} of ${paths.length} item(s) could not be deleted.`);
      }
    } catch (error) {
      filesPaneData(paneId).error = friendlyFileError(error.message);
      showToast(error.message);
      updateFilesPane(paneId);
    }
  }

  function cutFiles(paths, paneId) {
    if (!paths.length) {
      return;
    }
    state.fileClipboard = { paths: [...paths], mode: 'cut' };
    showToast(paths.length === 1 ? 'Item ready to move.' : `${paths.length} items ready to move.`, 'success');
    updateFilesPane(paneId);
  }

  async function pasteFiles(paneId) {
    const found = findPaneState(paneId);
    const clipboard = state.fileClipboard;
    if (!found?.pane.path || !clipboard?.paths?.length) {
      return;
    }
    const destination = found.pane.path;
    let failures = 0;
    for (const path of clipboard.paths) {
      try {
        await api('/api/files/move', {
          method: 'PATCH',
          body: JSON.stringify({ path, destination })
        });
      } catch (error) {
        failures += 1;
      }
    }
    state.fileClipboard = null;
    state.selectedFiles[paneId] = [];
    await loadFilesPane(found.pane);
    if (failures) {
      filesPaneData(paneId).error = `${failures} item(s) could not be moved.`;
      updateFilesPane(paneId);
      showToast(`${failures} item(s) could not be moved.`);
    } else {
      showToast('Moved.', 'success');
    }
  }

  function closeFileContextMenu() {
    document.querySelector('.file-context-menu')?.remove();
    document.removeEventListener('pointerdown', handleContextMenuOutside, true);
    document.removeEventListener('keydown', handleContextMenuKey, true);
  }

  function handleContextMenuOutside(event) {
    if (!event.target.closest('.file-context-menu')) {
      closeFileContextMenu();
    }
  }

  function handleContextMenuKey(event) {
    if (event.key === 'Escape') {
      closeFileContextMenu();
    }
  }

  function openFileContextMenu(paneId, anchorPath, clientX, clientY) {
    closeFileContextMenu();
    const paneElement = document.querySelector(`[data-files-pane="${paneId}"]`);
    if (!paneElement) {
      return;
    }
    if (anchorPath && !selectedFileList(paneId).includes(anchorPath)) {
      state.selectedFiles[paneId] = [anchorPath];
      syncFileSelectionUi(paneElement, paneId);
    }
    const selected = selectedFileList(paneId);
    const clipboardReady = Boolean(state.fileClipboard?.paths?.length);
    const items = [];
    if (anchorPath && selected.length === 1) {
      items.push({ label: 'Open', action: () => {
        const row = paneElement.querySelector(`[data-file-row="${cssEscape(anchorPath)}"]`);
        if (row) {
          openFileRow(row, paneId);
        }
      } });
    }
    if (selected.length) {
      items.push({ label: selected.length > 1 ? `Download (${selected.length})` : 'Download', action: () => downloadFiles(selected, paneId) });
      items.push({ label: 'Cut', action: () => cutFiles(selected, paneId) });
      items.push({ label: selected.length > 1 ? 'Copy paths' : 'Copy path', action: () => copyFilePaths(selected) });
    }
    items.push({ label: 'Paste', disabled: !clipboardReady, action: () => pasteFiles(paneId) });
    if (selected.length === 1) {
      items.push({ label: 'Rename', action: () => renameFile(selected[0], paneId) });
    }
    if (selected.length) {
      items.push({ label: 'Delete', danger: true, action: () => deleteFiles(selected, paneId) });
    }
    if (!items.length) {
      return;
    }
    const menu = document.createElement('div');
    menu.className = 'file-context-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = items.map((item, index) => `
      <button type="button" role="menuitem" class="file-context-item ${item.danger ? 'danger' : ''}" data-context-index="${index}" ${item.disabled ? 'disabled' : ''}>${escapeHtml(item.label)}</button>
    `).join('');
    document.body.appendChild(menu);
    const width = menu.offsetWidth;
    const height = menu.offsetHeight;
    menu.style.left = `${Math.min(clientX, window.innerWidth - width - 6)}px`;
    menu.style.top = `${Math.min(clientY, window.innerHeight - height - 6)}px`;
    menu.querySelectorAll('[data-context-index]').forEach((button) => {
      button.onclick = () => {
        const item = items[Number(button.dataset.contextIndex)];
        closeFileContextMenu();
        item.action();
      };
    });
    menu.querySelector('button:not([disabled])')?.focus();
    document.addEventListener('pointerdown', handleContextMenuOutside, true);
    document.addEventListener('keydown', handleContextMenuKey, true);
  }

  function cssEscape(value) {
    return String(value).replace(/["\\]/g, '\\$&');
  }

  async function downloadFile(path, paneId = '') {
    try {
      const headers = {};
      if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
      }
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(path)}`, { headers });
      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Download failed.' }));
        throw new Error(result.error || 'Download failed.');
      }
      await saveResponseAsFile(response, path.split(/[\\/]/).pop() || 'download');
    } catch (error) {
      if (paneId) {
        filesPaneData(paneId).error = friendlyFileError(error.message);
      } else {
        state.fileError = error.message;
      }
      showToast(error.message);
      if (paneId) {
        updateFilesPane(paneId);
      }
    }
  }

  async function downloadFiles(paths, paneId) {
    if (!paths.length) {
      return;
    }
    if (paths.length === 1) {
      await downloadFile(paths[0], paneId);
      return;
    }
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (state.token) {
        headers.Authorization = `Bearer ${state.token}`;
      }
      const response = await fetch('/api/files/download-archive', {
        method: 'POST',
        headers,
        body: JSON.stringify({ paths })
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: 'Download failed.' }));
        throw new Error(result.error || 'Download failed.');
      }
      await saveResponseAsFile(response, 'wps7-files.zip');
    } catch (error) {
      if (paneId) {
        filesPaneData(paneId).error = friendlyFileError(error.message);
      }
      showToast(error.message);
      if (paneId) {
        updateFilesPane(paneId);
      }
    }
  }

  async function uploadFiles(event, paneId = '') {
    const files = Array.from(event.target.files || []).map((file) => ({ file, name: file.webkitRelativePath || file.name }));
    await uploadFileItems(files, paneId);
    event.target.value = '';
  }

  async function uploadDroppedFiles(dataTransfer, paneId) {
    const items = Array.from(dataTransfer?.items || []);
    const entries = items.map((item) => item.webkitGetAsEntry?.()).filter(Boolean);
    const files = entries.length
      ? (await Promise.all(entries.map((entry) => droppedEntryFiles(entry)))).flat()
      : Array.from(dataTransfer?.files || []).map((file) => ({ file, name: file.name }));
    await uploadFileItems(files, paneId);
  }

  async function droppedEntryFiles(entry, prefix = '') {
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      return [{ file, name: `${prefix}${file.name}` }];
    }
    if (!entry.isDirectory) {
      return [];
    }
    const reader = entry.createReader();
    const children = [];
    while (true) {
      const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
      if (!batch.length) break;
      children.push(...batch);
    }
    return (await Promise.all(children.map((child) => droppedEntryFiles(child, `${prefix}${entry.name}/`)))).flat();
  }

  async function uploadFileItems(files, paneId = '') {
    const found = paneId ? findPaneState(paneId) : null;
    if (!files.length) {
      return;
    }
    const form = new FormData();
    files.forEach((item) => form.append('files', item.file, item.name));
    try {
      await uploadWithProgress(`/api/files/upload?path=${encodeURIComponent(found?.pane.path || state.filePath)}`, form, paneId);
      if (found) {
        await loadFilesPane(found.pane);
      } else {
        await loadFiles(state.filePath);
      }
      showToast('Upload complete.', 'success');
    } catch (error) {
      if (found) {
        filesPaneData(paneId).error = error.message;
      } else {
        state.fileError = error.message;
      }
      showToast(error.message);
      found ? updateFilesPane(paneId) : renderFilePanel();
    } finally {
      setFileStatus('', paneId);
    }
  }

  function setFileStatus(message, paneId = '') {
    if (paneId) {
      const pane = document.querySelector(`[data-pane="${paneId}"]`);
      const target = pane?.querySelector(`[data-pane-upload-status="${paneId}"]`);
      if (target) {
        target.textContent = message;
        target.closest('.pane-title')?.classList.toggle('uploading', Boolean(message));
        syncPaneTitleWidth(pane);
      }
      return;
    }
    const target = document.querySelector('.file-panel .file-error');
    if (target) {
      target.textContent = message;
    }
  }

  function uploadWithProgress(url, form, paneId = '') {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      if (state.token) {
        xhr.setRequestHeader('Authorization', `Bearer ${state.token}`);
      }
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          setFileStatus('0%', paneId);
          return;
        }
        const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
        setFileStatus(`${percent}%`, paneId);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
          return;
        }
        let message = xhr.responseText || 'Upload failed.';
        try {
          message = JSON.parse(message).error || message;
        } catch (error) {
          // Keep the raw response text.
        }
        if (xhr.status === 401) {
          clearToken();
          renderLogin();
        }
        reject(new Error(message));
      };
      xhr.onerror = () => reject(new Error('Upload failed.'));
      xhr.send(form);
    });
  }

  async function togglePathBookmark(path, paneId) {
    if (!path) {
      return;
    }
    const paneData = filesPaneData(paneId);
    const bookmarked = paneData.bookmarks.some((bookmark) => bookmark.path.toLowerCase() === path.toLowerCase());
    try {
      const result = await api('/api/files/bookmarks', {
        method: bookmarked ? 'DELETE' : 'POST',
        body: JSON.stringify({ name: path, path })
      });
      paneData.bookmarks = result.bookmarks || [];
      updateFilesPane(paneId);
    } catch (error) {
      state.fileError = error.message;
      showToast(error.message);
      updateFilesPane(paneId);
    }
  }

  function formatBytes(value) {
    const size = Number(value) || 0;
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${Math.round(size / 1024)} KB`;
    }
    return `${Math.round(size / 1024 / 1024)} MB`;
  }

  function wirePaneControls(root) {
    findAll(root, '[data-close-pane]').forEach((button) => {
      button.onclick = async (event) => {
        event.stopPropagation();
        await closePane(button.dataset.closePane);
      };
      button.ondblclick = (event) => event.stopPropagation();
    });
    findAll(root, '[data-pane]').forEach((pane) => {
      syncPaneTitleWidth(pane);
      pane.onclick = (event) => {
        if (event.target.closest('.terminal') && pane.dataset.pane === state.activePaneId) {
          return;
        }
        setActivePane(pane.dataset.pane, pane.dataset.paneType !== 'files');
      };
    });
    findAll(root, '[data-pane-title]').forEach((title) => {
      title.onpointerdown = startPaneMove;
      title.ontouchstart = startPaneSwipe;
      title.ondblclick = (event) => {
        const label = title.querySelector('[data-rename-pane]');
        if (!label) return;
        cancelClick();
        event.stopPropagation();
        renamePane(title.dataset.paneTitle, label.textContent);
      };
    });
    findAll(root, '[data-rename-pane]').forEach((label) => {
      label.ondblclick = (event) => {
        event.stopPropagation();
        renamePane(label.dataset.renamePane, label.textContent);
      };
    });
    findAll(root, '[data-pane-resize]').forEach((handle) => {
      handle.onpointerdown = startPaneResize;
    });
  }

  function startPaneSwipe(event) {
    if (!event.touches || event.touches.length !== 1 || event.target.closest('button, [data-browser-tab], [data-notepad-tab], [data-pane-tab]')) {
      return;
    }
    const touch = event.touches[0];
    state.swipeStart = { x: touch.clientX, y: touch.clientY, paneId: event.currentTarget.dataset.paneTitle };
    event.currentTarget.ontouchend = finishPaneSwipe;
  }

  function finishPaneSwipe(event) {
    const start = state.swipeStart;
    state.swipeStart = null;
    if (!start || !event.changedTouches || !event.changedTouches.length) {
      return;
    }
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) {
      return;
    }
    switchPaneByOffset(dx < 0 ? 1 : -1);
  }

  async function switchPaneByOffset(offset) {
    const session = activeSession();
    const tab = activeTab(session);
    if (!tab || tab.panes.length < 2) {
      return;
    }
    const index = tab.panes.findIndex((pane) => pane.id === state.activePaneId);
    const nextIndex = (index + offset + tab.panes.length) % tab.panes.length;
    await setActivePane(tab.panes[nextIndex].id);
  }

  function wirePaneLinks(root) {
    findAll(root, '[data-pane-link]').forEach((button) => {
      button.onclick = (event) => {
        scheduleClick(event, async () => {
          const found = findPaneState(button.dataset.paneLink);
          if (found && found.session.id === state.activeSessionId) {
            await setActivePane(button.dataset.paneLink);
            return;
          }
          state.activeSessionId = button.dataset.session;
          state.activePaneId = button.dataset.paneLink;
          await api(`/api/panes/${state.activePaneId}/activate`, { method: 'POST' });
          await loadState();
        });
      };
    });
  }

  function findAll(root, selector) {
    const items = [];
    if (root.matches?.(selector)) {
      items.push(root);
    }
    items.push(...root.querySelectorAll(selector));
    return items;
  }

  function scheduleClick(event, handler) {
    if (event.detail > 1) {
      cancelClick();
      return;
    }
    cancelClick();
    state.clickTimer = window.setTimeout(() => {
      state.clickTimer = null;
      handler();
    }, isMobileLayout() ? 420 : 220);
  }

  function installSessionTabTouchRename(button) {
    button.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'touch') {
        return;
      }
      const now = Date.now();
      const previous = state.lastSessionTap;
      state.lastSessionTap = { sessionId: button.dataset.tabSession, at: now };
      if (!previous || previous.sessionId !== button.dataset.tabSession || now - previous.at > 420) {
        return;
      }
      state.suppressSessionClickUntil = now + 500;
      state.lastSessionTap = null;
      cancelClick();
      event.preventDefault();
      const label = button.querySelector('[data-rename-session]');
      if (label) {
        renameSession(button.dataset.tabSession, label.textContent);
      }
    });
  }

  function cancelClick() {
    if (state.clickTimer) {
      window.clearTimeout(state.clickTimer);
      state.clickTimer = null;
    }
  }

  async function closeSession(sessionId) {
    try {
      await api(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      state.activeSessionId = '';
      state.activePaneId = '';
      await loadState();
    } catch (error) {
      showToast(error.message);
    }
  }

  async function closePane(paneId) {
    if (!paneId) {
      return;
    }
    const found = findPaneState(paneId);
    if (!found) {
      return;
    }

    let result;
    try {
      result = await api(`/api/panes/${paneId}`, { method: 'DELETE' });
      if (!result.ok) {
        return;
      }
    } catch (error) {
      showToast(error.message);
      return;
    }

    clearUsageRefresh(paneId);
    const index = found.tab.panes.findIndex((pane) => pane.id === paneId);
    found.tab.panes.splice(index, 1);
    const nextPane = found.tab.panes[Math.max(0, index - 1)] || found.tab.panes[0];
    found.tab.activePaneId = nextPane?.id || '';
    found.session.activePaneId = nextPane?.id || '';
    state.activePaneId = nextPane?.id || '';

    (found.pane.terminalTabs || []).forEach((tab) => disposeTerminal(tab.id));
    state.browserConnections.get(paneId)?.dispose();
    state.browserConnections.delete(paneId);
    delete state.filePaneData[paneId];
    (found.pane.notepadTabs || []).forEach((tab) => {
      delete state.notepadTabData[tab.id];
      window.clearTimeout(state.notepadAutosaveTimers.get(tab.id));
      state.notepadAutosaveTimers.delete(tab.id);
    });
    document.querySelector(`[data-pane="${paneId}"]`)?.remove();
    renderSidebarPaneList();
    updateActivePaneUi();
    paneTerminal(state.activePaneId)?.term.focus();
  }

  function startSidebarResize(event) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = state.sidebarWidth || Number(state.config.ui?.sidebar_width) || 286;
    const onMove = (moveEvent) => {
      const width = Math.max(180, Math.min(520, startWidth + moveEvent.clientX - startX));
      state.sidebarWidth = width;
      localStorage.setItem('wps7.sidebarWidth', String(width));
      document.querySelector('.app')?.style.setProperty('--sidebar-width', `${width}px`);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function editInline(label, value, save, renderLabel) {
    const input = document.createElement('input');
    input.className = 'inline-rename';
    input.value = value.trim();
    label.replaceWith(input);
    input.focus();
    input.select();

    let committed = false;
    const commit = async () => {
      if (committed) {
        return;
      }
      committed = true;
      const nextValue = input.value.trim();
      try {
        if (nextValue && nextValue !== value.trim()) {
          await save(nextValue);
        }
        input.replaceWith(renderLabel(nextValue || value.trim()));
      } catch (error) {
        showToast(error.message);
        input.replaceWith(renderLabel(value.trim()));
      }
    };

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        commit();
      }
      if (event.key === 'Escape') {
        committed = true;
        loadState();
      }
    });
    input.addEventListener('blur', commit);
  }

  function renameSession(sessionId, value) {
    const label = document.querySelector(`[data-rename-session="${sessionId}"]`);
    editInline(label, value, async (name) => {
      await api(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name })
      });
      const session = state.sessions.find((candidate) => candidate.id === sessionId);
      if (session) {
        session.name = name;
      }
      updateSidebarLabels();
    }, (name) => {
      const nextLabel = document.createElement('span');
      nextLabel.dataset.renameSession = sessionId;
      nextLabel.textContent = name;
      nextLabel.ondblclick = (event) => {
        cancelClick();
        event.stopPropagation();
        renameSession(sessionId, nextLabel.textContent);
      };
      return nextLabel;
    });
  }

  function renamePane(paneId, value) {
    const label = document.querySelector(`[data-rename-pane="${paneId}"]`);
    editInline(label, value, async (title) => {
      await api(`/api/panes/${paneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title })
      });
      const found = findPaneState(paneId);
      if (found) {
        found.pane.title = title;
      }
      updateSidebarLabels();
    }, (title) => {
      const nextLabel = document.createElement('span');
      nextLabel.dataset.renamePane = paneId;
      nextLabel.textContent = title;
      nextLabel.ondblclick = (event) => {
        event.stopPropagation();
        renamePane(paneId, nextLabel.textContent);
      };
      return nextLabel;
    });
  }

  function findPaneState(paneId) {
    for (const session of state.sessions) {
      for (const tab of session.tabs) {
        const pane = tab.panes.find((candidate) => candidate.id === paneId);
        if (pane) {
          return { session, tab, pane };
        }
      }
    }
    return null;
  }

  function updateSidebarLabels() {
    const rows = new Map(sidebarPaneRows().map((row) => [row.pane.id, row]));
    app.querySelectorAll('[data-pane-link]').forEach((button) => {
      const row = rows.get(button.dataset.paneLink);
      if (!row) {
        return;
      }
      const label = button.querySelector('[data-pane-label]');
      if (label) {
        label.textContent = row.label;
      }
    });
  }

  async function setActivePane(paneId, reloadFiles = true) {
    if (state.activePaneId === paneId) {
      return;
    }

    clearFileSelections();
    state.activePaneId = paneId;
    updateActivePaneUi();
    try {
      await api(`/api/panes/${paneId}/activate`, { method: 'POST' });
    } catch (error) {
      showToast(error.message);
      return;
    }
    const terminal = paneTerminal(paneId);
    if (terminal) {
      terminal.sendResize();
      terminal.term.focus();
    } else {
      const found = findPaneState(paneId);
      if (found?.pane.type === 'files' && reloadFiles) {
        await loadFilesPane(found.pane);
      }
    }
  }

  function updateActivePaneUi() {
    app.querySelectorAll('[data-pane]').forEach((pane) => {
      pane.classList.toggle('active', pane.dataset.pane === state.activePaneId);
    });
    app.querySelectorAll('[data-pane-link]').forEach((button) => {
      button.classList.toggle('active', button.dataset.paneLink === state.activePaneId);
    });
    ensureActivePaneVisible();
  }

  function setSidebarOpen(open) {
    state.sidebarOpen = Boolean(open);
    localStorage.setItem('wps7.sidebarOpen', String(state.sidebarOpen));
    app.querySelector('.app')?.classList.toggle('sidebar-closed', !state.sidebarOpen);
    app.querySelectorAll('[data-action="toggle"]').forEach((button) => {
      button.setAttribute('aria-expanded', String(state.sidebarOpen));
      button.title = state.sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar';
    });
  }

  function setSidebarPinned(pinned) {
    state.sidebarPinned = Boolean(pinned);
    localStorage.setItem('wps7.sidebarPinned', String(state.sidebarPinned));
    const root = app.querySelector('.app');
    root?.classList.toggle('sidebar-pinned', state.sidebarPinned);
    const button = app.querySelector('[data-sidebar-pin]');
    if (button) {
      const label = state.sidebarPinned ? 'Unpin sidebar' : 'Pin sidebar';
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(state.sidebarPinned));
      button.title = label;
      button.querySelector('.rail-icon').innerHTML = fileActionIcon(state.sidebarPinned ? 'pin-off' : 'pin');
    }
    setSidebarOpen(true);
  }

  function sendMobileTerminalKey(button) {
    const pane = button.closest('[data-pane]');
    const terminal = paneTerminal(pane?.dataset.pane);
    if (!terminal) {
      return;
    }
    const keybar = button.closest('.mobile-keybar');
    const action = button.dataset.terminalAction;
    const value = button.dataset.terminalValue || '';
    if (action === 'modifier') {
      const active = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(active));
      terminal.term.focus();
      return;
    }
    const modifierButtons = Array.from(keybar.querySelectorAll('[data-terminal-action="modifier"]'));
    const prefix = modifierButtons
      .filter((modifier) => modifier.getAttribute('aria-pressed') === 'true')
      .map((modifier) => modifierShortcutToken(modifier.dataset.terminalValue))
      .filter(Boolean);
    modifierButtons.forEach((modifier) => modifier.setAttribute('aria-pressed', 'false'));
    const input = action === 'text'
      ? value
      : terminalShortcutSequence([...prefix, value].join('+'));
    terminal.term.input(input, true);
    terminal.term.focus();
  }

  function modifierShortcutToken(value) {
    return { Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift' }[value] || '';
  }

  function terminalShortcutSequence(shortcut) {
    const parts = String(shortcut || '').split('+').map((part) => part.trim()).filter(Boolean);
    const key = parts.pop() || '';
    const modifiers = new Set(parts.map((part) => part.toLowerCase()));
    const named = {
      Escape: '\x1b',
      Tab: '\t',
      Enter: '\r',
      Backspace: '\x7f',
      ArrowLeft: '\x1b[D',
      ArrowDown: '\x1b[B',
      ArrowUp: '\x1b[A',
      ArrowRight: '\x1b[C'
    };
    const arrows = { ArrowLeft: 'D', ArrowDown: 'B', ArrowUp: 'A', ArrowRight: 'C' };
    if (arrows[key] && modifiers.size) {
      const modifier = 1 + (modifiers.has('shift') ? 1 : 0) + (modifiers.has('alt') ? 2 : 0) + (modifiers.has('ctrl') || modifiers.has('control') ? 4 : 0);
      return `\x1b[1;${modifier}${arrows[key]}`;
    }
    if ((modifiers.has('ctrl') || modifiers.has('control')) && key.length === 1) {
      const code = key.toUpperCase().charCodeAt(0);
      return code >= 64 && code <= 95 ? String.fromCharCode(code & 31) : key;
    }
    let value = named[key] || (modifiers.has('shift') ? key.toUpperCase() : key);
    if (modifiers.has('alt')) {
      value = `\x1b${value}`;
    }
    return value;
  }

  function applyMobileControlModifier(element, data) {
    const control = element.closest('[data-pane]')?.querySelector('[data-terminal-action="modifier"][data-terminal-value="Control"]');
    if (!control || control.getAttribute('aria-pressed') !== 'true' || !data) {
      return data;
    }
    control.setAttribute('aria-pressed', 'false');
    if (data.length !== 1) {
      return data;
    }
    if (data === '?') {
      return '\x7f';
    }
    const code = data.toUpperCase().charCodeAt(0);
    return code >= 64 && code <= 95 ? String.fromCharCode(code & 31) : data;
  }

  function closeFloatingSidebarFromOutside(event) {
    if (!app.querySelector('.app') || !state.sidebarOpen || (state.sidebarPinned && !isMobileLayout())) {
      return;
    }
    if (event.target.closest?.('.sidebar, [data-action="toggle"]')) {
      return;
    }
    setSidebarOpen(false);
  }

  function closeMobileSidebarAfterAction(event) {
    if (!isMobileLayout() || !event.target.closest('button') || event.target.closest('[data-action="toggle"]')) {
      return;
    }
    setSidebarOpen(false);
  }

  async function setThemeLive(theme, persist = false) {
    applyTheme(theme);
    for (const item of state.terminals.values()) {
      item.term.options.theme = terminalTheme();
    }
    app.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const nextTheme = themeMode() === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', `Switch to ${nextTheme} mode`);
      button.title = 'Switch theme';
      const icon = button.querySelector('.rail-icon');
      const label = button.querySelector('.rail-label');
      if (icon) icon.textContent = themeMode() === 'dark' ? '☾' : '☀';
      if (label) label.textContent = themeMode() === 'dark' ? 'Dark mode' : 'Light mode';
    });
    if (persist && state.token) {
      try {
        const config = await api('/api/settings', {
          method: 'POST',
          body: JSON.stringify({ custom_theme: { mode: themeMode() } })
        });
        state.config.custom_theme = config.custom_theme;
      } catch (error) {
        showToast(error.message);
      }
    }
  }

  function wirePaneGrid(root) {
    const grid = root.querySelector?.('.pane-grid') || (root.matches?.('.pane-grid') ? root : null);
    if (!grid) {
      return;
    }
    // Double-clicking empty board space opens a pane in a new column.
    grid.ondblclick = async (event) => {
      if (event.target.closest('[data-pane]')) {
        return;
      }
      await createPane();
    };
    grid.addEventListener('wheel', (event) => {
      const paneEl = event.ctrlKey && event.shiftKey ? event.target.closest?.('[data-pane]') : null;
      if (!paneEl) {
        return; // the board scrolls natively; panes keep their own scrolling
      }
      event.preventDefault();
      event.stopPropagation();
      changePaneFontSize(paneEl.dataset.pane, event.deltaY < 0 ? 1 : -1);
    }, { passive: false, capture: true });
  }

  async function createPane(preferredLayout) {
    const session = activeSession();
    const tab = activeTab(session);
    const basePaneId = state.activePaneId || tab?.activePaneId || tab?.panes[0]?.id;
    if (!session || !tab || !basePaneId) {
      return;
    }

    try {
      const pane = await api(`/api/panes/${basePaneId}/split`, {
        method: 'POST',
        body: JSON.stringify({ direction: 'auto' })
      });
      if (preferredLayout) {
        try {
          const result = await api(`/api/panes/${pane.id}/layout`, {
            method: 'PATCH',
            body: JSON.stringify({ layout: preferredLayout })
          });
          pane.layout = result.layout || preferredLayout;
        } catch (error) {
          showToast(error.message);
        }
      }
      appendPaneToWorkspace(session, tab, pane);
    } catch (error) {
      showToast(error.message);
    }
  }


  // Which cell the pointer is over, in board coordinates so a scrolled board
  // still resolves to the cell drawn under the cursor.
  function pointerCell(grid, clientX, clientY) {
    const rect = grid.getBoundingClientRect();
    const rowHeight = rect.height / verticalSlots();
    return {
      x: Math.floor((clientX - rect.left + grid.scrollLeft) / gridSize()),
      y: Math.floor((clientY - rect.top) / rowHeight)
    };
  }

  // Drag and resize both work in whole-cell deltas: the pointer's starting cell
  // is subtracted from its current one, so the pane can only ever land on a
  // cell boundary and never drifts by a stray pixel.
  function startPaneResize(event) {
    event.preventDefault();
    event.stopPropagation();
    const handle = event.currentTarget;
    const paneId = handle.dataset.paneResize;
    const paneElement = handle.closest('[data-pane]');
    const grid = app.querySelector('.pane-grid');
    const found = findPaneState(paneId);
    if (!paneElement || !grid || !found) {
      return;
    }

    const direction = handle.dataset.paneResizeDirection || 'se';
    const startCell = pointerCell(grid, event.clientX, event.clientY);
    const startLayout = normalizePaneLayout(found.pane.layout);
    let nextLayout = startLayout;

    handle.setPointerCapture(event.pointerId);
    const onMove = (moveEvent) => {
      const cell = pointerCell(grid, moveEvent.clientX, moveEvent.clientY);
      const dx = cell.x - startCell.x;
      const dy = cell.y - startCell.y;
      const candidate = { ...startLayout };
      if (direction.includes('e')) candidate.w = startLayout.w + dx;
      if (direction.includes('w')) {
        candidate.x = startLayout.x + dx;
        candidate.w = startLayout.w - dx;
      }
      if (direction.includes('s')) candidate.h = startLayout.h + dy;
      if (direction.includes('n')) {
        candidate.y = startLayout.y + dy;
        candidate.h = startLayout.h - dy;
      }
      // Keep the anchored edge still once the pane is down to a single cell.
      if (direction.includes('w') && candidate.w < 1) {
        candidate.x = startLayout.x + startLayout.w - 1;
      }
      if (direction.includes('n') && candidate.h < 1) {
        candidate.y = startLayout.y + startLayout.h - 1;
      }
      nextLayout = normalizePaneLayout(candidate);
      applyPaneLayoutStyle(paneElement, nextLayout);
      paneElement.classList.toggle('invalid', wouldOverlap(found.tab, paneId, nextLayout));
    };
    const onUp = async () => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      paneElement.classList.remove('invalid');
      // Snapping back locally avoids a round trip the server would only refuse.
      if (wouldOverlap(found.tab, paneId, nextLayout)) {
        applyPaneLayoutStyle(paneElement, startLayout);
        return;
      }
      if (!await savePaneLayoutLocal(paneId, nextLayout)) {
        applyPaneLayoutStyle(paneElement, startLayout);
      }
      paneTerminal(paneId)?.sendResize();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }

  function startPaneMove(event) {
    if (event.button !== 0 || event.target.closest('.pane-close, button, input, [data-browser-tab], [data-notepad-tab], [data-pane-tab]')) {
      return;
    }
    event.preventDefault();

    const title = event.currentTarget;
    const paneId = title.dataset.paneTitle;
    const paneElement = title.closest('[data-pane]');
    const grid = app.querySelector('.pane-grid');
    const found = findPaneState(paneId);
    if (!paneElement || !grid || !found) {
      return;
    }

    const startX = event.clientX;
    const startY = event.clientY;
    const startCell = pointerCell(grid, startX, startY);
    const startLayout = normalizePaneLayout(found.pane.layout);
    let nextLayout = startLayout;
    let moved = false;

    title.setPointerCapture(event.pointerId);
    const onMove = (moveEvent) => {
      if (!moved && Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) < 6) {
        return;
      }
      if (!moved) {
        moved = true;
        cancelClick();
        paneElement.classList.add('dragging');
      }
      const cell = pointerCell(grid, moveEvent.clientX, moveEvent.clientY);
      nextLayout = normalizePaneLayout({
        ...startLayout,
        x: startLayout.x + (cell.x - startCell.x),
        y: startLayout.y + (cell.y - startCell.y)
      });
      applyPaneLayoutStyle(paneElement, nextLayout);
      paneElement.classList.toggle('invalid', wouldOverlap(found.tab, paneId, nextLayout));
    };
    const onUp = async () => {
      title.removeEventListener('pointermove', onMove);
      title.removeEventListener('pointerup', onUp);
      paneElement.classList.remove('dragging', 'invalid');
      if (!moved) {
        return;
      }
      // Snapping back locally avoids a round trip the server would only refuse.
      if (wouldOverlap(found.tab, paneId, nextLayout)) {
        applyPaneLayoutStyle(paneElement, startLayout);
        await setActivePane(paneId);
        return;
      }
      if (!await savePaneLayoutLocal(paneId, nextLayout)) {
        applyPaneLayoutStyle(paneElement, startLayout);
      }
      await setActivePane(paneId);
    };
    title.addEventListener('pointermove', onMove);
    title.addEventListener('pointerup', onUp);
  }

  async function savePaneLayoutLocal(paneId, layout) {
    try {
      const result = await api(`/api/panes/${paneId}/layout`, {
        method: 'PATCH',
        body: JSON.stringify({ layout })
      });
      const found = findPaneState(paneId);
      if (found) {
        found.pane.layout = result.layout || layout;
      }
      return true;
    } catch (error) {
      showToast(error.message);
      return false;
    }
  }

  function syncPaneTitleWidth(paneElement) {
    const label = paneElement?.querySelector('[data-rename-pane]');
    if (!label || paneElement.clientWidth <= 0) {
      return;
    }
    const status = paneElement.querySelector('.pane-upload-status:not(:empty)');
    const available = Math.max(0, paneElement.clientWidth - 70 - (status ? status.offsetWidth + 8 : 0));
    label.style.width = `${available}px`;
    label.style.maxWidth = `${available}px`;
  }

  function applyPaneLayoutStyle(paneElement, layout) {
    if (!paneElement) {
      return;
    }
    paneElement.style.gridColumn = `${layout.x + 1} / span ${layout.w}`;
    paneElement.style.gridRow = `${layout.y + 1} / span ${layout.h}`;
    syncPaneTitleWidth(paneElement);
    paneElement.querySelectorAll('[data-paged-toolbar]').forEach(updatePagedToolbar);
  }

  function applyPaneLayoutUpdates(tab, paneLayouts) {
    if (!Array.isArray(paneLayouts)) {
      return;
    }
    for (const update of paneLayouts) {
      const pane = tab.panes.find((candidate) => candidate.id === update.id);
      if (!pane) continue;
      const previous = normalizePaneLayout(pane.layout);
      const next = normalizePaneLayout(update.layout);
      pane.layout = next;
      applyPaneLayoutStyle(document.querySelector(`[data-pane="${pane.id}"]`), next);
      if (previous.w !== next.w || previous.h !== next.h) {
        paneTerminal(pane.id)?.sendResize();
      }
    }
  }

  function appendPaneToWorkspace(session, tab, response) {
    const { paneLayouts, ...pane } = response;
    applyPaneLayoutUpdates(tab, paneLayouts);
    tab.panes.push(pane);
    tab.activePaneId = pane.id;
    session.activeTabId = tab.id;
    state.activeSessionId = session.id;
    state.activePaneId = pane.id;

    const grid = app.querySelector('.pane-grid');
    grid?.insertAdjacentHTML('beforeend', renderPane(pane));
    const paneElement = grid?.querySelector(`[data-pane="${pane.id}"]`);
    if (paneElement) {
      wirePaneControls(paneElement);
      wireFilesPane(paneElement);
      wireBrowserPane(paneElement);
      wireNotepadPane(paneElement);
      wirePaneTabStrips(paneElement);
      wireMobileKeybarButtons(paneElement);
    }
    renderSidebarPaneList();
    updateActivePaneUi();
    mountPaneContent(pane);
  }

  const DEFAULT_GRID_SIZE = 120;
  const DEFAULT_VERTICAL_SLOTS = 12;
  const MAX_VERTICAL_SLOTS = 24;
  const DEFAULT_PANE_CELLS = 6;

  // Cell width is a fixed pixel size because the board scrolls sideways; cell
  // height is the viewport divided by the configured slot count, so it is only
  // ever resolved in CSS.
  function gridSize() {
    const size = Math.round(Number(state.config?.ui?.grid_size));
    return Number.isFinite(size) ? Math.min(400, Math.max(20, size)) : DEFAULT_GRID_SIZE;
  }

  function verticalSlots() {
    const slots = Math.round(Number(state.config?.ui?.vertical_slots));
    return Number.isFinite(slots) ? Math.min(MAX_VERTICAL_SLOTS, Math.max(1, slots)) : DEFAULT_VERTICAL_SLOTS;
  }

  // Mirrors sanitizeLayout in src/state.js: whole cells, at least one of each,
  // never taller than the board, and pushed back so it always fits.
  function normalizePaneLayout(layout, slots = verticalSlots()) {
    const cell = (value, fallback) => {
      const rounded = Math.round(Number(value));
      return Number.isFinite(rounded) ? rounded : fallback;
    };
    const w = Math.max(1, cell(layout?.w, DEFAULT_PANE_CELLS));
    const h = Math.min(slots, Math.max(1, cell(layout?.h, slots)));
    return {
      x: Math.max(0, cell(layout?.x, 0)),
      y: Math.min(Math.max(0, cell(layout?.y, 0)), slots - h),
      w,
      h
    };
  }

  // Mirrors overlaps() in src/state.js: sharing a cell is a collision, merely
  // touching edges is not.
  function layoutsOverlap(a, b) {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  }

  // Checked while dragging so an illegal drop shows up under the cursor rather
  // than as a rejection after the fact.
  function wouldOverlap(tab, paneId, layout) {
    return (tab?.panes || []).some((pane) => pane.id !== paneId
      && layoutsOverlap(layout, normalizePaneLayout(pane.layout)));
  }

  // The board only scrolls horizontally, so bringing a pane into view is just
  // scrolling to the pane itself.
  function ensureActivePaneVisible(behavior = 'smooth') {
    if (isMobileLayout()) {
      return; // the active pane already fills the grid
    }
    const pane = app.querySelector(`[data-pane="${state.activePaneId}"]`);
    if (!pane) {
      return;
    }
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    pane.scrollIntoView({
      behavior: reduceMotion ? 'auto' : behavior,
      inline: 'nearest',
      block: 'nearest'
    });
  }

  // The dashed backdrop and the pane placement read the same two variables, so
  // the cells a pane snaps to are exactly the cells drawn behind it.
  function boardStyle() {
    return `--grid-size: ${gridSize()}px; --vertical-slots: ${verticalSlots()};`;
  }

  function mountTerminal(paneId, terminalTabId) {
    const element = document.getElementById(`terminal-${terminalTabId}`);
    if (!element || state.terminals.has(terminalTabId)) {
      return;
    }

    const term = new Terminal({
      cursorBlink: state.config.terminal?.cursor_blink !== false,
      fontFamily: state.config.ui?.terminal_font_family || 'Consolas, "Cascadia Mono", monospace',
      fontSize: paneFontSize(findPaneState(paneId)?.pane),
      scrollback: Number(state.config.persistence?.scrollback_lines) || 10000,
      windowsPty: { backend: 'conpty' },
      theme: terminalTheme()
    });
    const fit = new FitAddon.FitAddon();
    term.loadAddon(fit);
    term.open(element);
    installMobileTerminalTouchScroll(element, term);
    fitTerminal(term, fit, true);
    element.addEventListener('click', () => term.focus());
    element.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      openTerminalContextMenu(terminalTabId, event.clientX, event.clientY);
    });
    term.attachCustomKeyEventHandler((event) => terminalShortcut(terminalTabId, event));
    term.onTitleChange((title) => updatePaneTitleFromTerminal(paneId, terminalTabId, title));
    term.onBell(() => showTerminalNotification(paneId));
    term.parser.registerOscHandler(9, (data) => handleTerminalOscNotification(paneId, 9, data));
    term.parser.registerOscHandler(99, (data) => handleTerminalOscNotification(paneId, 99, data));
    term.parser.registerOscHandler(777, (data) => handleTerminalOscNotification(paneId, 777, data));

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const writer = createTerminalWriter(term, element);
    let ws = null;
    let reconnectTimer = 0;
    let reconnectDelay = 500;
    let disposed = false;
    let lastCols = 0;
    let lastRows = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    let resizeFrame = 0;
    let resizeTimer = 0;
    const sendResize = () => {
      if (!element.getClientRects().length) {
        return;
      }
      const rect = element.getBoundingClientRect();
      if (Math.round(rect.width) === lastWidth && Math.round(rect.height) === lastHeight) {
        return;
      }
      lastWidth = Math.round(rect.width);
      lastHeight = Math.round(rect.height);
      fitTerminal(term, fit, Boolean(state.config.terminal?.auto_scroll_on_resize));
      if (ws?.readyState === WebSocket.OPEN) {
        if (term.cols !== lastCols || term.rows !== lastRows) {
          lastCols = term.cols;
          lastRows = term.rows;
          ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
        }
      }
    };
    const scheduleResize = () => {
      if (resizeFrame) {
        return;
      }
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
      resizeTimer = window.setTimeout(() => {
        resizeTimer = 0;
        scheduleResizeNow();
      }, Number(state.config.terminal?.resize_debounce_ms) || 100);
    };
    const scheduleResizeNow = () => {
      if (resizeFrame) {
        return;
      }
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        sendResize();
      });
    };
    const connect = () => {
      if (disposed) {
        return;
      }
      const socket = new WebSocket(`${protocol}//${location.host}/ws?paneId=${encodeURIComponent(terminalTabId)}&token=${encodeURIComponent(state.token)}`);
      ws = socket;
      socket.onopen = () => {
        reconnectDelay = 500;
        lastWidth = 0;
        lastHeight = 0;
        sendResize();
      };
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === 'snapshot') {
          term.reset();
          writer.write(message.data || '');
        }
        if (message.type === 'output') {
          writer.write(message.data);
        }
      };
      socket.onclose = (event) => {
        if (disposed || socket !== ws) {
          return;
        }
        if (event.code === 1008) {
          showToast(event.reason || 'Terminal connection rejected.');
          if (event.reason === 'Login required') {
            clearToken();
            renderLogin();
          }
          return;
        }
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 10000);
      };
    };
    connect();
    term.onData((data) => {
      const input = applyMobileControlModifier(element, data);
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data: input }));
      }
    });
    term.onResize((size) => {
      if (ws?.readyState === WebSocket.OPEN && (size.cols !== lastCols || size.rows !== lastRows)) {
        lastCols = size.cols;
        lastRows = size.rows;
        ws.send(JSON.stringify({ type: 'resize', cols: size.cols, rows: size.rows }));
      }
    });
    const resizeObserver = new ResizeObserver(scheduleResize);
    resizeObserver.observe(element);
    window.addEventListener('resize', scheduleResize);
    state.terminals.set(terminalTabId, {
      term,
      fit,
      writer,
      resizeObserver,
      sendResize: scheduleResize,
      sendClear: () => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'clear' }));
        }
      },
      disposeConnection: () => {
        disposed = true;
        window.clearTimeout(reconnectTimer);
        ws?.close();
      },
      cancelResize: () => {
        if (resizeTimer) {
          window.clearTimeout(resizeTimer);
          resizeTimer = 0;
        }
        if (resizeFrame) {
          window.cancelAnimationFrame(resizeFrame);
          resizeFrame = 0;
        }
      }
    });
    if (paneId === state.activePaneId) {
      term.focus();
    }
  }

  // Reading the xterm buffer instead of the DOM keeps wrapped lines joined and
  // drops the padding spaces the renderer adds to fill each row.
  function copyTerminalSelection(terminalTabId) {
    const term = state.terminals.get(terminalTabId)?.term;
    const text = term?.getSelection() || '';
    if (!text) {
      showToast('No text selected.');
      return;
    }
    copyBrowserText(text);
  }

  function pasteTerminalText(terminalTabId) {
    const terminal = state.terminals.get(terminalTabId);
    if (!terminal) {
      return;
    }
    const fallback = () => {
      terminal.term.focus();
      showToast('Clipboard access is unavailable. Press Ctrl+V to paste.');
    };
    if (!navigator.clipboard?.readText) {
      fallback();
      return;
    }
    navigator.clipboard.readText().then((text) => {
      if (text) {
        terminal.term.paste(text);
      }
    }, fallback);
  }

  function selectAllTerminal(terminalTabId) {
    const terminal = state.terminals.get(terminalTabId);
    terminal?.term.selectAll();
    terminal?.term.focus();
  }

  function clearTerminal(terminalTabId) {
    const terminal = state.terminals.get(terminalTabId);
    if (!terminal) {
      return;
    }
    terminal.term.clear();
    terminal.sendClear();
    terminal.term.focus();
  }

  // xterm hands every key here first; returning false keeps the shortcut out of
  // the shell. Ctrl+C is left alone so it still interrupts the running command.
  function terminalShortcut(terminalTabId, event) {
    if (event.type !== 'keydown' || event.altKey || event.metaKey) {
      return true;
    }
    const key = event.key.toLowerCase();
    // Insert pairs work in plain browser tabs, where Chrome keeps Ctrl+Shift+C.
    if (key === 'insert' && event.ctrlKey !== event.shiftKey) {
      event.preventDefault();
      if (event.ctrlKey) {
        copyTerminalSelection(terminalTabId);
      } else {
        pasteTerminalText(terminalTabId);
      }
      return false;
    }
    if (!event.ctrlKey || !event.shiftKey || event.altKey || event.metaKey) {
      return true;
    }
    switch (key) {
      case 'c':
        event.preventDefault();
        copyTerminalSelection(terminalTabId);
        return false;
      case 'v':
        event.preventDefault();
        pasteTerminalText(terminalTabId);
        return false;
      case 'a':
        event.preventDefault();
        selectAllTerminal(terminalTabId);
        return false;
      case 'l':
        event.preventDefault();
        clearTerminal(terminalTabId);
        return false;
      default:
        return true;
    }
  }

  function closeTerminalContextMenu() {
    document.querySelector('.terminal-context-menu')?.remove();
    document.removeEventListener('pointerdown', handleTerminalMenuOutside, true);
    document.removeEventListener('keydown', handleTerminalMenuKey, true);
  }

  function handleTerminalMenuOutside(event) {
    if (!event.target.closest('.terminal-context-menu')) {
      closeTerminalContextMenu();
    }
  }

  function handleTerminalMenuKey(event) {
    if (event.key === 'Escape') {
      closeTerminalContextMenu();
    }
  }

  function openTerminalContextMenu(terminalTabId, clientX, clientY) {
    closeTerminalContextMenu();
    const term = state.terminals.get(terminalTabId)?.term;
    if (!term) {
      return;
    }
    const items = [
      { label: 'Copy', shortcut: 'Ctrl+Shift+C', disabled: !term.hasSelection(), action: () => copyTerminalSelection(terminalTabId) },
      { label: 'Paste', shortcut: 'Ctrl+Shift+V', action: () => pasteTerminalText(terminalTabId) },
      { label: 'Select All', shortcut: 'Ctrl+Shift+A', action: () => selectAllTerminal(terminalTabId) },
      { label: 'Clear', shortcut: 'Ctrl+Shift+L', action: () => clearTerminal(terminalTabId) }
    ];
    const menu = document.createElement('div');
    menu.className = 'terminal-context-menu';
    menu.setAttribute('role', 'menu');
    menu.innerHTML = items.map((item, index) => `
      <button type="button" role="menuitem" class="terminal-context-item" data-terminal-context-index="${index}" ${item.disabled ? 'disabled' : ''}>${escapeHtml(item.label)}<span class="terminal-context-shortcut">${escapeHtml(item.shortcut)}</span></button>
    `).join('');
    document.body.appendChild(menu);
    menu.style.left = `${Math.min(clientX, window.innerWidth - menu.offsetWidth - 6)}px`;
    menu.style.top = `${Math.min(clientY, window.innerHeight - menu.offsetHeight - 6)}px`;
    menu.querySelectorAll('[data-terminal-context-index]').forEach((button) => {
      button.onclick = () => {
        const item = items[Number(button.dataset.terminalContextIndex)];
        closeTerminalContextMenu();
        item.action();
      };
    });
    menu.querySelector('button:not([disabled])')?.focus();
    document.addEventListener('pointerdown', handleTerminalMenuOutside, true);
    document.addEventListener('keydown', handleTerminalMenuKey, true);
  }

  function terminalCellAtTouch(element, term, touch) {
    const screen = element.querySelector('.xterm-screen');
    const rect = screen?.getBoundingClientRect();
    if (!rect?.width || !rect.height) {
      return null;
    }
    const column = Math.max(0, Math.min(term.cols - 1, Math.floor((touch.clientX - rect.left) / rect.width * term.cols)));
    const viewportRow = Math.max(0, Math.min(term.rows - 1, Math.floor((touch.clientY - rect.top) / rect.height * term.rows)));
    return { column, row: term.buffer.active.viewportY + viewportRow };
  }

  function terminalWordCell(line, column) {
    return /[\p{L}\p{N}_-]/u.test(line?.getCell(column)?.getChars() || '');
  }

  function selectTerminalWordAtTouch(element, term, touch) {
    const cell = terminalCellAtTouch(element, term, touch);
    const line = cell && term.buffer.active.getLine(cell.row);
    if (!cell || !line) {
      return null;
    }
    let start = cell.column;
    let end = cell.column;
    if (terminalWordCell(line, cell.column)) {
      while (start > 0 && terminalWordCell(line, start - 1)) {
        start -= 1;
      }
      while (end < term.cols - 1 && terminalWordCell(line, end + 1)) {
        end += 1;
      }
    }
    term.select(start, cell.row, end - start + 1);
    return { start: { column: start, row: cell.row }, end: { column: end, row: cell.row } };
  }

  function extendTerminalTouchSelection(element, term, anchor, touch) {
    const cell = terminalCellAtTouch(element, term, touch);
    if (!cell || !anchor) {
      return;
    }
    const beforeAnchor = cell.row < anchor.start.row || (cell.row === anchor.start.row && cell.column < anchor.start.column);
    const start = beforeAnchor ? cell : anchor.start;
    const end = beforeAnchor ? anchor.end : cell;
    const length = (end.row - start.row) * term.cols + end.column - start.column + 1;
    term.select(start.column, start.row, Math.max(1, length));
  }

  function installMobileTerminalTouchScroll(element, term) {
    const scrollSurface = element.querySelector('.xterm-scrollable-element');
    const longPressDelay = 500;
    const moveTolerance = 10;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let longPressTimer = 0;
    let selecting = false;
    let selectionAnchor = null;
    const cancelLongPress = () => {
      window.clearTimeout(longPressTimer);
      longPressTimer = 0;
    };
    element.addEventListener('touchstart', (event) => {
      cancelLongPress();
      selecting = false;
      selectionAnchor = null;
      if (!isMobileLayout() || event.touches.length !== 1) {
        lastY = 0;
        return;
      }
      const touch = event.touches[0];
      lastY = touch.clientY;
      startX = touch.clientX;
      startY = touch.clientY;
      const point = { clientX: touch.clientX, clientY: touch.clientY };
      longPressTimer = window.setTimeout(() => {
        selecting = true;
        lastY = 0;
        selectionAnchor = selectTerminalWordAtTouch(element, term, point);
        if (!selectionAnchor) {
          selecting = false;
          return;
        }
        element.classList.add('touch-selecting');
        navigator.vibrate?.(12);
      }, longPressDelay);
    }, { passive: true, capture: true });
    element.addEventListener('touchmove', (event) => {
      if (!isMobileLayout() || event.touches.length !== 1) {
        return;
      }
      const touch = event.touches[0];
      if (selecting) {
        event.preventDefault();
        extendTerminalTouchSelection(element, term, selectionAnchor, touch);
        return;
      }
      if (Math.hypot(touch.clientX - startX, touch.clientY - startY) > moveTolerance) {
        cancelLongPress();
      }
      if (!lastY) {
        return;
      }
      const nextY = touch.clientY;
      const deltaY = lastY - nextY;
      lastY = nextY;
      if (!deltaY) {
        return;
      }
      event.preventDefault();
      scrollSurface?.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaMode: 0,
        deltaY
      }));
    }, { passive: false, capture: true });
    element.addEventListener('touchend', (event) => {
      cancelLongPress();
      if (selecting) {
        event.preventDefault();
      }
      lastY = 0;
      selecting = false;
      selectionAnchor = null;
      element.classList.remove('touch-selecting');
    }, { passive: false, capture: true });
    element.addEventListener('touchcancel', () => {
      cancelLongPress();
      lastY = 0;
      selecting = false;
      selectionAnchor = null;
      element.classList.remove('touch-selecting');
    }, { passive: true, capture: true });
  }

  function createTerminalWriter(term, element) {
    const maxQueueLength = 2 * 1024 * 1024;
    let queue = '';
    let writing = false;
    let disposed = false;
    let cursorTimer = 0;

    const stabilizeTuiCursor = (data) => {
      const cursorMoves = data.match(/\x1b\[[0-9;?]*[Hf]/g)?.length || 0;
      const alternateScreen = term.buffer.active.type === 'alternate';
      if (!alternateScreen && !data.includes('\x1b[?1049h') && cursorMoves < 2) {
        return;
      }
      element?.classList.add('terminal-updating');
      clearTimeout(cursorTimer);
      cursorTimer = setTimeout(() => element?.classList.remove('terminal-updating'), 90);
    };

    const flush = () => {
      if (disposed || writing || !queue) {
        return;
      }
      const chunk = queue;
      queue = '';
      writing = true;
      term.write(chunk, () => {
        writing = false;
        flush();
      });
    };

    return {
      write(data) {
        if (disposed || !data) {
          return;
        }
        stabilizeTuiCursor(data);
        queue += data;
        if (queue.length > maxQueueLength) {
          queue = queue.slice(-maxQueueLength);
        }
        flush();
      },
      dispose() {
        disposed = true;
        queue = '';
        clearTimeout(cursorTimer);
        element?.classList.remove('terminal-updating');
      }
    };
  }

  function fitTerminal(term, fit, scrollToBottom = false) {
    try {
      fit.fit();
      if (scrollToBottom) {
        term.scrollToBottom();
      }
    } catch (error) {
      // xterm can throw while its DOM is being replaced.
    }
  }

  function disposeTerminals() {
    for (const item of state.terminals.values()) {
      disposeTerminalItem(item);
    }
    state.terminals.clear();
    for (const timer of state.terminalTitleTimers.values()) {
      window.clearTimeout(timer);
    }
    state.terminalTitleTimers.clear();
  }

  function disposeTerminal(terminalTabId) {
    window.clearTimeout(state.terminalTitleTimers.get(terminalTabId));
    state.terminalTitleTimers.delete(terminalTabId);
    const item = state.terminals.get(terminalTabId);
    if (!item) {
      return;
    }
    disposeTerminalItem(item);
    state.terminals.delete(terminalTabId);
  }

  function disposeTerminalItem(item) {
    window.removeEventListener('resize', item.sendResize);
    item.cancelResize();
    item.resizeObserver.disconnect();
    item.disposeConnection();
    item.writer?.dispose();
    item.term.dispose();
  }

  async function loadState() {
    const loaded = await api('/api/state');
    state.sessions = loaded.sessions;
    state.persistedActiveSessionId = loaded.activeSessionId;
    render();
  }

  async function load() {
    installKeyboardShortcuts();
    try {
      state.config = await api('/api/config');
      applyTheme(selectedThemeForMode(state.config.custom_theme?.mode || 'dark'));
      if (state.config.authRequired && !state.token) {
        renderLogin();
        return;
      }
      await loadState();
    } catch (error) {
      if (error.status === 401) {
        renderLogin();
        return;
      }
      renderConnectionError(error);
    }
  }

  function usageWindowMarkup(window) {
    const used = Math.max(0, Math.min(100, Number(window.usedPercent) || 0));
    const reset = window.resetsAt ? new Date(window.resetsAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short', hour12: false }) : 'Reset time unavailable';
    return `
      <div class="usage-window">
        <div class="usage-window-heading"><span>${escapeHtml(window.label)}</span><strong>${Math.round(used)}%</strong></div>
        <div class="usage-meter" role="progressbar" aria-label="${escapeAttr(window.label)} used" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(used)}"><i style="width:${used}%"></i></div>
        <small>${escapeHtml(reset)}</small>
      </div>
    `;
  }

  function usageProviderMarkup(provider) {
    if (provider.error) {
      return `
        <article class="usage-card usage-error-card">
          <header><div><h3>${escapeHtml(provider.label)}</h3><small>Unavailable</small></div><span class="usage-state">!</span></header>
          <p>${escapeHtml(provider.error)}</p>
          ${provider.provider === 'minimax' ? '<button class="secondary" type="button" data-usage-settings>Configure</button>' : ''}
        </article>
      `;
    }
    const windows = provider.provider === 'minimax'
      ? (provider.services || []).map((service) => `<div class="usage-service"><h4>${escapeHtml(service.label)}</h4>${(service.windows || []).map(usageWindowMarkup).join('')}</div>`).join('')
      : (provider.windows || []).map(usageWindowMarkup).join('');
    const detail = provider.provider === 'codex' && provider.plan ? provider.plan : provider.source;
    const credits = provider.credits?.hasCredits || provider.credits?.unlimited
      ? `<div class="usage-credits"><span>Credits</span><strong>${provider.credits.unlimited ? 'Unlimited' : provider.credits.balance}</strong></div>`
      : '';
    return `
      <article class="usage-card">
        <header><div><h3>${escapeHtml(provider.label)}</h3><small>${escapeHtml(detail || 'Connected')}</small></div><span class="usage-state ok">●</span></header>
        ${windows || '<p>No quota windows returned.</p>'}
        ${credits}
      </article>
    `;
  }

  function renderUsagePane(pane) {
    return `
      <div class="usage-pane" data-usage-pane="${pane.id}">
        <div class="usage-content" data-usage-content><div class="usage-loading">Reading provider usage…</div></div>
      </div>
    `;
  }

  const usageRefreshTimers = new Map();

  function clearUsageRefresh(paneId) {
    clearTimeout(usageRefreshTimers.get(paneId));
    usageRefreshTimers.delete(paneId);
  }

  // Re-runs the lookup on the configured interval. 0 minutes turns auto-refresh off.
  function scheduleUsageRefresh(paneId) {
    clearUsageRefresh(paneId);
    const minutes = Number(state.config?.usage?.refresh_minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    usageRefreshTimers.set(paneId, setTimeout(() => loadUsagePane(paneId, true), minutes * 60000));
  }

  async function loadUsagePane(paneId, refresh = false) {
    const pane = document.querySelector(`[data-pane="${paneId}"]`);
    const content = pane?.querySelector('[data-usage-content]');
    const refreshButton = pane?.querySelector('[data-usage-refresh]');
    if (!content) {
      clearUsageRefresh(paneId);
      return;
    }
    refreshButton.onclick = () => loadUsagePane(paneId, true);
    refreshButton.disabled = true;
    if (!refresh) {
      content.innerHTML = '<div class="usage-loading">Reading provider usage…</div>';
    }
    try {
      const result = refresh ? await api('/api/usage?refresh=1') : await api('/api/usage');
      const providers = result.providers || [];
      content.innerHTML = providers.length
        ? providers.map(usageProviderMarkup).join('')
        : '<div class="usage-loading">Choose at least one provider in Settings → Usage.</div>';
      content.querySelector('[data-usage-settings]')?.addEventListener('click', openSettings);
    } catch (error) {
      content.innerHTML = `<div class="usage-loading error">${escapeHtml(error.message)}</div>`;
    } finally {
      refreshButton.disabled = false;
      scheduleUsageRefresh(paneId);
    }
  }

  const mobileKeybarModifierOptions = ['Control', 'Alt', 'Shift'];
  const namedShortcutKeys = new Set(['Escape', 'Tab', 'Enter', 'Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

  function isSupportedShortcut(value) {
    const parts = String(value || '').split('+').map((part) => part.trim()).filter(Boolean);
    const key = parts.pop() || '';
    if (!key) {
      return false;
    }
    const modifiers = parts.map((part) => part.toLowerCase());
    if (modifiers.some((modifier) => !['ctrl', 'control', 'alt', 'shift'].includes(modifier))) {
      return false;
    }
    return namedShortcutKeys.has(key) || key.length === 1;
  }

  function mobileKeybarRowValidity(action, value) {
    const trimmed = String(value || '').trim();
    if (action === 'text') {
      return { valid: trimmed.length > 0, hint: trimmed ? '' : 'Enter the text to type.' };
    }
    if (action === 'modifier') {
      const valid = mobileKeybarModifierOptions.includes(value);
      return { valid, hint: valid ? '' : 'Pick a modifier.' };
    }
    if (!trimmed) {
      return { valid: false, hint: 'Enter or record a shortcut.' };
    }
    return isSupportedShortcut(trimmed)
      ? { valid: true, hint: '' }
      : { valid: false, hint: 'Unsupported key combination.' };
  }

  function readMobileKeybarRow(row) {
    const action = row.querySelector('[data-mobile-keybar-action]').value;
    const value = action === 'modifier'
      ? row.querySelector('[data-mobile-keybar-modifier]').value
      : row.querySelector('[data-mobile-keybar-value]').value;
    return {
      label: row.querySelector('[data-mobile-keybar-label]').value.trim(),
      action,
      value,
      enabled: row.querySelector('[data-mobile-keybar-enabled]').checked
    };
  }

  function renderMobileKeybarRow(button) {
    const action = button.action || 'shortcut';
    const isModifier = action === 'modifier';
    const modifierValue = isModifier && mobileKeybarModifierOptions.includes(button.value) ? button.value : 'Control';
    return `
      <div class="mobile-keybar-setting-row" data-mobile-keybar-row>
        <span class="mobile-keybar-drag" data-mobile-keybar-drag draggable="true" aria-hidden="true" title="Drag to reorder">⠿</span>
        <label class="mobile-keybar-visible" title="Show on the toolbar"><input type="checkbox" data-mobile-keybar-enabled ${button.enabled !== false ? 'checked' : ''}><span>Show</span></label>
        <label><span>Label</span><input data-mobile-keybar-label maxlength="5" value="${escapeAttr(String(button.label || '').slice(0, 5))}"></label>
        <label><span>Action</span><select data-mobile-keybar-action>
          <option value="shortcut" ${action === 'shortcut' ? 'selected' : ''}>Shortcut</option>
          <option value="modifier" ${action === 'modifier' ? 'selected' : ''}>Modifier</option>
          <option value="text" ${action === 'text' ? 'selected' : ''}>Type text</option>
        </select></label>
        <label class="mobile-keybar-value"><span>Shortcut or text</span>
          <div class="mobile-keybar-value-field" ${isModifier ? 'hidden' : ''}>
            <input data-mobile-keybar-value maxlength="256" value="${escapeAttr(isModifier ? '' : button.value)}" placeholder="${action === 'text' ? 'npm test' : 'Ctrl+C, Escape, ArrowUp'}">
            <button type="button" class="secondary mobile-keybar-record" data-mobile-keybar-record ${action === 'text' ? 'hidden' : ''} title="Record a key combination">Rec</button>
          </div>
          <select class="mobile-keybar-modifier" data-mobile-keybar-modifier ${isModifier ? '' : 'hidden'}>
            ${mobileKeybarModifierOptions.map((modifier) => `<option value="${modifier}" ${modifier === modifierValue ? 'selected' : ''}>${modifier}</option>`).join('')}
          </select>
        </label>
        <div class="mobile-keybar-order" aria-label="Button order">
          <button type="button" class="icon-button" data-mobile-keybar-up aria-label="Move button up" title="Move up">↑</button>
          <button type="button" class="icon-button" data-mobile-keybar-down aria-label="Move button down" title="Move down">↓</button>
          <button type="button" class="icon-button" data-mobile-keybar-duplicate aria-label="Duplicate button" title="Duplicate">⧉</button>
          <button type="button" class="icon-button" data-mobile-keybar-remove aria-label="Remove button" title="Remove">×</button>
        </div>
        <div class="mobile-keybar-hint" data-mobile-keybar-hint aria-live="polite"></div>
      </div>`;
  }

  function renderKeybarPreviewChips(rows) {
    const visible = rows.filter((button) => button.enabled !== false && button.label && mobileKeybarRowValidity(button.action, button.value).valid);
    if (!visible.length) {
      return '<span class="mobile-keybar-preview-empty">No buttons will be shown.</span>';
    }
    return visible.map((button) => `<span class="mobile-keybar-preview-chip">${escapeHtml(button.label)}</span>`).join('');
  }

  function renderMobileKeybarEditor(buttons) {
    const values = Array.isArray(buttons) ? buttons : defaultMobileKeybarButtons;
    return `
      <div class="mobile-keybar-preview" data-mobile-keybar-preview aria-label="Toolbar preview"></div>
      <div class="mobile-keybar-editor" data-mobile-keybar-editor>${values.map(renderMobileKeybarRow).join('')}</div>`;
  }

  function refreshMobileKeybarPreview(container) {
    const editor = container.querySelector('[data-mobile-keybar-editor]');
    const preview = container.querySelector('[data-mobile-keybar-preview]');
    if (!editor) {
      return;
    }
    const rows = Array.from(editor.querySelectorAll('[data-mobile-keybar-row]'));
    rows.forEach((row) => {
      const data = readMobileKeybarRow(row);
      const hasContent = Boolean(data.label || data.value);
      let invalid = false;
      let hint = '';
      if (hasContent) {
        if (!data.label) {
          invalid = true;
          hint = 'Enter a label.';
        } else {
          const validity = mobileKeybarRowValidity(data.action, data.value);
          invalid = !validity.valid;
          hint = validity.hint;
        }
      }
      row.classList.toggle('invalid', invalid);
      const hintEl = row.querySelector('[data-mobile-keybar-hint]');
      if (hintEl) {
        hintEl.textContent = invalid ? hint : '';
      }
    });
    if (preview) {
      preview.innerHTML = renderKeybarPreviewChips(rows.map(readMobileKeybarRow));
    }
  }

  function mobileKeybarButtonsFromSettings(form) {
    return Array.from(form.querySelectorAll('[data-mobile-keybar-row]'))
      .map(readMobileKeybarRow)
      .filter((button) => button.label && mobileKeybarRowValidity(button.action, button.value).valid);
  }

  function mobileKeybarSkippedCount(form) {
    return Array.from(form.querySelectorAll('[data-mobile-keybar-row]'))
      .map(readMobileKeybarRow)
      .filter((button) => (button.label || button.value) && !(button.label && mobileKeybarRowValidity(button.action, button.value).valid))
      .length;
  }

  function normalizeRecordedShortcutKey(key) {
    if (key === ' ' || key === 'Spacebar') {
      return ' ';
    }
    return key;
  }

  function syncMobileKeybarRowAction(row) {
    const action = row.querySelector('[data-mobile-keybar-action]').value;
    const field = row.querySelector('.mobile-keybar-value-field');
    const input = row.querySelector('[data-mobile-keybar-value]');
    const record = row.querySelector('[data-mobile-keybar-record]');
    const modifier = row.querySelector('[data-mobile-keybar-modifier]');
    if (field) field.hidden = action === 'modifier';
    if (modifier) modifier.hidden = action !== 'modifier';
    if (record) record.hidden = action === 'text';
    if (input) input.placeholder = action === 'text' ? 'npm test' : 'Ctrl+C, Escape, ArrowUp';
  }

  function startMobileKeybarRecording(recordButton, row, refresh) {
    const input = row.querySelector('[data-mobile-keybar-value]');
    const actionSelect = row.querySelector('[data-mobile-keybar-action]');
    const hintEl = row.querySelector('[data-mobile-keybar-hint]');
    const original = input.value;
    recordButton.classList.add('recording');
    recordButton.textContent = '…';
    if (hintEl) hintEl.textContent = 'Press a key combination…';
    const finish = () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('pointerdown', onCancel, true);
      recordButton.classList.remove('recording');
      recordButton.textContent = 'Rec';
      refresh();
    };
    const onCancel = (event) => {
      if (event.target !== recordButton) {
        input.value = original;
        finish();
      }
    };
    const onKey = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
        return;
      }
      const modifiers = [];
      if (event.ctrlKey) modifiers.push('Ctrl');
      if (event.altKey) modifiers.push('Alt');
      if (event.shiftKey) modifiers.push('Shift');
      const combo = [...modifiers, normalizeRecordedShortcutKey(event.key)].join('+');
      if (actionSelect.value !== 'shortcut') {
        actionSelect.value = 'shortcut';
        syncMobileKeybarRowAction(row);
      }
      input.value = combo;
      if (hintEl) {
        hintEl.textContent = isSupportedShortcut(combo) ? '' : 'Unsupported key combination.';
      }
      finish();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onCancel, true);
  }

  function wireMobileKeybarDrag(editor, refresh) {
    let dragged = null;
    editor.addEventListener('dragstart', (event) => {
      const handle = event.target.closest('[data-mobile-keybar-drag]');
      if (!handle) {
        event.preventDefault();
        return;
      }
      dragged = handle.closest('[data-mobile-keybar-row]');
      dragged.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
    });
    editor.addEventListener('dragover', (event) => {
      if (!dragged) {
        return;
      }
      event.preventDefault();
      const over = event.target.closest('[data-mobile-keybar-row]');
      if (!over || over === dragged) {
        return;
      }
      const rect = over.getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      editor.insertBefore(dragged, after ? over.nextElementSibling : over);
    });
    editor.addEventListener('drop', (event) => event.preventDefault());
    editor.addEventListener('dragend', () => {
      if (dragged) {
        dragged.classList.remove('dragging');
        dragged = null;
        refresh();
      }
    });
  }

  function wireMobileKeybarEditor(overlay) {
    const container = overlay.querySelector('.mobile-keybar-setting');
    const editor = overlay.querySelector('[data-mobile-keybar-editor]');
    if (!container || !editor) {
      return;
    }
    const refresh = () => refreshMobileKeybarPreview(container);
    const move = (button, direction) => {
      const row = button.closest('[data-mobile-keybar-row]');
      const sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
      if (!sibling) {
        return;
      }
      editor.insertBefore(row, direction < 0 ? sibling : sibling.nextElementSibling);
      refresh();
    };
    editor.addEventListener('input', refresh);
    editor.addEventListener('change', (event) => {
      if (event.target.matches('[data-mobile-keybar-action]')) {
        syncMobileKeybarRowAction(event.target.closest('[data-mobile-keybar-row]'));
      }
      refresh();
    });
    editor.addEventListener('click', (event) => {
      const row = event.target.closest('[data-mobile-keybar-row]');
      if (!row) {
        return;
      }
      if (event.target.closest('[data-mobile-keybar-up]')) {
        move(event.target, -1);
      } else if (event.target.closest('[data-mobile-keybar-down]')) {
        move(event.target, 1);
      } else if (event.target.closest('[data-mobile-keybar-remove]')) {
        row.remove();
        refresh();
      } else if (event.target.closest('[data-mobile-keybar-duplicate]')) {
        row.insertAdjacentHTML('afterend', renderMobileKeybarRow(readMobileKeybarRow(row)));
        syncMobileKeybarRowAction(row.nextElementSibling);
        refresh();
      } else if (event.target.closest('[data-mobile-keybar-record]')) {
        startMobileKeybarRecording(event.target.closest('[data-mobile-keybar-record]'), row, refresh);
      }
    });
    wireMobileKeybarDrag(editor, refresh);
    overlay.querySelector('[data-mobile-keybar-add]').onclick = () => {
      editor.insertAdjacentHTML('beforeend', renderMobileKeybarRow({ label: 'Custom', action: 'shortcut', value: 'Ctrl+Shift+C', enabled: true }));
      syncMobileKeybarRowAction(editor.lastElementChild);
      editor.lastElementChild.querySelector('[data-mobile-keybar-label]').focus();
      refresh();
    };
    overlay.querySelector('[data-mobile-keybar-reset]').onclick = () => {
      editor.innerHTML = defaultMobileKeybarButtons.map(renderMobileKeybarRow).join('');
      editor.querySelectorAll('[data-mobile-keybar-row]').forEach(syncMobileKeybarRowAction);
      refresh();
    };
    editor.querySelectorAll('[data-mobile-keybar-row]').forEach(syncMobileKeybarRowAction);
    refresh();
  }

  async function openSettings() {
    let settings;
    try {
      settings = await api('/api/settings');
    } catch (error) {
      showToast(error.message);
      return;
    }

    discardOverlay('.settings-overlay');

    state.customThemeDraft = { ...customThemeDefaults, ...(settings.custom_theme || {}) };
    let savedTheme = state.theme;
    let savedDisplayMode = state.displayMode;
    let savedTerminalDensity = state.mobileTerminalDensity;
    const selectedLight = state.customThemeDraft.selected_light;
    const selectedDark = state.customThemeDraft.selected_dark;
    const notificationCapability = browserNotificationCapability();
    const overlay = document.createElement('div');
    overlay.className = 'settings-overlay';
    const fontOptions = [
      { label: 'Consolas', value: 'Consolas, "Cascadia Mono", monospace' },
      { label: 'Cascadia Mono', value: '"Cascadia Mono", Consolas, monospace' },
      { label: 'Cascadia Code', value: '"Cascadia Code", Consolas, monospace' },
      { label: 'JetBrains Mono', value: '"JetBrains Mono", Consolas, monospace' },
      { label: 'Fira Code', value: '"Fira Code", Consolas, monospace' },
      { label: 'Lucida Console', value: '"Lucida Console", monospace' }
    ];
    overlay.innerHTML = `
      <form class="settings-panel">
        <header class="settings-header">
          <div class="product-mark"><span class="brand-mark">›_</span><div><div class="settings-title" id="settings-dialog-title">WPS7 Settings</div><small>Workspace preferences</small></div></div>
          <button class="icon-button" type="button" data-settings-close aria-label="Close settings" title="Close">×</button>
        </header>
        <div class="settings-shell">
          <nav class="settings-nav" aria-label="Settings categories">
            <a aria-label="Appearance" href="#settings-appearance">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('appearance')}</span><span class="settings-nav-label">Appearance</span>
            </a>
            <a aria-label="Terminal" href="#settings-terminal">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('terminal')}</span><span class="settings-nav-label">Terminal</span>
            </a>
            <a aria-label="Workspace" href="#settings-workspace">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('workspace')}</span><span class="settings-nav-label">Workspace</span>
            </a>
            <a aria-label="Persistence" href="#settings-persistence">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('persistence')}</span><span class="settings-nav-label">Persistence</span>
            </a>
            <a aria-label="Shell" href="#settings-shell">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('shell')}</span><span class="settings-nav-label">Shell</span>
            </a>
            <a aria-label="Files" href="#settings-files">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('file')}</span><span class="settings-nav-label">Files</span>
            </a>
            <a aria-label="Notepad" href="#settings-notepad">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('notepad')}</span><span class="settings-nav-label">Notepad</span>
            </a>
            <a aria-label="Usage" href="#settings-usage">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('usage')}</span><span class="settings-nav-label">Usage</span>
            </a>
            <a aria-label="Server" href="#settings-server">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('server')}</span><span class="settings-nav-label">Server</span>
            </a>
            <a aria-label="Security" href="#settings-security">
              <span class="settings-nav-icon" aria-hidden="true">${fileActionIcon('security')}</span><span class="settings-nav-label">Security</span>
            </a>
          </nav>
          <div class="settings-body">
            <section class="settings-section appearance-section" id="settings-appearance">
              <div class="section-heading"><div><h2>Appearance</h2><p>Previewed live — Cancel reverts, Save keeps it.</p></div><span class="live-badge">● Live preview</span></div>
              <input type="hidden" name="custom_theme.mode" value="${escapeAttr(state.customThemeDraft.mode)}">
              <input type="hidden" name="custom_theme.selected_light" value="${escapeAttr(selectedLight)}">
              <input type="hidden" name="custom_theme.selected_dark" value="${escapeAttr(selectedDark)}">
              <div class="theme-mode-setting" data-theme-mode="light">
                <div class="theme-mode-heading"><span>Light mode</span><small>Used whenever WPS7 is in light mode.</small></div>
                <div class="theme-preset-grid" role="group" aria-label="Light theme">
                  ${Object.entries(themePresets).filter(([, theme]) => theme.mode === 'light').map(([id, theme]) => `
                    <button type="button" class="theme-preset ${selectedLight === id ? 'active' : ''}" data-theme-choice="${id}" data-theme-choice-mode="light" aria-pressed="${selectedLight === id}">
                      <span class="theme-swatches" aria-hidden="true"><i style="--swatch:${theme.ink}"></i><i style="--swatch:${theme.panel}"></i><i style="--swatch:${theme.accent}"></i></span><span>${escapeHtml(theme.label)}</span>
                    </button>
                  `).join('')}
                  <button type="button" class="theme-preset ${selectedLight === 'custom-light' ? 'active' : ''}" data-theme-choice="custom-light" data-theme-choice-mode="light" aria-pressed="${selectedLight === 'custom-light'}"><span class="theme-swatches custom" aria-hidden="true"><i></i><i></i><i></i></span><span>Custom Light</span></button>
                </div>
              </div>
              <div class="custom-theme-editor ${selectedLight === 'custom-light' ? '' : 'hidden'}" data-custom-theme-editor="light">
                <div class="custom-theme-heading"><div><h3>Custom Light palette</h3><p>Saved on the WPS7 server and shared across devices.</p></div><button class="secondary custom-theme-reset" type="button" data-custom-theme-reset="light" aria-label="Reset custom light palette" title="Reset to default custom light palette">${fileActionIcon('refresh')}<span>Reset</span></button></div>
                <div class="custom-theme-grid">
                  <label>App background<input name="custom_theme.light_ink" type="color" value="${escapeAttr(state.customThemeDraft.light_ink)}"></label>
                  <label>Panel<input name="custom_theme.light_panel" type="color" value="${escapeAttr(state.customThemeDraft.light_panel)}"></label>
                  <label>Sidebar<input name="custom_theme.light_rail" type="color" value="${escapeAttr(state.customThemeDraft.light_rail)}"></label>
                  <label>Raised surface<input name="custom_theme.light_surface" type="color" value="${escapeAttr(state.customThemeDraft.light_surface)}"></label>
                  <label>Border<input name="custom_theme.light_line" type="color" value="${escapeAttr(state.customThemeDraft.light_line)}"></label>
                  <label>Text<input name="custom_theme.light_text" type="color" value="${escapeAttr(state.customThemeDraft.light_text)}"></label>
                  <label>Muted text<input name="custom_theme.light_muted" type="color" value="${escapeAttr(state.customThemeDraft.light_muted)}"></label>
                  <label>Accent<input name="custom_theme.light_accent" type="color" value="${escapeAttr(state.customThemeDraft.light_accent)}"></label>
                  <label>Warning<input name="custom_theme.light_warn" type="color" value="${escapeAttr(state.customThemeDraft.light_warn)}"></label>
                  <label>Danger<input name="custom_theme.light_danger" type="color" value="${escapeAttr(state.customThemeDraft.light_danger)}"></label>
                  <label>Terminal background<input name="custom_theme.light_terminal_bg" type="color" value="${escapeAttr(state.customThemeDraft.light_terminal_bg)}"></label>
                  <label>Terminal text<input name="custom_theme.light_terminal_fg" type="color" value="${escapeAttr(state.customThemeDraft.light_terminal_fg)}"></label>
                </div>
              </div>
              <div class="theme-mode-setting" data-theme-mode="dark">
                <div class="theme-mode-heading"><span>Dark mode</span><small>Used whenever WPS7 is in dark mode.</small></div>
                <div class="theme-preset-grid" role="group" aria-label="Dark theme">
                  ${Object.entries(themePresets).filter(([, theme]) => theme.mode === 'dark').map(([id, theme]) => `
                    <button type="button" class="theme-preset ${selectedDark === id ? 'active' : ''}" data-theme-choice="${id}" data-theme-choice-mode="dark" aria-pressed="${selectedDark === id}">
                      <span class="theme-swatches" aria-hidden="true"><i style="--swatch:${theme.ink}"></i><i style="--swatch:${theme.panel}"></i><i style="--swatch:${theme.accent}"></i></span><span>${escapeHtml(theme.label)}</span>
                    </button>
                  `).join('')}
                  <button type="button" class="theme-preset ${selectedDark === 'custom-dark' ? 'active' : ''}" data-theme-choice="custom-dark" data-theme-choice-mode="dark" aria-pressed="${selectedDark === 'custom-dark'}"><span class="theme-swatches custom" aria-hidden="true"><i></i><i></i><i></i></span><span>Custom Dark</span></button>
                </div>
              </div>
              <div class="custom-theme-editor ${selectedDark === 'custom-dark' ? '' : 'hidden'}" data-custom-theme-editor="dark">
                <div class="custom-theme-heading"><div><h3>Custom Dark palette</h3><p>Saved on the WPS7 server and shared across devices.</p></div><button class="secondary custom-theme-reset" type="button" data-custom-theme-reset="dark" aria-label="Reset custom dark palette" title="Reset to default custom dark palette">${fileActionIcon('refresh')}<span>Reset</span></button></div>
                <div class="custom-theme-grid">
                  <label>App background<input name="custom_theme.ink" type="color" value="${escapeAttr(state.customThemeDraft.ink)}"></label>
                  <label>Panel<input name="custom_theme.panel" type="color" value="${escapeAttr(state.customThemeDraft.panel)}"></label>
                  <label>Sidebar<input name="custom_theme.rail" type="color" value="${escapeAttr(state.customThemeDraft.rail)}"></label>
                  <label>Raised surface<input name="custom_theme.surface" type="color" value="${escapeAttr(state.customThemeDraft.surface)}"></label>
                  <label>Border<input name="custom_theme.line" type="color" value="${escapeAttr(state.customThemeDraft.line)}"></label>
                  <label>Text<input name="custom_theme.text" type="color" value="${escapeAttr(state.customThemeDraft.text)}"></label>
                  <label>Muted text<input name="custom_theme.muted" type="color" value="${escapeAttr(state.customThemeDraft.muted)}"></label>
                  <label>Accent<input name="custom_theme.accent" type="color" value="${escapeAttr(state.customThemeDraft.accent)}"></label>
                  <label>Warning<input name="custom_theme.warn" type="color" value="${escapeAttr(state.customThemeDraft.warn)}"></label>
                  <label>Danger<input name="custom_theme.danger" type="color" value="${escapeAttr(state.customThemeDraft.danger)}"></label>
                  <label>Terminal background<input name="custom_theme.terminal_bg" type="color" value="${escapeAttr(state.customThemeDraft.terminal_bg)}"></label>
                  <label>Terminal text<input name="custom_theme.terminal_fg" type="color" value="${escapeAttr(state.customThemeDraft.terminal_fg)}"></label>
                </div>
              </div>
              <div class="display-mode-setting">
                <div class="theme-mode-heading"><span>Layout</span><small>Mobile shows one pane at a time. Auto follows the viewport width.</small></div>
                <div class="segmented" role="group" aria-label="Display mode">
                  ${['auto', 'mobile', 'desktop'].map((mode) => `
                    <button type="button" class="segmented-option ${state.displayMode === mode ? 'active' : ''}" data-display-mode="${mode}" aria-pressed="${state.displayMode === mode}">${mode[0].toUpperCase()}${mode.slice(1)}</button>
                  `).join('')}
                </div>
                <div class="theme-mode-heading"><span>Terminal density</span><small>Dense fits more rows on small screens.</small></div>
                <div class="segmented" role="group" aria-label="Terminal density">
                  ${['readable', 'dense'].map((density) => `
                    <button type="button" class="segmented-option ${state.mobileTerminalDensity === density ? 'active' : ''}" data-terminal-density="${density}" aria-pressed="${state.mobileTerminalDensity === density}">${density === 'dense' ? 'Dense' : 'Readable'}</button>
                  `).join('')}
                </div>
              </div>
              <div class="settings-grid appearance-font-setting">
                <label>System font size<input name="ui.system_font_size" type="number" min="10" max="24" value="${escapeAttr(settings.ui.system_font_size ?? 13)}"></label>
              </div>
            </section>
            <section class="settings-section" id="settings-terminal">
              <div class="section-heading"><div><h2>Terminal</h2><p>Typography, rendering and resize behavior.</p></div></div>
              <div class="settings-grid">
                <label>Terminal font<select name="ui.terminal_font_family">
                  ${fontOptions.map((font) => `<option value="${escapeAttr(font.value)}" ${font.value === settings.ui.terminal_font_family ? 'selected' : ''}>${escapeHtml(font.label)}</option>`).join('')}
                </select></label>
                <label>PowerShell font size<input name="ui.terminal_font_size" type="number" min="8" max="32" value="${escapeAttr(settings.ui.terminal_font_size)}"></label>
                <label>PowerShell mobile font size<input name="ui.mobile_terminal_font_size" type="number" min="8" max="24" value="${escapeAttr(settings.ui.mobile_terminal_font_size ?? 12)}"></label>
                <label>Terminal backend<select name="terminal.backend">
                  ${['conpty_screen', 'xterm_pty'].map((backend) => `<option value="${backend}" ${backend === settings.terminal?.backend ? 'selected' : ''}>${backend}</option>`).join('')}
                </select></label>
                <label>Reconnect scrollback<input name="terminal.reconnect_scrollback_lines" type="number" min="0" value="${escapeAttr(settings.terminal?.reconnect_scrollback_lines ?? 2000)}"></label>
                <label>Resize debounce ms<input name="terminal.resize_debounce_ms" type="number" min="0" value="${escapeAttr(settings.terminal?.resize_debounce_ms ?? 100)}"></label>
                <label class="settings-check"><input name="terminal.auto_scroll_on_resize" type="checkbox" ${settings.terminal?.auto_scroll_on_resize ? 'checked' : ''}> Auto scroll on resize</label>
                <label class="settings-check"><input name="terminal.cursor_blink" type="checkbox" ${settings.terminal?.cursor_blink !== false ? 'checked' : ''}> Cursor blink</label>
                <div class="notification-setting settings-wide">
                  <label class="settings-check"><input name="terminal.browser_notifications" type="checkbox" ${settings.terminal?.browser_notifications ? 'checked' : ''} ${notificationCapability.available ? '' : 'disabled'}> Browser notifications for terminal bells</label>
                  <small class="notification-capability ${notificationCapability.available ? '' : 'blocked'}" data-browser-notification-status>${escapeHtml(notificationCapability.message)}</small>
                </div>
              </div>
              <div class="mobile-keybar-setting">
                <div class="mobile-keybar-setting-heading"><div><h3>PowerShell shortcut buttons</h3><p>Choose buttons shown below PowerShell on desktop and mobile, arrange their order, or add a shortcut or text command. Ctrl stays active for the next software-keyboard key.</p></div><div class="mobile-keybar-setting-actions"><button class="secondary" type="button" data-mobile-keybar-reset>Reset to defaults</button><button class="secondary" type="button" data-mobile-keybar-add>${fileActionIcon('add')}<span>Add button</span></button></div></div>
                ${renderMobileKeybarEditor(settings.terminal?.mobile_keybar_buttons)}
              </div>
            </section>
            <section class="settings-section" id="settings-workspace">
              <div class="section-heading"><div><h2>Workspace</h2><p>Sidebar size and how new columns are split.</p></div></div>
              <div class="settings-grid">
                <label>Grid cell width (px)<input name="ui.grid_size" type="number" min="20" max="400" step="10" value="${escapeAttr(settings.ui.grid_size)}"></label>
                <label>Rows per screen<input name="ui.vertical_slots" type="number" min="1" max="24" value="${escapeAttr(settings.ui.vertical_slots)}"></label>
              </div>
            </section>
            <section class="settings-section" id="settings-persistence">
              <div class="section-heading"><div><h2>Persistence</h2><p>Autosave timing and retained terminal output.</p></div></div>
              <div class="settings-grid">
                <label>Autosave minutes<input name="persistence.autosave_minutes" type="number" min="1" value="${escapeAttr(settings.persistence.autosave_minutes)}"></label>
                <label>Scrollback limit<input name="persistence.scrollback_lines" type="number" min="0" value="${escapeAttr(settings.persistence.scrollback_lines)}"></label>
              </div>
            </section>
            <section class="settings-section" id="settings-shell">
              <div class="section-heading"><div><h2>Shell</h2><p>PowerShell executables and startup arguments.</p></div></div>
              <div class="settings-grid">
                <label>PowerShell preferred<input name="shell.preferred" value="${escapeAttr(settings.shell.preferred)}"></label>
                <label>PowerShell fallback<input name="shell.fallback" value="${escapeAttr(settings.shell.fallback)}"></label>
                <label class="settings-wide">Shell args<textarea name="shell.args" rows="3">${escapeHtml((settings.shell.args || []).join('\n'))}</textarea></label>
              </div>
            </section>
            <section class="settings-section" id="settings-files">
              <div class="section-heading"><div><h2>Files</h2><p>File manager access and upload limits.</p></div></div>
              <div class="settings-grid">
                <label>Upload limit bytes<input name="file_manager.max_upload_bytes" type="number" min="0" value="${escapeAttr(settings.file_manager?.max_upload_bytes ?? 0)}"></label>
                <label>File pane font size<input name="ui.file_pane_font_size" type="number" min="10" max="24" value="${escapeAttr(settings.ui.file_pane_font_size ?? 13)}"></label>
              </div>
            </section>
            <section class="settings-section" id="settings-notepad">
              <div class="section-heading"><div><h2>Notepad</h2><p>Defaults applied to newly opened Notepad tabs.</p></div></div>
              <div class="settings-grid">
                <label class="settings-check"><input name="ui.notepad_word_wrap" type="checkbox" ${settings.ui.notepad_word_wrap ? 'checked' : ''}> Word wrap</label>
                <label class="settings-check"><input name="ui.notepad_indent_guides" type="checkbox" ${settings.ui.notepad_indent_guides ? 'checked' : ''}> Indent guides</label>
                <label class="settings-check"><input name="ui.notepad_autosave" type="checkbox" ${settings.ui.notepad_autosave ? 'checked' : ''}> Auto save</label>
              </div>
            </section>
            <section class="settings-section" id="settings-usage">
              <div class="section-heading"><div><h2>Usage</h2><p>Choose the provider cards and quota windows shown in Usage panes.</p></div></div>
              <div class="settings-grid">
                <label>Auto-refresh minutes<input name="usage.refresh_minutes" type="number" min="0" max="999" step="1" value="${escapeAttr(settings.usage?.refresh_minutes ?? 10)}" title="0 turns auto-refresh off"></label>
                <label class="settings-check"><input name="usage.show_codex" type="checkbox" ${settings.usage?.show_codex !== false ? 'checked' : ''}> Codex</label>
                <label class="settings-check"><input name="usage.show_claude" type="checkbox" ${settings.usage?.show_claude !== false ? 'checked' : ''}> Claude Code</label>
                <label class="settings-check"><input name="usage.show_minimax" type="checkbox" ${settings.usage?.show_minimax !== false ? 'checked' : ''}> MiniMax</label>
                <label class="settings-check"><input name="usage.show_five_hour" type="checkbox" ${settings.usage?.show_five_hour !== false ? 'checked' : ''}> 5-hour window</label>
                <label class="settings-check"><input name="usage.show_weekly" type="checkbox" ${settings.usage?.show_weekly !== false ? 'checked' : ''}> Weekly window</label>
                <label class="settings-check"><input name="usage.show_model_weekly" type="checkbox" ${settings.usage?.show_model_weekly !== false ? 'checked' : ''}> Per-model weekly windows</label>
                <label class="settings-check"><input name="usage.show_credits" type="checkbox" ${settings.usage?.show_credits !== false ? 'checked' : ''}> Credit balance</label>
                <label class="settings-wide">MiniMax Coding Plan API key<input name="usage.minimax_api_key" type="password" autocomplete="off" placeholder="${settings.usage?.minimax_configured ? 'Saved — leave blank to keep' : 'sk-cp-…'}"></label>
                <label>MiniMax region<select name="usage.minimax_region"><option value="global" ${settings.usage?.minimax_region !== 'china' ? 'selected' : ''}>Global</option><option value="china" ${settings.usage?.minimax_region === 'china' ? 'selected' : ''}>China mainland</option></select></label>
                <label class="settings-check"><input name="usage.clear_minimax_api_key" type="checkbox"> Clear saved MiniMax key</label>
              </div>
            </section>
            <section class="settings-section restart" id="settings-server">
              <div class="section-heading"><div><h2>Server</h2><p>LAN access requires a password and restarts WPS7 automatically.</p></div><span class="restart-badge">△ Restart required</span></div>
              <div class="settings-grid">
                <label>Access<select name="server.host"><option value="127.0.0.1" ${settings.server.host === '127.0.0.1' ? 'selected' : ''}>Local</option><option value="0.0.0.0" ${settings.server.host === '0.0.0.0' ? 'selected' : ''}>LAN</option></select></label>
                <label>Port<input name="server.port" type="number" min="1" max="65535" value="${escapeAttr(settings.server.port)}"></label>
                <label class="settings-check"><input name="server.open_browser" type="checkbox" ${settings.server.open_browser ? 'checked' : ''}> Open browser on start</label>
              </div>
            </section>
            <section class="settings-section" id="settings-security">
              <div class="section-heading"><div><h2>Security</h2><p>Set a new password for workspace access.</p></div></div>
              <div class="settings-grid">
                <label class="settings-wide">New password<input name="auth.password" type="password" autocomplete="new-password" aria-describedby="settings-password-rule" placeholder="Leave blank to keep the current password"><small class="field-hint" id="settings-password-rule">At least 12 characters, including an upper case letter, a lower case letter, a number and a symbol.</small></label>
              </div>
            </section>
          </div>
        </div>
        <footer class="settings-footer">
          <span class="settings-status" data-settings-status></span>
          <button type="button" class="secondary" data-settings-cancel title="Discard changes and close">Cancel</button>
          <button type="submit" class="secondary" data-settings-apply title="Save and keep this dialog open">Apply</button>
          <button type="submit" class="primary" data-settings-save title="Save and close">Save</button>
        </footer>
      </form>
    `;

    document.body.appendChild(overlay);
    const settingsBody = overlay.querySelector('.settings-body');
    const settingsLinks = [...overlay.querySelectorAll('.settings-nav a')];
    const settingsSections = settingsLinks.map((link) => overlay.querySelector(link.getAttribute('href'))).filter(Boolean);

    function setActiveSettingsSection(sectionId) {
      settingsLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${sectionId}`;
        link.classList.toggle('active', active);
        active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
      });
    }

    function syncSettingsNav() {
      const atBottom = settingsBody.scrollTop + settingsBody.clientHeight >= settingsBody.scrollHeight - 2;
      let current = atBottom ? settingsSections[settingsSections.length - 1] : settingsSections[0];
      if (!atBottom) {
        const bodyTop = settingsBody.getBoundingClientRect().top + 18;
        for (const section of settingsSections) {
          if (section.getBoundingClientRect().top <= bodyTop) {
            current = section;
          }
        }
      }
      setActiveSettingsSection(current.id);
    }

    // The last section is shorter than the viewport, so without trailing room it
    // can never scroll to the top and clicking its nav entry looks like a no-op.
    function syncSettingsScrollPadding() {
      const last = settingsSections[settingsSections.length - 1];
      if (!last) {
        return;
      }
      const slack = settingsBody.clientHeight - last.offsetHeight - 24;
      const next = `${Math.max(24, Math.round(slack))}px`;
      if (settingsBody.style.paddingBottom !== next) {
        settingsBody.style.paddingBottom = next;
      }
    }

    settingsLinks.forEach((link) => {
      link.onclick = (event) => {
        event.preventDefault();
        const section = overlay.querySelector(link.getAttribute('href'));
        section.scrollIntoView({ block: 'start' });
        setActiveSettingsSection(section.id);
        requestAnimationFrame(() => setActiveSettingsSection(section.id));
      };
    });
    settingsBody.addEventListener('scroll', syncSettingsNav, { passive: true });
    const settingsResizeObserver = new ResizeObserver(() => {
      syncSettingsScrollPadding();
      syncSettingsNav();
    });
    settingsResizeObserver.observe(settingsBody);
    const closeSettings = (restoreTheme = true) => {
      disposeModal();
      settingsResizeObserver.disconnect();
      overlay.remove();
      if (restoreTheme) {
        state.customThemeDraft = null;
        setThemeLive(savedTheme);
        if (state.displayMode !== savedDisplayMode) {
          setDisplayMode(savedDisplayMode, false);
        }
        if (state.mobileTerminalDensity !== savedTerminalDensity) {
          setTerminalDensity(savedTerminalDensity, false);
        }
      }
    };
    const disposeModal = wireModal(overlay.querySelector('.settings-panel'), () => closeSettings(), 'settings-dialog-title');
    overlay._disposeModal = disposeModal;
    const initialSection = settingsSections[0];
    setActiveSettingsSection(initialSection.id);
    requestAnimationFrame(() => {
      syncSettingsScrollPadding();
      initialSection.scrollIntoView({ block: 'start' });
      syncSettingsNav();
    });
    overlay.querySelector('[data-settings-close]').onclick = closeSettings;
    overlay.querySelector('[data-settings-cancel]').onclick = closeSettings;
    const syncSegmented = (group, activeButton) => {
      group.querySelectorAll('.segmented-option').forEach((option) => {
        const active = option === activeButton;
        option.classList.toggle('active', active);
        option.setAttribute('aria-pressed', String(active));
      });
    };
    overlay.querySelectorAll('[data-display-mode]').forEach((button) => {
      button.onclick = () => {
        setDisplayMode(button.dataset.displayMode, false);
        syncSegmented(button.closest('.segmented'), button);
      };
    });
    overlay.querySelectorAll('[data-terminal-density]').forEach((button) => {
      button.onclick = () => {
        setTerminalDensity(button.dataset.terminalDensity, false);
        syncSegmented(button.closest('.segmented'), button);
      };
    });
    overlay.querySelectorAll('[data-theme-choice]').forEach((button) => {
      button.onclick = () => {
        const mode = button.dataset.themeChoiceMode;
        const selectedInput = overlay.querySelector(`[name="custom_theme.selected_${mode}"]`);
        selectedInput.value = button.dataset.themeChoice;
        overlay.querySelector('[name="custom_theme.mode"]').value = mode;
        state.customThemeDraft[`selected_${mode}`] = button.dataset.themeChoice;
        state.customThemeDraft.mode = mode;
        applyTheme(button.dataset.themeChoice);
        overlay.querySelector(`[data-custom-theme-editor="${mode}"]`).classList.toggle('hidden', button.dataset.themeChoice !== `custom-${mode}`);
        button.closest('[data-theme-mode]').querySelectorAll('[data-theme-choice]').forEach((choice) => {
          const active = choice === button;
          choice.classList.toggle('active', active);
          choice.setAttribute('aria-pressed', String(active));
        });
        for (const item of state.terminals.values()) {
          item.term.options.theme = terminalTheme();
        }
      };
    });
    overlay.querySelectorAll('[name^="custom_theme."][type="color"]').forEach((input) => {
      input.oninput = () => {
        state.customThemeDraft[input.name.slice('custom_theme.'.length)] = input.value;
        if (state.theme === 'custom-light' || state.theme === 'custom-dark') {
          setThemeLive(state.theme);
        }
      };
    });
    overlay.querySelectorAll('[data-custom-theme-reset]').forEach((button) => {
      button.onclick = () => resetCustomThemePalette(button.dataset.customThemeReset, overlay);
    });
    wireMobileKeybarEditor(overlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        closeSettings();
      }
    });
    overlay.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const keepSettingsOpen = event.submitter?.hasAttribute('data-settings-apply') === true;
      const status = overlay.querySelector('[data-settings-status]');
      status.textContent = 'Saving...';
      try {
        const notificationInput = event.currentTarget.elements['terminal.browser_notifications'];
        if (notificationInput?.checked && !notificationInput?.disabled) {
          const permission = await requestBrowserNotificationPermission();
          if (permission !== 'granted') {
            notificationInput.checked = false;
            showToast('Browser notification permission was not granted.');
          }
        }
        const payload = settingsPayload(new FormData(event.currentTarget), event.currentTarget);
        const skippedKeybarButtons = mobileKeybarSkippedCount(event.currentTarget);
        if (skippedKeybarButtons) {
          showToast(`${skippedKeybarButtons} shortcut button(s) skipped: fill in a label and a supported key or text.`);
        }
        const switchingToLan = payload.server.host === '0.0.0.0' && state.config.server.host !== '0.0.0.0';
        const hasPassword = settings.auth?.password_set || Boolean(payload.auth?.password);
        if (payload.server.host === '0.0.0.0' && !hasPassword) {
          status.textContent = 'Set a password before enabling LAN access.';
          const passwordInput = event.currentTarget.elements['auth.password'];
          passwordInput.scrollIntoView({ block: 'center' });
          passwordInput.focus();
          showToast(status.textContent);
          return;
        }
        payload.restart_after_save = switchingToLan;
        state.config = await api('/api/settings', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        savedTheme = selectedThemeForMode(state.config.custom_theme?.mode || themeMode());
        state.customThemeDraft = { ...customThemeDefaults, ...(state.config.custom_theme || {}) };
        applyTheme(savedTheme);
        // Display mode and density live in localStorage, not the server config.
        localStorage.setItem('wps7.displayMode', state.displayMode);
        localStorage.setItem('wps7.mobileTerminalDensity', state.mobileTerminalDensity);
        savedDisplayMode = state.displayMode;
        savedTerminalDensity = state.mobileTerminalDensity;
        applyConfigLive();
        // A new row count rescales every pane on the server. Only the geometry
        // moved, so the panes are repositioned in place: a full render would
        // tear down every terminal connection to change two numbers.
        if (state.config.layoutChanged) {
          const loaded = await api('/api/state');
          state.sessions = loaded.sessions;
          state.persistedActiveSessionId = loaded.activeSessionId;
          for (const pane of activeTab(activeSession())?.panes || []) {
            pane.layout = normalizePaneLayout(pane.layout);
            applyPaneLayoutStyle(document.querySelector(`[data-pane="${pane.id}"]`), pane.layout);
            paneTerminal(pane.id)?.sendResize();
          }
        }
        document.querySelectorAll('[data-pane-type="usage"]').forEach((pane) => loadUsagePane(pane.dataset.pane, true));
        if (state.config.restarting) {
          if (payload.auth?.password) {
            clearToken();
          }
          status.textContent = 'Saved. Restarting WPS7…';
          showToast(status.textContent, 'success');
          const nextUrl = `${location.protocol}//${location.hostname}:${payload.server.port}/`;
          window.setTimeout(() => location.assign(nextUrl), 1800);
          return;
        }
        if (payload.auth?.password) {
          clearToken();
          closeSettings(false);
          renderLogin();
          showToast('Password changed. Sign in again.', 'success');
          return;
        }
        status.textContent = state.config.restartRequired ? 'Saved. Restart wps7.exe for host/port changes.' : 'Saved.';
        showToast(status.textContent, 'success');
        if (!keepSettingsOpen) {
          state.customThemeDraft = null;
          closeSettings(false);
        }
      } catch (error) {
        status.textContent = error.message || 'Save failed.';
        showToast(status.textContent);
      }
    });
  }

  function settingsPayload(form, formElement) {
    const notificationInput = formElement.elements['terminal.browser_notifications'];
    const payload = {
      server: {
        host: form.get('server.host'),
        port: numberOrUndefined(form.get('server.port')),
        open_browser: form.get('server.open_browser') === 'on'
      },
      shell: {
        preferred: form.get('shell.preferred'),
        fallback: form.get('shell.fallback'),
        args: lines(form.get('shell.args'))
      },
      persistence: {
        autosave_minutes: numberOrUndefined(form.get('persistence.autosave_minutes')),
        scrollback_lines: numberOrUndefined(form.get('persistence.scrollback_lines'))
      },
      terminal: {
        backend: form.get('terminal.backend'),
        reconnect_scrollback_lines: numberOrUndefined(form.get('terminal.reconnect_scrollback_lines')),
        resize_debounce_ms: numberOrUndefined(form.get('terminal.resize_debounce_ms')),
        auto_scroll_on_resize: form.get('terminal.auto_scroll_on_resize') === 'on',
        cursor_blink: form.get('terminal.cursor_blink') === 'on',
        browser_notifications: notificationInput?.disabled
          ? Boolean(state.config.terminal?.browser_notifications)
          : form.get('terminal.browser_notifications') === 'on',
        mobile_keybar_buttons: mobileKeybarButtonsFromSettings(formElement)
      },
      ui: {
        sidebar_width: numberOrUndefined(form.get('ui.sidebar_width')),
        grid_size: numberOrUndefined(form.get('ui.grid_size')),
        vertical_slots: numberOrUndefined(form.get('ui.vertical_slots')),
        terminal_font_family: form.get('ui.terminal_font_family'),
        terminal_font_size: numberOrUndefined(form.get('ui.terminal_font_size')),
        mobile_terminal_font_size: numberOrUndefined(form.get('ui.mobile_terminal_font_size')),
        file_pane_font_size: numberOrUndefined(form.get('ui.file_pane_font_size')),
        system_font_size: numberOrUndefined(form.get('ui.system_font_size')),
        notepad_word_wrap: form.get('ui.notepad_word_wrap') === 'on',
        notepad_indent_guides: form.get('ui.notepad_indent_guides') === 'on',
        notepad_autosave: form.get('ui.notepad_autosave') === 'on'
      },
      file_manager: {
        enabled: state.config.file_manager?.enabled !== false,
        root_mode: 'drives',
        max_upload_bytes: numberOrUndefined(form.get('file_manager.max_upload_bytes')) || 0
      },
      usage: {
        minimax_region: form.get('usage.minimax_region'),
        refresh_minutes: numberOrUndefined(form.get('usage.refresh_minutes')),
        show_codex: form.get('usage.show_codex') === 'on',
        show_claude: form.get('usage.show_claude') === 'on',
        show_minimax: form.get('usage.show_minimax') === 'on',
        show_five_hour: form.get('usage.show_five_hour') === 'on',
        show_weekly: form.get('usage.show_weekly') === 'on',
        show_model_weekly: form.get('usage.show_model_weekly') === 'on',
        show_credits: form.get('usage.show_credits') === 'on'
      },
      custom_theme: customThemeFromForm(form)
    };
    const minimaxApiKey = String(form.get('usage.minimax_api_key') || '').trim();
    if (form.get('usage.clear_minimax_api_key') === 'on') {
      payload.usage.minimax_api_key = '';
    } else if (minimaxApiKey) {
      payload.usage.minimax_api_key = minimaxApiKey;
    }
    const password = String(form.get('auth.password') || '');
    if (password) {
      payload.auth = { password };
    }
    return payload;
  }

  function customThemeFromForm(form) {
    return {
      mode: form.get('custom_theme.mode'),
      selected_light: form.get('custom_theme.selected_light'),
      selected_dark: form.get('custom_theme.selected_dark'),
      ink: form.get('custom_theme.ink'),
      panel: form.get('custom_theme.panel'),
      rail: form.get('custom_theme.rail'),
      surface: form.get('custom_theme.surface'),
      line: form.get('custom_theme.line'),
      text: form.get('custom_theme.text'),
      muted: form.get('custom_theme.muted'),
      accent: form.get('custom_theme.accent'),
      warn: form.get('custom_theme.warn'),
      danger: form.get('custom_theme.danger'),
      terminal_bg: form.get('custom_theme.terminal_bg'),
      terminal_fg: form.get('custom_theme.terminal_fg'),
      light_ink: form.get('custom_theme.light_ink'),
      light_panel: form.get('custom_theme.light_panel'),
      light_rail: form.get('custom_theme.light_rail'),
      light_surface: form.get('custom_theme.light_surface'),
      light_line: form.get('custom_theme.light_line'),
      light_text: form.get('custom_theme.light_text'),
      light_muted: form.get('custom_theme.light_muted'),
      light_accent: form.get('custom_theme.light_accent'),
      light_warn: form.get('custom_theme.light_warn'),
      light_danger: form.get('custom_theme.light_danger'),
      light_terminal_bg: form.get('custom_theme.light_terminal_bg'),
      light_terminal_fg: form.get('custom_theme.light_terminal_fg')
    };
  }

  function resetCustomThemePalette(mode, overlay) {
    const prefix = mode === 'light' ? 'light_' : '';
    for (const key of customThemePaletteKeys) {
      const field = `${prefix}${key}`;
      state.customThemeDraft[field] = customThemeDefaults[field];
      const input = overlay.querySelector(`[name="custom_theme.${field}"]`);
      input.value = customThemeDefaults[field];
    }
    if (state.theme === `custom-${mode}`) {
      setThemeLive(state.theme);
    }
  }

  function lines(value) {
    return String(value || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function numberOrUndefined(value) {
    if (value === null || String(value).trim() === '') {
      return undefined;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  function applyConfigLive() {
    applyUiTypography();
    app.querySelectorAll('.mobile-keybar').forEach((keybar) => {
      keybar.outerHTML = renderMobileKeybar();
    });
    wireMobileKeybarButtons(app);
    const sidebarWidth = state.sidebarWidth || Number(state.config.ui?.sidebar_width) || 286;
    document.querySelector('.app')?.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    const session = activeSession();
    const tab = activeTab(session);
    const grid = document.querySelector('.pane-grid');
    if (grid && tab) {
      // Cell size and row count drive both the pane placement and the dashed
      // backdrop, so the board picks up a saved setting without a reload.
      grid.setAttribute('style', boardStyle());
      for (const pane of tab.panes) {
        pane.layout = normalizePaneLayout(pane.layout);
        applyPaneLayoutStyle(document.querySelector(`[data-pane="${pane.id}"]`), pane.layout);
      }
    }
    for (const [paneId, item] of state.terminals.entries()) {
      item.term.options.fontFamily = state.config.ui?.terminal_font_family || item.term.options.fontFamily;
      item.term.options.fontSize = paneFontSize(findPaneState(paneId)?.pane);
      item.term.options.theme = terminalTheme();
      item.sendResize();
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value ?? '');
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  }

  load();
})();
