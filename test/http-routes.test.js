// Exercises the Express/WebSocket layer in src/main.js against a real, running
// instance. AGENTS.md notes the rest of the suite never does this ("the suite
// does not exercise Express routing... verify against a running server"); this
// file is that verification, automated.
//
// main.js has no exported app-building function (it calls listen()/starts the
// tray/registers process-level handlers unconditionally, and stopRuntime()
// calls process.exit()), so it cannot safely be require()'d into this test
// process. Instead this spawns `node src/main.js` as a real child process
// against an isolated port and a temporary config/state, the same way
// scripts/verify-mobile-scroll.js does for the browser-driven check.
//
// Tests run in declaration order and share one instance: the early tests rely
// on the fresh default config having no password, and a later test sets one
// that every test after it depends on.

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');

const root = path.join(__dirname, '..');
const configPath = path.join(root, 'config.toml');
const dataDir = path.join(root, 'data');
const statePath = path.join(dataDir, 'state.json');
const stateBakPath = path.join(dataDir, 'state.json.bak');
const controlTokenPath = path.join(dataDir, 'control-token');

let port;
let child;
let configBackup;
let stateBackup;
let stateBakBackup;
let sessionToken = '';

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port: assigned } = server.address();
      server.close(() => resolve(assigned));
    });
  });
}

function backupAside(file) {
  if (!fs.existsSync(file)) {
    return null;
  }
  const backup = `${file}.http-routes-test-backup`;
  fs.renameSync(file, backup);
  return backup;
}

function restoreFrom(file, backup) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
  }
  if (backup) {
    fs.renameSync(backup, file);
  }
}

function waitForHttp(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/api/config', timeout: 1000 }, (res) => {
        res.resume();
        res.statusCode === 200 ? resolve() : retry();
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Server did not respond within ${timeoutMs}ms`));
        return;
      }
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

// Same as waitForHttp, but against a port other than the shared instance's,
// for the port-fallback tests below which spawn their own throwaway children.
function waitForHttpOnPort(targetPort, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get({ host: '127.0.0.1', port: targetPort, path: '/api/config', timeout: 1000 }, (res) => {
        res.resume();
        res.statusCode === 200 ? resolve() : retry();
      });
      req.on('error', retry);
      req.on('timeout', () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Nothing answered on port ${targetPort} within ${timeoutMs}ms`));
        return;
      }
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

function waitForRuntimeInfo(predicate, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      let info = null;
      try {
        info = JSON.parse(fs.readFileSync(path.join(dataDir, 'runtime.json'), 'utf8'));
      } catch {
        // Not written yet.
      }
      if (info && predicate(info)) {
        resolve(info);
        return;
      }
      if (Date.now() > deadline) {
        reject(new Error('runtime.json did not reach the expected state in time'));
        return;
      }
      setTimeout(attempt, 200);
    };
    attempt();
  });
}

function waitForExit(child, timeoutMs) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve(child.exitCode);
      return;
    }
    child.once('exit', (code) => resolve(code));
    setTimeout(() => resolve(null), timeoutMs).unref();
  });
}

// A thin request helper built on http.request rather than fetch(): fetch
// silently drops "forbidden" headers (Host, Origin, ...) per the Fetch spec,
// which is exactly what the Host-header rejection test needs to set.
function request(pathPart, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body));
    const req = http.request({
      host: '127.0.0.1',
      port,
      path: pathPart,
      method,
      headers: {
        ...(payload !== undefined ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = data ? JSON.parse(data) : undefined;
        } catch {
          json = undefined;
        }
        resolve({ status: res.statusCode, headers: res.headers, text: data, json });
      });
    });
    req.on('error', reject);
    if (payload !== undefined) {
      req.write(payload);
    }
    req.end();
  });
}

before(async () => {
  port = await freePort();
  configBackup = backupAside(configPath);
  stateBackup = backupAside(statePath);
  stateBakBackup = backupAside(stateBakPath);

  fs.writeFileSync(configPath, [
    '[server]',
    'host = "127.0.0.1"',
    `port = ${port}`,
    'open_browser = false',
    '',
    '[auth]',
    'password_hash = ""',
    ''
  ].join('\n'));

  child = spawn(process.execPath, [path.join(root, 'src', 'main.js')], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  await waitForHttp(20000);
});

after(async () => {
  try {
    const controlToken = fs.readFileSync(controlTokenPath, 'utf8').trim();
    await request('/api/runtime/shutdown', { method: 'POST', headers: { 'X-WPS7-Control-Token': controlToken } });
  } catch {
    // Nothing to shut down cleanly with; the kill below covers it.
  }
  await new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    child.once('exit', resolve);
    setTimeout(resolve, 5000).unref();
  });
  if (child.exitCode === null) {
    child.kill();
  }

  restoreFrom(configPath, configBackup);
  restoreFrom(statePath, stateBackup);
  restoreFrom(stateBakPath, stateBakBackup);
});

test('serves the app shell over plain HTTP', async () => {
  const res = await request('/');
  assert.equal(res.status, 200);
  assert.match(res.headers['content-type'], /text\/html/);
});

test('rejects a request whose Host header does not match this server', async () => {
  // DNS rebinding: a page that resolves its own name to 127.0.0.1 would send
  // that name as Host. Anything not localhost/an IP/an allow-listed name must
  // be rejected before it reaches a single route.
  const res = await request('/api/config', { headers: { Host: 'evil.example.com' } });
  assert.equal(res.status, 403);
  assert.match(res.text, /Untrusted Host header/);
});

test('a malformed JSON body returns a structured error instead of an Express stack trace', async () => {
  const res = await request('/api/settings', { method: 'POST', body: '{not valid json' });
  assert.equal(res.status, 400);
  assert.deepEqual(res.json, { error: 'Invalid request body.' });
  // The bug this guards against renders the stack (with this machine's
  // absolute paths) straight into the response body.
  assert.doesNotMatch(res.text, /\bat\s+\S+\s+\(/);
  assert.ok(!res.text.includes(root), 'response must not leak the server\'s filesystem root');
});

test(':param routes report 404 with a JSON body for an id that does not exist', async () => {
  const res = await request('/api/panes/does-not-exist/activate', { method: 'POST', body: {} });
  assert.equal(res.status, 404);
  assert.deepEqual(res.json, { error: 'Pane not found.' });
});

test('the default workspace state is reachable with no password set', async () => {
  const res = await request('/api/state');
  assert.equal(res.status, 200);
  assert.ok(res.json.sessions[0].tabs[0].panes[0].id);
});

test('setting a password through /api/settings gates every authenticated route after it', async () => {
  const weak = await request('/api/settings', { method: 'POST', body: { auth: { password: 'short' } } });
  assert.equal(weak.status, 400);
  assert.match(weak.json.error, /at least 12 characters/);

  const strong = await request('/api/settings', { method: 'POST', body: { auth: { password: 'Correct-Horse-Battery-9' } } });
  assert.equal(strong.status, 200);
  assert.equal(strong.json.authRequired, true);

  const blocked = await request('/api/state');
  assert.equal(blocked.status, 401);
});

test('logging in with the wrong password is rejected and the right one issues a working token', async () => {
  const wrong = await request('/api/login', { method: 'POST', body: { password: 'not the password' } });
  assert.equal(wrong.status, 401);

  const right = await request('/api/login', { method: 'POST', body: { password: 'Correct-Horse-Battery-9' } });
  assert.equal(right.status, 200);
  assert.ok(right.json.token);
  sessionToken = right.json.token;

  const authed = await request('/api/state', { headers: { Authorization: `Bearer ${sessionToken}` } });
  assert.equal(authed.status, 200);
});

test('a full create/list/delete round trip through the file manager routes', async () => {
  const auth = { Authorization: `Bearer ${sessionToken}` };
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-http-route-test-'));

  const created = await request('/api/files/folder', { method: 'POST', headers: auth, body: { path: parent, name: 'route-test-folder' } });
  assert.equal(created.status, 201);
  assert.equal(created.json.type, 'directory');

  const listed = await request(`/api/files?path=${encodeURIComponent(parent)}`, { headers: auth });
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.json.entries.map((entry) => entry.name), ['route-test-folder']);

  const deleted = await request('/api/files', { method: 'DELETE', headers: auth, body: { path: created.json.path } });
  assert.equal(deleted.status, 200);
  assert.equal(deleted.json.ok, true);
});

test('a WebSocket upgrade is rejected for an untrusted Host or cross-origin request', async () => {
  const untrustedHost = new WebSocket(`ws://127.0.0.1:${port}/ws?paneId=x`, { headers: { Host: 'evil.example.com' } });
  const untrustedHostClose = await new Promise((resolve, reject) => {
    untrustedHost.on('close', (code) => resolve(code));
    untrustedHost.on('error', reject);
  });
  assert.equal(untrustedHostClose, 1008);

  const crossOrigin = new WebSocket(`ws://127.0.0.1:${port}/ws?paneId=x`, { headers: { Origin: 'http://evil.example.com' } });
  const crossOriginClose = await new Promise((resolve, reject) => {
    crossOrigin.on('close', (code) => resolve(code));
    crossOrigin.on('error', reject);
  });
  assert.equal(crossOriginClose, 1008);
});

test('a WebSocket upgrade without a valid session token is rejected once a password is set', async () => {
  const noToken = new WebSocket(`ws://127.0.0.1:${port}/ws?paneId=x`);
  const closeCode = await new Promise((resolve, reject) => {
    noToken.on('close', (code) => resolve(code));
    noToken.on('error', reject);
  });
  assert.equal(closeCode, 1008);
});

test('a WebSocket upgrade with a valid session token and pane id connects', async () => {
  const state = await request('/api/state', { headers: { Authorization: `Bearer ${sessionToken}` } });
  const paneId = state.json.sessions[0].tabs[0].panes[0].id;

  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?paneId=${paneId}&token=${sessionToken}`);
  try {
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
      ws.on('close', (code) => reject(new Error(`closed early with code ${code}`)));
    });
  } finally {
    ws.close();
  }
});

// These two tests each spawn their own throwaway main.js child on a fresh
// port, independent of the shared instance above. They overwrite config.toml
// while doing so, which is safe: nothing after them re-reads it (the shared
// instance already has its config in memory), and after() restores the
// original file from its own backup regardless of what is left on disk.
test('falls back to the next free port when the configured one is held by another process', async () => {
  const busyPort = await freePort();
  const blocker = net.createServer();
  await new Promise((resolve, reject) => {
    blocker.once('error', reject);
    blocker.listen(busyPort, '127.0.0.1', resolve);
  });

  fs.writeFileSync(configPath, [
    '[server]',
    'host = "127.0.0.1"',
    `port = ${busyPort}`,
    'open_browser = false',
    '',
    '[auth]',
    'password_hash = ""',
    ''
  ].join('\n'));

  const fallbackChild = spawn(process.execPath, [path.join(root, 'src', 'main.js')], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    const info = await waitForRuntimeInfo(
      (candidate) => candidate.pid === fallbackChild.pid && candidate.port > busyPort,
      20000
    );
    await waitForHttpOnPort(info.port, 5000);
  } finally {
    fallbackChild.kill();
    await waitForExit(fallbackChild, 3000);
    blocker.close();
  }
});

test('a genuine duplicate launch on the same port still exits instead of hopping to a new port', async () => {
  const dupPort = await freePort();
  fs.writeFileSync(configPath, [
    '[server]',
    'host = "127.0.0.1"',
    `port = ${dupPort}`,
    'open_browser = false',
    '',
    '[auth]',
    'password_hash = ""',
    ''
  ].join('\n'));

  const first = spawn(process.execPath, [path.join(root, 'src', 'main.js')], {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  try {
    await waitForRuntimeInfo((candidate) => candidate.pid === first.pid && candidate.port === dupPort, 20000);
    await waitForHttpOnPort(dupPort, 5000);

    const second = spawn(process.execPath, [path.join(root, 'src', 'main.js')], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const secondExitCode = await waitForExit(second, 8000);
    assert.equal(secondExitCode, 1);

    // The duplicate must not have stolen the next port for itself.
    await assert.rejects(waitForHttpOnPort(dupPort + 1, 1500));

    // The original instance is still the one recorded and still answering.
    const runtimeInfo = JSON.parse(fs.readFileSync(path.join(dataDir, 'runtime.json'), 'utf8'));
    assert.equal(runtimeInfo.pid, first.pid);
    assert.equal(runtimeInfo.port, dupPort);
    await waitForHttpOnPort(dupPort, 2000);
  } finally {
    first.kill();
    await waitForExit(first, 3000);
  }
});
