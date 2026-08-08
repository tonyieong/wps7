const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { shellEnv } = require('../src/shell');

test('extra_path folders are appended to PATH for the shell', () => {
  const env = shellEnv(
    { shell: { extra_path: ['C:\\Users\\someone\\AppData\\Roaming\\npm'] } },
    { PATH: 'C:\\Windows\\system32', TERM: 'xterm-256color' }
  );

  assert.equal(env.PATH, `C:\\Windows\\system32${path.delimiter}C:\\Users\\someone\\AppData\\Roaming\\npm`);
  assert.equal(env.TERM, 'xterm-256color');
});

test('shell env leaves PATH alone when there is nothing to add', () => {
  const base = { PATH: 'C:\\Windows\\system32' };

  assert.equal(shellEnv({}, base).PATH, base.PATH);
  assert.equal(shellEnv({ shell: { extra_path: [] } }, base).PATH, base.PATH);
  assert.equal(shellEnv({ shell: { extra_path: ['  '] } }, base).PATH, base.PATH);
  // Already on PATH, in the casing Windows happens to have stored.
  assert.equal(shellEnv({ shell: { extra_path: ['c:\\windows\\SYSTEM32'] } }, base).PATH, base.PATH);
});

// Windows spells the variable Path, and node-pty passes the environment through
// verbatim, so appending to a new PATH key would leave a second, ignored copy.
test('shell env extends the PATH variable Windows actually set', () => {
  const env = shellEnv(
    { shell: { extra_path: ['C:\\tools'] } },
    { Path: 'C:\\Windows\\system32' }
  );

  assert.equal(env.Path, `C:\\Windows\\system32${path.delimiter}C:\\tools`);
  assert.equal('PATH' in env, false);
});
