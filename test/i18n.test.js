const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'i18n.js'), 'utf8');

function loadI18n({ savedLocale, language = 'en-US' } = {}) {
  const storage = new Map(savedLocale ? [['wps7.locale', savedLocale]] : []);
  const documentElement = { lang: '' };
  const document = {
    documentElement,
    body: null,
    addEventListener() {}
  };
  const context = {
    document,
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    navigator: { language },
    MutationObserver: class { observe() {} },
    NodeFilter: { SHOW_TEXT: 4 },
    window: {}
  };
  context.window = context;
  vm.runInNewContext(source, context);
  return { i18n: context.Wps7I18n, documentElement, storage };
}

test('i18n uses the saved locale and updates the document language', () => {
  const { i18n, documentElement, storage } = loadI18n({ savedLocale: 'zh-HK' });

  assert.equal(i18n.getLocale(), 'zh-HK');
  assert.equal(documentElement.lang, 'zh-HK');
  i18n.setLocale('en');
  assert.equal(documentElement.lang, 'en');
  assert.equal(storage.get('wps7.locale'), 'en');
});

test('i18n falls back to English and translates known interface copy', () => {
  const { i18n } = loadI18n({ language: 'fr-FR' });

  assert.equal(i18n.getLocale(), 'en');
  i18n.setLocale('zh-HK');
  assert.equal(i18n.t('Settings'), '設定');
  assert.equal(i18n.t('Workspace 2'), '工作區 2');
  assert.equal(i18n.t('A string that has no translation'), 'A string that has no translation');
});
