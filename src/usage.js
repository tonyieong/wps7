const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const readline = require('readline');
const pty = require('@homebridge/node-pty-prebuilt-multiarch');

const REQUEST_TIMEOUT_MS = 15000;
const CLI_TIMEOUT_MS = 15000;

function clampPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : null;
}

function resetDate(value, milliseconds = false) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }
  return new Date(milliseconds ? number : number * 1000).toISOString();
}

function isoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function windowInfo(seconds, fallbackLabel, fallbackKind) {
  const hours = Number(seconds) / 3600;
  if (hours > 0 && hours <= 6) {
    return { label: '5-hour', kind: 'five_hour' };
  }
  if (hours >= 24 * 6 && hours <= 24 * 8) {
    return { label: 'Weekly', kind: 'weekly' };
  }
  return { label: fallbackLabel, kind: fallbackKind };
}

// Runs in the system Node binary. Reads {url, headers} from stdin so tokens never
// reach the command line, and writes back the raw status and body.
const SYSTEM_NODE_FETCH_SCRIPT = `
let input = '';
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', async () => {
  try {
    const request = JSON.parse(input);
    const response = await fetch(request.url, { headers: request.headers });
    process.stdout.write(JSON.stringify({ status: response.status, body: await response.text() }));
  } catch (error) {
    process.stdout.write(JSON.stringify({ error: error.message }));
  }
});
`;

function systemNodePath() {
  const binary = process.platform === 'win32' ? 'node.exe' : 'node';
  for (const dir of String(process.env.PATH || '').split(path.delimiter)) {
    if (!dir) {
      continue;
    }
    const candidate = path.join(dir.replace(/^"|"$/g, ''), binary);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return '';
}

// Proxy rules that route by process name match node.exe but not the packaged
// wps7.exe, so usage lookups are sent through the system Node binary instead.
function systemNodeFetch(url, options = {}, spawnImpl = spawn) {
  return new Promise((resolve, reject) => {
    const nodePath = systemNodePath();
    if (!nodePath) {
      reject(new Error('Node.js was not found on PATH to run the usage lookup.'));
      return;
    }
    let child;
    try {
      child = spawnImpl(nodePath, ['-e', SYSTEM_NODE_FETCH_SCRIPT], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });
    } catch (error) {
      reject(new Error('Node.js could not run the usage lookup.'));
      return;
    }

    let output = '';
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch (killError) {}
      if (error) reject(error);
      else resolve(value);
    };

    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        const error = new Error('The operation was aborted.');
        error.name = 'AbortError';
        finish(error);
      });
    }
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', () => finish(new Error('Node.js could not run the usage lookup.')));
    child.on('close', () => {
      let payload;
      try {
        payload = JSON.parse(output);
      } catch (error) {
        finish(new Error('The usage lookup returned an unreadable response.'));
        return;
      }
      if (payload.error) {
        finish(new Error(payload.error));
        return;
      }
      finish(null, {
        ok: payload.status >= 200 && payload.status < 300,
        status: payload.status,
        text: async () => payload.body,
        json: async () => JSON.parse(payload.body)
      });
    });
    child.stdin.end(JSON.stringify({ url, headers: options.headers || {} }));
  });
}

function defaultFetch(url, options) {
  return process.pkg ? systemNodeFetch(url, options) : fetch(url, options);
}

async function requestJson(url, options, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const error = new Error('Provider authentication failed.');
        error.code = 'PROVIDER_AUTH';
        error.status = response.status;
        try {
          error.body = (await response.text()).slice(0, 300);
        } catch (bodyError) {
          error.body = '';
        }
        throw error;
      }
      throw new Error(`Provider request failed (${response.status}).`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Provider request timed out.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function codexProcess() {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'codex app-server']
    };
  }
  return { command: 'codex', args: ['app-server'] };
}

function fetchCodexCliUsage({ codexHome, spawnImpl = spawn }) {
  return new Promise((resolve, reject) => {
    const cli = codexProcess();
    let child;
    try {
      child = spawnImpl(cli.command, cli.args, {
        cwd: process.cwd(),
        env: { ...process.env, CODEX_HOME: codexHome },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true
      });
    } catch (error) {
      reject(new Error('Codex CLI is unavailable to the WPS7 service account.'));
      return;
    }

    let settled = false;
    let account = null;
    let stderr = '';
    const lines = readline.createInterface({ input: child.stdout });
    const timer = setTimeout(() => finish(new Error('Codex CLI usage request timed out.')), CLI_TIMEOUT_MS);
    const send = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      lines.close();
      child.stdin.end();
      try {
        child.kill();
      } catch (killError) {}
      if (error) reject(error);
      else resolve(value);
    };

    child.on('error', () => finish(new Error('Codex CLI is unavailable to the WPS7 service account.')));
    child.on('exit', (code) => {
      if (!settled) {
        const detail = stderr.trim() ? ` ${stderr.trim().slice(0, 240)}` : '';
        finish(new Error(`Codex CLI exited before returning usage (${code ?? 'unknown'}).${detail}`));
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    lines.on('line', (line) => {
      let message;
      try {
        message = JSON.parse(line);
      } catch (error) {
        return;
      }
      if (message.error) {
        finish(new Error(`Codex CLI could not refresh the subscription login: ${message.error.message || 'Unknown error.'}`));
        return;
      }
      if (message.id === 1) {
        send({ method: 'initialized', params: {} });
        send({ method: 'account/read', id: 2, params: { refreshToken: true } });
      } else if (message.id === 2) {
        account = message.result?.account || null;
        if (!account || account.type !== 'chatgpt') {
          finish(new Error('Codex subscription login is unavailable to the WPS7 service account.'));
          return;
        }
        send({ method: 'account/rateLimits/read', id: 3 });
      } else if (message.id === 3) {
        finish(null, { account, ...(message.result || {}) });
      }
    });

    send({
      method: 'initialize',
      id: 1,
      params: { clientInfo: { name: 'wps7', title: 'WPS7', version: '0.1.0' } }
    });
  });
}

function codexUsageResult(payload) {
  const rateLimit = payload.rateLimits || {};
  const windows = [
    ['primary', rateLimit.primary, 'Session', 'five_hour'],
    ['secondary', rateLimit.secondary, 'Weekly', 'weekly']
  ].flatMap(([id, window, fallbackLabel, fallbackKind]) => window ? [{
    id,
    ...windowInfo(Number(window.windowDurationMins) * 60, fallbackLabel, fallbackKind),
    usedPercent: clampPercent(window.usedPercent),
    resetsAt: resetDate(window.resetsAt)
  }] : []);
  const credits = rateLimit.credits || payload.credits;
  return {
    provider: 'codex',
    label: 'Codex',
    source: 'oauth',
    plan: payload.account?.planType || rateLimit.planType || '',
    windows,
    credits: credits ? {
      balance: Number(credits.balance) || 0,
      hasCredits: Boolean(credits.hasCredits ?? credits.has_credits),
      unlimited: Boolean(credits.unlimited)
    } : null,
    updatedAt: new Date().toISOString()
  };
}

async function fetchCodexUsage({ codexHome, fetchImpl = defaultFetch, spawnImpl = spawn } = {}) {
  const home = codexHome || process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const authPath = path.join(home, 'auth.json');
  if (!fs.existsSync(authPath)) {
    throw new Error('Codex is not signed in on this server.');
  }
  let auth;
  try {
    auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  } catch (error) {
    throw new Error('Codex auth.json could not be read.');
  }
  const accessToken = auth.tokens?.access_token || auth.access_token;
  if (!accessToken) {
    throw new Error('Codex OAuth token is missing.');
  }

  let payload;
  try {
    payload = await requestJson('https://chatgpt.com/backend-api/wham/usage', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
    }, fetchImpl);
  } catch (error) {
    if (error.code === 'PROVIDER_AUTH') {
      return codexUsageResult(await fetchCodexCliUsage({ codexHome: home, spawnImpl }));
    }
    throw error;
  }
  const rateLimit = payload.rate_limit || {};
  const windows = [
    ['primary', rateLimit.primary_window, 'Session', 'five_hour'],
    ['secondary', rateLimit.secondary_window, 'Weekly', 'weekly']
  ].flatMap(([id, window, fallbackLabel, fallbackKind]) => window ? [{
    id,
    ...windowInfo(window.limit_window_seconds, fallbackLabel, fallbackKind),
    usedPercent: clampPercent(window.used_percent),
    resetsAt: resetDate(window.reset_at)
  }] : []);

  return {
    provider: 'codex',
    label: 'Codex',
    source: 'oauth',
    plan: payload.plan_type || '',
    windows,
    credits: payload.credits ? {
      balance: Number(payload.credits.balance) || 0,
      hasCredits: Boolean(payload.credits.has_credits),
      unlimited: Boolean(payload.credits.unlimited)
    } : null,
    updatedAt: new Date().toISOString()
  };
}

function claudeAccessToken(credentials) {
  return credentials.claudeAiOauth?.accessToken || credentials.claude_ai_oauth?.access_token || '';
}

function claudeExpiry(credentials) {
  const value = Number(credentials.claudeAiOauth?.expiresAt || credentials.claude_ai_oauth?.expires_at);
  return Number.isFinite(value) && value > 0 ? new Date(value).toISOString() : 'unknown';
}

function tokenLength(token) {
  return String(token || '').length;
}

function readClaudeCredentials(credentialsPath) {
  try {
    return JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  } catch (error) {
    throw new Error('Claude Code credentials could not be read.');
  }
}

function refreshClaudeLogin({ claudeHome, credentialsPath, previousAccessToken, ptyImpl = pty, log = () => {} }) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'claude';
    const args = process.platform === 'win32' ? ['/d', '/s', '/c', 'claude'] : [];
    let proc;
    let settled = false;
    let bytes = 0;
    const finish = (error, token) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(poll);
      try {
        proc.kill();
      } catch (killError) {}
      if (error) reject(error);
      else resolve(token);
    };
    const checkCredentials = () => {
      try {
        const token = claudeAccessToken(readClaudeCredentials(credentialsPath));
        if (token && token !== previousAccessToken) {
          finish(null, token);
        }
      } catch (error) {}
    };
    const timer = setTimeout(() => {
      log(`claude cli refresh timed out after ${CLI_TIMEOUT_MS}ms bytes=${bytes}`);
      finish(new Error('Claude Code CLI refresh timed out.'));
    }, CLI_TIMEOUT_MS);
    const poll = setInterval(checkCredentials, 200);

    log(`claude cli spawn command=${command} args=${JSON.stringify(args)} home=${claudeHome}`);
    try {
      proc = ptyImpl.spawn(command, args, {
        name: 'xterm-256color',
        cols: 100,
        rows: 30,
        cwd: process.cwd(),
        env: { ...process.env, CLAUDE_CONFIG_DIR: claudeHome },
        ...(process.platform === 'win32' ? { useConptyDll: false } : {})
      });
    } catch (error) {
      log(`claude cli spawn failed: ${error.message}`);
      finish(new Error('Claude Code CLI is unavailable to the WPS7 service account.'));
      return;
    }
    proc.onData((chunk) => {
      bytes += String(chunk).length;
      checkCredentials();
    });
    proc.onExit((event) => {
      log(`claude cli exited code=${event?.exitCode ?? 'unknown'} bytes=${bytes} settled=${settled}`);
      checkCredentials();
      if (!settled) {
        finish(new Error('Claude Code CLI could not refresh the subscription login.'));
      }
    });
    proc.write('/status\r');
    checkCredentials();
  });
}

async function fetchClaudeUsage({ claudeHome, fetchImpl = defaultFetch, ptyImpl = pty, log = () => {} } = {}) {
  const home = claudeHome || process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const credentialsPath = path.join(home, '.credentials.json');
  log(`claude home=${home} homedir=${os.homedir()} configDirEnv=${process.env.CLAUDE_CONFIG_DIR || 'unset'}`);
  if (!fs.existsSync(credentialsPath)) {
    throw new Error('Claude Code is not signed in on this server.');
  }
  const credentials = readClaudeCredentials(credentialsPath);
  let accessToken = claudeAccessToken(credentials);
  if (!accessToken) {
    throw new Error('Claude Code OAuth token is missing.');
  }
  log(`claude oauth tokenLength=${tokenLength(accessToken)} expiresAt=${claudeExpiry(credentials)} now=${new Date().toISOString()}`);

  const fetchUsage = (token) => requestJson('https://api.anthropic.com/api/oauth/usage', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'anthropic-beta': 'oauth-2025-04-20'
    }
  }, fetchImpl);
  let payload;
  try {
    payload = await fetchUsage(accessToken);
  } catch (error) {
    log(`claude usage request failed status=${error.status ?? 'none'} code=${error.code || 'none'} message=${error.message} body=${error.body || 'none'}`);
    if (error.code === 'PROVIDER_AUTH') {
      try {
        accessToken = await refreshClaudeLogin({
          claudeHome: home,
          credentialsPath,
          previousAccessToken: accessToken,
          ptyImpl,
          log
        });
        log(`claude refreshed tokenLength=${tokenLength(accessToken)}`);
      } catch (refreshError) {
        throw new Error(`${refreshError.message} Run /login in Claude Code as the WPS7 service account.`);
      }
      payload = await fetchUsage(accessToken);
    } else {
      throw error;
    }
  }
  const windows = [
    ['five_hour', '5-hour', 'five_hour'],
    ['seven_day', 'Weekly', 'weekly'],
    ['seven_day_sonnet', 'Sonnet weekly', 'model_weekly'],
    ['seven_day_opus', 'Opus weekly', 'model_weekly']
  ].flatMap(([key, label, kind]) => payload[key] ? [{
    id: key,
    kind,
    label,
    usedPercent: clampPercent(payload[key].utilization),
    resetsAt: isoDate(payload[key].resets_at)
  }] : []);

  log(`claude usage ok windows=${windows.map((window) => window.id).join(',') || 'none'}`);
  return {
    provider: 'claude',
    label: 'Claude Code',
    source: 'oauth',
    windows,
    updatedAt: new Date().toISOString()
  };
}

function minimaxServiceLabel(modelName) {
  return ({ general: 'Text', speech: 'Speech', image: 'Image', video: 'Video', music: 'Music' })[modelName] || modelName || 'Coding plan';
}

function minimaxWindow(kind, label, remainingPercent, resetsAt) {
  const remaining = clampPercent(remainingPercent);
  if (remaining === null) {
    return null;
  }
  return {
    kind,
    label,
    usedPercent: 100 - remaining,
    remainingPercent: remaining,
    resetsAt: resetDate(resetsAt, true)
  };
}

async function fetchMiniMaxUsage({ apiKey, region = 'global', fetchImpl = defaultFetch } = {}) {
  const token = String(apiKey || '').trim();
  if (!token) {
    throw new Error('MiniMax API key is not configured.');
  }
  const host = region === 'china' ? 'api.minimaxi.com' : 'api.minimax.io';
  const url = `https://${host}/v1/token_plan/remains`;
  const payload = await requestJson(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'MM-API-Source': 'WPS7'
    }
  }, fetchImpl);
  const baseResponse = payload.base_resp || payload.data?.base_resp;
  if (baseResponse && Number(baseResponse.status_code) !== 0) {
    throw new Error('MiniMax rejected the Coding Plan request.');
  }
  const remains = payload.model_remains || payload.data?.model_remains || [];
  if (!Array.isArray(remains) || !remains.length) {
    throw new Error('MiniMax returned no Coding Plan usage.');
  }

  return {
    provider: 'minimax',
    label: 'MiniMax',
    source: 'api',
    services: remains.map((item) => ({
      id: item.model_name || 'coding-plan',
      label: minimaxServiceLabel(item.model_name),
      windows: [
        minimaxWindow('five_hour', '5-hour', item.current_interval_remaining_percent, item.end_time),
        minimaxWindow('weekly', 'Weekly', item.current_weekly_remaining_percent, item.weekly_end_time)
      ].filter(Boolean)
    })),
    updatedAt: new Date().toISOString()
  };
}

async function fetchUsageOverview({ codex, claude, minimax, content }) {
  const providers = await Promise.all([
    ['codex', 'Codex', codex],
    ['claude', 'Claude Code', claude],
    ['minimax', 'MiniMax', minimax]
  ].filter(([, , fetcher]) => typeof fetcher === 'function')
    .map(([provider, label, fetcher]) => providerResult(provider, label, fetcher, content)));
  return { providers, updatedAt: new Date().toISOString() };
}

function filterContent(provider, content) {
  if (!content) {
    return provider;
  }
  const visible = (window) => content[window.kind] !== false;
  const next = { ...provider };
  if (Array.isArray(next.windows)) {
    next.windows = next.windows.filter(visible);
  }
  if (Array.isArray(next.services)) {
    next.services = next.services.map((service) => ({ ...service, windows: (service.windows || []).filter(visible) }));
  }
  if (next.credits && content.credits === false) {
    next.credits = null;
  }
  return next;
}

async function providerResult(provider, label, fetcher, content) {
  try {
    return filterContent(await fetcher(), content);
  } catch (error) {
    return { provider, label, error: error.message || 'Usage unavailable.' };
  }
}

module.exports = {
  systemNodeFetch,
  fetchClaudeUsage,
  fetchCodexUsage,
  fetchMiniMaxUsage,
  fetchUsageOverview
};
