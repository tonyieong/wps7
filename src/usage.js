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

async function fetchCodexUsage({ codexHome, apiKey, fetchImpl = fetch } = {}) {
  const configuredKey = String(apiKey || '').trim();
  let accessToken = configuredKey;
  if (!accessToken) {
    const home = codexHome || process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
    const authPath = path.join(home, 'auth.json');
    if (!fs.existsSync(authPath)) {
      throw new Error('Codex is not signed in on this server and no API key is configured.');
    }
    let auth;
    try {
      auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    } catch (error) {
      throw new Error('Codex auth.json could not be read.');
    }
    accessToken = auth.tokens?.access_token || auth.access_token;
    if (!accessToken) {
      throw new Error('Codex OAuth token is missing.');
    }
  }

  const payload = await requestJson('https://chatgpt.com/backend-api/wham/usage', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' }
  }, fetchImpl);
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
    source: configuredKey ? 'api' : 'oauth',
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

async function fetchClaudeUsage({ claudeHome, apiKey, fetchImpl = fetch } = {}) {
  const configuredKey = String(apiKey || '').trim();
  let accessToken = configuredKey;
  if (!accessToken) {
    const home = claudeHome || process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
    const credentialsPath = path.join(home, '.credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      throw new Error('Claude Code is not signed in on this server and no API key is configured.');
    }
    let credentials;
    try {
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    } catch (error) {
      throw new Error('Claude Code credentials could not be read.');
    }
    accessToken = credentials.claudeAiOauth?.accessToken || credentials.claude_ai_oauth?.access_token;
    if (!accessToken) {
      throw new Error('Claude Code OAuth token is missing.');
    }
  }

  const payload = await requestJson('https://api.anthropic.com/api/oauth/usage', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'anthropic-beta': 'oauth-2025-04-20'
    }
  }, fetchImpl);
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

  return {
    provider: 'claude',
    label: 'Claude Code',
    source: configuredKey ? 'api' : 'oauth',
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
  fetchClaudeUsage,
  fetchCodexUsage,
  fetchMiniMaxUsage,
  fetchUsageOverview
};
