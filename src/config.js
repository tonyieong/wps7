const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

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

const defaultConfig = {
  server: {
    host: '127.0.0.1',
    port: 5000,
    open_browser: true
  },
  auth: {
    password_hash: ''
  },
  shell: {
    preferred: 'pwsh.exe',
    fallback: 'powershell.exe',
    args: [
      '-NoLogo',
      '-NoExit',
      '-Command',
      'try { Set-PSReadLineOption -PredictionSource None } catch {}'
    ]
  },
  persistence: {
    autosave_minutes: 15,
    scrollback_lines: 10000
  },
  terminal: {
    backend: 'conpty_screen',
    reconnect_scrollback_lines: 2000,
    resize_debounce_ms: 100,
    auto_scroll_on_resize: false,
    cursor_blink: true,
    browser_notifications: false,
    mobile_keybar_buttons: defaultMobileKeybarButtons
  },
  ui: {
    sidebar_width: 286,
    max_pane_columns: 4,
    max_pane_rows: 3,
    terminal_font_family: 'Consolas, "Cascadia Mono", monospace',
    terminal_font_size: 13,
    mobile_terminal_font_size: 12,
    file_pane_font_size: 13,
    system_font_size: 13
  },
  file_manager: {
    enabled: true,
    root_mode: 'drives',
    max_upload_bytes: 0,
    show_hidden: false,
    bookmarks: []
  },
  browser: {
    bookmarks: [],
    history: []
  },
  usage: {
    minimax_api_key: '',
    minimax_region: 'global',
    show_codex: true,
    show_claude: true,
    show_minimax: true
  },
  custom_theme: {
    selected_light: 'wps-light',
    selected_dark: 'wps-dark',
    mode: 'dark',
    ink: '#0c1017',
    panel: '#161b24',
    rail: '#111721',
    surface: '#202735',
    line: '#394354',
    text: '#f4f7fa',
    muted: '#9aa7b8',
    accent: '#6ee7c2',
    warn: '#f0b35a',
    danger: '#ff7676',
    terminal_bg: '#080c12',
    terminal_fg: '#f4f7fa',
    light_ink: '#f5f7f8',
    light_panel: '#ffffff',
    light_rail: '#f2f5f6',
    light_surface: '#edf3f3',
    light_line: '#d7e0e4',
    light_text: '#14202b',
    light_muted: '#667582',
    light_accent: '#159d83',
    light_warn: '#8a4f00',
    light_danger: '#c43d4b',
    light_terminal_bg: '#ffffff',
    light_terminal_fg: '#17232d'
  }
};

const defaultConfigText = `# Settings saved in the web UI update this file.
# Hot reload: [auth], [shell], [persistence], [ui]
# Restart wps7.exe: server.host, server.port

[server]
# Requires restart: host and port are bound when wps7.exe starts.
# Hot reload: open_browser only affects future browser opens.
host = "127.0.0.1"
port = 5000
open_browser = true

[auth]
# Hot reload.
password_hash = ""

[shell]
# Hot reload for new panes only. Existing PowerShell processes keep their current executable and args.
preferred = "pwsh.exe"
fallback = "powershell.exe"
args = ["-NoLogo", "-NoExit", "-Command", "try { Set-PSReadLineOption -PredictionSource None } catch {}"]

[persistence]
# Hot reload.
autosave_minutes = 15
scrollback_lines = 10000

[terminal]
# Hot reload.
backend = "conpty_screen"
reconnect_scrollback_lines = 2000
resize_debounce_ms = 100
auto_scroll_on_resize = false
cursor_blink = true
browser_notifications = false
mobile_keybar_buttons = ${formatTomlValue(defaultMobileKeybarButtons)}

[ui]
# Hot reload after saving settings in the web UI.
sidebar_width = 286
max_pane_columns = 4
max_pane_rows = 3
terminal_font_family = "Consolas, \\"Cascadia Mono\\", monospace"
terminal_font_size = 13
mobile_terminal_font_size = 12
file_pane_font_size = 13
system_font_size = 13

[file_manager]
# File manager always requires a strong password before use.
enabled = true
root_mode = "drives"
# 0 means no app-level upload limit.
max_upload_bytes = 0
show_hidden = false
bookmarks = []

[browser]
bookmarks = []
history = []

[usage]
# MiniMax Coding Plan key. MINIMAX_CODING_API_KEY or MINIMAX_API_KEY takes precedence.
minimax_api_key = ""
minimax_region = "global"
show_codex = true
show_claude = true
show_minimax = true

[custom_theme]
selected_light = "wps-light"
selected_dark = "wps-dark"
mode = "dark"
ink = "#0c1017"
panel = "#161b24"
rail = "#111721"
surface = "#202735"
line = "#394354"
text = "#f4f7fa"
muted = "#9aa7b8"
accent = "#6ee7c2"
warn = "#f0b35a"
danger = "#ff7676"
terminal_bg = "#080c12"
terminal_fg = "#f4f7fa"
light_ink = "#f5f7f8"
light_panel = "#ffffff"
light_rail = "#f2f5f6"
light_surface = "#edf3f3"
light_line = "#d7e0e4"
light_text = "#14202b"
light_muted = "#667582"
light_accent = "#159d83"
light_warn = "#8a4f00"
light_danger = "#c43d4b"
light_terminal_bg = "#ffffff"
light_terminal_fg = "#17232d"
`;

function deepMerge(base, value) {
  const result = { ...base };
  for (const [key, nextValue] of Object.entries(value || {})) {
    if (nextValue && typeof nextValue === 'object' && !Array.isArray(nextValue)) {
      result[key] = deepMerge(base[key] || {}, nextValue);
    } else {
      result[key] = nextValue;
    }
  }
  return result;
}

function appRoot() {
  if (process.pkg) {
    return path.dirname(process.execPath);
  }
  return path.resolve(__dirname, '..');
}

function loadConfig(root = appRoot()) {
  const configPath = path.join(root, 'config.toml');
  if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, defaultConfigText);
  }

  const configText = normalizeConfigText(fs.readFileSync(configPath, 'utf8'));
  fs.writeFileSync(configPath, configText);
  const parsed = TOML.parse(configText);
  const config = deepMerge(defaultConfig, parsed);
  const port = Number(config.server.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    config.server.port = defaultConfig.server.port;
  } else {
    config.server.port = port;
  }

  if (config.server.host === '0.0.0.0' && !config.auth.password_hash) {
    throw new Error('Binding to 0.0.0.0 requires auth.password_hash in config.toml.');
  }

  return { config, configPath, root };
}

function normalizeConfigText(configText) {
  let nextText = configText
    .replace(/^port\s*=\s*5_000\s*$/m, 'port = 5000')
    .replace(/^scrollback_lines\s*=\s*100_000\s*$/m, 'scrollback_lines = 100000')
    .replace(/^allowlist\s*=\s*\[\s*"codex"\s*\]\s*$/m, 'allowlist = []')
    .replace(/^args\s*=\s*\["-NoLogo",\s*"-NoProfile",\s*"-NoExit",\s*"-Command",\s*"try \{ Set-PSReadLineOption -PredictionSource None \} catch \{\}; Clear-Host"\]\s*$/m, 'args = ["-NoLogo", "-NoExit", "-Command", "try { Set-PSReadLineOption -PredictionSource None } catch {}"]')
    .replace(/^args\s*=\s*\["-NoLogo",\s*"-NoExit",\s*"-Command",\s*"try \{ Set-PSReadLineOption -PredictionSource None \} catch \{\}; Clear-Host"\]\s*$/m, 'args = ["-NoLogo", "-NoExit", "-Command", "try { Set-PSReadLineOption -PredictionSource None } catch {}"]')
    .replace(/^args\s*=\s*\[\s*\]\s*$/m, 'args = ["-NoLogo", "-NoExit", "-Command", "try { Set-PSReadLineOption -PredictionSource None } catch {}"]');

  if (!/^\[ui\]\s*$/m.test(nextText)) {
    nextText = `${nextText.trimEnd()}

[ui]
sidebar_width = ${defaultConfig.ui.sidebar_width}
max_pane_columns = ${defaultConfig.ui.max_pane_columns}
max_pane_rows = ${defaultConfig.ui.max_pane_rows}
terminal_font_family = "${defaultConfig.ui.terminal_font_family.replaceAll('"', '\\"')}"
terminal_font_size = ${defaultConfig.ui.terminal_font_size}
mobile_terminal_font_size = ${defaultConfig.ui.mobile_terminal_font_size}
file_pane_font_size = ${defaultConfig.ui.file_pane_font_size}
system_font_size = ${defaultConfig.ui.system_font_size}
`;
  }

  if (/^\[ui\]\s*$/m.test(nextText)) {
    nextText = ensureTomlKey(nextText, 'ui', 'terminal_font_family', defaultConfig.ui.terminal_font_family);
    nextText = ensureTomlKey(nextText, 'ui', 'terminal_font_size', defaultConfig.ui.terminal_font_size);
    nextText = ensureTomlKey(nextText, 'ui', 'mobile_terminal_font_size', defaultConfig.ui.mobile_terminal_font_size);
    nextText = ensureTomlKey(nextText, 'ui', 'file_pane_font_size', defaultConfig.ui.file_pane_font_size);
    nextText = ensureTomlKey(nextText, 'ui', 'system_font_size', defaultConfig.ui.system_font_size);
  }
  if (!/^\[file_manager\]\s*$/m.test(nextText)) {
    nextText = `${nextText.trimEnd()}

[file_manager]
enabled = true
root_mode = "drives"
max_upload_bytes = 0
show_hidden = false
bookmarks = []
`;
  }
  if (/^\[file_manager\]\s*$/m.test(nextText)) {
    nextText = ensureTomlKey(nextText, 'file_manager', 'enabled', defaultConfig.file_manager.enabled);
    nextText = ensureTomlKey(nextText, 'file_manager', 'root_mode', defaultConfig.file_manager.root_mode);
    nextText = ensureTomlKey(nextText, 'file_manager', 'max_upload_bytes', defaultConfig.file_manager.max_upload_bytes);
    nextText = ensureTomlKey(nextText, 'file_manager', 'show_hidden', defaultConfig.file_manager.show_hidden);
    nextText = ensureTomlKey(nextText, 'file_manager', 'bookmarks', defaultConfig.file_manager.bookmarks);
  }
  if (!/^\[browser\]\s*$/m.test(nextText)) {
    nextText = `${nextText.trimEnd()}\n\n[browser]\nbookmarks = []\nhistory = []\n`;
  }
  nextText = ensureTomlKey(nextText, 'browser', 'bookmarks', defaultConfig.browser.bookmarks);
  nextText = ensureTomlKey(nextText, 'browser', 'history', defaultConfig.browser.history);
  if (!/^\[usage\]\s*$/m.test(nextText)) {
    nextText = `${nextText.trimEnd()}\n\n[usage]\nminimax_api_key = ""\nminimax_region = "global"\n`;
  }
  nextText = ensureTomlKey(nextText, 'usage', 'minimax_api_key', defaultConfig.usage.minimax_api_key);
  nextText = ensureTomlKey(nextText, 'usage', 'minimax_region', defaultConfig.usage.minimax_region);
  nextText = ensureTomlKey(nextText, 'usage', 'show_codex', defaultConfig.usage.show_codex);
  nextText = ensureTomlKey(nextText, 'usage', 'show_claude', defaultConfig.usage.show_claude);
  nextText = ensureTomlKey(nextText, 'usage', 'show_minimax', defaultConfig.usage.show_minimax);
  if (!/^\[terminal\]\s*$/m.test(nextText)) {
    nextText = `${nextText.trimEnd()}

[terminal]
backend = "conpty_screen"
reconnect_scrollback_lines = 2000
resize_debounce_ms = 100
auto_scroll_on_resize = false
cursor_blink = true
browser_notifications = false
mobile_keybar_buttons = ${formatTomlValue(defaultMobileKeybarButtons)}
`;
  }
  if (/^\[terminal\]\s*$/m.test(nextText)) {
    nextText = ensureTomlKey(nextText, 'terminal', 'backend', defaultConfig.terminal.backend);
    nextText = ensureTomlKey(nextText, 'terminal', 'reconnect_scrollback_lines', defaultConfig.terminal.reconnect_scrollback_lines);
    nextText = ensureTomlKey(nextText, 'terminal', 'resize_debounce_ms', defaultConfig.terminal.resize_debounce_ms);
    nextText = ensureTomlKey(nextText, 'terminal', 'auto_scroll_on_resize', defaultConfig.terminal.auto_scroll_on_resize);
    nextText = ensureTomlKey(nextText, 'terminal', 'cursor_blink', defaultConfig.terminal.cursor_blink);
    nextText = ensureTomlKey(nextText, 'terminal', 'browser_notifications', defaultConfig.terminal.browser_notifications);
    nextText = ensureTomlKey(nextText, 'terminal', 'mobile_keybar_buttons', defaultConfig.terminal.mobile_keybar_buttons);
  }
  if (!/^\[custom_theme\]\s*$/m.test(nextText)) {
    nextText = `${nextText.trimEnd()}\n\n[custom_theme]\n`;
  }
  for (const [key, value] of Object.entries(defaultConfig.custom_theme)) {
    nextText = ensureTomlKey(nextText, 'custom_theme', key, value);
  }

  return nextText;
}

function formatTomlValue(value) {
  if (Array.isArray(value)) {
    return `[${value.map(formatTomlValue).join(', ')}]`;
  }
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).map(([key, nextValue]) => `${key} = ${formatTomlValue(nextValue)}`).join(', ')} }`;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function sectionRange(configText, section) {
  const startMatch = new RegExp(`^\\[${section}\\]\\s*$`, 'm').exec(configText);
  if (!startMatch) {
    return null;
  }
  const start = startMatch.index + startMatch[0].length;
  const rest = configText.slice(start);
  const nextMatch = /^\[[^\]]+\]\s*$/m.exec(rest);
  return {
    start,
    end: nextMatch ? start + nextMatch.index : configText.length
  };
}

function ensureTomlKey(configText, section, key, value) {
  const range = sectionRange(configText, section);
  if (!range) {
    return `${configText.trimEnd()}\n\n[${section}]\n${key} = ${formatTomlValue(value)}\n`;
  }
  const body = configText.slice(range.start, range.end);
  if (new RegExp(`^${key}\\s*=`, 'm').test(body)) {
    return configText;
  }
  return `${configText.slice(0, range.end).trimEnd()}\n${key} = ${formatTomlValue(value)}\n${configText.slice(range.end)}`;
}

function setTomlKey(configText, section, key, value) {
  let nextText = ensureTomlKey(configText, section, key, value);
  const range = sectionRange(nextText, section);
  const body = nextText.slice(range.start, range.end);
  const nextBody = body.replace(new RegExp(`^${key}\\s*=.*$`, 'm'), `${key} = ${formatTomlValue(value)}`);
  return `${nextText.slice(0, range.start)}${nextBody}${nextText.slice(range.end)}`;
}

function updateConfigFile(root, updates) {
  const configPath = path.join(root, 'config.toml');
  let configText = normalizeConfigText(fs.readFileSync(configPath, 'utf8'));
  const allowed = {
    server: ['host', 'port', 'open_browser'],
    auth: ['password_hash'],
    shell: ['preferred', 'fallback', 'args'],
    persistence: ['autosave_minutes', 'scrollback_lines'],
    terminal: ['backend', 'reconnect_scrollback_lines', 'resize_debounce_ms', 'auto_scroll_on_resize', 'cursor_blink', 'browser_notifications', 'mobile_keybar_buttons'],
    ui: ['sidebar_width', 'max_pane_columns', 'max_pane_rows', 'terminal_font_family', 'terminal_font_size', 'mobile_terminal_font_size', 'file_pane_font_size', 'system_font_size'],
    file_manager: ['enabled', 'root_mode', 'max_upload_bytes', 'show_hidden', 'bookmarks'],
    browser: ['bookmarks', 'history'],
    usage: ['minimax_api_key', 'minimax_region', 'show_codex', 'show_claude', 'show_minimax'],
    custom_theme: ['selected_light', 'selected_dark', 'mode', 'ink', 'panel', 'rail', 'surface', 'line', 'text', 'muted', 'accent', 'warn', 'danger', 'terminal_bg', 'terminal_fg', 'light_ink', 'light_panel', 'light_rail', 'light_surface', 'light_line', 'light_text', 'light_muted', 'light_accent', 'light_warn', 'light_danger', 'light_terminal_bg', 'light_terminal_fg']
  };

  for (const [section, keys] of Object.entries(allowed)) {
    for (const key of keys) {
      if (updates[section] && Object.prototype.hasOwnProperty.call(updates[section], key)) {
        configText = setTomlKey(configText, section, key, updates[section][key]);
      }
    }
  }

  const candidate = deepMerge(defaultConfig, TOML.parse(configText));
  if (candidate.server.host !== '127.0.0.1' && candidate.server.host !== '0.0.0.0') {
    throw new Error('Server access must be Local or LAN.');
  }
  if (candidate.server.host === '0.0.0.0' && !candidate.auth.password_hash) {
    throw new Error('LAN access requires a password.');
  }

  fs.writeFileSync(configPath, configText);
  return loadConfig(root);
}

module.exports = {
  appRoot,
  defaultConfig,
  loadConfig,
  updateConfigFile
};
