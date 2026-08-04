const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const files = require('../src/files');

test('normalizes local drive paths and rejects unsafe roots', () => {
  const root = path.parse(os.tmpdir()).root;
  assert.equal(files.normalizeLocalPath(path.join(root, 'Users')), path.win32.resolve(path.join(root, 'Users')));
  assert.equal(files.normalizeLocalPath('relative\\path'), null);
  assert.equal(files.normalizeLocalPath('\\\\server\\share'), null);
});

test('manages folders and files inside a local path', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const created = files.createFolder(root, 'folder-a');
  assert.equal(created.type, 'directory');

  const saved = await files.saveUploadedFile(created.path, 'note.txt', Readable.from(['hello']));
  assert.equal(fs.readFileSync(saved.path, 'utf8'), 'hello');

  const renamed = files.renameItem(saved.path, 'renamed.txt');
  assert.equal(renamed.name, 'renamed.txt');

  const listing = files.listDirectory(created.path);
  assert.deepEqual(listing.entries.map((entry) => entry.name), ['renamed.txt']);

  assert.equal(files.deleteItem(renamed.path).ok, true);
  assert.equal(files.deleteItem(created.path).ok, true);
});

test('copies files and folders without disturbing the source, deduping name clashes', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const source = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-src-'));
  const sourceFile = path.join(source, 'note.txt');
  fs.writeFileSync(sourceFile, 'hello');
  fs.mkdirSync(path.join(source, 'nested'));
  fs.writeFileSync(path.join(source, 'nested', 'inner.txt'), 'inner');

  const copiedFile = files.copyItem(sourceFile, root);
  assert.equal(fs.readFileSync(copiedFile.path, 'utf8'), 'hello');
  assert.equal(fs.existsSync(sourceFile), true);

  const copiedFolder = files.copyItem(source, root);
  assert.equal(copiedFolder.type, 'directory');
  assert.equal(fs.readFileSync(path.join(copiedFolder.path, 'nested', 'inner.txt'), 'utf8'), 'inner');
  assert.equal(fs.existsSync(source), true);

  const duplicate = files.copyItem(sourceFile, root);
  assert.notEqual(duplicate.path, copiedFile.path);
  assert.equal(fs.readFileSync(duplicate.path, 'utf8'), 'hello');
});

test('repairs utf8 filenames decoded as latin1 mojibake', async () => {
  const mojibake = 'ãæå¡è§èæ¡ä¾éãç¬¬ä¸å­£-éç¨.pdf';
  assert.equal(files.repairMojibakeFilename(mojibake), '【服务规范案例集】第三季-通用.pdf');
  assert.equal(files.repairMojibakeFilename('note.txt'), 'note.txt');
});

test('creates empty files and preserves uploaded folder paths', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const created = files.createFile(root, 'empty.txt');
  assert.equal(created.type, 'file');
  assert.equal(fs.readFileSync(created.path, 'utf8'), '');

  const uploaded = await files.saveUploadedFile(root, 'folder-a/nested/note.txt', Readable.from(['nested']));
  assert.equal(fs.readFileSync(uploaded.path, 'utf8'), 'nested');
  assert.equal(path.relative(root, uploaded.path), path.join('folder-a', 'nested', 'note.txt'));
  await assert.rejects(
    files.saveUploadedFile(root, '../outside.txt', Readable.from(['unsafe'])),
    /Invalid file name/
  );
});

test('marks dot files hidden and recursively deletes folders', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  fs.writeFileSync(path.join(root, '.hidden.txt'), 'hidden');
  fs.mkdirSync(path.join(root, 'folder', 'nested'), { recursive: true });
  fs.writeFileSync(path.join(root, 'folder', 'nested', 'note.txt'), 'note');

  const hidden = files.listDirectory(root).entries.find((entry) => entry.name === '.hidden.txt');
  assert.equal(hidden.hidden, true);
  assert.equal(files.downloadInfo(path.join(root, 'folder')).type, 'directory');
  assert.equal(files.deleteItem(path.join(root, 'folder')).ok, true);
  assert.equal(fs.existsSync(path.join(root, 'folder')), false);
});

test('bulk delete continues past failures and reports each item', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const keep = path.join(root, 'keep.txt');
  const gone = path.join(root, 'gone.txt');
  fs.writeFileSync(keep, 'keep');
  fs.writeFileSync(gone, 'gone');
  const missing = path.join(root, 'missing.txt');

  const { results } = files.deleteItems([gone, missing, keep]);
  assert.equal(results.length, 3);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, false);
  assert.equal(results[2].ok, true);
  assert.equal(fs.existsSync(gone), false);
  assert.equal(fs.existsSync(keep), false);
});

test('bulk download rejects empty selections and delegates single items', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const only = path.join(root, 'only.txt');
  fs.writeFileSync(only, 'only');

  assert.throws(() => files.prepareBulkDownload([]), /No files selected/);
  const single = await files.prepareBulkDownload([only]);
  assert.equal(single.type, 'file');
  assert.equal(single.path, path.win32.resolve(only));
});

test('bulk download archives multiple items into one zip', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const first = path.join(root, 'first.txt');
  const second = path.join(root, 'second.txt');
  fs.writeFileSync(first, 'first');
  fs.writeFileSync(second, 'second');

  const archive = await files.prepareBulkDownload([first, second]);
  assert.equal(archive.type, 'archive');
  assert.equal(archive.temporary, true);
  assert.ok(fs.statSync(archive.path).size > 0);
  fs.unlinkSync(archive.path);
});

test('reads and writes text files while preserving UTF-8 and UTF-16 encodings', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const utf8Path = path.join(root, 'notes.txt');
  const utf16Path = path.join(root, 'unicode.txt');
  fs.writeFileSync(utf8Path, '\uFEFFone\ntwo', 'utf8');
  fs.writeFileSync(utf16Path, Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('甲\n乙', 'utf16le')]));

  assert.deepEqual(files.readTextFile(utf8Path), { path: utf8Path, content: 'one\ntwo', encoding: 'utf8-bom' });
  assert.deepEqual(files.readTextFile(utf16Path), { path: utf16Path, content: '甲\n乙', encoding: 'utf16le' });
  files.writeTextFile(utf16Path, '新\n文字', 'utf16le');
  assert.deepEqual(files.readTextFile(utf16Path), { path: utf16Path, content: '新\n文字', encoding: 'utf16le' });
});

test('text editor rejects directories and binary files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'wps7-files-'));
  const binaryPath = path.join(root, 'binary.bin');
  fs.writeFileSync(binaryPath, Buffer.from([0, 1, 2, 3]));

  assert.throws(() => files.readTextFile(root), /not a file/i);
  assert.throws(() => files.readTextFile(binaryPath), /binary/i);
});
