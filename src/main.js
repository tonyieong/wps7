#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { appRoot, loadConfig, updateConfigFile } = require('./config');
const { createSessionToken, hashPassword, validatePassword, verifyPassword, verifySessionToken } = require('./auth');
const files = require('./files');
const { resolveShell } = require('./shell');
const { StateStore } = require('./state');
const { TerminalManager } = require('./terminal');
const { startTray } = require('./tray');
const { loadOrCreateControlToken, requireRuntimeControl } = require('./runtime-control');
const { createUploadParser } = require('./upload');
const usage = require('./usage');
const { BrowserManager, isOwnServerWebsite } = require('./browser');

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const REMEMBER_TOKEN_TTL_MS = 30 * TOKEN_TTL_MS;

function openBrowser(url) {
  spawn('cmd', ['/c', 'start', '', url], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  }).unref();
}

function publicDir() {
  return path.join(__dirname, '..', 'public');
}

function ensurePackagedIcon(root) {
  if (!process.pkg) {
    return;
  }
  const source = path.join(__dirname, '..', 'assets', 'wps7.ico');
  const targetDir = path.join(root, 'data');
  const target = path.join(targetDir, 'wps7.ico');
  fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }
}

function appendRuntimeLog(root, message) {
  const targetDir = path.join(root, 'data');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.appendFileSync(path.join(targetDir, 'runtime.log'), `${new Date().toISOString()} ${message}\n`);
}

function writeRuntimeInfo(root, config) {
  const targetDir = path.join(root, 'data');
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, 'runtime.json'), JSON.stringify({
    host: config.server.host,
    port: config.server.port,
    pid: process.pid,
    updatedAt: new Date().toISOString()
  }, null, 2));
}

function isHeadlessMode() {
  return process.env.WPS7_HEADLESS === '1';
}

function isServiceManagedMode() {
  return process.env.WPS7_SERVICE_MANAGED === '1';
}

function stateCounts(store) {
  let panes = 0;
  for (const session of store.state.sessions || []) {
    for (const tab of session.tabs || []) {
      panes += (tab.panes || []).length;
    }
  }
  return {
    sessions: (store.state.sessions || []).length,
    panes
  };
}

function requireAuth(config) {
  return (req, res, next) => {
    if (!config.auth.password_hash) {
      next();
      return;
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : String(req.query.token || '');
    if (verifySessionToken(token, config.auth.password_hash)) {
      next();
      return;
    }

    res.status(401).json({ error: 'Login required.' });
  };
}

function requireFileAuth(config) {
  return (req, res, next) => {
    if (!config.file_manager.enabled) {
      res.status(404).json({ error: 'File manager is disabled.' });
      return;
    }
    if (!config.auth.password_hash) {
      res.status(403).json({ error: 'Set a strong password before using file manager.' });
      return;
    }
    requireAuth(config)(req, res, next);
  };
}

function replaceObject(target, source) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      delete target[key];
    }
  }
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = replaceObject(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

function publicConfig(config, shell, restartRequired, reloadError) {
  return {
    server: config.server,
    authRequired: Boolean(config.auth.password_hash),
    shell,
    persistence: config.persistence,
    terminal: {
      ...config.terminal,
      mobile_keybar_buttons: sanitizeMobileKeybarButtons(config.terminal.mobile_keybar_buttons)
    },
    ui: config.ui,
    file_manager: config.file_manager,
    browser: config.browser,
    usage: {
      minimax_configured: Boolean(process.env.MINIMAX_CODING_API_KEY || process.env.MINIMAX_API_KEY || config.usage.minimax_api_key),
      minimax_region: config.usage.minimax_region
    },
    custom_theme: config.custom_theme,
    restartRequired,
    reloadError
  };
}

function settingsConfig(config, runtimeConfig) {
  return {
    server: {
      host: typeof config.server.host === 'string' ? config.server.host : runtimeConfig.server.host,
      port: validPort(config.server.port) ? Number(config.server.port) : Number(runtimeConfig.server.port),
      open_browser: Boolean(config.server.open_browser)
    },
    auth: {
      password_set: Boolean(config.auth.password_hash)
    },
    shell: config.shell,
    persistence: {
      autosave_minutes: positiveInteger(config.persistence.autosave_minutes, runtimeConfig.persistence.autosave_minutes),
      scrollback_lines: nonNegativeInteger(config.persistence.scrollback_lines, runtimeConfig.persistence.scrollback_lines)
    },
    terminal: {
      backend: typeof config.terminal.backend === 'string' ? config.terminal.backend : runtimeConfig.terminal.backend,
      reconnect_scrollback_lines: nonNegativeInteger(config.terminal.reconnect_scrollback_lines, runtimeConfig.terminal.reconnect_scrollback_lines),
      resize_debounce_ms: positiveInteger(config.terminal.resize_debounce_ms, runtimeConfig.terminal.resize_debounce_ms),
      auto_scroll_on_resize: Boolean(config.terminal.auto_scroll_on_resize),
      cursor_blink: Boolean(config.terminal.cursor_blink),
      browser_notifications: Boolean(config.terminal.browser_notifications),
      mobile_keybar_buttons: sanitizeMobileKeybarButtons(config.terminal.mobile_keybar_buttons)
    },
    ui: {
      sidebar_width: positiveInteger(config.ui.sidebar_width, runtimeConfig.ui.sidebar_width),
      max_pane_columns: positiveInteger(config.ui.max_pane_columns, runtimeConfig.ui.max_pane_columns),
      max_pane_rows: positiveInteger(config.ui.max_pane_rows, runtimeConfig.ui.max_pane_rows),
      terminal_font_family: config.ui.terminal_font_family,
      terminal_font_size: positiveInteger(config.ui.terminal_font_size, runtimeConfig.ui.terminal_font_size),
      mobile_terminal_font_size: positiveInteger(config.ui.mobile_terminal_font_size, runtimeConfig.ui.mobile_terminal_font_size),
      file_pane_font_size: positiveInteger(config.ui.file_pane_font_size, runtimeConfig.ui.file_pane_font_size),
      system_font_size: positiveInteger(config.ui.system_font_size, runtimeConfig.ui.system_font_size)
    },
    file_manager: {
      enabled: Boolean(config.file_manager.enabled),
      root_mode: config.file_manager.root_mode === 'drives' ? 'drives' : runtimeConfig.file_manager.root_mode,
      max_upload_bytes: nonNegativeInteger(config.file_manager.max_upload_bytes, runtimeConfig.file_manager.max_upload_bytes),
      show_hidden: Boolean(config.file_manager.show_hidden),
      bookmarks: Array.isArray(config.file_manager.bookmarks) ? config.file_manager.bookmarks : []
    },
    browser: {
      bookmarks: Array.isArray(config.browser.bookmarks) ? config.browser.bookmarks : [],
      history: Array.isArray(config.browser.history) ? config.browser.history : []
    },
    usage: {
      minimax_configured: Boolean(process.env.MINIMAX_CODING_API_KEY || process.env.MINIMAX_API_KEY || config.usage.minimax_api_key),
      minimax_region: config.usage.minimax_region === 'china' ? 'china' : 'global'
    },
    custom_theme: config.custom_theme
  };
}

function validPort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

function validHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

function sanitizeMobileKeybarButtons(buttons) {
  const actions = new Set(['shortcut', 'modifier', 'text']);
  if (!Array.isArray(buttons)) {
    return [];
  }
  return buttons.slice(0, 24).flatMap((button) => {
    const label = typeof button?.label === 'string' ? button.label.trim().slice(0, 5) : '';
    const action = typeof button?.action === 'string' ? button.action : '';
    const value = typeof button?.value === 'string' ? button.value.slice(0, 256) : '';
    if (!label || !actions.has(action) || !value) {
      return [];
    }
    return [{ label, action, value, enabled: button.enabled !== false }];
  });
}

function sanitizeSettingsUpdates(updates) {
  const next = {};
  if (updates.server) {
    next.server = {};
    if (updates.server.host === '127.0.0.1' || updates.server.host === '0.0.0.0') {
      next.server.host = updates.server.host;
    } else if (Object.prototype.hasOwnProperty.call(updates.server, 'host')) {
      throw new Error('Server access must be Local or LAN.');
    }
    if (validPort(updates.server.port)) {
      next.server.port = Number(updates.server.port);
    }
    if (typeof updates.server.open_browser === 'boolean') {
      next.server.open_browser = updates.server.open_browser;
    }
  }
  if (updates.auth) {
    next.auth = {};
    if (Object.prototype.hasOwnProperty.call(updates.auth, 'password')) {
      const password = String(updates.auth.password || '');
      if (password) {
        const passwordError = validatePassword(password);
        if (passwordError) {
          throw new Error(passwordError);
        }
        next.auth.password_hash = hashPassword(password);
      }
    }
  }
  if (updates.shell) {
    next.shell = {};
    if (typeof updates.shell.preferred === 'string' && updates.shell.preferred.trim()) {
      next.shell.preferred = updates.shell.preferred.trim();
    }
    if (typeof updates.shell.fallback === 'string' && updates.shell.fallback.trim()) {
      next.shell.fallback = updates.shell.fallback.trim();
    }
    if (Array.isArray(updates.shell.args)) {
      next.shell.args = updates.shell.args.map((arg) => String(arg)).filter(Boolean);
    }
  }
  if (updates.persistence) {
    next.persistence = {};
    if (positiveInteger(updates.persistence.autosave_minutes, 0)) {
      next.persistence.autosave_minutes = Number(updates.persistence.autosave_minutes);
    }
    if (nonNegativeInteger(updates.persistence.scrollback_lines, -1) >= 0) {
      next.persistence.scrollback_lines = Number(updates.persistence.scrollback_lines);
    }
  }
  if (updates.terminal) {
    next.terminal = {};
    if (updates.terminal.backend === 'conpty_screen' || updates.terminal.backend === 'xterm_pty') {
      next.terminal.backend = updates.terminal.backend;
    }
    if (nonNegativeInteger(updates.terminal.reconnect_scrollback_lines, -1) >= 0) {
      next.terminal.reconnect_scrollback_lines = Number(updates.terminal.reconnect_scrollback_lines);
    }
    if (positiveInteger(updates.terminal.resize_debounce_ms, 0)) {
      next.terminal.resize_debounce_ms = Number(updates.terminal.resize_debounce_ms);
    }
    if (typeof updates.terminal.auto_scroll_on_resize === 'boolean') {
      next.terminal.auto_scroll_on_resize = updates.terminal.auto_scroll_on_resize;
    }
    if (typeof updates.terminal.cursor_blink === 'boolean') {
      next.terminal.cursor_blink = updates.terminal.cursor_blink;
    }
    if (typeof updates.terminal.browser_notifications === 'boolean') {
      next.terminal.browser_notifications = updates.terminal.browser_notifications;
    }
    if (Array.isArray(updates.terminal.mobile_keybar_buttons)) {
      next.terminal.mobile_keybar_buttons = sanitizeMobileKeybarButtons(updates.terminal.mobile_keybar_buttons);
    }
  }
  if (updates.ui) {
    next.ui = {};
    if (positiveInteger(updates.ui.sidebar_width, 0)) {
      next.ui.sidebar_width = Number(updates.ui.sidebar_width);
    }
    if (positiveInteger(updates.ui.max_pane_columns, 0)) {
      next.ui.max_pane_columns = Number(updates.ui.max_pane_columns);
    }
    if (positiveInteger(updates.ui.max_pane_rows, 0)) {
      next.ui.max_pane_rows = Number(updates.ui.max_pane_rows);
    }
    if (typeof updates.ui.terminal_font_family === 'string' && updates.ui.terminal_font_family.trim()) {
      next.ui.terminal_font_family = updates.ui.terminal_font_family.trim();
    }
    if (positiveInteger(updates.ui.terminal_font_size, 0)) {
      next.ui.terminal_font_size = Number(updates.ui.terminal_font_size);
    }
    if (positiveInteger(updates.ui.mobile_terminal_font_size, 0)) {
      next.ui.mobile_terminal_font_size = Number(updates.ui.mobile_terminal_font_size);
    }
    if (positiveInteger(updates.ui.file_pane_font_size, 0)) {
      next.ui.file_pane_font_size = Number(updates.ui.file_pane_font_size);
    }
    if (positiveInteger(updates.ui.system_font_size, 0)) {
      next.ui.system_font_size = Number(updates.ui.system_font_size);
    }
  }
  if (updates.file_manager) {
    next.file_manager = {};
    if (typeof updates.file_manager.enabled === 'boolean') {
      next.file_manager.enabled = updates.file_manager.enabled;
    }
    if (updates.file_manager.root_mode === 'drives') {
      next.file_manager.root_mode = updates.file_manager.root_mode;
    }
    if (nonNegativeInteger(updates.file_manager.max_upload_bytes, -1) >= 0) {
      next.file_manager.max_upload_bytes = Number(updates.file_manager.max_upload_bytes);
    }
    if (typeof updates.file_manager.show_hidden === 'boolean') {
      next.file_manager.show_hidden = updates.file_manager.show_hidden;
    }
    if (Array.isArray(updates.file_manager.bookmarks)) {
      next.file_manager.bookmarks = sanitizeBookmarks(updates.file_manager.bookmarks);
    }
  }
  if (updates.browser) {
    next.browser = {};
    if (Array.isArray(updates.browser.bookmarks)) {
      next.browser.bookmarks = sanitizeBrowserBookmarks(updates.browser.bookmarks);
    }
    if (Array.isArray(updates.browser.history)) {
      next.browser.history = updates.browser.history.slice(0, 50).map(normalizeWebsite).filter(Boolean);
    }
  }
  if (updates.usage) {
    next.usage = {};
    if (Object.prototype.hasOwnProperty.call(updates.usage, 'minimax_api_key')) {
      next.usage.minimax_api_key = String(updates.usage.minimax_api_key || '').trim();
    }
    if (updates.usage.minimax_region === 'global' || updates.usage.minimax_region === 'china') {
      next.usage.minimax_region = updates.usage.minimax_region;
    }
  }
  if (updates.custom_theme) {
    next.custom_theme = {};
    const lightThemeIds = ['wps-light', 'apple-light', 'claude-light', 'codex-light', 'custom-light'];
    const darkThemeIds = ['wps-dark', 'apple-dark', 'claude-dark', 'codex-dark', 'custom-dark'];
    for (const [key, themeIds] of [['selected_light', lightThemeIds], ['selected_dark', darkThemeIds]]) {
      if (themeIds.includes(updates.custom_theme[key])) {
        next.custom_theme[key] = updates.custom_theme[key];
      } else if (Object.prototype.hasOwnProperty.call(updates.custom_theme, key)) {
        throw new Error(`Unknown ${key === 'selected_light' ? 'light' : 'dark'} theme selection.`);
      }
    }
    if (updates.custom_theme.mode === 'dark' || updates.custom_theme.mode === 'light') {
      next.custom_theme.mode = updates.custom_theme.mode;
    } else if (Object.prototype.hasOwnProperty.call(updates.custom_theme, 'mode')) {
      throw new Error('Custom theme mode must be dark or light.');
    }
    for (const key of ['ink', 'panel', 'rail', 'surface', 'line', 'text', 'muted', 'accent', 'warn', 'danger', 'terminal_bg', 'terminal_fg', 'light_ink', 'light_panel', 'light_rail', 'light_surface', 'light_line', 'light_text', 'light_muted', 'light_accent', 'light_warn', 'light_danger', 'light_terminal_bg', 'light_terminal_fg']) {
      if (Object.prototype.hasOwnProperty.call(updates.custom_theme, key)) {
        if (!validHexColor(updates.custom_theme[key])) {
          throw new Error(`Custom theme ${key} must be a six-digit hex color.`);
        }
        next.custom_theme[key] = updates.custom_theme[key].toLowerCase();
      }
    }
  }
  return next;
}

function sanitizeBookmarks(bookmarks) {
  return bookmarks.map((bookmark) => {
    const bookmarkPath = files.normalizeLocalPath(bookmark.path);
    if (!bookmarkPath) {
      return null;
    }
    return {
      name: String(bookmark.name || bookmarkPath).trim(),
      path: bookmarkPath
    };
  }).filter(Boolean);
}

function normalizeWebsite(value) {
  const input = String(value || '').trim();
  if (!input) {
    return '';
  }
  try {
    const localAddress = /^(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?(?:[/?#]|$)/i.test(input);
    const url = new URL(/^https?:\/\//i.test(input) ? input : localAddress ? `http://${input}` : `https://${input}`);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch (error) {
    return null;
  }
}

function sanitizeBrowserBookmarks(bookmarks) {
  return bookmarks.slice(0, 100).flatMap((bookmark) => {
    const url = normalizeWebsite(bookmark.url);
    if (!url) {
      return [];
    }
    return [{ name: String(bookmark.name || url).trim().slice(0, 120), url }];
  });
}

function handleRouteError(res, error) {
  res.status(error.statusCode || 500).json({ error: error.message || 'Request failed.' });
}

function spawnReplacementProcess(root) {
  const args = process.pkg ? [] : process.argv.slice(1);
  if (process.platform === 'win32') {
    const scriptPath = path.join(root, 'data', 'restart-wps7.ps1');
    fs.writeFileSync(scriptPath, `
param(
  [Parameter(Mandatory=$true)][int]$ParentPid,
  [Parameter(Mandatory=$true)][string]$Executable,
  [Parameter(Mandatory=$true)][string]$WorkingDirectory,
  [string]$ArgumentsJson = '[]'
)

Wait-Process -Id $ParentPid -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 150
$Arguments = @($ArgumentsJson | ConvertFrom-Json)
if ($Arguments.Count -gt 0) {
  Start-Process -FilePath $Executable -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -WindowStyle Hidden
} else {
  Start-Process -FilePath $Executable -WorkingDirectory $WorkingDirectory -WindowStyle Hidden
}
`.trim(), 'utf8');
    const child = spawn('powershell.exe', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-WindowStyle',
      'Hidden',
      '-File',
      scriptPath,
      '-ParentPid',
      String(process.pid),
      '-Executable',
      process.execPath,
      '-WorkingDirectory',
      root,
      '-ArgumentsJson',
      JSON.stringify(args)
    ], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: {
        ...process.env,
        WPS7_HEADLESS: process.env.WPS7_HEADLESS || ''
      }
    });
    appendRuntimeLog(root, `spawned relaunch helper pid=${child.pid || 'unknown'} exe=${process.execPath} args=${JSON.stringify(args)}`);
    child.on('error', (error) => {
      appendRuntimeLog(root, `relaunch helper failed: ${error.message}`);
    });
    child.unref();
    return;
  }
  const child = spawn(process.execPath, args, {
    cwd: root,
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    env: {
      ...process.env,
      WPS7_HEADLESS: process.env.WPS7_HEADLESS || ''
    }
  });
  appendRuntimeLog(root, `spawned replacement pid=${child.pid || 'unknown'} exe=${process.execPath} args=${JSON.stringify(args)}`);
  child.on('error', (error) => {
    appendRuntimeLog(root, `replacement spawn failed: ${error.message}`);
  });
  child.unref();
}

function main() {
  const root = appRoot();
  ensurePackagedIcon(root);
  const config = loadConfig(root).config;
  const headless = isHeadlessMode();
  const serviceManaged = isServiceManagedMode();
  const startedAt = Date.now();
  const controlToken = loadOrCreateControlToken(root);
  let shell = resolveShell(config);
  let configReloadError = '';
  let restartRequired = false;
  const store = new StateStore(root, config.persistence.scrollback_lines);
  store.load();

  const app = express();
  const server = http.createServer(app);
  const terminalManager = new TerminalManager({ config, root, store, shell });
  const browserManager = new BrowserManager({
    root,
    store,
    normalizeWebsite,
    serverPort: config.server.port,
    onNavigate: (url) => {
      const current = Array.isArray(config.browser.history) ? config.browser.history : [];
      const history = [url, ...current.filter((item) => item !== url)].slice(0, 50);
      const loaded = updateConfigFile(root, { browser: { history } });
      applyLoadedConfig(loaded.config);
      return history;
    }
  });
  let trayController = null;
  let autosaveTimer = startAutosave(store, config);
  let usageCache = null;
  let stopping = false;

  function applyLoadedConfig(nextConfig) {
    const passwordChanged = nextConfig.auth.password_hash !== config.auth.password_hash;
    restartRequired = nextConfig.server.host !== config.server.host || nextConfig.server.port !== config.server.port;
    if (restartRequired) {
      nextConfig.server = {
        ...nextConfig.server,
        host: config.server.host,
        port: config.server.port
      };
    }
    replaceObject(config, nextConfig);
    shell = resolveShell(config);
    store.scrollbackLimit = config.persistence.scrollback_lines;
    terminalManager.updateConfig(config, shell);
    clearInterval(autosaveTimer);
    autosaveTimer = startAutosave(store, config);
    configReloadError = '';
    usageCache = null;
    if (passwordChanged) {
      queueMicrotask(revokeWebSocketSessions);
    }
    return publicConfig(config, shell, restartRequired, configReloadError);
  }

  function revokeWebSocketSessions() {
    for (const client of wss.clients) {
      client.close(1008, 'Login required');
    }
  }

  function stopRuntime({ restart = false } = {}) {
    if (stopping) {
      return;
    }
    stopping = true;
    appendRuntimeLog(root, `stopping pid=${process.pid} restart=${restart}`);
    store.save();
    terminalManager.shutdown();
    browserManager.shutdown();
    if (trayController) {
      trayController.kill(false);
      trayController = null;
    }
    clearInterval(autosaveTimer);
    wss.close(() => {});
    server.close(() => {
      if (restart) {
        spawnReplacementProcess(root);
      }
      process.exit(0);
    });
    setTimeout(() => {
      if (restart) {
        spawnReplacementProcess(root);
      }
      process.exit(0);
    }, 1500).unref();
  }

  app.use(express.json({ limit: '12mb' }));
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; frame-src http: https:;");
    next();
  });
  app.use(express.static(publicDir(), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store');
    }
  }));

  app.get('/api/config', (req, res) => {
    res.json(publicConfig(config, shell, restartRequired, configReloadError));
  });

  app.post('/api/config/reload', requireAuth(config), (req, res) => {
    try {
      res.json(applyLoadedConfig(loadConfig(root).config));
    } catch (error) {
      configReloadError = error.message;
      res.status(400).json({ error: configReloadError });
    }
  });

  app.get('/api/settings', requireAuth(config), (req, res) => {
    try {
      res.json(settingsConfig(loadConfig(root).config, config));
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/usage', requireAuth(config), async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1';
      if (!forceRefresh && usageCache && Date.now() - usageCache.createdAt < 60000) {
        res.json(usageCache.value);
        return;
      }
      const minimaxApiKey = process.env.MINIMAX_CODING_API_KEY || process.env.MINIMAX_API_KEY || config.usage.minimax_api_key;
      const value = await usage.fetchUsageOverview({
        codex: () => usage.fetchCodexUsage(),
        minimax: () => usage.fetchMiniMaxUsage({ apiKey: minimaxApiKey, region: config.usage.minimax_region })
      });
      usageCache = { createdAt: Date.now(), value };
      res.json(value);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.post('/api/settings', requireAuth(config), (req, res) => {
    try {
      const updates = sanitizeSettingsUpdates(req.body || {});
      const runtimeHost = config.server.host;
      const loaded = updateConfigFile(root, updates);
      const shouldRestart = req.body?.restart_after_save === true
        && loaded.config.server.host === '0.0.0.0'
        && loaded.config.server.host !== runtimeHost;
      const response = applyLoadedConfig(loaded.config);
      res.json({ ...response, restarting: shouldRestart });
      if (shouldRestart) {
        setTimeout(() => stopRuntime({ restart: !serviceManaged }), 250).unref();
      }
    } catch (error) {
      configReloadError = error.message;
      res.status(400).json({ error: configReloadError });
    }
  });

  app.post('/api/auth/hash', (req, res) => {
    const passwordError = validatePassword(req.body.password || '');
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }
    res.json({ password_hash: hashPassword(req.body.password || '') });
  });

  app.post('/api/login', (req, res) => {
    if (!verifyPassword(req.body.password || '', config.auth.password_hash)) {
      res.status(401).json({ error: 'Invalid password.' });
      return;
    }
    const ttlMs = req.body.remember ? REMEMBER_TOKEN_TTL_MS : TOKEN_TTL_MS;
    const token = createSessionToken(config.auth.password_hash, Date.now(), ttlMs);
    res.json({ token, expires_in: Math.floor(ttlMs / 1000) });
  });

  app.get('/api/state', requireAuth(config), (req, res) => {
    res.json(store.getPublicState());
  });

  app.post('/api/sessions', requireAuth(config), (req, res) => {
    res.status(201).json(store.createSession(req.body.name));
  });

  app.post('/api/sessions/:sessionId/activate', requireAuth(config), (req, res) => {
    if (!store.setActiveSession(req.params.sessionId)) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.delete('/api/sessions/:sessionId', requireAuth(config), (req, res) => {
    const session = store.state.sessions.find((candidate) => candidate.id === req.params.sessionId);
    const ok = store.closeSession(req.params.sessionId);
    if (ok) {
      terminalManager.killSession(session);
      browserManager.killSession(session);
    }
    res.json({ ok });
  });

  app.patch('/api/sessions/:sessionId', requireAuth(config), (req, res) => {
    if (!store.renameSession(req.params.sessionId, req.body.name)) {
      res.status(404).json({ error: 'Session not found.' });
      return;
    }
    const session = store.state.sessions.find((candidate) => candidate.id === req.params.sessionId);
    res.json({ id: session.id, name: session.name });
  });

  app.post('/api/panes/:paneId/activate', requireAuth(config), (req, res) => {
    if (!store.setActivePane(req.params.paneId)) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.patch('/api/panes/:paneId', requireAuth(config), (req, res) => {
    const hasTitle = typeof req.body.title === 'string';
    const hasFontSize = req.body.fontSize !== undefined;
    if (!hasTitle && !hasFontSize) {
      res.status(400).json({ error: 'No pane changes supplied.' });
      return;
    }
    if (hasTitle && !store.renamePane(req.params.paneId, req.body.title)) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    if (hasFontSize && !store.setPaneFontSize(req.params.paneId, req.body.fontSize)) {
      res.status(400).json({ error: 'Pane font size must be between 8 and 32.' });
      return;
    }
    const { pane } = store.findPane(req.params.paneId);
    res.json({ id: pane.id, title: pane.title, cwd: pane.cwd, fontSize: pane.fontSize, split: pane.split });
  });

  app.get('/api/panes/:paneId/status', requireAuth(config), (req, res) => {
    const status = terminalManager.getPaneStatus(req.params.paneId);
    if (!status) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    res.json(status);
  });

  app.post('/api/panes/:paneId/split', requireAuth(config), (req, res) => {
    const found = store.findPane(req.params.paneId);
    if (!found) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    const pane = store.splitPane(req.params.paneId, req.body.direction);
    if (!pane) {
      res.status(400).json({ error: 'Unable to create pane.' });
      return;
    }
    res.status(201).json({
      ...pane,
      paneLayouts: found.tab.panes.map((candidate) => ({ id: candidate.id, layout: candidate.layout }))
    });
  });

  app.post('/api/panes/:paneId/files', requireFileAuth(config), (req, res) => {
    const found = store.findPane(req.params.paneId);
    if (!found) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    const pane = store.createFilesPane(req.params.paneId, req.body.path);
    if (!pane) {
      res.status(400).json({ error: 'Unable to create pane.' });
      return;
    }
    res.status(201).json({
      ...pane,
      paneLayouts: found.tab.panes.map((candidate) => ({ id: candidate.id, layout: candidate.layout }))
    });
  });

  app.patch('/api/panes/:paneId/files/path', requireFileAuth(config), (req, res) => {
    const nextPath = req.body.path ? files.normalizeLocalPath(req.body.path) : '';
    if (req.body.path && !nextPath) {
      res.status(400).json({ error: 'Invalid local path.' });
      return;
    }
    if (!store.setFilesPanePath(req.params.paneId, nextPath)) {
      res.status(404).json({ error: 'Files pane not found.' });
      return;
    }
    const { pane } = store.findPane(req.params.paneId);
    res.json({ id: pane.id, path: pane.path });
  });

  app.post('/api/panes/:paneId/browser', requireAuth(config), (req, res) => {
    const found = store.findPane(req.params.paneId);
    const url = normalizeWebsite(req.body.url);
    if (!found) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    if (req.body.url && !url) {
      res.status(400).json({ error: 'Website must use HTTP or HTTPS.' });
      return;
    }
    if (url && isOwnServerWebsite(url, config.server.port)) {
      res.status(400).json({ error: 'WPS7 cannot open its own server address in a Browser pane.' });
      return;
    }
    const pane = store.createBrowserPane(req.params.paneId, url || '', req.body.emulationMode);
    if (!pane) {
      res.status(400).json({ error: 'Unable to create pane.' });
      return;
    }
    res.status(201).json({
      ...pane,
      paneLayouts: found.tab.panes.map((candidate) => ({ id: candidate.id, layout: candidate.layout }))
    });
  });

  app.patch('/api/panes/:paneId/browser/url', requireAuth(config), (req, res) => {
    const url = normalizeWebsite(req.body.url);
    if (req.body.url && !url) {
      res.status(400).json({ error: 'Website must use HTTP or HTTPS.' });
      return;
    }
    if (url && isOwnServerWebsite(url, config.server.port)) {
      res.status(400).json({ error: 'WPS7 cannot open its own server address in a Browser pane.' });
      return;
    }
    if (!store.setBrowserPaneUrl(req.params.paneId, url || '')) {
      res.status(404).json({ error: 'Browser pane not found.' });
      return;
    }
    res.json({ id: req.params.paneId, url: url || '' });
  });

  app.post('/api/panes/:paneId/notepad', requireFileAuth(config), (req, res) => {
    const found = store.findPane(req.params.paneId);
    const targetPath = req.body.path ? files.normalizeLocalPath(req.body.path) : '';
    if (!found) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    if (req.body.path && !targetPath) {
      res.status(400).json({ error: 'Invalid local path.' });
      return;
    }
    const pane = store.createNotepadPane(req.params.paneId, targetPath);
    if (!pane) {
      res.status(400).json({ error: 'Unable to create pane.' });
      return;
    }
    res.status(201).json({
      ...pane,
      paneLayouts: found.tab.panes.map((candidate) => ({ id: candidate.id, layout: candidate.layout }))
    });
  });

  app.post('/api/panes/:paneId/notepad/tabs', requireFileAuth(config), (req, res) => {
    const targetPath = req.body.path ? files.normalizeLocalPath(req.body.path) : '';
    if (req.body.path && !targetPath) {
      res.status(400).json({ error: 'Invalid local path.' });
      return;
    }
    const tab = store.createNotepadTab(req.params.paneId, targetPath);
    if (!tab) {
      res.status(404).json({ error: 'Notepad pane not found.' });
      return;
    }
    res.status(201).json({ tab });
  });

  app.post('/api/panes/:paneId/notepad/tabs/:tabId/activate', requireFileAuth(config), (req, res) => {
    if (!store.activateNotepadTab(req.params.paneId, req.params.tabId)) {
      res.status(404).json({ error: 'Notepad tab not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.patch('/api/panes/:paneId/notepad/tabs/:tabId', requireFileAuth(config), (req, res) => {
    const updates = {};
    if (req.body.path !== undefined) {
      const targetPath = req.body.path ? files.normalizeLocalPath(req.body.path) : '';
      if (req.body.path && !targetPath) {
        res.status(400).json({ error: 'Invalid local path.' });
        return;
      }
      updates.path = targetPath;
    }
    if (req.body.title !== undefined) {
      updates.title = req.body.title;
    }
    if (req.body.content !== undefined) {
      if (typeof req.body.content !== 'string' || Buffer.byteLength(req.body.content, 'utf8') > 10 * 1024 * 1024) {
        res.status(413).json({ error: 'Notepad draft exceeds the 10 MB limit.' });
        return;
      }
      updates.content = req.body.content;
    }
    if (req.body.encoding !== undefined) {
      if (!['utf8', 'utf8-bom', 'utf16le', 'utf16be', 'latin1'].includes(req.body.encoding)) {
        res.status(400).json({ error: 'Unsupported text encoding.' });
        return;
      }
      updates.encoding = req.body.encoding;
    }
    for (const key of ['wrap', 'indentGuides', 'autosave']) {
      if (req.body[key] !== undefined) {
        if (typeof req.body[key] !== 'boolean') {
          res.status(400).json({ error: `${key} must be a boolean.` });
          return;
        }
        updates[key] = req.body[key];
      }
    }
    if (req.body.fontFamily !== undefined) {
      updates.fontFamily = String(req.body.fontFamily || '').slice(0, 200);
    }
    if (!store.updateNotepadTab(req.params.paneId, req.params.tabId, updates)) {
      res.status(404).json({ error: 'Notepad tab not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.delete('/api/panes/:paneId/notepad/tabs/:tabId', requireFileAuth(config), (req, res) => {
    if (!store.closeNotepadTab(req.params.paneId, req.params.tabId)) {
      res.status(404).json({ error: 'Notepad tab not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.patch('/api/panes/:paneId/layout', requireAuth(config), (req, res) => {
    if (!store.findPane(req.params.paneId)) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    if (!store.resizePane(req.params.paneId, req.body.layout)) {
      res.status(400).json({ error: 'Unable to update pane layout.' });
      return;
    }
    const { pane } = store.findPane(req.params.paneId);
    res.json({ id: pane.id, layout: pane.layout });
  });

  app.patch('/api/tabs/:tabId/camera', requireAuth(config), (req, res) => {
    if (!store.setCamera(req.params.tabId, req.body.camera)) {
      res.status(404).json({ error: 'Tab not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.post('/api/panes/:paneId/move', requireAuth(config), (req, res) => {
    if (!store.movePane(req.params.paneId, req.body.beforePaneId)) {
      res.status(404).json({ error: 'Pane not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.delete('/api/panes/:paneId', requireAuth(config), (req, res) => {
    const ok = store.closePane(req.params.paneId);
    if (ok) {
      terminalManager.killPane(req.params.paneId);
      browserManager.killPane(req.params.paneId);
    }
    res.json({ ok });
  });

  app.post('/api/save', requireAuth(config), (req, res) => {
    store.save();
    res.json({ ok: true, updatedAt: store.state.updatedAt });
  });

  app.post('/api/runtime/save', requireRuntimeControl(controlToken), (req, res) => {
    store.save();
    res.json({ ok: true, updatedAt: store.state.updatedAt });
  });

  app.get('/api/runtime/status', requireRuntimeControl(controlToken), (req, res) => {
    res.json({
      ok: true,
      pid: process.pid,
      host: config.server.host,
      port: config.server.port,
      headless,
      serviceManaged,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      configLoaded: !configReloadError,
      configReloadError,
      stateUpdatedAt: store.state.updatedAt,
      ...stateCounts(store)
    });
  });

  app.post('/api/runtime/restart', requireRuntimeControl(controlToken), (req, res) => {
    res.json({ ok: true });
    setTimeout(() => stopRuntime({ restart: !serviceManaged }), 100).unref();
  });

  app.post('/api/runtime/shutdown', requireRuntimeControl(controlToken), (req, res) => {
    if (serviceManaged) {
      res.status(409).json({ error: 'wps7 is service managed. Stop the Windows service instead.' });
      return;
    }
    res.json({ ok: true });
    setTimeout(() => stopRuntime(), 100).unref();
  });

  app.get('/api/files/drives', requireFileAuth(config), (req, res) => {
    try {
      res.json({ drives: files.listDrives() });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.get('/api/files/bookmarks', requireFileAuth(config), (req, res) => {
    res.json({ bookmarks: Array.isArray(config.file_manager.bookmarks) ? config.file_manager.bookmarks : [] });
  });

  app.post('/api/files/bookmarks', requireFileAuth(config), (req, res) => {
    try {
      const bookmarkPath = files.normalizeLocalPath(req.body.path);
      if (!bookmarkPath) {
        res.status(400).json({ error: 'Invalid local path.' });
        return;
      }
      const bookmarks = Array.isArray(config.file_manager.bookmarks) ? config.file_manager.bookmarks : [];
      const nextBookmark = { name: String(req.body.name || bookmarkPath).trim(), path: bookmarkPath };
      const nextBookmarks = bookmarks.filter((bookmark) => bookmark.path.toLowerCase() !== bookmarkPath.toLowerCase());
      nextBookmarks.push(nextBookmark);
      const loaded = updateConfigFile(root, { file_manager: { bookmarks: nextBookmarks } });
      applyLoadedConfig(loaded.config);
      res.status(201).json({ bookmarks: config.file_manager.bookmarks });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.delete('/api/files/bookmarks', requireFileAuth(config), (req, res) => {
    try {
      const bookmarkPath = files.normalizeLocalPath(req.body.path);
      if (!bookmarkPath) {
        res.status(400).json({ error: 'Invalid local path.' });
        return;
      }
      const bookmarks = Array.isArray(config.file_manager.bookmarks) ? config.file_manager.bookmarks : [];
      const nextBookmarks = bookmarks.filter((bookmark) => bookmark.path.toLowerCase() !== bookmarkPath.toLowerCase());
      const loaded = updateConfigFile(root, { file_manager: { bookmarks: nextBookmarks } });
      applyLoadedConfig(loaded.config);
      res.json({ bookmarks: config.file_manager.bookmarks });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.get('/api/files', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.listDirectory(req.query.path));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.get('/api/files/text', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.readTextFile(req.query.path));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.put('/api/files/text', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.writeTextFile(req.body.path, req.body.content, req.body.encoding));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.post('/api/browser/upload', requireAuth(config), (req, res) => {
    const tabId = String(req.query.tabId || '');
    const nodeId = Number(req.query.nodeId);
    const uploadRoot = path.join(root, 'data', 'browser-uploads', crypto.randomUUID());
    fs.mkdirSync(uploadRoot, { recursive: true });
    const paths = [];
    const writes = [];
    try {
      const uploadLimit = Number(config.file_manager.max_upload_bytes) || 0;
      const busboy = createUploadParser(req.headers, uploadLimit);
      let uploadError = null;
      busboy.on('file', (field, stream, info) => {
        const filename = path.basename(info.filename || 'upload').replace(/[<>:"/\\|?*]/g, '_');
        const target = path.join(uploadRoot, filename);
        paths.push(target);
        const output = fs.createWriteStream(target);
        writes.push(new Promise((resolve, reject) => {
          output.on('finish', resolve);
          output.on('error', reject);
          stream.on('error', reject);
        }));
        stream.on('limit', () => { uploadError = new Error('Upload exceeds configured size limit.'); });
        stream.pipe(output);
      });
      busboy.on('error', (error) => { uploadError = error; });
      busboy.on('finish', async () => {
        try {
          await Promise.all(writes);
          if (uploadError) throw uploadError;
          await browserManager.setFileInputFiles(tabId, nodeId, paths);
          res.status(201).json({ ok: true, count: paths.length });
          setTimeout(() => fs.rm(uploadRoot, { recursive: true, force: true }, () => {}), 10 * 60 * 1000).unref();
        } catch (error) {
          fs.rm(uploadRoot, { recursive: true, force: true }, () => {});
          handleRouteError(res, error);
        }
      });
      req.pipe(busboy);
    } catch (error) {
      fs.rm(uploadRoot, { recursive: true, force: true }, () => {});
      handleRouteError(res, error);
    }
  });

  app.get('/api/browser/downloads/:guid', requireAuth(config), (req, res) => {
    const download = browserManager.downloadFile(req.params.guid);
    if (!download) {
      res.status(404).json({ error: 'Download is not ready.' });
      return;
    }
    res.download(download.path, download.filename);
  });

  app.get('/api/browser/bookmarks', requireAuth(config), (req, res) => {
    res.json({ bookmarks: Array.isArray(config.browser.bookmarks) ? config.browser.bookmarks : [] });
  });

  app.post('/api/browser/bookmarks', requireAuth(config), (req, res) => {
    const url = normalizeWebsite(req.body.url);
    if (!url) {
      res.status(400).json({ error: 'Website must use HTTP or HTTPS.' });
      return;
    }
    const bookmarks = Array.isArray(config.browser.bookmarks) ? config.browser.bookmarks : [];
    const next = bookmarks.filter((bookmark) => bookmark.url !== url);
    next.push({ name: String(req.body.name || url).trim().slice(0, 120), url });
    const loaded = updateConfigFile(root, { browser: { bookmarks: next } });
    applyLoadedConfig(loaded.config);
    res.status(201).json({ bookmarks: config.browser.bookmarks });
  });

  app.delete('/api/browser/bookmarks', requireAuth(config), (req, res) => {
    const url = normalizeWebsite(req.body.url);
    const bookmarks = Array.isArray(config.browser.bookmarks) ? config.browser.bookmarks : [];
    const loaded = updateConfigFile(root, {
      browser: { bookmarks: url ? bookmarks.filter((bookmark) => bookmark.url !== url) : bookmarks }
    });
    applyLoadedConfig(loaded.config);
    res.json({ bookmarks: config.browser.bookmarks });
  });

  app.post('/api/files/folder', requireFileAuth(config), (req, res) => {
    try {
      res.status(201).json(files.createFolder(req.body.path, req.body.name));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.post('/api/files/file', requireFileAuth(config), (req, res) => {
    try {
      res.status(201).json(files.createFile(req.body.path, req.body.name));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.get('/api/files/download', requireFileAuth(config), async (req, res) => {
    try {
      const download = await files.prepareDownload(req.query.path);
      res.download(download.path, download.name, (error) => {
        if (download.temporary) {
          fs.unlink(download.path, () => {});
        }
        if (error && !res.headersSent) {
          handleRouteError(res, error);
        }
      });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.post('/api/files/download-archive', requireFileAuth(config), async (req, res) => {
    try {
      const download = await files.prepareBulkDownload(req.body.paths);
      res.download(download.path, download.name, (error) => {
        if (download.temporary) {
          fs.unlink(download.path, () => {});
        }
        if (error && !res.headersSent) {
          handleRouteError(res, error);
        }
      });
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.patch('/api/files/rename', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.renameItem(req.body.path, req.body.name));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.patch('/api/files/move', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.moveItem(req.body.path, req.body.destination));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.delete('/api/files', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.deleteItem(req.body.path));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.post('/api/files/delete-bulk', requireFileAuth(config), (req, res) => {
    try {
      res.json(files.deleteItems(req.body.paths));
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  app.post('/api/files/upload', requireFileAuth(config), (req, res) => {
    const targetPath = req.query.path;
    let finished = false;
    let uploadError = null;
    let pending = Promise.resolve([]);
    try {
      files.listDirectory(targetPath);
      const uploadLimit = Number(config.file_manager.max_upload_bytes) || 0;
      const busboy = createUploadParser(req.headers, uploadLimit);
      const uploaded = [];
      busboy.on('file', (field, stream, info) => {
        stream.on('limit', () => {
          uploadError = new Error('Upload exceeds configured size limit.');
          uploadError.statusCode = 413;
        });
        pending = pending.then(async () => {
          const saved = await files.saveUploadedFile(targetPath, info.filename, stream);
          uploaded.push(saved);
        }).catch((error) => {
          uploadError = error;
          stream.resume();
        });
      });
      busboy.on('error', (error) => {
        uploadError = error;
      });
      busboy.on('finish', async () => {
        if (finished) {
          return;
        }
        finished = true;
        try {
          await pending;
          if (uploadError) {
            throw uploadError;
          }
          res.status(201).json({ files: uploaded });
        } catch (error) {
          handleRouteError(res, error);
        }
      });
      req.pipe(busboy);
    } catch (error) {
      handleRouteError(res, error);
    }
  });

  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const paneId = url.searchParams.get('paneId');
    const token = url.searchParams.get('token');
    if (config.auth.password_hash && !verifySessionToken(token, config.auth.password_hash)) {
      ws.close(1008, 'Login required');
      return;
    }
    if (url.searchParams.get('mode') === 'browser') {
      browserManager.attach(paneId, ws);
    } else {
      terminalManager.attach(paneId, ws);
    }
  });

  const handleListenError = (error) => {
    if (error.code === 'EADDRINUSE') {
      const url = `http://${config.server.host === '0.0.0.0' ? '127.0.0.1' : config.server.host}:${config.server.port}`;
      if (config.server.open_browser) {
        openBrowser(url);
      }
      process.exit(1);
    }
    throw error;
  };

  server.on('error', handleListenError);
  wss.on('error', handleListenError);

  server.listen(config.server.port, config.server.host, () => {
    writeRuntimeInfo(root, config);
    appendRuntimeLog(root, `listening pid=${process.pid} host=${config.server.host} port=${config.server.port} headless=${headless} serviceManaged=${serviceManaged}`);
    const url = `http://${config.server.host === '0.0.0.0' ? '127.0.0.1' : config.server.host}:${config.server.port}`;
    if (!headless) {
      trayController = startTray({
        root,
        url,
        save: () => store.save(),
        openBrowser,
        restart: () => stopRuntime({ restart: true }),
        shutdown: () => stopRuntime()
      });
    }
    if (!headless && config.server.open_browser) {
      openBrowser(url);
    }
  });

}

function startAutosave(store, config) {
  const minutes = Math.max(1, Number(config.persistence.autosave_minutes) || 15);
  const timer = setInterval(() => store.save(), minutes * 60 * 1000);
  timer.unref();
  return timer;
}

main();
