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

test('browser terminal scrollback follows the configured workspace limit', () => {
  assert.match(appSource, /scrollback:\s*Number\(state\.config\.persistence\?\.scrollback_lines\)/);
});

test('workspace header keeps layout and shortcut controls in the sidebar only', () => {
  assert.doesNotMatch(appSource, /toolbar-button help-button/);
  assert.doesNotMatch(appSource, /toolbar-button" data-action="layout"/);
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

test('sidebar keeps only a divider above session panes and uses session names for every pane', () => {
  assert.doesNotMatch(appSource, /class="sidebar-header"/);
  assert.doesNotMatch(appSource, />Sessions<|>Persistent workspaces</);
  assert.match(appSource, /class="sidebar-divider" aria-hidden="true"/);
  assert.match(appSource, /const prefix = paneSession\.name/);
  assert.doesNotMatch(appSource, /pane\.type === 'files' \? 'Files' : paneSession\.name/);
});

test('sidebar actions use shared icons for new PowerShell and new file', () => {
  assert.match(appSource, /data-action="new-powershell"[^>]+aria-label="New PowerShell"[^>]*>\s*<span class="rail-icon" aria-hidden="true">\$\{fileActionIcon\('terminal'\)\}<\/span><span class="rail-label">New PowerShell<\/span>/);
  assert.match(appSource, /data-action="files"[^>]+aria-label="New file"[^>]*>\s*<span class="rail-icon" aria-hidden="true">\$\{fileActionIcon\('file'\)\}<\/span><span class="rail-label">New file<\/span>/);
  assert.match(appSource, /\[data-action="new-powershell"\][^\n]+createPane/);
});

test('pane titles reuse the same pane-type icons as the sidebar', () => {
  assert.match(appSource, /class="pane-kind-icon"[^>]*>\$\{fileActionIcon\(\(\{ files: 'file', notepad: 'notepad' \}\)\[pane\.type\] \|\| 'terminal'\)\}<\/span>/);
  assert.match(styles, /\.pane-kind-icon \.file-action-icon\s*\{[^}]*width:\s*14px[^}]*height:\s*14px/s);
  assert.match(styles, /\.pane-title::before\s*\{[^}]*content:\s*none/s);
});

test('long pane titles keep the close button visible immediately while resizing', () => {
  assert.match(appSource, /\$\{header\}\s*<button class="pane-close" data-close-pane="\$\{pane\.id\}"/);
  assert.match(styles, /\.pane-title\s*\{[^}]*padding:\s*0 38px 0 10px/s);
  assert.match(styles, /\.pane-title\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*contain:\s*inline-size[^}]*transition:\s*none/s);
  assert.match(styles, /\.pane-title \[data-rename-pane\]\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.pane-close\s*\{[^}]*position:\s*absolute[^}]*top:\s*3px[^}]*right:\s*6px[^}]*z-index:\s*6/s);
  assert.match(appSource, /function syncPaneTitleWidth\(paneElement\)/);
  assert.match(appSource, /paneElement\.clientWidth[\s\S]*?label\.style\.maxWidth/);
  assert.match(appSource, /function applyPaneLayoutStyle[\s\S]*?syncPaneTitleWidth\(paneElement\)/);
});

test('each pane supports independent Ctrl zoom controls', () => {
  assert.match(appSource, /function paneFontSize\(pane\)/);
  assert.match(appSource, /function changePaneFontSize\(paneId, delta\)/);
  assert.match(appSource, /event\.ctrlKey[^\n]*event\.deltaY/);
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
  assert.match(source, /normalizePaneLayout\(pane\.layout, maxColumns, maxRows\)/);
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
  assert.match(appSource, /pane\.type === 'browser'[\s\S]*?class="browser-tab-strip"[\s\S]*?data-pane-title="\$\{pane\.id\}"/);
  assert.doesNotMatch(appSource, /function renderBrowserPane\(pane\)[\s\S]*?<div class="browser-tab-strip"/);
  assert.match(styles, /\.pane\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\)/s);
  assert.match(styles, /\.browser-tab-strip\s*\{[^}]*height:\s*var\(--pane-toolbar-height\)[^}]*padding-right:\s*38px/s);
});

test('workspace exposes multi-tab notepad panes with line numbers and text-file save support', () => {
  assert.match(appSource, /data-action="notepad"[^>]+aria-label="New notepad"/);
  assert.match(appSource, /function renderNotepadPane\(pane\)/);
  assert.match(appSource, /function renderNotepadTabs\(pane\)/);
  assert.match(appSource, /class="notepad-tab-strip" data-notepad-tab-strip/);
  assert.match(appSource, /function editNotepadTabPath\(paneId, tabId\)/);
  assert.match(appSource, /editNotepadTabPath\(paneId, tabElement\.dataset\.notepadTab\)/);
  assert.match(appSource, /event\.target\.closest\('\.pane-close, button, input, \[data-browser-tab\], \[data-notepad-tab\]'\)/);
  assert.match(appSource, /class="notepad-gutter"/);
  assert.match(appSource, /class="notepad-editor"/);
  assert.match(appSource, /event\.ctrlKey && event\.key\.toLowerCase\(\) === 's'/);
  assert.match(appSource, /openNotepadForFile/);
  assert.match(appSource, /function addNotepadTab\(paneId, filePath = ''\)/);
  assert.match(appSource, /function closeNotepadTabClient\(paneId, tabId\)/);
  assert.match(mainSource, /app\.post\('\/api\/panes\/:paneId\/notepad\/tabs'/);
  assert.match(mainSource, /app\.get\('\/api\/files\/text'/);
  assert.match(mainSource, /app\.put\('\/api\/files\/text'/);
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

test('layout panel removes pane creation and keeps active panes readable in light mode', () => {
  assert.doesNotMatch(appSource, /data-layout-add|＋ PS/);
  assert.match(styles, /\[data-theme="light"\] \.mini-grid\s*\{[^}]*background:\s*var\(--surface-soft\)/s);
  assert.match(styles, /\[data-theme="light"\] \.mini-pane\.active\s*\{[^}]*color:\s*var\(--accent\)/s);
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

test('usage panel includes Codex and MiniMax with server-side refresh', () => {
  assert.match(mainSource, /app\.get\('\/api\/usage', requireAuth\(config\)/);
  assert.match(appSource, /data-action="usage"[^>]+aria-label="Usage"/);
  assert.match(appSource, /async function openUsage\(\)/);
  assert.match(appSource, /api\('\/api\/usage\?refresh=1'\)/);
  assert.match(appSource, /Codex/);
  assert.match(appSource, /MiniMax/);
  assert.match(appSource, /name="usage\.minimax_api_key"/);
  assert.match(appSource, /name="usage\.minimax_region"/);
  assert.match(styles, /\.usage-panel\s*\{/);
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
  assert.match(appSource, /control\?\.setAttribute\('aria-pressed', 'false'\)/);
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
  assert.match(appSource, /term\.onTitleChange\(\(title\) => updatePaneTitleFromTerminal\(paneId, title\)\)/);
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

test('panes expose invisible resize targets on every edge and corner over a dashed workspace grid', () => {
  for (const direction of ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']) {
    assert.match(appSource, new RegExp(`data-pane-resize-direction="${direction}"`));
  }
  assert.match(appSource, /findAdjacentResizePane/);
  assert.match(appSource, /savePaneLayoutPair/);
  assert.match(styles, /\.pane-grid::before\s*\{[^}]*--pane-columns[^}]*repeating-linear-gradient/s);
  assert.match(styles, /\.pane-grid::after\s*\{[^}]*--pane-rows[^}]*repeating-linear-gradient/s);
  assert.doesNotMatch(styles, /\.pane-resize::after\s*\{[^}]*border-/s);
});

test('partially shared pane edges select and resize the pane under the pointer', () => {
  assert.match(appSource, /function findAdjacentResizePane\([^)]*pointerColumn, pointerRow\)/);
  assert.match(appSource, /candidate\.layout\.y < layout\.y \+ layout\.rows/);
  assert.match(appSource, /candidate\.layout\.y \+ candidate\.layout\.rows > layout\.y/);
  assert.match(appSource, /candidate\.layout\.x < layout\.x \+ layout\.cols/);
  assert.match(appSource, /candidate\.layout\.x \+ candidate\.layout\.cols > layout\.x/);
  assert.match(appSource, /pointerRow >= candidate\.layout\.y/);
  assert.match(appSource, /pointerColumn >= candidate\.layout\.x/);
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
  assert.match(appSource, /: `\s*\$\{renderMobileKeybar\(\)\}\s*<div class="terminal" id="terminal-\$\{pane\.id\}"><\/div>/s);
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
  assert.match(appSource, /new ResizeObserver\(syncSettingsNav\)/);
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
  assert.match(appSource, /data-settings-apply>Apply<\/button>/);
  assert.match(appSource, /data-settings-save>Save<\/button>/);
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

test('reviewed compactness improvements use friendly font labels and stable controls', () => {
  assert.match(appSource, /\{ label: 'Consolas', value: 'Consolas,/);
  assert.match(appSource, /\$\{escapeHtml\(font\.label\)\}/);
  assert.match(appSource, /class="tab tab-add"[^>]*>\$\{fileActionIcon\('add'\)\}<\/button>/);
  assert.match(styles, /\.file-command-bar\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow:\s*hidden/s);
});
