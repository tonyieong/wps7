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
