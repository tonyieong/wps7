(function () {
  const storageKey = 'wps7.locale';
  const supportedLocales = ['en', 'zh-HK'];
  const translations = {
    'zh-HK': {
      'Sign in': '登入',
      'Password': '密碼',
      'Remember me': '記住我',
      'Login failed.': '登入失敗。',
      'Login expired. Please log in again.': '登入已過期，請重新登入。',
      'Request failed ({status}).': '請求失敗（{status}）。',
      'New PowerShell': '新增 PowerShell',
      'New file': '新增檔案',
      'New browser': '新增瀏覽器',
      'New notepad': '新增記事本',
      'New whiteboard': '新增白板',
      'New usage pane': '新增用量面板',
      'Usage pane': '用量面板',
      'Toggle sidebar': '切換側邊欄',
      'Settings': '設定',
      'Appearance': '外觀',
      'Terminal': '終端機',
      'Workspace': '工作區',
      'Persistence': '儲存',
      'Shell': 'Shell',
      'Files': '檔案',
      'Notepad': '記事本',
      'Usage': '用量',
      'Server': '伺服器',
      'Security': '安全性',
      'Language': '語言',
      'English': 'English',
      '繁體中文（香港）': '繁體中文（香港）',
      'Light theme': '淺色主題',
      'Dark theme': '深色主題',
      'Light mode': '淺色模式',
      'Dark mode': '深色模式',
      'Display mode': '顯示模式',
      'Terminal density': '終端機密度',
      'System font size': '系統字型大小',
      'PowerShell font': 'PowerShell 字型',
      'PowerShell font size': 'PowerShell 字型大小',
      'PowerShell mobile font size': 'PowerShell 手機字型大小',
      'Auto scroll on resize': '調整大小時自動捲動',
      'Cursor blink': '游標閃爍',
      'Browser notifications for terminal bells': '終端機提示音的瀏覽器通知',
      'Grid cell width (px)': '格線欄寬（px）',
      'Rows per screen': '每個畫面的列數',
      'New pane width (cells)': '新增面板寬度（格）',
      'New pane height (cells)': '新增面板高度（格）',
      'Autosave minutes': '自動儲存分鐘數',
      'PowerShell preferred': '首選 PowerShell',
      'PowerShell fallback': '備用 PowerShell',
      'Shell args': 'Shell 參數',
      'Upload limit bytes': '上傳大小上限（bytes）',
      'File pane font size': '檔案面板字型大小',
      'Word wrap': '自動換行',
      'Indent guides': '縮排輔助線',
      'Auto save': '自動儲存',
      'Auto-refresh minutes': '自動重新整理分鐘數',
      '5-hour window': '5 小時時段',
      'Weekly window': '每週時段',
      'Per-model weekly windows': '每個模型的每週時段',
      'Credit balance': '點數餘額',
      'Amber at': '黃色警示門檻',
      'Red at': '紅色警示門檻',
      'Notify when a quota window turns red': '用量時段變紅時通知',
      'MiniMax Coding Plan API key': 'MiniMax Coding Plan API 金鑰',
      'MiniMax region': 'MiniMax 地區',
      'Global': '全球',
      'China mainland': '中國大陸',
      'Clear saved MiniMax key': '清除已儲存的 MiniMax 金鑰',
      'Codex home folder': 'Codex 主資料夾',
      'Claude Code home folder': 'Claude Code 主資料夾',
      'Access': '存取範圍',
      'Local': '本機',
      'LAN': '區域網絡',
      'Port': '連接埠',
      'Open browser on start': '啟動時開啟瀏覽器',
      'Allowed hosts': '允許的主機名稱',
      'New password': '新密碼',
      'Cancel': '取消',
      'Apply': '套用',
      'Save': '儲存',
      'Close settings': '關閉設定',
      'Save and close': '儲存並關閉',
      'Save and keep this dialog open': '儲存並保持此視窗開啟',
      'Discard changes and close': '捨棄變更並關閉',
      'Close pane': '關閉面板',
      'Close tab': '關閉分頁',
      'New tab': '新增分頁',
      'Refresh usage': '重新整理用量',
      'Refresh': '重新整理',
      'Folder path': '資料夾路徑',
      'Address or search': '網址或搜尋',
      'This PC': '本機',
      'Loading…': '載入中…',
      'Saving...': '儲存中…',
      'Saved.': '已儲存。',
      'Save failed.': '儲存失敗。',
      'Password changed. Sign in again.': '密碼已變更，請重新登入。',
      'Set a password before enabling LAN access.': '啟用區域網絡存取前請先設定密碼。',
      'Browser notification permission was not granted.': '未獲授予瀏覽器通知權限。',
      'This location does not exist or was moved.': '此位置不存在或已被移動。',
      'Access to this location was denied.': '沒有權限存取此位置。',
      'This path is not a folder.': '此路徑不是資料夾。',
      'This location is in use by another program.': '另一個程式正在使用此位置。',
      'Unavailable: this browser requires HTTPS or localhost for notifications.': '無法使用：此瀏覽器需要 HTTPS 或 localhost 才能使用通知。',
      'Unavailable: this browser does not support notifications.': '無法使用：此瀏覽器不支援通知。',
      'Available and allowed in this browser.': '可使用，且已獲瀏覽器允許。',
      'Available. The browser will ask for permission when enabled.': '可使用。啟用時瀏覽器會要求權限。'
    }
  };

  function normalizeLocale(locale) {
    const value = String(locale || '').replace('_', '-').toLowerCase();
    return value.startsWith('zh') ? 'zh-HK' : 'en';
  }

  let locale = normalizeLocale(localStorage.getItem(storageKey) || navigator.language);

  function t(key, values) {
    const message = translations[locale]?.[key] || key;
    const translated = values ? message.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`) : message;
    if (translated !== key || locale !== 'zh-HK') {
      return translated;
    }
    return translated
      .replace(/^Workspace (\d+)/, '工作區 $1')
      .replace(/^Workspace list$/, '工作區清單');
  }

  function translateValue(value) {
    const match = String(value).match(/^(\s*)([\s\S]*?)(\s*)$/);
    return `${match[1]}${t(match[2])}${match[3]}`;
  }

  function shouldSkip(node) {
    return node.closest?.('script, style, textarea, pre, code, .xterm, [contenteditable="true"]');
  }

  function translate(root = document.body) {
    if (!root || locale === 'en') {
      return;
    }
    const documentForRoot = root.ownerDocument || document;
    const walker = documentForRoot.createTreeWalker?.(root, NodeFilter.SHOW_TEXT);
    if (walker) {
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const node of nodes) {
        if (!shouldSkip(node.parentElement)) node.nodeValue = translateValue(node.nodeValue);
      }
    }
    const elements = root.matches?.('*') ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll?.('*') || []];
    for (const element of elements) {
      if (shouldSkip(element)) continue;
      for (const name of ['aria-label', 'title', 'placeholder']) {
        if (element.hasAttribute?.(name)) element.setAttribute(name, translateValue(element.getAttribute(name)));
      }
    }
  }

  function setLocale(nextLocale) {
    locale = supportedLocales.includes(nextLocale) ? nextLocale : 'en';
    localStorage.setItem(storageKey, locale);
    document.documentElement.lang = locale;
    translate();
  }

  document.documentElement.lang = locale;
  document.addEventListener('DOMContentLoaded', () => {
    translate();
    const observer = new MutationObserver((changes) => {
      if (locale === 'en') return;
      for (const change of changes) {
        for (const node of change.addedNodes) {
          if (node.nodeType === 1) translate(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  window.Wps7I18n = { getLocale: () => locale, setLocale, supportedLocales, t, translate };
}());
