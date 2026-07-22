const crypto = require('crypto');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `pbkdf2_sha256$120000$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return true;
  }

  const [scheme, iterationsText, salt, expected] = storedHash.split('$');
  if (scheme !== 'pbkdf2_sha256' || !iterationsText || !salt || !expected) {
    return false;
  }

  const iterations = Number(iterationsText);
  const actual = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return expectedBuffer.length === actual.length && crypto.timingSafeEqual(expectedBuffer, actual);
}

function createSessionToken(secret, now = Date.now(), ttlMs = 24 * 60 * 60 * 1000) {
  const payload = Buffer.from(JSON.stringify({
    expiresAt: now + ttlMs,
    nonce: crypto.randomBytes(16).toString('base64url')
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifySessionToken(token, secret, now = Date.now()) {
  if (!token || !secret) {
    return false;
  }
  const [payload, signature] = String(token).split('.');
  if (!payload || !signature) {
    return false;
  }
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return false;
  }
  try {
    return Number(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).expiresAt) > now;
  } catch (error) {
    return false;
  }
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 12) {
    return 'Password must be at least 12 characters.';
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return 'Password must include uppercase, lowercase, number, and symbol.';
  }
  return '';
}

module.exports = {
  createSessionToken,
  hashPassword,
  validatePassword,
  verifyPassword,
  verifySessionToken
};
