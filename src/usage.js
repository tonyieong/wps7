const fs = require('fs');
const os = require('os');
const path = require('path');

const REQUEST_TIMEOUT_MS = 15000;

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

function windowLabel(seconds, fallback) {
  const hours = Number(seconds) / 3600;
  if (hours > 0 && hours <= 6) {
    return '5-hour';
  }
  if (hours >= 24 * 6 && hours <= 24 * 8) {
    return 'Weekly';
  }
  return fallback;
}

async function requestJson(url, options, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Provider login expired or the API key is invalid.');
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

async function fetchCodexUsage({ codexHome, fetchImpl = fetch } = {}) {
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

  const payload = await requestJson('https://chatgpt.com/backend-api/wham/usage', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
  }, fetchImpl);
  const rateLimit = payload.rate_limit || {};
  const windows = [
    ['primary', rateLimit.primary_window, 'Session'],
    ['secondary', rateLimit.secondary_window, 'Weekly']
  ].flatMap(([id, window, fallback]) => window ? [{
    id,
    label: windowLabel(window.limit_window_seconds, fallback),
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

function minimaxServiceLabel(modelName) {
  return ({ general: 'Text', speech: 'Speech', image: 'Image', video: 'Video', music: 'Music' })[modelName] || modelName || 'Coding plan';
}

function minimaxWindow(label, remainingPercent, resetsAt) {
  const remaining = clampPercent(remainingPercent);
  if (remaining === null) {
    return null;
  }
  return {
    label,
    usedPercent: 100 - remaining,
    remainingPercent: remaining,
    resetsAt: resetDate(resetsAt, true)
  };
}

async function fetchMiniMaxUsage({ apiKey, region = 'global', fetchImpl = fetch } = {}) {
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
        minimaxWindow('5-hour', item.current_interval_remaining_percent, item.end_time),
        minimaxWindow('Weekly', item.current_weekly_remaining_percent, item.weekly_end_time)
      ].filter(Boolean)
    })),
    updatedAt: new Date().toISOString()
  };
}

async function fetchUsageOverview({ codex, minimax }) {
  const providers = await Promise.all([
    providerResult('codex', 'Codex', codex),
    providerResult('minimax', 'MiniMax', minimax)
  ]);
  return { providers, updatedAt: new Date().toISOString() };
}

async function providerResult(provider, label, fetcher) {
  try {
    return await fetcher();
  } catch (error) {
    return { provider, label, error: error.message || 'Usage unavailable.' };
  }
}

module.exports = {
  fetchCodexUsage,
  fetchMiniMaxUsage,
  fetchUsageOverview
};
