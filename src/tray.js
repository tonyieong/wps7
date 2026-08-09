const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const SysTrayModule = require('systray2');

const SysTray = SysTrayModule.default || SysTrayModule;

function startTray({ root, url, save, openBrowser, restart, shutdown, log = () => {} }) {
  if (process.platform === 'win32') {
    return startWindowsNotifyIconTray({ root, url, save, openBrowser, restart, shutdown, log });
  }
  return startPortableTray({ root, url, save, openBrowser, restart, shutdown, log });
}

function startWindowsNotifyIconTray({ root, url, save, openBrowser, restart, shutdown, log }) {
  const trayDir = path.join(root, 'data', 'tray');
  fs.mkdirSync(trayDir, { recursive: true });
  const scriptPath = path.join(trayDir, 'wps7-notifyicon.ps1');
  fs.writeFileSync(scriptPath, windowsNotifyIconScript(), 'utf8');

  const child = spawn('powershell.exe', [
    '-NoProfile',
    '-STA',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    '-IconPath',
    realIconPath(root),
    '-Root',
    root,
    '-Url',
    url,
    '-ServerPid',
    String(process.pid)
  ], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk.toString('utf8');
    const lines = stdout.split(/\r?\n/);
    stdout = lines.pop() || '';
    for (const line of lines) {
      if (line === 'open') {
        openBrowser(url);
      } else if (line === 'save') {
        save();
      } else if (line === 'restart') {
        restart();
      } else if (line === 'exit') {
        shutdown();
      }
    }
  });
  child.stderr.on('data', (chunk) => {
    const message = chunk.toString('utf8').trim();
    if (message) {
      log(`stderr: ${message}`);
    }
  });
  // Without a handler a failed spawn raises an unhandled 'error' event, which
  // the fatal handler turns into an exit of the whole server.
  child.on('error', (error) => {
    log(`failed to start: ${error.message}`);
  });
  // Every exit is worth recording, including a clean one: the tray is meant to
  // outlive everything except shutdown, so code 0 here still means the icon
  // vanished while the server kept running.
  child.on('exit', (code, signal) => {
    log(`exited code=${code} signal=${signal || 'none'}`);
  });
  log(`started pid=${child.pid || 'unknown'}`);

  return {
    kill(exitNode = true) {
      if (!child.killed) {
        child.kill();
      }
      if (exitNode) {
        process.exit(0);
      }
    }
  };
}

function windowsNotifyIconScript() {
  return `
param(
  [Parameter(Mandatory=$true)][string]$IconPath,
  [Parameter(Mandatory=$true)][string]$Root,
  [Parameter(Mandatory=$true)][string]$Url,
  [Parameter(Mandatory=$true)][int]$ServerPid
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$icon = New-Object System.Drawing.Icon($IconPath)
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = $icon
$notifyIcon.Text = 'wps7 terminal workspace'
$notifyIcon.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$statusItem = $menu.Items.Add('Status: running')
$statusItem.Enabled = $false
$menu.Items.Add('-') | Out-Null
$openItem = $menu.Items.Add('Open Web UI')
$saveItem = $menu.Items.Add('Save Now')
$restartItem = $menu.Items.Add('Restart wps7')
$menu.Items.Add('-') | Out-Null
$logsItem = $menu.Items.Add('View Logs')
$diagnosticsItem = $menu.Items.Add('Diagnostics')
$menu.Items.Add('-') | Out-Null
$exitItem = $menu.Items.Add('Exit')

$openItem.add_Click({ [Console]::Out.WriteLine('open'); [Console]::Out.Flush() })
$saveItem.add_Click({ [Console]::Out.WriteLine('save'); [Console]::Out.Flush() })
$restartItem.add_Click({ [Console]::Out.WriteLine('restart'); [Console]::Out.Flush() })
$logsItem.add_Click({ Start-Process explorer.exe -ArgumentList (Join-Path $Root 'data') })
$diagnosticsItem.add_Click({
  $newline = [Environment]::NewLine
  $message = 'Status: running' + $newline + "URL: $Url" + $newline + "Server PID: $ServerPid" + $newline + "Data: $(Join-Path $Root 'data')"
  [System.Windows.Forms.MessageBox]::Show($message, 'WPS7 Diagnostics', 'OK', 'Information') | Out-Null
})
$exitItem.add_Click({ [Console]::Out.WriteLine('exit'); [Console]::Out.Flush() })
$notifyIcon.add_DoubleClick({ [Console]::Out.WriteLine('open'); [Console]::Out.Flush() })
$notifyIcon.ContextMenuStrip = $menu

try {
  [System.Windows.Forms.Application]::Run()
} finally {
  $notifyIcon.Visible = $false
  $notifyIcon.Dispose()
  $icon.Dispose()
}
`.trim();
}

function startPortableTray({ root, url, save, openBrowser, restart, shutdown, log }) {
  const icon = realIconPath(root);
  const openItem = {
    title: 'Open Web UI',
    tooltip: 'Open wps7 in your browser',
    checked: false,
    enabled: true,
    click: () => openBrowser(url)
  };
  const saveItem = {
    title: 'Save Now',
    tooltip: 'Save sessions now',
    checked: false,
    enabled: true,
    click: save
  };
  const exitItem = {
    title: 'Exit',
    tooltip: 'Save and exit wps7',
    checked: false,
    enabled: true,
    click: shutdown
  };
  const restartItem = {
    title: 'Restart wps7',
    tooltip: 'Restart wps7',
    checked: false,
    enabled: true,
    click: restart
  };

  const tray = new SysTray({
    menu: {
      icon,
      title: 'wps7',
      tooltip: 'wps7 terminal workspace',
      items: [openItem, saveItem, restartItem, SysTray.separator, exitItem]
    },
    debug: Boolean(process.env.WPS7_TRAY_DEBUG),
    copyDir: path.join(root, 'data', 'tray')
  });

  tray.onClick((action) => {
    if (action.item.click) {
      action.item.click();
    }
  });

  tray.ready().then(() => {
    tray.onError((error) => {
      log(`error: ${error.message || error}`);
    });
    tray.onExit((code) => {
      log(`exited code=${code}`);
    });
  }).catch((error) => {
    log(`failed to start: ${error.message}`);
  });

  return tray;
}

function realIconPath(root) {
  const source = path.join(__dirname, '..', 'assets', 'wps7.ico');
  if (!process.pkg) {
    return source;
  }

  const targetDir = path.join(root, 'data');
  const target = path.join(targetDir, 'wps7.ico');
  fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(target)) {
    fs.copyFileSync(source, target);
  }
  return target;
}

module.exports = {
  startTray
};
