const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createSessionToken,
  hashPassword,
  validatePassword,
  verifyPassword,
  verifySessionToken
} = require('../src/auth');

test('verifies pbkdf2 password hashes', () => {
  const hash = hashPassword('secret');
  assert.equal(verifyPassword('secret', hash), true);
  assert.equal(verifyPassword('wrong', hash), false);
});

test('validates strong passwords', () => {
  assert.equal(validatePassword('Strong-Pass-123'), '');
  assert.match(validatePassword('short'), /at least 12/);
  assert.match(validatePassword('longbutweakpassword'), /uppercase, lowercase, number, and symbol/);
});

test('session tokens survive a service restart until they expire', () => {
  const secret = hashPassword('Strong-Pass-123');
  const issuedAt = Date.parse('2026-07-13T00:00:00Z');
  const token = createSessionToken(secret, issuedAt);

  assert.equal(verifySessionToken(token, secret, issuedAt + 1000), true);
  assert.equal(verifySessionToken(token, secret, issuedAt + 24 * 60 * 60 * 1000 + 1), false);
  assert.equal(verifySessionToken(token, `${secret}changed`, issuedAt + 1000), false);
});

test('remembered session tokens can use a longer explicit lifetime', () => {
  const secret = hashPassword('Strong-Pass-123');
  const issuedAt = Date.parse('2026-07-13T00:00:00Z');
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const token = createSessionToken(secret, issuedAt, thirtyDays);

  assert.equal(verifySessionToken(token, secret, issuedAt + 29 * 24 * 60 * 60 * 1000), true);
  assert.equal(verifySessionToken(token, secret, issuedAt + thirtyDays + 1), false);
});
