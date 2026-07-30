const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(__dirname, '..', 'public', 'styles.css'), 'utf8');
const mainSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
const browserSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'browser.js'), 'utf8');
const manifest = fs.readFileSync(path.join(__dirname, '..', 'public', 'manifest.webmanifest'), 'utf8');
const indexSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

test('mobile display mode uses the current two-column navigation layout', () => {
  assert.match(styles, /\.app\.mode-mobile\s*\{\s*grid-template-columns:\s*0 minmax\(0, 1fr\)/);
  assert.match(styles, /\.app\.mode-mobile \.workspace\s*\{\s*grid-column:\s*2/);
});

test('installed mobile app uses fullscreen display without a browser address bar', () => {
  assert.equal(JSON.parse(manifest).display, 'fullscreen');
  assert.match(indexSource, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(appSource, /navigator\.serviceWorker\.register\('\/service-worker\.js'\)/);
});

test('terminal fills its pane without decorative outer padding', () => {
  assert.match(styles, /\.terminal\s*\{\s*padding:\s*0/);
});

test('obsolete pane history and fixed service status are absent', () => {
  assert.doesNotMatch(appSource, /data-pane-history|openPaneHistory|Service online|Local service online/);
  assert.doesNotMatch(mainSource, /\/api\/panes\/:paneId\/history/);
});

test('obsolete TUI pane mode is absent', () => {
  assert.doesNotMatch(appSource, /data-pane-mode|togglePaneMode|Toggle TUI mode/);
  assert.doesNotMatch(mainSource, /\/api\/panes\/:paneId\/mode/);
});

test('collapsed navigation controls have explicit accessible names', () => {
  assert.match(appSource, /class="rail-button sidebar-brand"[^>]+aria-label="Toggle sidebar"/);
  assert.match(appSource, /data-theme-toggle aria-label="Switch to \$\{themeMode\(\)/);
});

test('the theme toggle button shows the currently active mode, not the switch target', () => {
  assert.match(appSource, /<span class="rail-icon">\$\{themeMode\(\) === 'dark' \? '☾' : '☀'\}<\/span><span class="rail-label">\$\{themeMode\(\) === 'dark' \? 'Dark mode' : 'Light mode'\}<\/span>/);
  const setThemeLiveSource = appSource.slice(appSource.indexOf('async function setThemeLive'), appSource.indexOf('function wirePaneGrid'));
  assert.match(setThemeLiveSource, /icon\.textContent = themeMode\(\) === 'dark' \? '☾' : '☀'/);
  assert.match(setThemeLiveSource, /label\.textContent = themeMode\(\) === 'dark' \? 'Dark mode' : 'Light mode'/);
});

test('settings sits above the theme toggle in a shorter sidebar footer', () => {
  const footerSource = appSource.slice(appSource.indexOf('<footer class="sidebar-footer">'), appSource.indexOf('</footer>'));
  const settingsIndex = footerSource.indexOf('data-action="settings"');
  const themeToggleIndex = footerSource.indexOf('data-theme-toggle');
  assert.ok(settingsIndex !== -1 && themeToggleIndex !== -1 && settingsIndex < themeToggleIndex);
  assert.match(styles, /\.sidebar-footer \.rail-button\s*\{[^}]*min-height:\s*28px/s);
  assert.match(styles, /\.sidebar-footer\s*\{\s*padding:\s*6px 10px 8px/);
});

test('browser terminal scrollback follows the configured workspace limit', () => {
  assert.match(appSource, /scrollback:\s*Number\(state\.config\.persistence\?\.scrollback_lines\)/);
});

test('workspace header keeps shortcut controls in the sidebar only', () => {
  assert.doesNotMatch(appSource, /toolbar-button help-button/);
});

test('the sidebar shortcuts feature has been removed', () => {
  assert.doesNotMatch(appSource, /openHelp|data-action="help"|help-overlay|help-dialog-title/);
  assert.doesNotMatch(styles, /\.help-overlay|\.help-panel|\.help-header|\.help-list/);
});

test('workspace tabs and terminal grid use the compact edge-to-edge layout', () => {
  assert.match(styles, /\.workspace\s*\{\s*grid-template-rows:\s*44px minmax\(0, 1fr\)/);
  assert.match(styles, /\.tabs\s*\{\s*padding:\s*4px 8px 0/);
  assert.match(styles, /\.tab\s*\{[^}]*width:\s*max-content[^}]*min-width:\s*0[^}]*flex:\s*0 1 auto/s);
  assert.match(styles, /\.pane-grid\s*\{[^}]*border:\s*0/s);
});

test('sidebar brand is the dedicated collapse control', () => {
  assert.match(appSource, /class="rail-button sidebar-brand"[^>]+data-action="toggle"[^>]+aria-label="Toggle sidebar"/);
  assert.doesNotMatch(appSource, /data-action="toggle"[^>]+title="Sessions"/);
  assert.match(appSource, /<span class="rail-brand-mark" aria-hidden="true">W7<\/span><span class="rail-label">WPS7<\/span>/);
});

test('sidebar keeps only a divider above session panes and lists every pane as a workspace tree', () => {
  assert.doesNotMatch(appSource, /class="sidebar-header"/);
  assert.doesNotMatch(appSource, />Sessions<|>Persistent workspaces</);
  assert.match(appSource, /class="sidebar-divider" aria-hidden="true"/);
  assert.match(appSource, /function sidebarPaneRows\(\)/);
  const rowsSource = appSource.slice(appSource.indexOf('function sidebarPaneRows'), appSource.indexOf('function renderSidebarPaneItem'));
  assert.match(rowsSource, /index === 0 \? '' : \(index === panes\.length - 1 \? ' └─' : ' ├─'\)/);
  assert.match(rowsSource, /index === 0 \? `\$\{session\.name\}\/\$\{pane\.title\}` : pane\.title/);
  assert.match(appSource, /class="session-branch" aria-hidden="true">\$\{branch\}<\/span>` : ''\}<span data-pane-label>/);
  assert.match(styles, /\.session-item \.session-branch\s*\{[^}]*white-space:\s*pre/s);
});

test('sidebar actions use shared icons for new PowerShell and new file', () => {
  assert.match(appSource, /data-action="new-powershell"[^>]+aria-label="New PowerShell"[^>]*>\s*<span class="rail-icon" aria-hidden="true">\$\{fileActionIcon\('terminal'\)\}<\/span><span class="rail-label">New PowerShell<\/span>/);
  assert.match(appSource, /data-action="files"[^>]+aria-label="New file"[^>]*>\s*<span class="rail-icon" aria-hidden="true">\$\{fileActionIcon\('file'\)\}<\/span><span class="rail-label">New file<\/span>/);
  assert.match(appSource, /\[data-action="new-powershell"\][^\n]+createPane/);
});

test('pane titles reuse the same pane-type icons as the sidebar', () => {
  assert.match(appSource, /class="pane-kind-icon"[^>]*>\$\{fileActionIcon\('usage'\)\}<\/span>/);
  assert.match(appSource, /class="pane-kind-icon"[^>]*>\$\{fileActionIcon\(pane\.type === 'files' \? 'file' : 'terminal'\)\}<\/span>/);
  assert.match(styles, /\.pane-kind-icon \.file-action-icon\s*\{[^}]*width:\s*14px[^}]*height:\s*14px/s);
  assert.match(styles, /\.pane-title::before\s*\{[^}]*content:\s*none/s);
});

test('long pane titles keep the close button visible immediately while resizing', () => {
  assert.match(appSource, /\$\{header\}\s*\$\{pane\.type === 'usage'[\s\S]*?\}\s*<button class="pane-close" data-close-pane="\$\{pane\.id\}"/);
  assert.match(styles, /\.pane-title\s*\{[^}]*padding:\s*0 38px 0 10px/s);
  assert.match(styles, /\.pane-title\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*contain:\s*inline-size[^}]*transition:\s*none/s);
  assert.match(styles, /\.pane-title \[data-rename-pane\]\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.pane-close,\s*\.pane-usage-refresh\s*\{[^}]*position:\s*absolute[^}]*top:\s*3px[^}]*right:\s*6px[^}]*z-index:\s*6/s);
  assert.match(appSource, /function syncPaneTitleWidth\(paneElement\)/);
  assert.match(appSource, /paneElement\.clientWidth[\s\S]*?label\.style\.maxWidth/);
  assert.match(appSource, /function applyPaneLayoutStyle[\s\S]*?syncPaneTitleWidth\(paneElement\)/);
});

test('each pane supports independent Ctrl zoom controls', () => {
  assert.match(appSource, /function paneFontSize\(pane\)/);
  assert.match(appSource, /function changePaneFontSize\(paneId, delta\)/);
  assert.match(appSource, /event\.shiftKey && paneEl[\s\S]*?changePaneFontSize\(paneEl\.dataset\.pane, event\.deltaY/);
  assert.match(appSource, /key === '\+' \|\| key === '='/);
  assert.match(appSource, /--pane-font-size/);
  assert.match(appSource, /body:\s*JSON\.stringify\(\{ fontSize: nextSize \}\)/);
});

test('settings separate PowerShell, file pane, and system font sizes', () => {
  assert.match(appSource, /System font size<input name="ui\.system_font_size"/);
  assert.match(appSource, /PowerShell font size<input name="ui\.terminal_font_size"/);
  assert.match(appSource, /File pane font size<input name="ui\.file_pane_font_size"/);
  assert.match(appSource, /system_font_size:\s*numberOrUndefined\(form\.get\('ui\.system_font_size'\)\)/);
  assert.match(appSource, /file_pane_font_size:\s*numberOrUndefined\(form\.get\('ui\.file_pane_font_size'\)\)/);
  assert.match(appSource, /--system-font-size/);
  assert.match(appSource, /--file-pane-font-size/);
  assert.match(styles, /\.files-pane\s*\{[^}]*font-size:\s*var\(--pane-font-size, var\(--file-pane-font-size\)\)/s);
  assert.match(styles, /\.session-item[\s\S]*?font-size:\s*var\(--system-font-size/s);
});

test('settings hide internal sidebar and file-manager switches and use clear shared icons', () => {
  assert.doesNotMatch(appSource, /Sidebar width<input/);
  assert.doesNotMatch(appSource, /File manager enabled<\/label>/);
  assert.match(appSource, /aria-label="Terminal"[^>]*>\s*<span class="settings-nav-icon"[^>]*>\$\{fileActionIcon\('terminal'\)\}/);
  assert.match(appSource, /aria-label="Files"[^>]*>\s*<span class="settings-nav-icon"[^>]*>\$\{fileActionIcon\('file'\)\}/);
  for (const icon of ['appearance', 'workspace', 'persistence', 'shell', 'server', 'security']) {
    assert.match(appSource, new RegExp(`fileActionIcon\\('${icon}'\\)`));
  }
  assert.match(styles, /\.settings-nav-icon \.file-action-icon\s*\{/);
});

test('server access uses Local and LAN choices with password-gated automatic restart', () => {
  assert.match(appSource, /<select name="server\.host">/);
  assert.match(appSource, /value="127\.0\.0\.1"[^>]*>Local</);
  assert.match(appSource, /value="0\.0\.0\.0"[^>]*>LAN</);
  assert.doesNotMatch(appSource, /Host<input name="server\.host"/);
  assert.match(appSource, /const switchingToLan = payload\.server\.host === '0\.0\.0\.0'/);
  assert.match(appSource, /settings\.auth\?\.password_set \|\| Boolean\(payload\.auth\?\.password\)/);
  assert.match(appSource, /Set a password before enabling LAN access/);
  assert.match(appSource, /payload\.restart_after_save = switchingToLan/);
  assert.match(mainSource, /restart_after_save === true/);
  assert.match(mainSource, /stopRuntime\(\{ restart: !serviceManaged \}\)/);
});

test('pane grid settings resize existing panes immediately without rebuilding terminals', () => {
  const source = appSource.slice(appSource.indexOf('function applyConfigLive()'), appSource.indexOf('function escapeHtml'));
  assert.match(source, /for \(const pane of tab\.panes\)/);
  assert.match(source, /normalizePaneLayout\(pane\.layout\)/);
  assert.match(source, /applyPaneLayoutStyle\(document\.querySelector\(`\[data-pane="\$\{pane\.id\}"\]`\), pane\.layout\)/);
  assert.doesNotMatch(source, /render\(\)|loadState\(\)/);
});

test('TUI output hides intermediate cursor positions until a redraw burst settles', () => {
  assert.match(appSource, /function createTerminalWriter\(term, element\)/);
  assert.match(appSource, /term\.buffer\.active\.type === 'alternate'/);
  assert.match(appSource, /classList\.add\('terminal-updating'\)/);
  assert.match(appSource, /classList\.remove\('terminal-updating'\)/);
  assert.match(styles, /\.terminal\.terminal-updating \.xterm-cursor-layer\s*\{[^}]*opacity:\s*0/s);
});

test('workspace exposes browser panes with URL history, bookmarks and an embedded viewport', () => {
  assert.match(appSource, /data-action="browser"[^>]+aria-label="New browser"/);
  assert.match(appSource, /function renderBrowserPane\(pane\)/);
  assert.match(appSource, /data-browser-url-form/);
  assert.match(appSource, /Current[\s\S]*History[\s\S]*Bookmark/);
  assert.doesNotMatch(appSource, /<iframe class="browser-frame"/);
  assert.match(appSource, /<canvas class="browser-surface"/);
  assert.match(appSource, /<video class="browser-video"[^>]+playsinline/);
  assert.match(appSource, /data-browser-input-surface/);
  assert.match(appSource, /data-browser-emulation-mode/);
  assert.match(appSource, /data-browser-audio-toggle/);
  assert.match(appSource, /mode=browser/);
  assert.match(appSource, /data-browser-forward/);
  assert.match(appSource, /type: 'mouse'/);
  assert.match(appSource, /type: 'key'/);
  assert.match(appSource, /type: 'touch'/);
  assert.match(appSource, /new RTCPeerConnection/);
  assert.match(appSource, /type: 'rtcAnswer'/);
  assert.match(appSource, /type: 'rtcIceCandidate'/);
  assert.match(appSource, /message\.type === 'streamMode'/);
  assert.match(appSource, /data-browser-context-menu/);
  assert.match(appSource, /navigator\.clipboard\.writeText/);
  assert.match(appSource, /navigator\.clipboard\.readText/);
  assert.match(browserSource, /window\.getSelection\(\)\.toString\(\)/);
  assert.match(browserSource, /Input\.insertText/);
  assert.match(browserSource, /Input\.dispatchTouchEvent/);
  assert.match(browserSource, /navigator\.mediaDevices\.getDisplayMedia/);
  assert.match(browserSource, /type: 'webrtcOffer'/);
  assert.match(browserSource, /mode: 'jpeg'/);
  assert.match(appSource, /data-browser-tab-strip/);
  assert.match(appSource, /data-browser-new-tab/);
  assert.match(appSource, /data-browser-close-tab/);
  assert.match(appSource, /type: 'activateTab'/);
  assert.match(appSource, /type: 'find'/);
  assert.match(appSource, /type: 'zoom'/);
  assert.match(appSource, /data-browser-zoom-toggle[^>]*aria-label="Zoom controls"/);
  assert.match(appSource, /data-browser-zoom-popover[^>]*role="dialog"/);
  assert.match(appSource, /data-browser-zoom-out/);
  assert.match(appSource, /data-browser-zoom-in/);
  assert.match(appSource, /data-browser-zoom-reset/);
  assert.match(appSource, /data-browser-zoom-value/);
  assert.match(appSource, /event\.ctrlKey \|\| event\.metaKey[\s\S]*?event\.deltaY < 0 \? 0\.1 : -0\.1/);
  assert.match(appSource, /shortcut === '\+' \|\| shortcut === '='/);
  assert.match(appSource, /shortcut === '-'/);
  assert.match(styles, /\.browser-zoom-control\s*\{[^}]*position:\s*relative/s);
  assert.match(styles, /\.browser-zoom-popover\s*\{[^}]*position:\s*absolute/s);
  assert.match(browserSource, /Page\.javascriptDialogOpening/);
  assert.match(browserSource, /Page\.windowOpen/);
  assert.match(browserSource, /Page\.fileChooserOpened/);
  assert.match(browserSource, /Browser\.downloadWillBegin/);
  assert.match(browserSource, /Fetch\.enable/);
  assert.match(browserSource, /Fetch\.failRequest/);
  assert.match(browserSource, /metadata\?\.deviceHeight \|\| this\.viewport\.height/);
  assert.match(appSource, /function browserViewportSize\(viewport\)/);
  assert.match(appSource, /height: Number\(message\.viewportHeight\) \|\| remoteViewport\.height/);
  assert.doesNotMatch(appSource, /message\.viewportHeight !== expected\.height/);
  assert.match(styles, /\.browser-pane\s*\{[^}]*height:\s*100%/s);
  assert.match(styles, /\.browser-toolbar\s*\{[^}]*grid-row:\s*1/s);
  assert.match(styles, /\.browser-find-bar\s*\{[^}]*grid-row:\s*2/s);
  assert.match(styles, /\.browser-viewport\s*\{[^}]*grid-row:\s*3/s);
  assert.match(mainSource, /\/api\/browser\/upload/);
  assert.match(mainSource, /\/api\/browser\/downloads\/:guid/);
  assert.match(mainSource, /browserManager\.attach\(paneId, ws\)/);
  assert.match(mainSource, /\/api\/panes\/:paneId\/browser/);
  assert.match(mainSource, /\/api\/browser\/bookmarks/);
  assert.match(appSource, /name="url" type="text"/);
  assert.match(appSource, /data-browser-url-choice/);
  assert.match(appSource, /data-browser-bookmark/);
  assert.match(mainSource, /function normalizeWebsite\(value\)/);
  assert.match(mainSource, /`https:\/\/\$\{input\}`/);
  assert.match(mainSource, /`http:\/\/\$\{input\}`/);
  assert.match(mainSource, /localhost\|127/);
});

test('browser tabs replace the browser pane title at the shared title height', () => {
  assert.match(appSource, /pane\.type === 'browser'[\s\S]*?class="browser-tab-strip"[\s\S]*?data-pane-title="\$\{pane\.id\}"[\s\S]*?fileActionIcon\('browser'\)/);
  assert.doesNotMatch(appSource, /function renderBrowserPane\(pane\)[\s\S]*?<div class="browser-tab-strip"/);
  assert.match(styles, /\.pane\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/s);
  assert.match(styles, /\.browser-tab-strip\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)[^}]*padding-right:\s*30px/s);
  assert.match(appSource, /data-browser-new-tab[^>]*>\$\{fileActionIcon\('add'\)\}<\/button>/);
  assert.match(appSource, /data-notepad-new-tab[^>]*>\$\{fileActionIcon\('add'\)\}<\/button>/);
});

test('close buttons use the same single-stroke icon family as the new-tab button', () => {
  for (const attribute of ['data-pane-close-tab', 'data-browser-close-tab', 'data-notepad-close-tab']) {
    assert.match(appSource, new RegExp(`${attribute}="\\$\\{tab\\.id\\}">\\$\\{fileActionIcon\\('close'\\)\\}</button>`));
  }
  assert.match(appSource, /data-close-pane="\$\{pane\.id\}" title="Close pane">\$\{fileActionIcon\('close'\)\}<\/button>/);
  assert.doesNotMatch(appSource, /close-tab="\$\{tab\.id\}">×/);
  assert.match(styles, /\.pane-tab-close \.file-action-icon,[\s\S]*?\.notepad-tab-close \.file-action-icon\s*\{[^}]*width:\s*11px/s);
  // Every terminal tab keeps a close button; closing the last one restarts the shell.
  assert.doesNotMatch(appSource, /const closable =/);
});

test('browser tab strip keeps its icon after tab updates and the surface fills the viewport', () => {
  // The browser icon lives inside renderBrowserTabs so tab-strip re-renders keep it.
  assert.match(appSource, /function renderBrowserTabs\(pane\)[\s\S]*?<span class="pane-kind-icon" aria-hidden="true">\$\{fileActionIcon\('browser'\)\}<\/span>/);
  assert.match(appSource, /strip\.innerHTML = renderBrowserTabs\(found\.pane\)/);
  // The JPEG canvas fills the box like the WebRTC video, so no letterbox bars appear.
  assert.match(styles, /\.browser-surface\s*\{[^}]*object-fit:\s*fill/s);
  // Pointer mapping is a single proportional map for both stream modes (no contain offset math).
  assert.doesNotMatch(appSource, /const renderedWidth = contentWidth \* scale/);
  assert.match(appSource, /const pointerPosition = \(event\) => \{\s*const rect = inputSurface\.getBoundingClientRect\(\);[\s\S]*?event\.clientX - rect\.left\) \/ Math\.max\(1, rect\.width\) \* contentWidth/);
});

test('workspace exposes multi-tab notepad panes with line numbers and text-file save support', () => {
  assert.match(appSource, /data-action="notepad"[^>]+aria-label="New notepad"/);
  assert.match(appSource, /function renderNotepadPane\(pane\)/);
  assert.match(appSource, /function renderNotepadTabs\(pane\)/);
  assert.match(appSource, /class="notepad-tab-strip" data-notepad-tab-strip/);
  assert.match(appSource, /function editNotepadTabPath\(paneId, tabId\)/);
  assert.match(appSource, /editNotepadTabPath\(paneId, tabElement\.dataset\.notepadTab\)/);
  assert.match(appSource, /event\.target\.closest\('\.pane-close, button, input, \[data-browser-tab\], \[data-notepad-tab\], \[data-pane-tab\]'\)/);
  assert.match(appSource, /class="notepad-gutter"/);
  assert.match(appSource, /class="notepad-editor"/);
  assert.match(appSource, /event\.ctrlKey && key === 's'/);
  assert.match(appSource, /openNotepadForFile/);
  assert.match(appSource, /function addNotepadTab\(paneId, filePath = ''\)/);
  assert.match(appSource, /function closeNotepadTabClient\(paneId, tabId\)/);
  assert.match(mainSource, /app\.post\('\/api\/panes\/:paneId\/notepad\/tabs'/);
  assert.match(mainSource, /app\.get\('\/api\/files\/text'/);
  assert.match(mainSource, /app\.put\('\/api\/files\/text'/);
});

test('files and PowerShell panes share a multi-tab strip like the browser pane', () => {
  assert.match(appSource, /class="pane-tab-strip" data-pane-tab-strip data-pane-title="\$\{pane\.id\}"/);
  assert.match(appSource, /function renderPaneTabs\(pane\)/);
  assert.match(appSource, /class="pane-tab-list" role="tablist"/);
  assert.match(appSource, /data-pane-tab="\$\{tab\.id\}"/);
  assert.match(appSource, /data-pane-close-tab="\$\{tab\.id\}"/);
  assert.match(appSource, /data-pane-new-tab/);
  // Every terminal tab keeps its own surface so switching tabs never rebuilds xterm.
  assert.match(appSource, /function renderTerminalSurfaces\(pane\)/);
  assert.match(appSource, /function mountTerminal\(paneId, terminalTabId\)/);
  assert.match(appSource, /paneId=\$\{encodeURIComponent\(terminalTabId\)\}/);
  assert.match(appSource, /function showActiveTerminalTab\(paneId\)/);
  assert.match(appSource, /function activatePaneTabClient\(paneId, tabId\)/);
  assert.match(appSource, /function addPaneTab\(paneId\)/);
  assert.match(appSource, /function closePaneTabClient\(paneId, tabId\)/);
  assert.match(appSource, /function renamePaneTab\(paneId, tabId\)/);
  assert.match(styles, /\.pane-tab-strip\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)/s);
  assert.match(styles, /\.terminal\[hidden\]\s*\{[^}]*display:\s*none/s);
  assert.match(mainSource, /app\.post\('\/api\/panes\/:paneId\/terminal\/tabs'/);
  assert.match(mainSource, /app\.delete\('\/api\/panes\/:paneId\/terminal\/tabs\/:tabId'/);
  assert.match(mainSource, /app\.post\('\/api\/panes\/:paneId\/files\/tabs'/);
  assert.match(mainSource, /app\.delete\('\/api\/panes\/:paneId\/files\/tabs\/:tabId'/);
});

test('adding panes updates the workspace incrementally without rebuilding existing terminals', () => {
  const openFilesSource = appSource.slice(appSource.indexOf('async function openFilesPane'), appSource.indexOf('async function loadDrives'));
  const createPaneSource = appSource.slice(appSource.indexOf('async function createPane'), appSource.indexOf('function startPaneResize'));
  assert.match(openFilesSource, /appendPaneToWorkspace/);
  assert.match(createPaneSource, /appendPaneToWorkspace/);
  assert.doesNotMatch(openFilesSource, /loadState\(\)|render\(\)/);
  assert.doesNotMatch(createPaneSource, /loadState\(\)|render\(\)/);
  assert.match(appSource, /function applyPaneLayoutUpdates\(tab, paneLayouts\)/);
  assert.match(mainSource, /paneLayouts:\s*found\.tab\.panes\.map/);
});

test('sidebar, theme, and same-session pane activation avoid full workspace renders', () => {
  assert.match(appSource, /function setSidebarOpen\(open\)/);
  assert.match(appSource, /function setThemeLive\(theme, persist = false\)/);
  assert.match(appSource, /found\.session\.id === state\.activeSessionId/);
  const paneControlsSource = appSource.slice(appSource.indexOf('function wirePaneControls'), appSource.indexOf('function startPaneSwipe'));
  assert.match(paneControlsSource, /pane\.onclick = \(event\) => \{[\s\S]*?setActivePane\(pane\.dataset\.pane,/);
  assert.doesNotMatch(paneControlsSource, /scheduleClick\(/);
});

test('workspace motion is responsive, consistent, and reduced-motion safe', () => {
  for (const token of ['--ease-out', '--dur-fast', '--dur-base']) {
    assert.match(styles, new RegExp(`${token}:`));
  }
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\.pane\s*\{[^}]*transition:\s*box-shadow var\(--dur-fast\) var\(--ease-out\)/);
  assert.doesNotMatch(styles, /\.pane\s*\{[^}]*transition:[^;}]*border-color/s);
  assert.match(styles, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*?\.primary:active[\s\S]*?transform:\s*scale\(\.97\)/);
  assert.match(styles, /\.settings-panel\s*\{[^}]*transform-origin:\s*center/s);
  assert.match(styles, /@keyframes settings-panel-in/);
  assert.match(styles, /:root\.theme-changing[\s\S]*?transition:\s*none !important/);
  assert.match(appSource, /function applyTheme[\s\S]*?classList\.add\('theme-changing'\)[\s\S]*?requestAnimationFrame/);
  assert.match(styles, /button:focus-visible,[\s\S]*?outline:\s*2px solid var\(--accent\)/);
});

test('mobile workspace keeps only the brand icon and closes the sidebar after an action', () => {
  const mobileActions = appSource.match(/<div class="mobile-actions">([\s\S]*?)<\/div>/)?.[1] || '';
  assert.match(mobileActions, /class="mobile-brand"[^>]*>[\s\S]*?<span class="rail-brand-mark"[^>]*>W7<\/span><\/button>/);
  assert.doesNotMatch(mobileActions, /WPS7|data-action="files"|data-action="settings"/);
  assert.match(appSource, /function closeMobileSidebarAfterAction\(event\)/);
  assert.match(appSource, /app\.querySelector\('\.sidebar'\)\.addEventListener\('click', closeMobileSidebarAfterAction\)/);
});

test('the layout panel is fully removed from script and styles', () => {
  assert.doesNotMatch(appSource, /layoutPanelOpen|renderLayoutPanel|toggleLayoutPanel|renderMiniPanes|adjustActivePaneLayout|data-action="layout"|data-layout-/);
  assert.doesNotMatch(styles, /\.layout-panel|\.layout-header|\.layout-controls|\.layout-list|\.mini-grid|\.mini-pane|\.mode-switch|\.mobile-sheet/);
});

test('mobile layout neutralises the canvas camera so the active pane fills the grid', () => {
  const cameraSource = appSource.slice(appSource.indexOf('function applyCameraTransform'), appSource.indexOf('function ensureActivePaneVisible'));
  assert.match(cameraSource, /if \(isMobileLayout\(\)\) \{/);
  assert.match(cameraSource, /canvas\.style\.transform = '';/);
  assert.match(styles, /\.app\.mode-mobile \.pane-canvas,\s*\.app\.mobile-device \.pane-canvas\s*\{[^}]*inset:\s*0[^}]*width:\s*100%[^}]*height:\s*100%/s);
});

test('the active pane is nudged back into the viewport', () => {
  assert.match(appSource, /function ensureActivePaneVisible\(\)/);
  const source = appSource.slice(appSource.indexOf('function ensureActivePaneVisible'), appSource.indexOf('function pointerToWorld'));
  assert.match(source, /if \(isMobileLayout\(\)\) \{\s*return;/);
  assert.match(source, /cam\.x \+= dx;\s*cam\.y \+= dy;/);
  assert.match(appSource, /applyCameraTransform\(\);\s*ensureActivePaneVisible\(\);\s*updateDesktopModeBanner\(\)/);
  assert.match(appSource, /button\.dataset\.paneLink === state\.activePaneId\);\s*\}\);\s*ensureActivePaneVisible\(\);/);
  assert.match(appSource, /window\.addEventListener\('resize', updateVisualViewport\)/);
});

test('modal dialogs are labelled, escapable, and restore focus to the opener', () => {
  assert.match(appSource, /function wireModal\(panel, requestClose, labelledBy\)/);
  const modalSource = appSource.slice(appSource.indexOf('function wireModal'), appSource.indexOf('function discardOverlay'));
  assert.match(modalSource, /panel\.setAttribute\('role', 'dialog'\)/);
  assert.match(modalSource, /panel\.setAttribute\('aria-modal', 'true'\)/);
  assert.match(modalSource, /event\.key === 'Escape'/);
  assert.match(modalSource, /event\.key !== 'Tab'/);
  assert.match(modalSource, /if \(opener\?\.isConnected\) \{\s*opener\.focus\(\);/);
  assert.match(appSource, /wireModal\(overlay\.querySelector\('\.settings-panel'\), \(\) => closeSettings\(\), 'settings-dialog-title'\)/);
  assert.match(appSource, /id="settings-dialog-title"/);
});

test('display mode and terminal density live in settings with preview semantics', () => {
  assert.match(appSource, /function setTerminalDensity\(density, persist = true\)/);
  assert.match(appSource, /data-display-mode="\$\{mode\}" aria-pressed=/);
  assert.match(appSource, /data-terminal-density="\$\{density\}" aria-pressed=/);
  assert.match(appSource, /setDisplayMode\(button\.dataset\.displayMode, false\)/);
  assert.match(appSource, /setTerminalDensity\(button\.dataset\.terminalDensity, false\)/);
  assert.match(appSource, /setDisplayMode\(savedDisplayMode, false\)/);
  assert.match(appSource, /setTerminalDensity\(savedTerminalDensity, false\)/);
  assert.match(appSource, /localStorage\.setItem\('wps7\.displayMode', state\.displayMode\)/);
  assert.match(styles, /\.segmented-option\.active\s*\{[^}]*border-color:\s*var\(--accent\)[^}]*background:\s*var\(--accent-soft\)/s);
});

test('settings explain preview semantics and state password rules outside the placeholder', () => {
  assert.match(appSource, /Previewed live — Cancel reverts, Save keeps it\./);
  assert.match(appSource, /class="live-badge">● Live preview</);
  assert.doesNotMatch(appSource, /placeholder="12\+ chars/);
  assert.match(appSource, /aria-describedby="settings-password-rule"/);
  assert.match(appSource, /class="field-hint" id="settings-password-rule">At least 12 characters/);
});

test('settings checkboxes are not styled as text inputs', () => {
  assert.match(styles, /\.settings-check\s*\{[^}]*border:\s*0[^}]*background:\s*transparent/s);
});

test('login offers browser persistence without persisting ordinary sessions', () => {
  assert.match(appSource, /name="remember" type="checkbox"/);
  assert.match(appSource, /Keep me signed in for 30 days/);
  assert.match(appSource, /localStorage\.getItem\('wps7\.token'\) \|\| sessionStorage\.getItem\('wps7\.token'\)/);
  assert.match(appSource, /function saveToken\(token, remember\)/);
  assert.match(appSource, /remember: form\.get\('remember'\) === 'on'/);
  assert.match(appSource, /function clearToken\(\)/);
});

test('changing the server password revokes remembered and connected sessions', () => {
  assert.match(mainSource, /function revokeWebSocketSessions\(\)/);
  assert.match(mainSource, /passwordChanged[\s\S]*?revokeWebSocketSessions\(\)/);
  assert.match(mainSource, /client\.close\(1008, 'Login required'\)/);
  assert.match(appSource, /if \(payload\.auth\?\.password\)[\s\S]*?clearToken\(\)[\s\S]*?renderLogin\(\)/);
});

test('sidebar expanded state and width are restored from local storage', () => {
  assert.match(appSource, /localStorage\.getItem\('wps7\.sidebarOpen'\)/);
  assert.match(appSource, /localStorage\.setItem\('wps7\.sidebarOpen', String\(state\.sidebarOpen\)\)/);
  assert.match(appSource, /localStorage\.getItem\('wps7\.sidebarWidth'\)/);
  assert.match(appSource, /localStorage\.setItem\('wps7\.sidebarWidth', String\(width\)\)/);
});

test('sidebar can be pinned or used as a dismissible floating panel', () => {
  assert.match(appSource, /localStorage\.getItem\('wps7\.sidebarPinned'\)/);
  const sidebarBrand = appSource.match(/<div class="sidebar-brand-row">([\s\S]*?)<\/div>/)?.[1] || '';
  assert.match(sidebarBrand, /data-action="toggle"/);
  assert.match(sidebarBrand, /data-sidebar-pin[^>]+aria-pressed="\$\{state\.sidebarPinned\}"/);
  assert.doesNotMatch(sidebarBrand, /rail-label[^>]*>\$\{state\.sidebarPinned \? 'Unpin sidebar' : 'Pin sidebar'\}/);
  assert.match(appSource, /['"]pin-off['"]:/);
  assert.match(appSource, /function setSidebarPinned\(pinned\)/);
  assert.match(appSource, /function closeFloatingSidebarFromOutside\(event\)/);
  assert.match(styles, /\.app:not\(\.sidebar-pinned\):not\(\.sidebar-closed\) \.sidebar\s*\{[^}]*position:\s*fixed/s);
  assert.match(styles, /\.sidebar-brand-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/s);
});

test('sidebar creates a persistent usage pane with configurable providers', () => {
  assert.match(mainSource, /app\.get\('\/api\/usage', requireAuth\(config\)/);
  assert.match(mainSource, /app\.post\('\/api\/panes\/:paneId\/usage'/);
  assert.match(appSource, /data-action="usage"[^>]+aria-label="New usage pane"/);
  assert.match(appSource, /async function openUsagePane\(\)/);
  assert.match(appSource, /function renderUsagePane\(pane\)/);
  assert.match(appSource, /api\('\/api\/usage\?refresh=1'\)/);
  assert.match(appSource, /Codex/);
  assert.match(appSource, /Claude Code/);
  assert.match(appSource, /MiniMax/);
  assert.match(appSource, /name="usage\.show_codex"/);
  assert.match(appSource, /name="usage\.show_claude"/);
  assert.match(appSource, /name="usage\.show_minimax"/);
  assert.match(appSource, /name="usage\.minimax_api_key"/);
  assert.match(appSource, /name="usage\.minimax_region"/);
  assert.match(styles, /\.usage-pane\s*\{/);
  assert.doesNotMatch(appSource, /className = 'usage-overlay'/);
});

test('usage settings configure the MiniMax key and the visible quota windows', () => {
  assert.match(appSource, /name="usage\.minimax_api_key"/);
  assert.match(appSource, /name="usage\.clear_minimax_api_key"/);
  for (const key of ['show_five_hour', 'show_weekly', 'show_model_weekly', 'show_credits']) {
    assert.match(appSource, new RegExp(`name="usage\\.${key}"`));
    assert.match(appSource, new RegExp(`${key}: form\\.get\\('usage\\.${key}'\\) === 'on'`));
  }
  assert.match(mainSource, /fetchCodexUsage\(\)/);
  assert.match(mainSource, /fetchClaudeUsage\(\{ log: usageLog \}\)/);
});

// Codex and Claude Code usage come from the signed-in CLI accounts; an API key cannot
// read subscription quotas, and storing one used to disable the working OAuth path.
test('usage settings expose no Codex or Claude Code API key fields', () => {
  for (const name of ['codex_api_key', 'claude_api_key', 'clear_codex_api_key', 'clear_claude_api_key']) {
    assert.doesNotMatch(appSource, new RegExp(`usage\\.${name}`));
  }
  assert.doesNotMatch(mainSource, /codex_api_key|claude_api_key/);
});

test('file pane shows modified timestamps in 24-hour time', () => {
  assert.match(appSource, /function formatModified\(value\)[\s\S]*?hour12: false/);
});

test('usage pane shows quota reset times in 24-hour time', () => {
  assert.match(appSource, /function usageWindowMarkup\(window\)[\s\S]*?hour12: false/);
});

test('usage pane puts the refresh button beside the pane close button instead of a toolbar row', () => {
  assert.match(appSource, /class="pane-usage-refresh"[^>]*data-usage-refresh/);
  assert.match(styles, /\.pane-usage-refresh\s*\{[^}]*right:\s*32px/s);
  // The toolbar row and its "AI provider quota windows" caption are gone.
  assert.doesNotMatch(appSource, /usage-pane-toolbar|AI provider quota windows/);
  assert.doesNotMatch(styles, /usage-pane-toolbar/);
});

test('usage panes auto-refresh on the configured interval and stop when set to zero', () => {
  assert.match(appSource, /name="usage\.refresh_minutes"[^>]*type="number"[^>]*min="0"[^>]*max="999"/);
  assert.match(appSource, /refresh_minutes: numberOrUndefined\(form\.get\('usage\.refresh_minutes'\)\)/);
  // 0 (and any non-positive value) must leave no timer scheduled.
  assert.match(appSource, /function scheduleUsageRefresh\(paneId\)[\s\S]*?if \(!Number\.isFinite\(minutes\) \|\| minutes <= 0\) return;/);
  assert.match(appSource, /setTimeout\(\(\) => loadUsagePane\(paneId, true\), minutes \* 60000\)/);
  // Closing a pane must not leave its timer running.
  assert.match(appSource, /clearUsageRefresh\(paneId\);\s*const index = found\.tab\.panes\.findIndex/);
  assert.match(mainSource, /function usageRefreshMinutes\(config\)[\s\S]*?minutes >= 0 && minutes <= 999 \? minutes : 10/);
});

test('mobile terminal sends touch movement through the xterm scroll surface with a compact virtual key row', () => {
  assert.match(appSource, /function installMobileTerminalTouchScroll\(element, term\)/);
  assert.match(appSource, /new WheelEvent\('wheel'/);
  assert.doesNotMatch(appSource, /term\.scrollLines\(-lines\)/);
  assert.match(styles, /\.app\.mode-mobile \.terminal[\s\S]*?touch-action:\s*none/s);
  assert.match(appSource, /class="mobile-keybar"/);
  assert.match(appSource, /function renderMobileKeybar\(\)/);
  assert.match(appSource, /mobile_keybar_buttons/);
  assert.match(appSource, /function sendMobileTerminalKey\(button\)/);
});

test('mobile terminal long press selects a word without breaking touch scrolling', () => {
  assert.match(appSource, /installMobileTerminalTouchScroll\(element, term\)/);
  assert.match(appSource, /const longPressDelay = 500/);
  assert.match(appSource, /function terminalCellAtTouch\(element, term, touch\)/);
  assert.match(appSource, /function selectTerminalWordAtTouch\(element, term, touch\)/);
  assert.match(appSource, /term\.select\(/);
  assert.match(appSource, /classList\.add\('touch-selecting'\)/);
  assert.match(styles, /\.terminal\.touch-selecting/);
});

test('mobile Ctrl keeps terminal focus and modifies the next software-keyboard character', () => {
  assert.match(appSource, /button\.onpointerdown = \(event\) => event\.preventDefault\(\)/);
  assert.match(appSource, /function applyMobileControlModifier\(element, data\)/);
  assert.match(appSource, /String\.fromCharCode\(code & 31\)/);
  assert.match(appSource, /applyMobileControlModifier\(element, data\)/);
  assert.match(appSource, /control\.setAttribute\('aria-pressed', 'false'\)/);
  assert.match(appSource, /modifierButtons\.forEach\(\(modifier\) => modifier\.setAttribute\('aria-pressed', 'false'\)\)/);
  assert.match(appSource, /terminal\.term\.focus\(\)/);
  assert.match(appSource, /function terminalShortcutSequence\(shortcut\)/);
  assert.match(appSource, /data-terminal-action/);
});

test('mobile keybar can be configured, reordered and extended from server-synced settings', () => {
  assert.match(appSource, /data-mobile-keybar-editor/);
  assert.match(appSource, /data-mobile-keybar-add/);
  assert.match(appSource, /data-mobile-keybar-up/);
  assert.match(appSource, /data-mobile-keybar-down/);
  assert.match(appSource, /action === 'text'/);
  assert.match(appSource, /mobileKeybarButtonsFromSettings/);
  assert.match(mainSource, /sanitizeMobileKeybarButtons/);
  assert.match(appSource, /PowerShell shortcut buttons/);
});

test('terminal hides the overlay scrollbar so it never covers the rightmost column', () => {
  assert.match(styles, /\.terminal \.xterm-scrollable-element > \.scrollbar\s*\{[^}]*display:\s*none !important/s);
});

test('keybar editor shows a live preview and validates each row without silently dropping buttons', () => {
  assert.match(appSource, /data-mobile-keybar-preview/);
  assert.match(appSource, /function renderKeybarPreviewChips\(rows\)/);
  assert.match(appSource, /function refreshMobileKeybarPreview\(container\)/);
  assert.match(appSource, /function mobileKeybarRowValidity\(action, value\)/);
  assert.match(appSource, /function isSupportedShortcut\(value\)/);
  assert.match(appSource, /row\.classList\.toggle\('invalid', invalid\)/);
  assert.match(appSource, /function mobileKeybarSkippedCount\(form\)/);
  assert.match(appSource, /skippedKeybarButtons = mobileKeybarSkippedCount\(event\.currentTarget\)/);
  assert.match(appSource, /shortcut button\(s\) skipped/);
  assert.match(styles, /\.mobile-keybar-preview\s*\{/);
  assert.match(styles, /\.mobile-keybar-setting-row\.invalid\s*\{[^}]*border-color:\s*var\(--danger\)/s);
});

test('keybar editor switches input by action and offers a modifier select', () => {
  assert.match(appSource, /const mobileKeybarModifierOptions = \['Control', 'Alt', 'Shift'\]/);
  assert.match(appSource, /data-mobile-keybar-modifier/);
  assert.match(appSource, /function syncMobileKeybarRowAction\(row\)/);
  assert.match(appSource, /action === 'text' \? 'npm test' : 'Ctrl\+C, Escape, ArrowUp'/);
  assert.match(appSource, /function modifierShortcutToken\(value\)/);
  assert.match(appSource, /\{ Control: 'Ctrl', Alt: 'Alt', Shift: 'Shift' \}/);
});

test('keybar editor supports recording, duplicating, resetting and drag reordering', () => {
  assert.match(appSource, /data-mobile-keybar-record/);
  assert.match(appSource, /function startMobileKeybarRecording\(recordButton, row, refresh\)/);
  assert.match(appSource, /data-mobile-keybar-duplicate/);
  assert.match(appSource, /renderMobileKeybarRow\(readMobileKeybarRow\(row\)\)/);
  assert.match(appSource, /data-mobile-keybar-reset/);
  assert.match(appSource, /editor\.innerHTML = defaultMobileKeybarButtons\.map\(renderMobileKeybarRow\)\.join\(''\)/);
  assert.match(appSource, /function wireMobileKeybarDrag\(editor, refresh\)/);
  assert.match(appSource, /data-mobile-keybar-drag draggable="true"/);
  assert.match(styles, /\.mobile-keybar-drag\s*\{[^}]*cursor:\s*grab/s);
});

test('mobile PowerShell toolbar stays compact at the bottom without hiding the keyboard', () => {
  assert.match(appSource, /data-mobile-keybar-label maxlength="5"/);
  assert.match(mainSource, /button\.label\.trim\(\)\.slice\(0, 5\)/);
  assert.match(appSource, /keybar\.querySelectorAll\('button'\)\.forEach\(\(button\) => \{\s*button\.onpointerdown = \(event\) => event\.preventDefault\(\)/s);
  assert.match(styles, /\.app\.mode-mobile \.pane\[data-pane-type="terminal"\],[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\) auto/s);
  assert.match(styles, /\.app\.mode-mobile \.mobile-keybar,[\s\S]*?grid-row:\s*3/s);
  assert.match(styles, /\.app\.mode-mobile \.mobile-keybar \[data-toolbar-item\],[\s\S]*?width:\s*52px[^}]*max-width:\s*52px/s);
  assert.match(styles, /\.app\.mode-mobile \.mobile-keybar \.paged-toolbar-button,[\s\S]*?width:\s*34px[^}]*max-width:\s*34px/s);
  assert.match(styles, /@media \(max-width:\s*760px\)[\s\S]*?\.app\.mode-auto \.mobile-keybar\s*\{[^}]*display:\s*flex/s);
});

test('mobile detection and soft keyboard follow the actual visual viewport', () => {
  assert.match(appSource, /matchMedia\('\(pointer: coarse\)'\)/);
  assert.match(appSource, /navigator\.maxTouchPoints/);
  assert.match(appSource, /window\.visualViewport/);
  assert.match(appSource, /--app-height/);
  assert.match(appSource, /term\.scrollToBottom\(\)/);
});

test('mobile session double tap cancels activation and starts rename', () => {
  assert.match(appSource, /function installSessionTabTouchRename\(button\)/);
  assert.match(appSource, /state\.suppressSessionClickUntil/);
  assert.match(appSource, /now - previous\.at > 420/);
  assert.match(appSource, /renameSession\(button\.dataset\.tabSession, label\.textContent\)/);
  assert.match(styles, /\.tab\s*\{[^}]*touch-action:\s*manipulation/s);
});

test('files pane exposes the complete compact action set', () => {
  for (const action of ['file-up', 'file-refresh', 'file-new-folder', 'file-new-file', 'file-download-selected', 'file-copy-selected', 'file-delete-selected', 'file-select-all', 'file-show-hidden', 'file-upload', 'folder-upload']) {
    assert.match(appSource, new RegExp(`data-${action}`));
  }
  assert.match(styles, /\.file-command-button\s*\{[^}]*height:\s*28px/s);
  assert.match(styles, /\.compact-file-row\s*\{[^}]*min-height:\s*28px/s);
  assert.match(styles, /\.menu-rail \.rail-button\s*\{[^}]*min-height:\s*32px/s);
});

test('files pane supports range, additive, select-all, and middle-click path copy', () => {
  assert.match(appSource, /event\.shiftKey/);
  assert.match(appSource, /event\.(ctrlKey|metaKey)/);
  assert.match(appSource, /selectFileRange/);
  assert.match(appSource, /data-file-select-all/);
  assert.match(appSource, /event\.button !== 1/);
  assert.match(appSource, /navigator\.clipboard\.writeText/);
  assert.match(appSource, /data-file-copy-selected/);
  assert.match(appSource, /document\.execCommand\('copy'\)/);
  assert.match(appSource, /row\.onmousedown[\s\S]*?event\.button === 1[\s\S]*?copyFilePath\(row\.dataset\.fileRow\)/);
  assert.match(styles, /\.compact-file-row\s*\{[^}]*user-select:\s*none/s);
  assert.match(styles, /\.compact-file-row:focus,\s*\.compact-file-row:focus-visible\s*\{[^}]*outline:\s*1px solid var\(--accent\)/s);
});

test('files pane supports drag upload and Windows-style sortable detail columns', () => {
  for (const key of ['name', 'modified', 'size']) {
    assert.match(appSource, new RegExp(`data-file-sort="${key}"`));
  }
  assert.match(appSource, /sortKey:\s*'name'/);
  assert.match(appSource, /sortDirection:\s*'asc'/);
  assert.match(appSource, /function sortedFileEntries\(paneId\)/);
  assert.match(appSource, /addEventListener\('dragover'/);
  assert.match(appSource, /addEventListener\('drop'/);
  assert.match(appSource, /webkitGetAsEntry/);
  assert.match(appSource, /pane-kind-icon[\s\S]*?pane-upload-status[\s\S]*?data-rename-pane/);
  assert.match(appSource, /setFileStatus\('0%', paneId\)/);
  assert.match(appSource, /setFileStatus\(`\$\{percent\}%`, paneId\)/);
  assert.match(appSource, /class="file-drop-overlay"[^>]*>Drop files or folders to upload<\/div>/);
  assert.match(appSource, /querySelector\(`\[data-pane-upload-status="\$\{paneId\}"\]`\)/);
  assert.match(styles, /\.file-column-header\s*\{/);
  assert.match(styles, /\.file-column-header\s*\{[^}]*position:\s*sticky[^}]*top:\s*0[^}]*z-index:\s*2/s);
  assert.match(styles, /\.files-pane \.file-list\s*\{[^}]*padding:\s*0 2px 2px/s);
  assert.match(appSource, /class="file-size">\$\{entry\.type === 'file' \? formatBytes\(entry\.size\) : 'Folder'\}<\/small>/);
  assert.doesNotMatch(styles, /\.files-pane\.drop-target\s*\{[^}]*box-shadow/s);
  assert.match(styles, /\.files-pane\.drop-target \.file-drop-overlay\s*\{[^}]*display:\s*flex/s);
  assert.match(styles, /\.file-pane-title\.uploading\s*\{[^}]*grid-template-columns:\s*auto auto minmax\(0, 1fr\)/s);
});

test('file detail rows share the exact column boundaries of their header', () => {
  assert.match(styles, /\.compact-file-row\s*\{[^}]*grid-template-columns:\s*var\(--file-column-template\)[^}]*gap:\s*0[^}]*padding:\s*1px 0[^}]*border-left:\s*0[^}]*border-right:\s*0/s);
  assert.match(styles, /\.compact-file-row \.file-name,\s*\.compact-file-row \.file-modified,\s*\.compact-file-row \.file-size\s*\{[^}]*padding:\s*0 5px/s);
});

test('terminal title and bell sequences update pane names and browser notifications', () => {
  assert.match(appSource, /term\.onTitleChange\(\(title\) => updatePaneTitleFromTerminal\(paneId, terminalTabId, title\)\)/);
  assert.match(appSource, /term\.onBell\(\(\) => showTerminalNotification\(paneId\)\)/);
  for (const code of [9, 99, 777]) {
    assert.match(appSource, new RegExp(`term\\.parser\\.registerOscHandler\\(${code},`));
  }
  assert.match(appSource, /function handleTerminalOscNotification\(paneId, code, data\)/);
  assert.match(appSource, /new Notification\(/);
  assert.match(appSource, /Notification\.requestPermission\(\)/);
  assert.match(appSource, /name="terminal\.browser_notifications"/);
  assert.match(appSource, /function browserNotificationCapability\(\)/);
  assert.match(appSource, /window\.isSecureContext/);
  assert.match(appSource, /Notification\.permission === 'denied'/);
  assert.match(appSource, /data-browser-notification-status/);
  assert.match(appSource, /notificationInput\?\.disabled/);
});

test('panes expose invisible resize targets on every edge and corner over an aligned grid canvas', () => {
  for (const direction of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
    assert.match(appSource, new RegExp(`data-pane-resize-direction="${direction}"`));
  }
  assert.match(appSource, /function bringPaneToFront\(tab, pane, paneElement\)/);
  assert.match(appSource, /savePaneLayoutLocal\(paneId, nextLayout\)/);
  assert.match(styles, /\.pane-grid\s*\{[^}]*linear-gradient[^}]*\}/s);
  assert.match(styles, /\.pane-canvas\s*\{[^}]*transform-origin:\s*0 0/s);
  assert.doesNotMatch(styles, /\.pane-resize::after\s*\{[^}]*border-/s);
});

test('pane layouts snap to the dashed grid cell so panes can rest between solid lines', () => {
  assert.match(appSource, /function snapUnit\(value\)/);
  assert.match(appSource, /const GRID_UNIT = 120/);
  assert.match(appSource, /const GRID_MINOR_UNIT = 30/);
  assert.match(appSource, /Math\.round\(value \/ GRID_MINOR_UNIT\) \* GRID_MINOR_UNIT/);
  assert.match(appSource, /const w = Math\.max\(GRID_UNIT, snapUnit\(/);
  assert.match(appSource, /const x = snapUnit\(/);
});

test('the canvas paints dashed 30px cells inside every 120px solid square', () => {
  assert.match(styles, /\.pane-grid\s*\{[^}]*background-size:\s*120px 120px, 120px 120px, 30px 6px, 6px 30px/s);
  assert.match(styles, /\.pane-grid\s*\{[^}]*conic-gradient\(at 1px var\(--grid-dash-length\)[^}]*conic-gradient\(at var\(--grid-dash-length\) 1px/s);
  assert.match(styles, /\.pane-grid\.minor-grid-hidden\s*\{[^}]*background-image:[^}]*\}/s);
  assert.doesNotMatch(styles, /\.pane-grid\.minor-grid-hidden\s*\{[^}]*conic-gradient/s);
  assert.match(appSource, /const GRID_DASH_PERIOD = GRID_MINOR_UNIT \/ 5/);
  assert.match(appSource, /grid\.style\.backgroundSize = `\$\{solid\}px \$\{solid\}px, \$\{solid\}px \$\{solid\}px, \$\{minor\}px \$\{dash\}px, \$\{dash\}px \$\{minor\}px`/);
  assert.match(appSource, /grid\.classList\.toggle\('minor-grid-hidden', minor < 12\)/);
});

test('drawing tools sit between the brand row and the pane actions, and reflow to fit the sidebar width', () => {
  const railStart = appSource.indexOf('class="rail-button sidebar-brand"');
  const toolbarStart = appSource.indexOf('class="draw-toolbar"');
  const newPaneStart = appSource.indexOf('data-action="new-powershell"');
  assert.ok(railStart < toolbarStart && toolbarStart < newPaneStart);
  for (const tool of ['hand', 'selection', 'rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'draw', 'text', 'eraser']) {
    assert.match(appSource, new RegExp(`\\{ id: '${tool}', label: '[^']+', icon: '[^']+' \\}`));
  }
  assert.match(appSource, /data-draw-tool-button="\$\{tool\.id\}"[^>]*aria-pressed="\$\{state\.drawTool === tool\.id\}"/);
  assert.match(styles, /\.draw-toolbar\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(auto-fit, minmax\(28px, 1fr\)\)/s);
  assert.match(styles, /\.draw-tool\s*\{[^}]*width:\s*28px[^}]*height:\s*28px[^}]*justify-self:\s*center/s);
  assert.match(styles, /\.app\.sidebar-closed \.draw-toolbar\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test('drawing gestures snap to the grid and stay on the tab that owns them', () => {
  assert.match(appSource, /element\.w = snapUnit\(point\.x\) - element\.x/);
  assert.match(appSource, /el\.x = snapUnit\(x \+ dx\)/);
  // freehand strokes follow the pointer without snapping, as in Excalidraw
  const freeDraw = appSource.slice(appSource.indexOf('function startFreeDraw'), appSource.indexOf('function startDrawErase'));
  assert.doesNotMatch(freeDraw, /snapUnit/);
  assert.match(appSource, /api\(`\/api\/tabs\/\$\{tab\.id\}\/drawings`/);
  assert.match(mainSource, /app\.patch\('\/api\/tabs\/:tabId\/drawings'/);
  assert.match(styles, /\.pane-grid:not\(\[data-draw-tool="selection"\]\) \.draw-layer\s*\{[^}]*pointer-events:\s*auto/s);
  assert.match(styles, /\.draw-hit\s*\{[^}]*pointer-events:\s*stroke/s);
});

test('drawing elements carry per-element style attributes instead of a fixed look', () => {
  assert.match(appSource, /data-draw-props/);
  assert.match(appSource, /wps7\.drawStyles/);
  const stylesFieldsSource = appSource.slice(appSource.indexOf('const DRAW_STYLE_FIELDS'), appSource.indexOf('const DRAW_STYLE_DEFAULTS'));
  for (const prop of ['strokeColor', 'backgroundColor', 'fillStyle', 'strokeWidth', 'strokeStyle', 'roundness', 'startArrowhead', 'endArrowhead', 'fontFamily', 'fontSize', 'textAlign', 'opacity']) {
    assert.match(stylesFieldsSource, new RegExp(`'${prop}'`));
  }
  // only "arrow" has arrowheads in Excalidraw; "line" must not list them
  const lineFields = stylesFieldsSource.match(/line: \[([^\]]+)\]/)[1];
  assert.doesNotMatch(lineFields, /Arrowhead/);
  for (const kind of ['none', 'arrow', 'triangle', 'triangle_outline', 'diamond', 'diamond_outline', 'circle', 'circle_outline', 'bar']) {
    assert.match(appSource, new RegExp(`'${kind}'`));
  }
  // shapes render presentation attributes per element instead of a fixed CSS look
  assert.match(appSource, /stroke="\$\{stroke\}" stroke-width="\$\{strokeWidth\}"/);
  assert.match(appSource, /function ensureFillPattern\(color, style\)/);
  // .draw-hit keeps a constant screen-space pick width regardless of zoom, but
  // the visible shape's stroke now scales with zoom like Excalidraw's does
  assert.doesNotMatch(styles, /\.draw-shape\s*\{[^}]*vector-effect/s);
  assert.match(styles, /\.draw-hit\s*\{[^}]*vector-effect:\s*non-scaling-stroke/s);
  assert.match(styles, /\.draw-props\s*\{/);
  assert.match(styles, /\.draw-hit-filled\s*\{[^}]*pointer-events:\s*all/s);
});

test('drawing selection is a Set supporting multi-select, marquee drag, and grouping', () => {
  assert.match(appSource, /drawSelection: new Set\(\)/);
  assert.match(appSource, /function groupMembers\(element\)/);
  assert.match(appSource, /function findDrawElementById\(id\)/);
  assert.match(appSource, /function applyDrawSelectionChange\(nextIds\)/);
  assert.match(appSource, /function replaceDrawSelection\(ids\)/);
  assert.match(appSource, /function addDrawSelection\(id\)/);
  assert.match(appSource, /function toggleDrawSelection\(id\)/);
  assert.match(appSource, /function clearDrawSelection\(\)/);
  // click conventions: Shift = additive add, Ctrl/Cmd = toggle, plain click on an
  // element not already selected replaces the selection
  const onDrawPointerDown = appSource.slice(appSource.indexOf('function onDrawPointerDown'), appSource.indexOf('function startDrawShape'));
  assert.match(onDrawPointerDown, /event\.shiftKey\)\s*\{\s*addDrawSelection\(id\)/);
  assert.match(onDrawPointerDown, /event\.ctrlKey \|\| event\.metaKey\)\s*\{\s*toggleDrawSelection\(id\)/);
  assert.match(onDrawPointerDown, /!state\.drawSelection\.has\(id\)\)\s*\{?\s*replaceDrawSelection/);
  assert.match(onDrawPointerDown, /startDrawMarquee\(grid, event\)/);
  // marquee drag-select and its AABB hit test
  assert.match(appSource, /function startDrawMarquee\(grid, event\)/);
  assert.match(appSource, /function elementIntersectsBox\(element, box\)/);
  assert.match(appSource, /function elementBounds\(element\)/);
  assert.match(styles, /\.draw-marquee\s*\{/);
  // grouping: click any member selects the whole group; Ctrl+G / Ctrl+Shift+G
  assert.match(appSource, /function groupSelectedDrawElements\(\)/);
  assert.match(appSource, /function ungroupSelectedDrawElements\(\)/);
  assert.match(appSource, /event\.ctrlKey && key === 'g'/);
});

test('clicks inside a pane never start a draw gesture on the canvas behind it', () => {
  const onDrawPointerDown = appSource.slice(appSource.indexOf('function onDrawPointerDown'), appSource.indexOf('function startDrawShape'));
  const guardIndex = onDrawPointerDown.search(/event\.target\.closest\?\.\('\[data-pane\]'\)\)\s*\{\s*return;/);
  const marqueeIndex = onDrawPointerDown.indexOf('startDrawMarquee(grid, event)');
  assert.ok(guardIndex !== -1, 'onDrawPointerDown must bail out when the click target is inside a pane');
  assert.ok(guardIndex < marqueeIndex, 'the [data-pane] guard must run before the marquee/selection gesture starts');
});

test('undo/redo tracks whiteboard mutations per tab without polluting history on no-op drags', () => {
  assert.match(appSource, /const drawHistories = new Map\(\)/);
  assert.match(appSource, /const DRAW_HISTORY_LIMIT = 50/);
  assert.match(appSource, /function drawHistoryFor\(tabId\)/);
  assert.match(appSource, /function beginDrawHistoryEntry\(\)/);
  assert.match(appSource, /function commitDrawHistoryEntry\(beforeSnapshot\)/);
  assert.match(appSource, /function undoDraw\(\)/);
  assert.match(appSource, /function redoDraw\(\)/);
  assert.match(appSource, /event\.ctrlKey && !event\.shiftKey && key === 'z'/);
  assert.match(appSource, /key === 'y' \|\| \(event\.shiftKey && key === 'z'\)/);
  // drag gestures only commit a history entry when something actually moved
  const move = appSource.slice(appSource.indexOf('function startDrawElementsMove'), appSource.indexOf('function trackDrawPointer'));
  assert.match(move, /if \(moved\)\s*\{\s*commitDrawHistoryEntry\(before\)/);
});

test('copy/paste/duplicate work on the whiteboard clipboard without stealing pane shortcuts', () => {
  assert.match(appSource, /drawClipboard: \[\]/);
  assert.match(appSource, /function copySelectedDrawElements\(\)/);
  assert.match(appSource, /function pasteDrawElementsAt\(offset = 20\)/);
  assert.match(appSource, /function duplicateSelectedDrawElements\(\)/);
  const shortcuts = appSource.slice(appSource.indexOf('function installKeyboardShortcuts'), appSource.indexOf('function installKeyboardShortcuts') + 3000);
  assert.match(shortcuts, /event\.ctrlKey && !event\.target\.closest\?\.\('\[data-pane\]'\)/);
  assert.match(shortcuts, /duplicateSelectedDrawElements\(\)/);
});

test('resize handles cover box shapes and linear endpoints, but not freehand or text', () => {
  assert.match(appSource, /function updateDrawHandles\(\)/);
  assert.match(appSource, /function startDrawResize\(event, element, direction\)/);
  assert.match(appSource, /function worldToScreen\(x, y, cam\)/);
  const handles = appSource.slice(appSource.indexOf('function updateDrawHandles'), appSource.indexOf('function startDrawResize'));
  assert.match(handles, /state\.drawSelection\.size !== 1/);
  assert.match(handles, /element\.type === 'draw' \|\| element\.type === 'text'/);
  assert.match(handles, /'nw'.*'n'.*'ne'.*'e'.*'se'.*'s'.*'sw'.*'w'/);
  assert.match(appSource, /data-draw-handles/);
  assert.match(styles, /\.draw-handle\s*\{/);
  assert.match(styles, /\.draw-handle-start,\s*\n\.draw-handle-end\s*\{[^}]*cursor:\s*move/s);
});

test('pane resize uses free world-pixel deltas scaled by the camera zoom', () => {
  const source = appSource.slice(appSource.indexOf('function startPaneResize'), appSource.indexOf('function startPaneMove'));
  assert.match(source, /const scale = activeCamera\(\)\.scale/);
  assert.match(source, /const dx = \(moveEvent\.clientX - startX\) \/ scale/);
  assert.match(source, /candidate\.w = startLayout\.w \+ dx/);
  assert.match(source, /candidate\.h = startLayout\.h \+ dy/);
  assert.match(source, /candidate\.w < MIN_PANE_WIDTH/);
  assert.doesNotMatch(source, /findAdjacentResizePane|resizePairIsFree/);
});

test('switching panes clears file selections and their range anchors', () => {
  assert.match(appSource, /function clearFileSelections\(\)/);
  assert.match(appSource, /state\.selectedFiles\[paneId\] = \[\]/);
  assert.match(appSource, /filesPaneData\(paneId\)\.selectionAnchor = -1/);
  assert.match(appSource, /document\.querySelectorAll\('\[data-files-pane\]'\)\.forEach\(\(paneElement\) => syncFileSelectionUi/);
  assert.match(appSource, /async function setActivePane\(paneId, reloadFiles = true\)[\s\S]*?clearFileSelections\(\);[\s\S]*?state\.activePaneId = paneId/);
  assert.match(appSource, /function selectFileRow[\s\S]*?state\.activePaneId !== paneId[\s\S]*?setActivePane\(paneId, false\);[\s\S]*?state\.selectedFiles\[paneId\] = \[row\.dataset\.fileRow\]/);
});

test('activating an existing Files pane does not reload its contents', () => {
  const paneControlsSource = appSource.slice(appSource.indexOf('function wirePaneControls'), appSource.indexOf('function startPaneSwipe'));
  assert.match(paneControlsSource, /setActivePane\(pane\.dataset\.pane, pane\.dataset\.paneType !== 'files'\)/);
});

test('file list starts with a compact parent-directory row', () => {
  assert.match(appSource, /class="file-row compact-file-row file-parent-row"[\s\S]*?data-file-parent="\$\{escapeAttr\(paneData\.parent\)\}"/);
  assert.match(appSource, /file-parent-row[\s\S]*?fileActionIcon\('up'\)[\s\S]*?<span>\.\.<\/span>[\s\S]*?class="file-item-count"[\s\S]*?selectedPaths\.length \? `\$\{selectedPaths\.length\}\/\$\{entries\.length\} items` : `\$\{entries\.length\} items`/);
  assert.match(styles, /\.file-parent-row\s*\{[^}]*grid-template-columns:\s*var\(--file-column-template\)/s);
  assert.match(styles, /\.file-item-count\s*\{[^}]*display:\s*inline-flex[^}]*width:\s*max-content[^}]*justify-self:\s*end[^}]*border-radius:/s);
  assert.match(appSource, /\[data-file-parent\][\s\S]*?button\.ondblclick[\s\S]*?setFilesPanePath\(paneId, button\.dataset\.fileParent\)/);
  assert.match(appSource, /button\.onkeydown[\s\S]*?event\.key === 'Enter'[\s\S]*?setFilesPanePath\(paneId, button\.dataset\.fileParent\)/);
  assert.doesNotMatch(appSource, /button\.onclick = \(\) => setFilesPanePath\(paneId, button\.dataset\.fileParent\)/);
  assert.doesNotMatch(appSource, /class="file-selection-count"/);
  assert.match(appSource, /itemCount\.textContent = selected\.length \? `\$\{selected\.length\}\/\$\{total\} items` : `\$\{total\} items`/);
});

test('show hidden files is stored in shared server configuration', () => {
  assert.match(appSource, /showHidden:\s*Boolean\(state\.config\.file_manager\?\.show_hidden\)/);
  assert.match(appSource, /file_manager:\s*\{ show_hidden:\s*showHidden \}/);
  assert.match(mainSource, /next\.file_manager\.show_hidden = updates\.file_manager\.show_hidden/);
});

test('every rendered files pane loads independently', () => {
  assert.doesNotMatch(appSource, /else if \(pane\.id === state\.activePaneId\) \{\s*loadFilesPane\(pane\)/);
  assert.match(appSource, /else \{\s*loadFilesPane\(pane\);\s*\}/);
});

test('files pane uses one coherent svg icon per action', () => {
  assert.doesNotMatch(appSource, /□＋|▱＋|⇧□|⇧▱/);
  for (const icon of ['terminal', 'up', 'refresh', 'new-folder', 'upload-file', 'upload-folder', 'download', 'copy', 'rename', 'delete', 'hidden', 'star', 'drive', 'file', 'folder']) {
    assert.match(appSource, new RegExp(`fileActionIcon\\('${icon}'\\)`));
  }
  assert.match(appSource, /fileActionIcon\(allSelected \? 'deselect-all' : 'select-all'\)/);
  assert.match(appSource, /<svg class="file-action-icon"[^>]+aria-hidden="true"/);
  assert.match(styles, /\.file-action-icon\s*\{[^}]*width:\s*15px[^}]*height:\s*15px/s);
  assert.match(appSource, /refresh:\s*'<g class="refresh-shape">/);
  assert.match(styles, /\.file-action-icon\s*\{[^}]*stroke-width:\s*1\.7[^}]*stroke-linecap:\s*round[^}]*stroke-linejoin:\s*round/s);
  assert.doesNotMatch(styles, /\.refresh-shape \.refresh-arc\s*\{/);
});

test('file rows use row selection without leading checkboxes', () => {
  assert.doesNotMatch(appSource, /class="file-select"|data-file-select=/);
  assert.doesNotMatch(styles, /\.compact-file-row \.file-select/);
  assert.match(styles, /\.compact-file-row\s*\{[^}]*grid-template-columns:\s*var\(--file-column-template\)/s);
  assert.match(appSource, /row\.classList\.toggle\('selected', selectedRow\)/);
});

test('file columns resize and the list owns the remaining pane height', () => {
  assert.match(appSource, /data-file-column-resize="name"/);
  assert.match(appSource, /data-file-column-resize="modified"/);
  assert.match(appSource, /data-file-column-resize="size"/);
  assert.match(appSource, /handle\.setPointerCapture\(event\.pointerId\)/);
  assert.match(styles, /\.files-pane \.file-list\s*\{[^}]*grid-row:\s*3/s);
  assert.match(styles, /\.file-column-resizer\s*\{[^}]*cursor:\s*col-resize/s);
  assert.match(styles, /\.compact-file-row \.file-modified,\s*\.compact-file-row \.file-size\s*\{[^}]*min-width:\s*0[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s);
});

test('double-click opens text files in Notepad and downloads binary files', () => {
  assert.match(appSource, /async function openFileRow\(row, paneId\)/);
  assert.match(appSource, /api\(`\/api\/files\/text\?path=\$\{encodeURIComponent\(path\)\}`\)/);
  assert.match(appSource, /if \(error\.status === 415\)\s*\{\s*await downloadFiles\(\[path\], paneId\)/s);
});

test('Notepad uses a compact neutral line-number gutter', () => {
  assert.match(appSource, /split\(\/\\r\\n\|\\r\|\\n\/\)/);
  assert.doesNotMatch(appSource, /lineNumberWidth/);
  assert.match(styles, /\.notepad-editor-shell\s*\{[^}]*grid-template-columns:\s*max-content minmax\(0, 1fr\)/s);
  assert.match(styles, /\.notepad-pane\s*\{[^}]*--notepad-divider:\s*color-mix\(in srgb, var\(--text\) 16%, var\(--terminal-bg\)\)/s);
  assert.match(styles, /\.notepad-gutter\s*\{[^}]*border-right:\s*1px solid var\(--notepad-divider\) !important/s);
  assert.match(styles, /\.notepad-editor:focus-visible\s*\{[^}]*outline:\s*none/s);
  assert.match(styles, /\.notepad-toolbar\s*\{[^}]*border-bottom:\s*1px solid var\(--notepad-divider\)/s);
});

test('Notepad uses compact popovers, four-space tabs, and synchronized wrapped rows', () => {
  assert.match(appSource, /data-notepad-font-toggle[^>]*>\$\{fileActionIcon\('font'\)\}<\/button>/);
  assert.match(appSource, /data-notepad-font-popover[^>]*role="dialog"/);
  assert.match(appSource, /data-notepad-font-size-popover[^>]*role="dialog"/);
  assert.match(appSource, /data-notepad-find-popover[^>]*role="dialog"/);
  assert.match(appSource, /data-notepad-replace-popover[^>]*role="dialog"/);
  assert.match(appSource, /data-notepad-find-prev[^>]*>\$\{fileActionIcon\('browser-back'\)\}<\/button>/);
  assert.match(appSource, /data-notepad-find-next[^>]*>\$\{fileActionIcon\('browser-forward'\)\}<\/button>/);
  assert.match(appSource, /data-notepad-replace-one[^>]*>\$\{fileActionIcon\('replace'\)\}<\/button>/);
  assert.match(appSource, /data-notepad-replace-all[^>]*>\$\{fileActionIcon\('replace-all'\)\}<\/button>/);
  assert.match(appSource, /editor\.setRangeText\(' {4}', start, editor\.selectionEnd, 'end'\)/);
  assert.match(appSource, /function syncNotepadRows\(paneElement, editor, gutter, guides\)/);
  assert.match(appSource, /function renderNotepadIndentGuides\(content/);
  assert.match(styles, /\.notepad-toolbar\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.match(styles, /\.notepad-popover\s*\{[^}]*position:\s*absolute/s);
  assert.match(styles, /\.notepad-find-popover,\s*\.notepad-replace-popover\s*\{[^}]*top:\s*50%[^}]*left:\s*50%[^}]*transform:\s*translate\(-50%, -50%\)/s);
  assert.match(appSource, /function closeNotepadPopoversFromOutside\(event\)/);
  assert.match(appSource, /changePaneFontSize\(paneId, -1\)/);
  assert.match(appSource, /changePaneFontSize\(paneId, 1\)/);
  assert.match(styles, /tab-size:\s*4/);
  assert.doesNotMatch(styles, /\.notepad-editor-shell\.indent-guides-on \.notepad-editor\s*\{[^}]*repeating-linear-gradient/s);
});

test('notepad find and replace popovers are draggable and closeable', () => {
  assert.match(appSource, /class="notepad-popover-header" data-notepad-popover-drag/);
  assert.match(appSource, /data-notepad-popover-close aria-label="Close find"/);
  assert.match(appSource, /data-notepad-popover-close aria-label="Close replace"/);
  assert.match(appSource, /function wireNotepadPopoverDrag\(popover\)/);
  assert.match(appSource, /handle\.setPointerCapture\(event\.pointerId\)/);
  assert.match(appSource, /wirePopover\('\[data-notepad-find\]', '\[data-notepad-find-popover\]', true\)/);
  assert.match(appSource, /wirePopover\('\[data-notepad-replace\]', '\[data-notepad-replace-popover\]', true\)/);
  assert.match(appSource, /if \(persistent\) \{[\s\S]*?wireNotepadPopoverDrag\(popover\)/);
  assert.match(styles, /\.notepad-popover-header\s*\{[^}]*grid-column:\s*1 \/ -1[^}]*cursor:\s*move/s);
  assert.match(styles, /\.notepad-popover-header \.notepad-popover-close\s*\{/);
});

test('notepad tab strip stays wired from the pane container with compact controls', () => {
  assert.match(appSource, /wireNotepadTabs\(paneElement\.closest\('\.pane'\) \|\| paneElement, paneId\)/);
  assert.match(appSource, /const newTabButton = paneElement\.querySelector\('\[data-notepad-new-tab\]'\);\s*\n\s*if \(newTabButton\) newTabButton\.onclick = \(\) => addNotepadTab\(paneId, ''\);/);
  assert.doesNotMatch(appSource, /\[data-notepad-new-tab\]'\)\?\.addEventListener/);
  assert.match(styles, /\.notepad-tab-close\s*\{[^}]*width:\s*14px[^}]*height:\s*14px/s);
  assert.match(styles, /\.notepad-new-tab\s*\{[^}]*flex:\s*0 0 18px[^}]*width:\s*18px/s);
  assert.match(styles, /\.notepad-new-tab \.file-action-icon\s*\{[^}]*width:\s*12px/s);
});

test('notepad toolbar handlers replace instead of stacking so font size steps by one', () => {
  assert.match(appSource, /if \(fontSizeOutButton\) fontSizeOutButton\.onclick = \(\) => changePaneFontSize\(paneId, -1\);/);
  assert.match(appSource, /if \(fontSizeInButton\) fontSizeInButton\.onclick = \(\) => changePaneFontSize\(paneId, 1\);/);
  assert.doesNotMatch(appSource, /data-notepad-font-size-(?:in|out|reset)\]'\)\?\.addEventListener/);
  assert.doesNotMatch(appSource, /data-notepad-(?:find|replace)-(?:prev|next|one|all)\]'\)\?\.addEventListener/);
  assert.doesNotMatch(appSource, /data-notepad-popover-close\]'\)\?\.addEventListener/);
  assert.match(appSource, /paneElement\._notepadResizeObserver\?\.disconnect\(\);/);
});

test('notepad find and replace popovers stay inside the editor area at any canvas zoom', () => {
  assert.match(appSource, /function clampNotepadPopover\(popover, left, top\)/);
  assert.match(appSource, /popover\.closest\('\.notepad-pane'\)\?\.querySelector\('\.notepad-editor-shell'\)/);
  assert.match(appSource, /const scale = parentRect\.width \/ parent\.offsetWidth \|\| 1;/);
  assert.match(appSource, /start\.left \+ \(moveEvent\.clientX - startX\) \/ start\.scale/);
  assert.match(appSource, /start\.top \+ \(moveEvent\.clientY - startY\) \/ start\.scale/);
  assert.match(appSource, /if \(candidateOpen && candidate\.querySelector\('\[data-notepad-popover-drag\]'\)\) \{\s*\n\s*placeNotepadPopover\(candidate\);/);
});

test('opening a file that is already open focuses its existing notepad tab', () => {
  assert.match(appSource, /function findOpenNotepadTab\(tab, path\)/);
  assert.match(appSource, /const opened = findOpenNotepadTab\(tab, path\);/);
  assert.match(appSource, /await activateNotepadTabClient\(opened\.pane\.id, opened\.notepadTab\.id\);/);
  assert.match(appSource, /function samePath\(left, right\)/);
});

test('notepad word wrap, indent guides, and auto save defaults come from settings', () => {
  assert.match(appSource, /<section class="settings-section" id="settings-notepad">/);
  assert.match(appSource, /name="ui\.notepad_word_wrap" type="checkbox"/);
  assert.match(appSource, /name="ui\.notepad_indent_guides" type="checkbox"/);
  assert.match(appSource, /name="ui\.notepad_autosave" type="checkbox"/);
  assert.match(appSource, /notepad_word_wrap: form\.get\('ui\.notepad_word_wrap'\) === 'on'/);
  assert.match(appSource, /notepad_indent_guides: form\.get\('ui\.notepad_indent_guides'\) === 'on'/);
  assert.match(appSource, /notepad_autosave: form\.get\('ui\.notepad_autosave'\) === 'on'/);
  assert.match(mainSource, /function notepadDefaults\(config\)/);
  assert.match(mainSource, /store\.createNotepadPane\(req\.params\.paneId, targetPath, notepadDefaults\(config\)\)/);
  assert.match(mainSource, /store\.createNotepadTab\(req\.params\.paneId, targetPath, notepadDefaults\(config\)\)/);
});

test('remote browser sizes its window so screencast frames fill the pane without distortion', () => {
  assert.match(browserSource, /async ensureWindowFits\(\)/);
  assert.match(browserSource, /async calibrateWindowInsets\(\)/);
  assert.match(browserSource, /Browser\.getWindowForTarget/);
  assert.match(browserSource, /Browser\.setWindowBounds/);
  assert.match(browserSource, /width: this\.viewport\.width \+ insets\.width/);
  assert.match(browserSource, /height: this\.viewport\.height \+ insets\.height/);
  assert.match(browserSource, /async applyViewport\(\) \{[\s\S]*?await this\.ensureWindowFits\(\)/);
});

test('Notepad titles show file names and pathless saves use a server-side location picker', () => {
  assert.match(appSource, /function notepadTabLabel\(tab\)/);
  assert.match(appSource, /split\(\/\[\\\\\/\]\//);
  assert.match(appSource, /function openNotepadSaveDialog\(paneId, tabId\)/);
  assert.match(appSource, /class="app-modal notepad-save-dialog"/);
  assert.match(appSource, /api\('\/api\/files\/drives'\)/);
  assert.match(appSource, /api\(`\/api\/files\?path=\$\{encodeURIComponent\(location\)\}`\)/);
  assert.match(appSource, /const selectedPath = await openNotepadSaveDialog\(paneId, tabId\)/);
  assert.match(styles, /\.notepad-save-directory-list\s*\{[^}]*overflow:\s*auto/s);
});

test('WebRTC browser video fills the pane while preserving remote input coordinates', () => {
  assert.match(styles, /\.browser-video\s*\{[^}]*object-fit:\s*fill/s);
  assert.match(appSource, /if \(streamMode === 'webrtc'\)[\s\S]*?rect\.width[\s\S]*?contentWidth[\s\S]*?rect\.height[\s\S]*?contentHeight/);
});

test('Notepad persists autosave drafts and editor toggles through the server state', () => {
  assert.match(appSource, /async function persistNotepadTabState\(paneId, tabId/);
  assert.match(appSource, /if \(!tab\.path && silent\)/);
  assert.match(appSource, /content:\s*data\.content/);
  assert.match(mainSource, /req\.body\.content !== undefined/);
  assert.match(mainSource, /\['wrap', 'indentGuides', 'autosave'\]/);
  assert.match(mainSource, /req\.body\[key\] !== undefined/);
});

test('all pane chrome shares a compact 28px toolbar language', () => {
  assert.match(styles, /:root\s*\{[^}]*--pane-toolbar-height:\s*28px/s);
  assert.match(styles, /\.pane-title\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)[^}]*min-height:\s*var\(--pane-toolbar-height\)/s);
  assert.match(styles, /\.file-location-row,\s*\.file-command-bar\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)/s);
  assert.match(styles, /\.file-column-heading > button\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)/s);
  assert.match(styles, /\.notepad-toolbar\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)/s);
  assert.match(styles, /\.mobile-keybar\s*\{[^}]*display:\s*flex[^}]*height:\s*var\(--pane-toolbar-height\)/s);
  assert.match(styles, /\.browser-toolbar\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)[^}]*padding:\s*0/s);
  assert.match(styles, /\.browser-toolbar \.file-location-row\s*\{[^}]*height:\s*100%/s);
});

test('PowerShell shortcut bar sits directly below the pane title', () => {
  assert.match(appSource, /: `\s*\$\{renderMobileKeybar\(\)\}\s*\$\{renderTerminalSurfaces\(pane\)\}/s);
  assert.match(styles, /\.pane\[data-pane-type="terminal"\]\s*\{[^}]*grid-template-rows:\s*auto auto minmax\(0, 1fr\)/s);
});

test('compact pane toolbars paginate buttons instead of scrolling horizontally', () => {
  assert.match(appSource, /function wirePagedToolbars\(root\)/);
  assert.match(appSource, /new ResizeObserver\(\(\) => updatePagedToolbar\(toolbar\)\)/);
  assert.match(appSource, /data-toolbar-page="previous"/);
  assert.match(appSource, /data-toolbar-page="next"/);
  assert.match(appSource, /availableWidth = toolbar\.clientWidth - previous\.offsetWidth - next\.offsetWidth/);
  assert.match(appSource, /class="mobile-keybar"[^>]*data-paged-toolbar/);
  assert.match(appSource, /class="file-command-bar"[^>]*data-paged-toolbar/);
  assert.match(appSource, /class="notepad-toolbar"[^>]*data-paged-toolbar/);
  assert.match(styles, /\.paged-toolbar-button\s*\{[^}]*flex:\s*0 0 auto/s);
  assert.match(styles, /\.file-command-bar\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(styles, /\.mobile-keybar\s*\{[^}]*overflow:\s*hidden/s);
  assert.doesNotMatch(appSource, /keybar\.scrollLeft \+= delta/);
});

test('desktop PowerShell buttons keep five-character width and paginate during pane resize', () => {
  assert.match(styles, /\.mobile-keybar \[data-toolbar-item\]\s*\{[^}]*width:\s*52px[^}]*min-width:\s*52px[^}]*max-width:\s*52px/s);
  assert.match(styles, /\.mobile-keybar \.paged-toolbar-button\s*\{[^}]*width:\s*28px[^}]*max-width:\s*28px/s);
  assert.match(appSource, /function applyPaneLayoutStyle\(paneElement, layout\)[\s\S]*?syncPaneTitleWidth\(paneElement\);[\s\S]*?paneElement\.querySelectorAll\('\[data-paged-toolbar\]'\)\.forEach\(updatePagedToolbar\)/);
});

test('toolbar paging survives activation from another pane', () => {
  assert.match(appSource, /function activatePagedToolbarPane\(toolbar, event\)/);
  assert.match(appSource, /event\.stopPropagation\(\);[\s\S]*?setActivePane\(pane\.dataset\.pane, false\)/);
  assert.match(appSource, /previous\.onclick = \(event\) => \{\s*activatePagedToolbarPane\(toolbar, event\)/s);
  assert.match(appSource, /next\.onclick = \(event\) => \{\s*activatePagedToolbarPane\(toolbar, event\)/s);
});

test('browser zoom uses ten-percent steps and briefly reveals controls for shortcuts', () => {
  assert.match(appSource, /delta:\s*-0\.1/);
  assert.match(appSource, /delta:\s*0\.1/);
  assert.match(appSource, /showBrowserZoomPopover\(paneId\)/);
  assert.match(appSource, /window\.setTimeout\(\(\) =>[\s\S]*?, 1000\)/);
  assert.match(browserSource, /Math\.round\(Number\(value\) \* 10\) \/ 10/);
});

test('checkbox-free file rows expose selection and keyboard behavior', () => {
  assert.match(appSource, /role="listbox" aria-label="Files" aria-multiselectable="true"/);
  assert.match(appSource, /role="option" aria-selected="\$\{selectedPaths\.includes\(entry\.path\)\}"/);
  assert.match(appSource, /row\.setAttribute\('aria-selected', String\(selectedRow\)\)/);
  assert.match(appSource, /row\.onkeydown = \(event\) =>/);
  assert.match(appSource, /event\.key === ' '/);
  assert.match(appSource, /event\.key === 'Enter'/);
});

test('mobile tabs and settings remain usable above the sidebar', () => {
  assert.match(styles, /\.tab\.tab-add\s*\{[^}]*min-width:\s*42px[^}]*flex:\s*0 0 42px/s);
  assert.match(styles, /\.settings-overlay\s*\{[^}]*z-index:\s*80/s);
  assert.match(appSource, /data-settings-close aria-label="Close settings"/);
  for (const label of ['Appearance', 'Terminal', 'Workspace', 'Persistence', 'Shell', 'Files', 'Server', 'Security']) {
    assert.match(appSource, new RegExp(`aria-label="${label}"[^>]+href="#settings-`));
  }
});

test('settings navigation maps to real sections and follows the visible section', () => {
  for (const section of ['appearance', 'terminal', 'workspace', 'persistence', 'shell', 'files', 'server', 'security']) {
    assert.match(appSource, new RegExp(`<section class="settings-section[^"]*" id="settings-${section}"`));
  }
  assert.match(appSource, /function setActiveSettingsSection\(sectionId\)/);
  assert.match(appSource, /settingsBody\.addEventListener\('scroll', syncSettingsNav/);
  assert.match(appSource, /new ResizeObserver\(\(\) => \{\s*syncSettingsScrollPadding\(\);\s*syncSettingsNav\(\);\s*\}\)/);
  assert.match(appSource, /settingsResizeObserver\.disconnect\(\)/);
  assert.match(appSource, /link\.onclick = \(event\) =>/);
  assert.match(appSource, /requestAnimationFrame\(\(\) => setActiveSettingsSection\(section\.id\)\)/);
});

test('settings use the same compact density as the workspace', () => {
  assert.match(styles, /\.settings-panel\s*\{[^}]*width:\s*min\(980px,[^}]*height:\s*min\(720px/s);
  assert.match(styles, /\.settings-shell\s*\{[^}]*grid-template-columns:\s*184px minmax\(0, 1fr\)/s);
  assert.match(styles, /\.settings-nav a\s*\{[^}]*min-height:\s*34px/s);
  assert.match(styles, /\.settings-body\s*\{[^}]*padding:\s*16px 18px 24px/s);
  assert.match(styles, /\.settings-grid input,[\s\S]*?\.settings-grid textarea\s*\{[^}]*min-height:\s*34px/s);
  assert.match(styles, /\.settings-footer\s*\{[^}]*min-height:\s*52px/s);
});

test('settings apply stays open while save closes the dialog', () => {
  assert.match(appSource, /data-settings-apply title="Save and keep this dialog open">Apply<\/button>/);
  assert.match(appSource, /data-settings-save title="Save and close">Save<\/button>/);
  assert.match(appSource, /const keepSettingsOpen = event\.submitter\?\.hasAttribute\('data-settings-apply'\) === true/);
  assert.match(appSource, /if \(!keepSettingsOpen\) \{\s*state\.customThemeDraft = null;\s*closeSettings\(false\);\s*\}/);
});

test('path dropdown combines current, history, and bookmarked paths', () => {
  assert.doesNotMatch(appSource, /data-file-bookmark(?:[=>\s])/);
  assert.doesNotMatch(appSource, /data-file-bookmarks|function renderBookmarks/);
  assert.match(appSource, /filePathHistory:\s*loadFilePathHistory\(\)/);
  assert.match(appSource, /function rememberFilePath\(path\)/);
  assert.match(appSource, /class="file-path-menu"[^>]+role="listbox"/);
  assert.match(appSource, /state\.filePathHistory\s*\.filter\(\(path\) => path\.toLowerCase\(\) !== currentPath\)\s*\.slice\(0, 5\)/);
  assert.match(appSource, /class="file-path-heading"[^>]*>Current<\/div>[\s\S]*class="file-path-divider"[^>]+role="separator"[\s\S]*class="file-path-heading"[^>]*>History<\/div>[\s\S]*class="file-path-divider"[^>]+role="separator"[\s\S]*class="file-path-heading"[^>]*>Bookmark<\/div>/);
  assert.match(appSource, /data-path-kind="\$\{kind\}"/);
  assert.match(appSource, /data-file-path-choice=/);
  assert.match(appSource, /data-path-bookmark=/);
  assert.match(appSource, /aria-label="\$\{bookmarked \? 'Remove' : 'Add'\} bookmark/);
  assert.match(appSource, /function togglePathBookmark\(path, paneId\)/);
  assert.match(styles, /\.file-path-menu\s*\{[^}]*position:\s*absolute[^}]*z-index:\s*20/s);
  assert.match(styles, /\.file-path-toggle\s*\{[^}]*display:\s*grid[^}]*place-items:\s*center/s);
  assert.match(appSource, /data-file-path-toggle[^>]*>\$\{fileActionIcon\('chevron-down'\)\}<\/button>/);
  assert.match(styles, /\.file-path-toggle \.file-action-icon\s*\{[^}]*display:\s*block/s);
  assert.match(styles, /\.file-path-divider\s*\{[^}]*border-top:\s*1px solid var\(--line\)/s);
});

test('file rows use solid icons, dim hidden entries, and toggle select all', () => {
  assert.match(styles, /\.compact-file-row \.file-name \.file-action-icon\s*\{[^}]*fill:\s*currentColor/s);
  assert.match(appSource, /entry\.hidden \? 'hidden-entry' : ''/);
  assert.match(styles, /\.compact-file-row\.hidden-entry\s*\{[^}]*opacity:\s*\.48/s);
  assert.match(appSource, /function allVisibleFilesSelected\(paneId\)/);
  assert.match(appSource, /allSelected \? 'Deselect all' : 'Select all'/);
  assert.match(appSource, /state\.selectedFiles\[paneId\] = allVisibleFilesSelected\(paneId\) \? \[\] : visibleFilePaths\(paneId\)/);
  assert.match(appSource, /fileActionIcon\(allSelected \? 'deselect-all' : 'select-all'\)/);
});

test('appearance stores separate light and dark choices with separate custom palettes', () => {
  for (const theme of ['WPS7 Dark', 'WPS7 Light', 'Apple Dark', 'Apple Light', 'Claude Dark', 'Claude Light', 'Codex Dark', 'Codex Light', 'Custom']) {
    assert.match(appSource, new RegExp(theme));
  }
  for (const field of ['mode', 'selected_light', 'selected_dark', 'ink', 'panel', 'rail', 'surface', 'line', 'text', 'muted', 'accent', 'warn', 'danger', 'terminal_bg', 'terminal_fg', 'light_ink', 'light_panel', 'light_rail', 'light_surface', 'light_line', 'light_text', 'light_muted', 'light_accent', 'light_warn', 'light_danger', 'light_terminal_bg', 'light_terminal_fg']) {
    assert.match(appSource, new RegExp(`custom_theme\\.${field}`));
  }
  assert.match(appSource, /data-theme-mode="light"/);
  assert.match(appSource, /data-theme-mode="dark"/);
  assert.match(appSource, /function selectedThemeForMode\(mode\)/);
  assert.match(appSource, /selected_\$\{mode\}/);
  assert.match(appSource, /custom_theme:\s*customThemeFromForm\(form\)/);
  assert.match(mainSource, /custom_theme:\s*config\.custom_theme/);
  assert.match(mainSource, /if \(updates\.custom_theme\)/);
  assert.match(styles, /\.theme-preset-grid\s*\{/);
  assert.match(styles, /\.custom-theme-grid\s*\{/);
  assert.match(appSource, /applyTheme\(selectedThemeForMode\(state\.config\.custom_theme\?\.mode \|\| 'dark'\)\)/);
  assert.match(appSource, /JSON\.stringify\(\{ custom_theme: \{ mode: themeMode\(\) \} \}\)/);
});

test('custom light and dark palettes can be reset to their defaults', () => {
  assert.match(appSource, /data-custom-theme-reset="light"/);
  assert.match(appSource, /data-custom-theme-reset="dark"/);
  assert.match(appSource, /function resetCustomThemePalette\(mode, overlay\)/);
  assert.match(appSource, /customThemePaletteKeys/);
  assert.match(appSource, /state\.customThemeDraft\[field\] = customThemeDefaults\[field\]/);
  assert.match(appSource, /input\.value = customThemeDefaults\[field\]/);
  assert.match(appSource, /state\.theme === `custom-\$\{mode\}`[\s\S]*?setThemeLive\(state\.theme\)/);
  assert.match(styles, /\.custom-theme-heading\s*\{[^}]*display:\s*flex/s);
});

test('light terminal palettes use a dark warning color for ANSI yellow text', () => {
  assert.match(appSource, /yellow:\s*palette\.warn/);
  assert.match(appSource, /brightYellow:\s*palette\.warn/);
  assert.match(appSource, /'wps-light':[\s\S]*?warn:\s*'#8a4f00'/);
});

test('terminal chrome follows the active preset background', () => {
  assert.match(appSource, /'terminal-bg':\s*palette\.terminalBg/);
  assert.match(appSource, /'terminal-fg':\s*palette\.terminalFg/);
  assert.match(styles, /\.terminal \.xterm,[\s\S]*?background:\s*var\(--terminal-bg\) !important/);
});

test('files pane clears stale entries and shows a friendly empty error state', () => {
  const loadSource = appSource.slice(appSource.indexOf('async function loadFilesPane'), appSource.indexOf('async function setFilesPanePath'));
  assert.match(loadSource, /paneData\.entries = \[\];\s*paneData\.drives = \[\];\s*updateFilesPane\(pane\.id\);/);
  assert.match(loadSource, /catch \(error\) \{[\s\S]*?paneData\.entries = \[\];[\s\S]*?paneData\.error = friendlyFileError\(error\.message\)/);
  assert.match(appSource, /function friendlyFileError\(message\)/);
  assert.match(appSource, /ENOENT\|no such file/);
  assert.match(appSource, /class="file-empty-state" role="note"/);
  assert.match(appSource, /paneData\.error \|\| \(paneData\.filter \? 'No files match your search\.' : 'This folder is empty\.'\)/);
  assert.match(styles, /\.file-empty-state\s*\{[^}]*flex-direction:\s*column/s);
});

test('upload controls are keyboard reachable buttons', () => {
  assert.match(appSource, /data-file-upload-trigger role="button" tabindex="\$\{pane\.path \? '0' : '-1'\}" aria-disabled="\$\{pane\.path \? 'false' : 'true'\}"/);
  assert.match(appSource, /data-file-upload-trigger\]'\)\.forEach\(\(trigger\) => \{[\s\S]*?event\.key !== 'Enter' && event\.key !== ' '[\s\S]*?querySelector\('input\[type="file"\]'\)\?\.click\(\)/);
});

test('file create, rename and delete use an app modal with live validation instead of native dialogs', () => {
  assert.match(appSource, /function openAppModal\(\{ title/);
  assert.match(appSource, /function validateFileName\(name\)/);
  assert.match(appSource, /function confirmDialog\(title, message/);
  assert.doesNotMatch(appSource, /window\.prompt\('Folder name'\)|window\.prompt\('File name'\)|window\.prompt\('New name'\)/);
  assert.doesNotMatch(appSource, /window\.confirm\('Delete this item permanently\?'\)/);
  assert.match(appSource, /class="app-modal" role="dialog" aria-modal="true"/);
  assert.match(styles, /\.app-modal-overlay\s*\{[^}]*position:\s*fixed[^}]*place-items:\s*center/s);
  assert.match(styles, /\.app-modal-danger\s*\{[^}]*border:\s*1px solid var\(--danger\)/s);
});

test('bulk download zips server-side and bulk delete uses a single reporting endpoint', () => {
  assert.match(mainSource, /app\.post\('\/api\/files\/download-archive'/);
  assert.match(mainSource, /app\.post\('\/api\/files\/delete-bulk'/);
  assert.match(appSource, /async function downloadFiles\(paths, paneId\)[\s\S]*?paths\.length === 1[\s\S]*?'\/api\/files\/download-archive'/);
  assert.match(appSource, /'\/api\/files\/delete-bulk'[\s\S]*?results[\s\S]*?filter\(\(item\) => !item\.ok\)/);
});

test('narrow desktop mode surfaces a recovery banner that switches to mobile', () => {
  assert.match(appSource, /data-desktop-mode-banner role="status" hidden/);
  assert.match(appSource, /data-switch-mobile>Switch to Mobile/);
  assert.match(appSource, /function updateDesktopModeBanner\(\)/);
  assert.match(appSource, /function setDisplayMode\(mode, persist = true\)/);
  assert.match(appSource, /state\.displayMode === 'desktop' && narrowViewport\(\) && !state\.dismissedDesktopBanner/);
  assert.match(styles, /\.desktop-mode-banner\s*\{[^}]*background:\s*var\(--accent-soft\)/s);
});

test('files pane exposes a context menu with cut, paste and keyboard shortcuts wired to the move API', () => {
  assert.match(appSource, /function openFileContextMenu\(paneId, anchorPath/);
  assert.match(appSource, /function cutFiles\(paths, paneId\)/);
  assert.match(appSource, /async function pasteFiles\(paneId\)/);
  assert.match(appSource, /'\/api\/files\/move'[\s\S]*?destination/);
  assert.match(appSource, /row\.oncontextmenu = \(event\) =>[\s\S]*?openFileContextMenu\(paneId, row\.dataset\.fileRow/);
  assert.match(appSource, /event\.key === 'F2'[\s\S]*?renameFile\(selected\[0\], paneId\)/);
  assert.match(appSource, /event\.key === 'Delete'[\s\S]*?deleteFiles\(selected, paneId\)/);
  assert.match(appSource, /key === 'x'[\s\S]*?cutFiles\(selected, paneId\)/);
  assert.match(appSource, /key === 'v'[\s\S]*?pasteFiles\(paneId\)/);
  assert.match(styles, /\.file-context-menu\s*\{[^}]*position:\s*fixed/s);
});

test('terminal pane exposes copy, paste, select all and clear without copy-on-select', () => {
  assert.match(appSource, /function openTerminalContextMenu\(terminalTabId, clientX, clientY\)/);
  assert.match(appSource, /element\.addEventListener\('contextmenu'[\s\S]*?openTerminalContextMenu\(terminalTabId, event\.clientX, event\.clientY\)/);
  // Copy reads the xterm buffer, so wrapped lines and row padding never reach the clipboard.
  assert.match(appSource, /function copyTerminalSelection\(terminalTabId\)[\s\S]*?term\?\.getSelection\(\)/);
  assert.match(appSource, /function pasteTerminalText\(terminalTabId\)[\s\S]*?navigator\.clipboard\.readText\(\)/);
  assert.match(appSource, /function selectAllTerminal\(terminalTabId\)[\s\S]*?term\.selectAll\(\)/);
  assert.match(appSource, /function clearTerminal\(terminalTabId\)[\s\S]*?term\.clear\(\)/);
  assert.match(styles, /\.terminal-context-menu\s*\{[^}]*position:\s*fixed/s);
  assert.doesNotMatch(appSource, /copyOnSelect|onSelectionChange/);
});

test('terminal shortcuts use Ctrl+Shift so Ctrl+C still interrupts the shell', () => {
  assert.match(appSource, /term\.attachCustomKeyEventHandler\(\(event\) => terminalShortcut\(terminalTabId, event\)\)/);
  assert.match(appSource, /function terminalShortcut\(terminalTabId, event\)/);
  assert.match(appSource, /if \(!event\.ctrlKey \|\| !event\.shiftKey \|\| event\.altKey \|\| event\.metaKey\)/);
  for (const [key, handler] of [['c', 'copyTerminalSelection'], ['v', 'pasteTerminalText'], ['a', 'selectAllTerminal'], ['l', 'clearTerminal']]) {
    assert.match(appSource, new RegExp(`case '${key}':[\\s\\S]{0,80}?${handler}\\(terminalTabId\\)`));
  }
  // Ctrl/Shift+Insert stays usable in plain browser tabs that keep Ctrl+Shift+C.
  assert.match(appSource, /key === 'insert' && event\.ctrlKey !== event\.shiftKey/);
});

test('clearing a terminal also tells the server to drop its replay buffer', () => {
  assert.match(appSource, /ws\.send\(JSON\.stringify\(\{ type: 'clear' \}\)\)/);
});

test('files pane can filter entries by name', () => {
  assert.match(appSource, /data-file-filter-toggle/);
  assert.match(appSource, /data-file-filter\b/);
  assert.match(appSource, /\.filter\(\(entry\) => !filterText \|\| entry\.name\.toLowerCase\(\)\.includes\(filterText\)\)/);
  assert.match(styles, /\.file-filter-input\s*\{/);
});

test('mobile file controls grow to touch size and narrow panes collapse to one column', () => {
  assert.match(styles, /\.app\.mode-mobile \.files-pane \.file-command-button,[\s\S]*?height:\s*40px/s);
  assert.match(styles, /@container \(max-width: 360px\)[\s\S]*?\.compact-file-row \.file-modified\s*\{[^}]*grid-row:\s*2/s);
});

test('reviewed compactness improvements use friendly font labels and stable controls', () => {
  assert.match(appSource, /\{ label: 'Consolas', value: 'Consolas,/);
  assert.match(appSource, /\$\{escapeHtml\(font\.label\)\}/);
  assert.match(appSource, /class="tab tab-add"[^>]*>\$\{fileActionIcon\('add'\)\}<\/button>/);
  assert.match(styles, /\.file-command-bar\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow:\s*hidden/s);
});
