const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const packageJson = require('../package.json');

const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
const traySource = fs.readFileSync(path.join(__dirname, '..', 'src', 'tray.js'), 'utf8');

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
