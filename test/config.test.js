const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig, updateConfigFile } = require('../src/config');

test('creates default config with localhost port 5000', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const { config } = loadConfig(root);
  assert.equal(config.server.host, '127.0.0.1');
  assert.equal(config.server.port, 5000);
  assert.equal(config.ui.terminal_font_family, 'Consolas, "Cascadia Mono", monospace');
  assert.equal(config.ui.grid_size, 400);
  assert.equal(config.ui.vertical_slots, 2);
  assert.equal(config.ui.default_pane_width, 6);
  assert.equal(config.ui.default_pane_height, 2);
  assert.equal(config.ui.terminal_font_size, 13);
  assert.equal(config.ui.mobile_terminal_font_size, 12);
  assert.equal(config.ui.file_pane_font_size, 13);
  assert.equal(config.ui.system_font_size, 13);
  assert.equal(config.ui.notepad_word_wrap, false);
  assert.equal(config.ui.notepad_indent_guides, false);
  assert.equal(config.ui.notepad_autosave, false);
  assert.equal(config.file_manager.enabled, true);
  assert.equal(config.file_manager.root_mode, 'drives');
  assert.equal(config.file_manager.max_upload_bytes, 0);
  assert.equal(config.file_manager.show_hidden, false);
  assert.equal(config.persistence.scrollback_lines, 10000);
  assert.equal(config.terminal.resize_debounce_ms, 100);
  assert.equal(config.terminal.auto_scroll_on_resize, false);
  assert.equal(config.terminal.cursor_blink, true);
  assert.equal(config.terminal.browser_notifications, false);
  assert.equal(config.terminal.backend, 'conpty_screen');
  assert.equal(config.terminal.reconnect_scrollback_lines, 2000);
  assert.deepEqual(config.terminal.mobile_keybar_buttons.slice(0, 3), [
    { label: 'Esc', action: 'shortcut', value: 'Escape', enabled: true },
    { label: 'Tab', action: 'shortcut', value: 'Tab', enabled: true },
    { label: 'Ctrl', action: 'modifier', value: 'Control', enabled: true }
  ]);
  assert.equal(config.custom_theme.mode, 'dark');
  assert.equal(config.custom_theme.selected_light, 'wps-light');
  assert.equal(config.custom_theme.selected_dark, 'wps-dark');
  assert.equal(config.custom_theme.accent, '#6ee7c2');
  assert.equal(config.custom_theme.light_accent, '#159d83');
  assert.equal(config.usage.minimax_api_key, '');
  assert.equal(config.usage.minimax_region, 'global');
  assert.equal(config.usage.refresh_minutes, 10);
  assert.equal(config.usage.show_codex, true);
  assert.equal(config.usage.show_claude, true);
  assert.equal(config.usage.show_minimax, true);
  // Codex and Claude Code usage always come from the signed-in CLI accounts.
  assert.equal('codex_api_key' in config.usage, false);
  assert.equal('claude_api_key' in config.usage, false);
  assert.equal(config.usage.show_five_hour, true);
  assert.equal(config.usage.show_weekly, true);
  assert.equal(config.usage.show_model_weekly, true);
  assert.equal(config.usage.show_credits, true);
  assert.equal(config.usage.codex_home, '');
  assert.equal(config.usage.claude_home, '');
});

test('rejects 0.0.0.0 without password hash', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  fs.writeFileSync(path.join(root, 'config.toml'), '[server]\nhost = "0.0.0.0"\n');
  assert.throws(() => loadConfig(root), /requires auth\.password_hash/);
});

test('does not save LAN binding until a password hash is present', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  loadConfig(root);
  const configPath = path.join(root, 'config.toml');
  const before = fs.readFileSync(configPath, 'utf8');

  assert.throws(() => updateConfigFile(root, {
    server: { host: '0.0.0.0' }
  }), /requires a password/i);
  assert.equal(fs.readFileSync(configPath, 'utf8'), before);
});

test('saves LAN binding when the same update supplies a password hash', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  loadConfig(root);
  const { hashPassword } = require('../src/auth');

  const { config } = updateConfigFile(root, {
    server: { host: '0.0.0.0' },
    auth: { password_hash: hashPassword('Strong-password-123!') }
  });

  assert.equal(config.server.host, '0.0.0.0');
  assert.ok(config.auth.password_hash);
});

test('falls back to default port when config port is invalid', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  fs.writeFileSync(path.join(root, 'config.toml'), '[server]\nport = "hello"\n');
  const { config } = loadConfig(root);
  assert.equal(config.server.port, 5000);
});

test('adds workspace defaults to an older config file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  const configPath = path.join(root, 'config.toml');
  fs.writeFileSync(configPath, '[ui]\nsidebar_width = 286\n');

  const { config } = loadConfig(root);

  assert.equal(config.ui.grid_size, 400);
  assert.equal(config.ui.vertical_slots, 2);
  assert.equal(config.ui.default_pane_height, 2);
  const saved = fs.readFileSync(configPath, 'utf8');
  assert.match(saved, /grid_size = 400/);
  assert.match(saved, /vertical_slots = 2/);
  assert.match(saved, /default_pane_height = 2/);
});

test('shell args load profile without clearing restored scrollback', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  fs.writeFileSync(path.join(root, 'config.toml'), [
    '[shell]',
    'args = ["-NoLogo", "-NoProfile", "-NoExit", "-Command", "try { Set-PSReadLineOption -PredictionSource None } catch {}; Clear-Host"]',
    '[restore]',
    'allowlist = ["codex"]',
    ''
  ].join('\n'));

  const { config } = loadConfig(root);
  assert.equal(config.shell.args.includes('-NoProfile'), false);
  assert.equal(config.shell.args.some((arg) => arg.includes('Clear-Host')), false);
  assert.deepEqual(config.restore.allowlist, []);
});

test('shell args turn PSReadLine command predictions back on', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  fs.writeFileSync(path.join(root, 'config.toml'), [
    '[shell]',
    'args = ["-NoLogo", "-NoExit", "-Command", "try { Set-PSReadLineOption -PredictionSource None } catch {}"]',
    ''
  ].join('\n'));

  const { config } = loadConfig(root);
  assert.equal(config.shell.args.some((arg) => arg.includes('-PredictionSource History')), true);
  assert.equal(config.shell.args.some((arg) => arg.includes('-PredictionSource None')), false);
  assert.deepEqual(loadConfig(fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'))).config.shell.args, [
    '-NoLogo',
    '-NoExit',
    '-Command',
    'try { Set-PSReadLineOption -PredictionSource History } catch {}'
  ]);
});

test('shell extra_path is added to older configs and stays out of the web UI', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  fs.writeFileSync(path.join(root, 'config.toml'), '[shell]\npreferred = "pwsh.exe"\n');

  const { config } = loadConfig(root);
  assert.deepEqual(config.shell.extra_path, []);
  assert.match(fs.readFileSync(path.join(root, 'config.toml'), 'utf8'), /^extra_path = \[\]$/m);

  // The shell runs as the wps7 account, so PATH entries are config.toml only.
  updateConfigFile(root, { shell: { extra_path: ['C:\\Users\\someone\\AppData\\Roaming\\npm'] } });
  assert.deepEqual(loadConfig(root).config.shell.extra_path, []);
});

test('updates known config values while preserving loadability', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  loadConfig(root);

  const { config } = updateConfigFile(root, {
    server: {
      host: '127.0.0.1',
      port: 5050,
      open_browser: false
    },
    ui: {
      terminal_font_family: 'Cascadia Mono',
      terminal_font_size: 16,
      mobile_terminal_font_size: 11,
      file_pane_font_size: 14,
      system_font_size: 15,
      grid_size: 60,
      vertical_slots: 8,
      default_pane_width: 4,
      default_pane_height: 5,
      notepad_word_wrap: true,
      notepad_indent_guides: true,
      notepad_autosave: true
    },
    shell: {
      args: ['-NoLogo', '-NoExit']
    },
    file_manager: {
      enabled: false,
      max_upload_bytes: 0,
      show_hidden: true,
      bookmarks: [{ name: 'Root', path: 'C:\\' }]
    },
    terminal: {
      backend: 'xterm_pty',
      reconnect_scrollback_lines: 1200,
      resize_debounce_ms: 120,
      cursor_blink: false,
      browser_notifications: true,
      mobile_keybar_buttons: [
        { label: '^C', action: 'shortcut', value: 'Ctrl+C', enabled: true },
        { label: 'Build', action: 'text', value: 'npm run build', enabled: false }
      ]
    },
    usage: {
      minimax_api_key: 'sk-cp-test',
      minimax_region: 'china',
      show_codex: false,
      show_claude: true,
      show_minimax: false,
      show_five_hour: false,
      show_weekly: true,
      show_model_weekly: false,
      show_credits: false,
      codex_home: 'C:\\Users\\Admin\\.codex',
      claude_home: 'C:\\Users\\Admin\\.claude'
    },
    custom_theme: {
      selected_light: 'claude-light',
      selected_dark: 'codex-dark',
      mode: 'light',
      ink: '#f0f0f0',
      panel: '#ffffff',
      rail: '#e8e8e8',
      surface: '#dedede',
      line: '#bbbbbb',
      text: '#111111',
      muted: '#555555',
      accent: '#0055aa',
      warn: '#704000',
      danger: '#aa2233',
      terminal_bg: '#ffffff',
      terminal_fg: '#111111',
      light_ink: '#f8f8f8',
      light_panel: '#ffffff',
      light_rail: '#eeeeee',
      light_surface: '#e5e5e5',
      light_line: '#cccccc',
      light_text: '#111111',
      light_muted: '#666666',
      light_accent: '#2255aa',
      light_warn: '#704000',
      light_danger: '#aa2233',
      light_terminal_bg: '#ffffff',
      light_terminal_fg: '#111111'
    }
  });

  assert.equal(config.server.port, 5050);
  assert.equal(config.server.open_browser, false);
  assert.equal(config.ui.terminal_font_family, 'Cascadia Mono');
  assert.equal(config.ui.terminal_font_size, 16);
  assert.equal(config.ui.mobile_terminal_font_size, 11);
  assert.equal(config.ui.file_pane_font_size, 14);
  assert.equal(config.ui.system_font_size, 15);
  assert.equal(config.ui.grid_size, 60);
  assert.equal(config.ui.vertical_slots, 8);
  assert.equal(config.ui.default_pane_width, 4);
  assert.equal(config.ui.default_pane_height, 5);
  assert.equal(config.ui.notepad_word_wrap, true);
  assert.equal(config.ui.notepad_indent_guides, true);
  assert.equal(config.ui.notepad_autosave, true);
  assert.deepEqual(config.shell.args, ['-NoLogo', '-NoExit']);
  assert.equal(config.file_manager.enabled, false);
  assert.equal(config.file_manager.max_upload_bytes, 0);
  assert.equal(config.file_manager.show_hidden, true);
  assert.deepEqual(config.file_manager.bookmarks, [{ name: 'Root', path: 'C:\\' }]);
  assert.equal(config.terminal.resize_debounce_ms, 120);
  assert.equal(config.terminal.cursor_blink, false);
  assert.equal(config.terminal.browser_notifications, true);
  assert.equal(config.terminal.backend, 'xterm_pty');
  assert.equal(config.terminal.reconnect_scrollback_lines, 1200);
  assert.deepEqual(config.terminal.mobile_keybar_buttons, [
    { label: '^C', action: 'shortcut', value: 'Ctrl+C', enabled: true },
    { label: 'Build', action: 'text', value: 'npm run build', enabled: false }
  ]);
  assert.equal(config.usage.minimax_api_key, 'sk-cp-test');
  assert.equal(config.usage.minimax_region, 'china');
  assert.equal(config.usage.show_codex, false);
  assert.equal(config.usage.show_claude, true);
  assert.equal(config.usage.show_minimax, false);
  assert.equal(config.usage.show_five_hour, false);
  assert.equal(config.usage.show_weekly, true);
  assert.equal(config.usage.show_model_weekly, false);
  assert.equal(config.usage.show_credits, false);
  assert.equal(config.usage.codex_home, 'C:\\Users\\Admin\\.codex');
  assert.equal(config.usage.claude_home, 'C:\\Users\\Admin\\.claude');
  assert.equal(config.custom_theme.mode, 'light');
  assert.equal(config.custom_theme.selected_light, 'claude-light');
  assert.equal(config.custom_theme.selected_dark, 'codex-dark');
  assert.equal(config.custom_theme.accent, '#0055aa');
  assert.equal(config.custom_theme.light_accent, '#2255aa');
  assert.match(fs.readFileSync(path.join(root, 'config.toml'), 'utf8'), /\[custom_theme\][\s\S]*accent = "#0055aa"/);
});

test('updates password hash without storing plain password', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-'));
  loadConfig(root);

  const { hashPassword, verifyPassword } = require('../src/auth');
  const passwordHash = hashPassword('new-secret');
  const { config } = updateConfigFile(root, {
    auth: {
      password_hash: passwordHash
    }
  });

  const saved = fs.readFileSync(path.join(root, 'config.toml'), 'utf8');
  assert.equal(saved.includes('new-secret'), false);
  assert.equal(verifyPassword('new-secret', config.auth.password_hash), true);
});
