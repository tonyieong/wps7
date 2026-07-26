const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { fetchClaudeUsage, fetchCodexUsage, fetchMiniMaxUsage, fetchUsageOverview } = require('../src/usage');

test('reads Codex rate limits from the local OAuth account without exposing identity', async () => {
  const codexHome = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-codex-'));
  fs.writeFileSync(path.join(codexHome, 'auth.json'), JSON.stringify({
    tokens: { access_token: 'secret-token' }
  }));
  const result = await fetchCodexUsage({
    codexHome,
    fetchImpl: async (_url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer secret-token');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          email: 'hidden@example.com',
          plan_type: 'plus',
          rate_limit: {
            primary_window: { used_percent: 25, limit_window_seconds: 18000, reset_at: 1800000000 },
            secondary_window: { used_percent: 40, limit_window_seconds: 604800, reset_at: 1800600000 }
          },
          credits: { balance: '12.5', has_credits: true, unlimited: false }
        })
      };
    }
  });

  assert.equal(result.provider, 'codex');
  assert.equal(result.plan, 'plus');
  assert.deepEqual(result.windows.map((window) => [window.label, window.usedPercent]), [['5-hour', 25], ['Weekly', 40]]);
  assert.equal(result.credits.balance, 12.5);
  assert.equal('email' in result, false);
});

test('reads MiniMax Coding Plan windows with bearer authentication', async () => {
  const result = await fetchMiniMaxUsage({
    apiKey: 'sk-cp-secret',
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.minimax.io/v1/token_plan/remains');
      assert.equal(options.headers.Authorization, 'Bearer sk-cp-secret');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          model_remains: [{
            model_name: 'general',
            current_interval_remaining_percent: 72,
            current_weekly_remaining_percent: 61,
            end_time: 1800000000000,
            weekly_end_time: 1800600000000
          }],
          base_resp: { status_code: 0 }
        })
      };
    }
  });

  assert.equal(result.provider, 'minimax');
  assert.deepEqual(result.services[0].windows.map((window) => window.usedPercent), [28, 39]);
});

test('reads Claude Code limits from the local OAuth account without exposing identity', async () => {
  const claudeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-claude-'));
  fs.writeFileSync(path.join(claudeHome, '.credentials.json'), JSON.stringify({
    claudeAiOauth: { accessToken: 'claude-secret-token' }
  }));
  const result = await fetchClaudeUsage({
    claudeHome,
    fetchImpl: async (url, options) => {
      assert.equal(url, 'https://api.anthropic.com/api/oauth/usage');
      assert.equal(options.headers.Authorization, 'Bearer claude-secret-token');
      assert.equal(options.headers['anthropic-beta'], 'oauth-2025-04-20');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          five_hour: { utilization: 21, resets_at: '2027-01-01T05:00:00Z' },
          seven_day: { utilization: 34, resets_at: '2027-01-07T00:00:00Z' },
          seven_day_sonnet: { utilization: 18, resets_at: '2027-01-07T00:00:00Z' },
          account: { email: 'hidden@example.com' }
        })
      };
    }
  });

  assert.equal(result.provider, 'claude');
  assert.deepEqual(result.windows.map((window) => [window.label, window.usedPercent]), [
    ['5-hour', 21],
    ['Weekly', 34],
    ['Sonnet weekly', 18]
  ]);
  assert.equal('account' in result, false);
});

test('usage overview keeps enabled providers available when another fails', async () => {
  const overview = await fetchUsageOverview({
    codex: () => Promise.resolve({ provider: 'codex', windows: [] }),
    claude: () => Promise.resolve({ provider: 'claude', windows: [] }),
    minimax: () => Promise.reject(new Error('MiniMax API key is not configured.'))
  });

  assert.equal(overview.providers[0].provider, 'codex');
  assert.equal(overview.providers[1].provider, 'claude');
  assert.equal(overview.providers[2].provider, 'minimax');
  assert.equal(overview.providers[2].error, 'MiniMax API key is not configured.');
});

test('usage overview omits disabled providers', async () => {
  const overview = await fetchUsageOverview({
    codex: null,
    claude: () => Promise.resolve({ provider: 'claude', windows: [] }),
    minimax: null
  });

  assert.deepEqual(overview.providers.map((provider) => provider.provider), ['claude']);
});
