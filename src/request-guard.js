const net = require('net');

function hostnameOf(hostHeader) {
  if (!hostHeader) {
    return '';
  }
  try {
    // URL keeps IPv6 literals bracketed, but net.isIP does not accept brackets.
    return new URL(`http://${hostHeader}`).hostname.toLowerCase().replace(/^\[|\]$/g, '');
  } catch (error) {
    return '';
  }
}

// DNS rebinding needs a hostname the attacker controls, so a Host header that is
// a literal address can never be a rebinding attempt. Names are only trusted
// when the operator listed them, which is what a reverse proxy needs.
function isTrustedHost(hostHeader, allowedHosts = []) {
  const hostname = hostnameOf(hostHeader);
  if (!hostname) {
    return false;
  }
  if (hostname === 'localhost' || net.isIP(hostname)) {
    return true;
  }
  return allowedHosts.some((allowed) => String(allowed).trim().toLowerCase() === hostname);
}

// curl and other non-browser clients send no Origin. Browsers always do, and a
// cross-site page cannot forge it, so an Origin that disagrees with Host is a
// cross-site WebSocket hijack attempt.
function isSameOrigin(origin, hostHeader) {
  if (!origin) {
    return true;
  }
  try {
    return new URL(origin).host.toLowerCase() === String(hostHeader || '').toLowerCase();
  } catch (error) {
    return false;
  }
}

function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const hits = new Map();

  function prune(current) {
    if (hits.size < 64) {
      return;
    }
    for (const [key, entry] of hits) {
      if (current > entry.resetAt) {
        hits.delete(key);
      }
    }
  }

  return {
    check(key) {
      const current = now();
      const entry = hits.get(key);
      if (!entry || current > entry.resetAt || entry.count < limit) {
        return { allowed: true, retryAfterMs: 0 };
      }
      return { allowed: false, retryAfterMs: entry.resetAt - current };
    },
    record(key) {
      const current = now();
      prune(current);
      const entry = hits.get(key);
      if (!entry || current > entry.resetAt) {
        hits.set(key, { count: 1, resetAt: current + windowMs });
        return;
      }
      entry.count += 1;
    },
    reset(key) {
      hits.delete(key);
    }
  };
}

module.exports = {
  createRateLimiter,
  isSameOrigin,
  isTrustedHost
};
