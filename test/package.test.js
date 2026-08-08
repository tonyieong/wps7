const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const packageJson = require('../package.json');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
const traySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'tray.js'), 'utf8');
const startupInstallerSource = fs.readFileSync(path.join(__dirname, '..', 'scripts', 'install-wps7-startup.ps1'), 'utf8');

test('Windows package includes the bundled ConPTY runtime', () => {
  const assets = packageJson.pkg?.assets || [];
  assert.ok(
    assets.includes('node_modules/@homebridge/node-pty-prebuilt-multiarch/build/Release/conpty/**/*'),
    'pkg assets must include conpty.dll and OpenConsole.exe'
  );
  assert.ok(
    assets.includes('node_modules/@homebridge/node-pty-prebuilt-multiarch/build/Release/*.node'),
    'pkg assets must include the native node-pty modules'
  );
});

test('portable Windows restart waits for the old process before relaunching', () => {
  const waitIndex = mainSource.indexOf('Wait-Process -Id $ParentPid');
  const startIndex = mainSource.indexOf('Start-Process -FilePath $Executable');
  assert.ok(waitIndex >= 0, 'restart helper must wait for the parent process');
  assert.ok(startIndex > waitIndex, 'replacement must start after the parent exits');
  assert.match(mainSource, /spawn\('powershell\.exe'/);
});

test('portable tray includes the common status, logs and diagnostics actions', () => {
  for (const label of ['Status: running', 'Open Web UI', 'Save Now', 'Restart wps7', 'View Logs', 'Diagnostics', 'Exit']) {
    assert.match(traySource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('portable tray module remains valid JavaScript for pkg discovery', () => {
  assert.doesNotThrow(() => require('../src/tray'));
});

test('installed service controls and tray follow the packaged runtime root', () => {
  assert.match(startupInstallerSource, /\$runtimeRoot = Resolve-Wps7RuntimeRoot/);
  assert.match(startupInstallerSource, /Join-Path \$runtimeRoot 'scripts\\control-wps7-service\.ps1'/);
  assert.match(startupInstallerSource, /Join-Path \$runtimeRoot 'scripts\\wps7-tray-companion\.ps1'/);
  assert.match(startupInstallerSource, /\$shortcut\.WorkingDirectory = \$runtimeRoot/);
});

test('moved installations include a path repair command', () => {
  const repairPath = path.join(__dirname, '..', 'scripts', 'repair-wps7-paths.ps1');
  assert.ok(fs.existsSync(repairPath), 'repair-wps7-paths.ps1 must exist');
  const repairSource = fs.readFileSync(repairPath, 'utf8');
  assert.equal(packageJson.scripts['startup:repair'], 'powershell -NoProfile -ExecutionPolicy Bypass -File scripts\\repair-wps7-paths.ps1');
  assert.match(repairSource, /Unregister-ScheduledTask/);
  assert.match(repairSource, /Register-ScheduledTask/);
  assert.match(repairSource, /wps7 tray\.lnk/);
  assert.match(repairSource, /install-wps7-startup\.ps1/);
});

test('Windows packaging refreshes generated folders without nesting them', () => {
  const command = packageJson.scripts['package:win'];
  assert.match(command, /Copy-Item scripts\\\* dist\\scripts/);
  assert.match(command, /Copy-Item assets\\\* dist\\assets/);
  assert.match(command, /Copy-Item tools\\\* dist\\tools/);
});

test('Windows packaging clears stale nested resource folders', () => {
  const command = packageJson.scripts['package:win'];
  assert.match(command, /Remove-Item 'dist\\scripts\\scripts','dist\\assets\\assets','dist\\tools\\tools' -Recurse -Force -ErrorAction SilentlyContinue/);
});

test('a fatal error saves state and logs before the process exits', () => {
  assert.match(mainSource, /process\.on\('uncaughtException'/);
  assert.match(mainSource, /process\.on\('unhandledRejection'/);
  const handlerIndex = mainSource.indexOf('function handleFatalError');
  const saveIndex = mainSource.indexOf('store.save()', handlerIndex);
  const exitIndex = mainSource.indexOf('process.exit(1)', handlerIndex);
  assert.ok(handlerIndex >= 0, 'main must install a fatal error handler');
  assert.ok(saveIndex > handlerIndex && exitIndex > saveIndex, 'state must be saved before exiting');
});

test('request errors never send a stack trace to the client', () => {
  const handlerIndex = mainSource.indexOf('app.use((error, req, res, next)');
  assert.ok(handlerIndex >= 0, 'main must install an Express error handler');

  const lastRouteIndex = mainSource.lastIndexOf("app.post('/api/files/upload'");
  const websocketIndex = mainSource.indexOf('new WebSocketServer');
  assert.ok(handlerIndex > lastRouteIndex, 'the handler must come after the routes it protects');
  assert.ok(handlerIndex < websocketIndex, 'the handler must be installed before the server starts');

  // Express's built-in handler puts error.stack in the response body, which
  // exposes absolute paths from the host. A malformed JSON body reaches it.
  const handler = mainSource.slice(handlerIndex, websocketIndex);
  assert.doesNotMatch(handler, /error\.stack/);
  assert.doesNotMatch(handler, /error:\s*error\.message/);
  assert.match(handler, /res\.status\(status\)\.json/);
});

test('the redistributable ships its license notices', () => {
  const root = path.join(__dirname, '..');
  for (const file of ['LICENSE', 'THIRD-PARTY-LICENSES.md']) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} must exist`);
  }
  assert.equal(packageJson.license, 'MIT');
  const notices = fs.readFileSync(path.join(root, 'THIRD-PARTY-LICENSES.md'), 'utf8');
  for (const dependency of Object.keys(packageJson.dependencies)) {
    assert.ok(notices.includes(`### ${dependency}@`), `${dependency} must appear in THIRD-PARTY-LICENSES.md`);
  }
  for (const dependency of ['@xterm/addon-serialize', '@xterm/headless', 'rc']) {
    const start = notices.indexOf(`### ${dependency}@`);
    const end = notices.indexOf('\n### ', start + 1);
    const section = notices.slice(start, end === -1 ? undefined : end);
    assert.match(section, /```/, `${dependency} must include its license text`);
  }
});
