const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const WebSocket = require('ws');

const {
  BrowserManager,
  RemoteBrowserPage,
  chromeArguments,
  chromiumProfileCleanupCommand,
  desktopUserAgent,
  findChromiumExecutable,
  isOwnServerWebsite,
  mobileUserAgent,
  normalizeEmulationMode,
  normalizeViewport,
  terminateStaleChromium
} = require('../src/browser');

test('remote browser launches an isolated headless Chromium profile', () => {
  const executable = findChromiumExecutable({
    existsSync: (candidate) => candidate.includes('Google\\Chrome')
  });
  assert.match(executable, /Google\\Chrome\\Application\\chrome\.exe$/);

  const args = chromeArguments('C:\\wps7\\data\\browser-profile');
  assert.ok(args.includes('--headless=new'));
  assert.ok(args.includes('--remote-debugging-port=0'));
  assert.ok(args.includes('--user-data-dir=C:\\wps7\\data\\browser-profile'));
  assert.ok(args.includes('--auto-accept-this-tab-capture'));
  assert.ok(args.includes('--auto-select-tab-capture-source-by-title=WPS7 Capture Target'));
  assert.ok(args.includes('--autoplay-policy=no-user-gesture-required'));
});

test('starting Chromium first clears out any stale process still holding the profile lock', async () => {
  const command = chromiumProfileCleanupCommand('C:\\wps7\\data\\browser-profile');
  assert.match(command, /Name='chrome\.exe' OR Name='msedge\.exe'/);
  assert.match(command, /CommandLine\.Contains\('C:\\wps7\\data\\browser-profile'\)/);
  assert.match(command, /Stop-Process -Id \$_\.ProcessId -Force/);

  const calls = [];
  const run = (file, args, options, callback) => {
    calls.push({ file, args, options });
    callback(null, '', '');
  };
  await terminateStaleChromium('C:\\wps7\\data\\browser-profile', run);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].file, 'powershell.exe');
  assert.match(calls[0].args.join(' '), /browser-profile/);

  // A prior instance's stale-cleanup attempt must never block a fresh launch,
  // even if the check itself fails (e.g. powershell.exe missing from PATH).
  const failingRun = (file, args, options, callback) => callback(new Error('spawn failed'));
  await assert.doesNotReject(terminateStaleChromium('C:\\wps7\\data\\browser-profile', failingRun));
});

test('remote browser viewport is bounded for safe screencasting', () => {
  assert.deepEqual(normalizeViewport(12, 9000, 4), { width: 320, height: 2160, deviceScaleFactor: 2 });
  assert.deepEqual(normalizeViewport(1280, 720, 1), { width: 1280, height: 720, deviceScaleFactor: 1 });
  assert.deepEqual(normalizeViewport(1200, 800, 3, 'mobile'), { width: 932, height: 800, deviceScaleFactor: 2 });
  assert.deepEqual(normalizeViewport(900, 1400, 1, 'mobile'), { width: 480, height: 1400, deviceScaleFactor: 1 });
});

test('mobile emulation uses an Android Chromium identity', () => {
  assert.equal(normalizeEmulationMode('mobile'), 'mobile');
  assert.equal(normalizeEmulationMode('tablet'), 'desktop');
  assert.match(mobileUserAgent('Mozilla/5.0 Chrome/150.0.7339.12 Safari/537.36'), /Android 15/);
  assert.match(mobileUserAgent('Mozilla/5.0 Chrome/150.0.7339.12 Safari/537.36'), /Chrome\/150\.0\.0\.0 Mobile/);
});

test('desktop identity masks the Headless marker instead of going blank', () => {
  // A blank User-Agent header is a strong bot signal on its own and was tripping
  // sites' (e.g. Google's) automated-traffic detection on every desktop-mode page load.
  const headless = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36';
  assert.equal(
    desktopUserAgent(headless),
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );
  assert.equal(desktopUserAgent(''), '');
});

test('mobile viewport enables device metrics, touch and the mobile user agent', async () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  page.viewport = normalizeViewport(390, 844, 2, 'mobile');
  page.emulationMode = 'mobile';
  page.desktopUserAgent = 'Mozilla/5.0 Chrome/150.0.7339.12 Safari/537.36';
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };

  await page.applyViewport();

  // The window is sized to the viewport (so screencast frames fill the pane)
  // before the emulation overrides are applied. Insets are 0 with the mock,
  // so the final window bounds equal the viewport.
  const windowBounds = calls.filter((call) => call.method === 'Browser.setWindowBounds').at(-1);
  assert.ok(windowBounds);
  assert.equal(windowBounds.params.bounds.width, page.viewport.width);
  assert.equal(windowBounds.params.bounds.height, page.viewport.height);

  const deviceMetrics = calls.find((call) => call.method === 'Emulation.setDeviceMetricsOverride');
  assert.ok(deviceMetrics);
  assert.equal(deviceMetrics.params.mobile, true);
  const touch = calls.find((call) => call.method === 'Emulation.setTouchEmulationEnabled');
  assert.equal(touch.params.enabled, true);
  const userAgent = calls.find((call) => call.method === 'Emulation.setUserAgentOverride');
  assert.match(userAgent.params.userAgent, /Mobile/);
});

test('desktop viewport masks the headless Chromium user agent instead of sending a blank one', async () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  page.viewport = normalizeViewport(1280, 720, 1);
  page.emulationMode = 'desktop';
  page.desktopUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36';
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };

  await page.applyViewport();

  const userAgent = calls.find((call) => call.method === 'Emulation.setUserAgentOverride');
  assert.ok(userAgent.params.userAgent);
  assert.doesNotMatch(userAgent.params.userAgent, /Headless/);
  assert.match(userAgent.params.userAgent, /Chrome\/120\.0\.0\.0/);
});

test('a blank tab uses the app theme background instead of Chromium\'s stark white default', async () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };

  await page.applyBackground('#06111b');

  assert.deepEqual(calls, [
    { method: 'Emulation.setEmulatedMedia', params: { features: [{ name: 'prefers-color-scheme', value: 'dark' }] } },
    { method: 'Emulation.setDefaultBackgroundColorOverride', params: { color: { r: 6, g: 17, b: 27, a: 1 } } }
  ]);
});

test('a light theme background is emulated as prefers-color-scheme: light', async () => {
  // Headless Chromium's own chrome (about:blank, the raw JSON/text viewer) reads
  // prefers-color-scheme rather than the background override to decide its color,
  // so it renders dark regardless of the override unless this is also set.
  const page = Object.create(RemoteBrowserPage.prototype);
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };

  await page.applyBackground('#ffffff');

  const media = calls.find((call) => call.method === 'Emulation.setEmulatedMedia');
  assert.deepEqual(media.params, { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
});

test('an invalid background color is ignored rather than sent to Chromium', async () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };

  await page.applyBackground('not-a-color');

  assert.deepEqual(calls, []);
});

test('a client reporting its theme background updates the shared manager color and Chromium', async () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  page.manager = { themeBackground: '#06111b' };
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };
  const client = { readyState: WebSocket.OPEN, send() {} };

  await page.handle({ type: 'theme', backgroundColor: '#ffffff' }, client);

  assert.equal(page.manager.themeBackground, '#ffffff');
  const bg = calls.find((call) => call.method === 'Emulation.setDefaultBackgroundColorOverride');
  assert.deepEqual(bg.params, { color: { r: 255, g: 255, b: 255, a: 1 } });
});

test('an unchanged or invalid client background does not re-issue the Chromium override', async () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  page.manager = { themeBackground: '#06111b' };
  const calls = [];
  page.send = async (method, params) => { calls.push({ method, params }); return {}; };
  const client = { readyState: WebSocket.OPEN, send() {} };

  await page.handle({ type: 'theme', backgroundColor: '#06111b' }, client);
  await page.handle({ type: 'theme', backgroundColor: 'nope' }, client);

  assert.deepEqual(calls.filter((call) => call.method === 'Emulation.setDefaultBackgroundColorOverride'), []);
  assert.equal(page.manager.themeBackground, '#06111b');
});

test('only the latest controlling browser client can resize a shared tab', async () => {
  const first = { readyState: WebSocket.OPEN, send() {} };
  const second = { readyState: WebSocket.OPEN, send() {} };
  const page = Object.create(RemoteBrowserPage.prototype);
  page.clients = new Set([first, second]);
  page.clientMetadata = new Map([
    [first, { viewport: { width: 800, height: 600, deviceScaleFactor: 1 } }],
    [second, { viewport: { width: 390, height: 844, deviceScaleFactor: 2 } }]
  ]);
  page.viewportOwner = first;
  page.broadcastViewportOwner = () => {};
  const resized = [];
  page.resize = async (...values) => resized.push(values);

  await page.updateClientViewport(second, 400, 850, 2, false);
  assert.deepEqual(resized, []);
  await page.claimViewport(second);
  assert.equal(page.viewportOwner, second);
  assert.deepEqual(resized, [[400, 850, 2]]);
});

test('WebRTC negotiation falls back to JPEG after its connection deadline', async () => {
  const client = { readyState: WebSocket.OPEN, send() {} };
  const page = Object.create(RemoteBrowserPage.prototype);
  page.clients = new Set([client]);
  page.rtcClients = new Map([['peer-1', client]]);
  page.rtcTimers = new Map();
  page.rtcConnectedPeers = new Set();
  page.rtcTimeoutMs = 5;
  page.closeRtcClient = async (candidate) => {
    assert.equal(candidate, client);
    page.rtcClients.delete('peer-1');
  };
  const modes = [];
  page.setClientStreamMode = (candidate, mode, reason) => modes.push({ candidate, mode, reason });

  page.scheduleRtcFallback('peer-1', client, 'WebRTC negotiation timed out.');
  await new Promise((resolve) => setTimeout(resolve, 20));

  assert.equal(page.rtcTimers.size, 0);
  assert.deepEqual(modes, [{ candidate: client, mode: 'jpeg', reason: 'WebRTC negotiation timed out.' }]);
});

test('an already connected WebRTC peer cannot receive a late fallback timer', () => {
  const client = { readyState: WebSocket.OPEN, send() {} };
  const page = Object.create(RemoteBrowserPage.prototype);
  page.rtcTimers = new Map();
  page.rtcConnectedPeers = new Set(['peer-1']);

  page.scheduleRtcFallback('peer-1', client, 'WebRTC negotiation timed out.');

  assert.equal(page.rtcTimers.size, 0);
});

test('tab capture ending signals every WebRTC peer sharing the stream', () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  page.rtcStateKey = '__state';
  page.rtcBinding = '__signal';
  const expression = page.rtcCaptureExpression('peer-1');

  assert.match(expression, /for \(const activePeerId of state\.peers\.keys\(\)\)/);
  assert.match(expression, /peerId: activePeerId, type: 'captureEnded'/);
});

test('tab capture crops WebRTC video to the emulated page viewport when Chromium supports it', () => {
  const page = Object.create(RemoteBrowserPage.prototype);
  page.rtcStateKey = '__state';
  page.rtcBinding = '__signal';
  const expression = page.rtcCaptureExpression('peer-1');

  assert.match(expression, /CropTarget\?\.fromElement/);
  assert.match(expression, /CropTarget\.fromElement\(document\.documentElement\)/);
  assert.match(expression, /videoTrack\.cropTo\(cropTarget\)/);
});

test('remote browser blocks every local interface on the WPS7 server port', () => {
  const interfaces = {
    Ethernet: [
      { address: '192.168.1.25' },
      { address: 'fe80::25' }
    ]
  };

  assert.equal(isOwnServerWebsite('http://localhost:5000/', 5000, interfaces), true);
  assert.equal(isOwnServerWebsite('http://127.8.7.6:5000/', 5000, interfaces), true);
  assert.equal(isOwnServerWebsite('https://192.168.1.25:5000/', 5000, interfaces), true);
  assert.equal(isOwnServerWebsite('http://[fe80::25]:5000/', 5000, interfaces), true);
  assert.equal(isOwnServerWebsite('http://0.0.0.0:5000/', 5000, interfaces), true);
  assert.equal(isOwnServerWebsite('http://192.168.1.26:5000/', 5000, interfaces), false);
  assert.equal(isOwnServerWebsite('http://192.168.1.25:5001/', 5000, interfaces), false);
});

test('browser resize waits for the initial frame before handling client messages', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-browser-test-'));
  const pane = {
    id: 'pane-1',
    type: 'browser',
    activeBrowserTabId: 'tab-1',
    browserTabs: [{ id: 'tab-1', url: '', zoom: 1 }]
  };
  const manager = new BrowserManager({
    root,
    store: { findPane: () => ({ pane }) },
    normalizeWebsite: (value) => value,
    serverPort: 5000,
    networkInterfaces: {}
  });
  const events = [];
  const page = {
    clients: new Set(),
    async attachClient(client) {
      this.clients.add(client);
      events.push('attach:start');
      await new Promise((resolve) => setTimeout(resolve, 20));
      events.push('attach:end');
    },
    async detachClient() {},
    async handle(message) {
      events.push(`handle:${message.type}`);
    }
  };
  manager.getOrCreatePage = async () => page;
  const client = new EventEmitter();
  client.readyState = WebSocket.OPEN;
  client.send = () => {};
  client.close = () => {};

  const attaching = manager.attach('pane-1', client);
  client.emit('message', Buffer.from(JSON.stringify({ type: 'resize', width: 640, height: 480 })));
  await attaching;
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(events, ['attach:start', 'attach:end', 'handle:resize']);
  manager.shutdown();
  fs.rmSync(root, { recursive: true, force: true });
});

test('a new browser manager defaults new tabs to the app\'s dark theme background', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-browser-test-'));
  const manager = new BrowserManager({
    root,
    store: { findPane: () => null },
    normalizeWebsite: (value) => value,
    serverPort: 5000,
    networkInterfaces: {}
  });

  assert.equal(manager.themeBackground, '#06111b');

  manager.shutdown();
  fs.rmSync(root, { recursive: true, force: true });
});
