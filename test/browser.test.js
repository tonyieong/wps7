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
  findChromiumExecutable,
  isOwnServerWebsite,
  mobileUserAgent,
  normalizeEmulationMode,
  normalizeViewport
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
