param(
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::SetUnhandledExceptionMode([System.Windows.Forms.UnhandledExceptionMode]::CatchException)

$logPath = Join-Path $Root 'data\tray-companion.log'
New-Item -ItemType Directory -Path (Split-Path -Parent $logPath) -Force | Out-Null

function Write-Wps7TrayLog {
  param([string]$Message)
  "$(Get-Date -Format o) $Message" | Add-Content -LiteralPath $logPath
}

function Read-Wps7ConfigValue {
  param(
    [string]$Path,
    [string]$Section,
    [string]$Key,
    [string]$Default
  )
  if (!(Test-Path -LiteralPath $Path)) {
    return $Default
  }
  $currentSection = ''
  foreach ($line in Get-Content -LiteralPath $Path) {
    $trimmed = $line.Trim()
    if ($trimmed -match '^\[(.+)\]$') {
      $currentSection = $Matches[1]
      continue
    }
    if ($currentSection -eq $Section -and $trimmed -match "^$Key\s*=\s*(.+)$") {
      return $Matches[1].Trim().Trim('"')
    }
  }
  return $Default
}

function Read-Wps7RuntimeUrl {
  $runtimePath = Join-Path $Root 'data\runtime.json'
  if (!(Test-Path -LiteralPath $runtimePath)) {
    return ''
  }
  try {
    $runtime = Get-Content -LiteralPath $runtimePath -Raw | ConvertFrom-Json
    $hostValue = [string]$runtime.host
    $portValue = [string]$runtime.port
    if (!$hostValue -or !$portValue) {
      return ''
    }
    if ($hostValue -eq '0.0.0.0') {
      $hostValue = '127.0.0.1'
    }
    return "http://${hostValue}:${portValue}"
  } catch {
    Write-Wps7TrayLog "failed to read runtime url: $($_.Exception.Message)"
    return ''
  }
}

function Read-Wps7ConfigUrl {
  $configPath = Join-Path $Root 'config.toml'
  $hostValue = Read-Wps7ConfigValue -Path $configPath -Section 'server' -Key 'host' -Default '127.0.0.1'
  $portValue = Read-Wps7ConfigValue -Path $configPath -Section 'server' -Key 'port' -Default '5000'
  if ($hostValue -eq '0.0.0.0') {
    $hostValue = '127.0.0.1'
  }
  return "http://${hostValue}:${portValue}"
}

function Resolve-Wps7ServerUrl {
  $runtimeUrl = Read-Wps7RuntimeUrl
  if ($runtimeUrl) {
    return $runtimeUrl
  }
  return Read-Wps7ConfigUrl
}

function Get-Wps7Token {
  $tokenPath = Join-Path $Root 'data\control-token'
  if (!(Test-Path -LiteralPath $tokenPath)) {
    return ''
  }
  return (Get-Content -LiteralPath $tokenPath -Raw).Trim()
}

function Test-Wps7TcpPort {
  param([string]$Url)
  try {
    $uri = [Uri]$Url
    $client = New-Object System.Net.Sockets.TcpClient
    try {
      $connect = $client.BeginConnect($uri.Host, $uri.Port, $null, $null)
      if (!$connect.AsyncWaitHandle.WaitOne(800, $false)) {
        return $false
      }
      $client.EndConnect($connect)
      return $true
    } finally {
      $client.Close()
    }
  } catch {
    return $false
  }
}

function Get-Wps7RuntimeStatus {
  $serverUrl = Resolve-Wps7ServerUrl
  $service = Get-Service -Name 'wps7-server' -ErrorAction SilentlyContinue
  $serviceStatus = if ($service) { [string]$service.Status } else { 'NotInstalled' }
  $token = Get-Wps7Token
  $tcpOk = Test-Wps7TcpPort -Url $serverUrl
  $httpOk = $false
  $runtime = $null
  $errorMessage = ''

  if ($token) {
    try {
      $runtime = Invoke-RestMethod -Method Get -Uri "$serverUrl/api/runtime/status" -Headers @{ 'X-WPS7-Control-Token' = $token } -TimeoutSec 2
      $httpOk = [bool]$runtime.ok
    } catch {
      $errorMessage = $_.Exception.Message
      try {
        Invoke-RestMethod -Method Get -Uri "$serverUrl/api/config" -TimeoutSec 2 | Out-Null
        $httpOk = $true
        $errorMessage = 'runtime status endpoint unavailable; basic HTTP health succeeded'
      } catch {
        $errorMessage = $_.Exception.Message
      }
    }
  } else {
    $errorMessage = 'control token missing'
  }

  $state = 'stopped'
  if ($httpOk) {
    $state = 'running'
  } elseif ($serviceStatus -eq 'Running') {
    $state = 'unhealthy'
  } elseif ($serviceStatus -eq 'StartPending') {
    $state = 'starting'
  } elseif ($serviceStatus -eq 'StopPending') {
    $state = 'stopping'
  } elseif ($serviceStatus -eq 'NotInstalled') {
    $state = 'not installed'
  }

  return [pscustomobject]@{
    State = $state
    Url = $serverUrl
    ServiceStatus = $serviceStatus
    TcpOk = $tcpOk
    HttpOk = $httpOk
    Runtime = $runtime
    Error = $errorMessage
  }
}

function Format-Wps7Tooltip {
  param($Status)
  $text = "wps7: $($Status.State) $($Status.Url)"
  if ($text.Length -gt 63) {
    return $text.Substring(0, 63)
  }
  return $text
}

function Open-Wps7Logs {
  $dataDir = Join-Path $Root 'data'
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
  Start-Process explorer.exe $dataDir
}

function Show-Wps7Diagnostics {
  $status = Get-Wps7RuntimeStatus
  $firewallOk = $false
  try {
    $uri = [Uri]$status.Url
    $firewallOk = [bool](Get-NetFirewallPortFilter -ErrorAction SilentlyContinue |
      Where-Object { $_.LocalPort -eq ([string]$uri.Port) } |
      ForEach-Object { $_ | Get-NetFirewallRule } |
      Where-Object { $_.Enabled -eq 'True' -and $_.Direction -eq 'Inbound' -and $_.Action -eq 'Allow' } |
      Select-Object -First 1)
  } catch {
    $firewallOk = $false
  }
  $lines = @(
    "State: $($status.State)",
    "Service: $($status.ServiceStatus)",
    "URL: $($status.Url)",
    "TCP: $($status.TcpOk)",
    "HTTP: $($status.HttpOk)",
    "Firewall allow rule: $firewallOk"
  )
  if ($status.Runtime) {
    $lines += "PID: $($status.Runtime.pid)"
    $lines += "Uptime: $($status.Runtime.uptimeSeconds)s"
    $lines += "Sessions: $($status.Runtime.sessions)"
    $lines += "Panes: $($status.Runtime.panes)"
  }
  if ($status.Error) {
    $lines += "Last error: $($status.Error)"
  }
  [System.Windows.Forms.MessageBox]::Show(($lines -join [Environment]::NewLine), 'wps7 diagnostics') | Out-Null
}

function New-Wps7GeneratedIcon {
  $bitmap = New-Object System.Drawing.Bitmap 32, 32
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $background = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 0, 210, 230))
  $foreground = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 5, 20, 25))
  $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 5, 20, 25), 3)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $graphics.FillRectangle($background, 2, 2, 28, 28)
  $graphics.DrawLine($pen, 8, 10, 15, 16)
  $graphics.DrawLine($pen, 15, 16, 8, 22)
  $graphics.FillRectangle($foreground, 17, 22, 9, 3)

  $handle = $bitmap.GetHicon()
  return @{
    Icon = [System.Drawing.Icon]::FromHandle($handle)
    Handle = $handle
    Bitmap = $bitmap
    Graphics = $graphics
    Pen = $pen
    Background = $background
    Foreground = $foreground
  }
}

function Resolve-Wps7IconPath {
  $candidates = @(
    (Join-Path $Root 'data\wps7.ico'),
    (Join-Path $Root 'assets\wps7.ico')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }
  return ''
}

function New-Wps7Icon {
  $iconPath = Resolve-Wps7IconPath
  if ($iconPath) {
    try {
      Write-Wps7TrayLog "loading icon from $iconPath"
      return @{
        Icon = New-Object System.Drawing.Icon($iconPath)
        Generated = $false
      }
    } catch {
      Write-Wps7TrayLog "failed to load icon from ${iconPath}: $($_.Exception.Message)"
    }
  }

  Write-Wps7TrayLog 'using generated fallback icon'
  $generated = New-Wps7GeneratedIcon
  $generated.Generated = $true
  return $generated
}

function Invoke-Wps7Runtime {
  param([string]$Action)
  $token = Get-Wps7Token
  if (!$token) {
    Write-Wps7TrayLog "$Action failed: control token missing"
    [System.Windows.Forms.MessageBox]::Show('wps7 control token was not found. Start the server first.', 'wps7') | Out-Null
    return
  }
  $serverUrl = Resolve-Wps7ServerUrl
  $started = Get-Date
  try {
    Invoke-RestMethod -Method Post -Uri "$serverUrl/api/runtime/$Action" -Headers @{ 'X-WPS7-Control-Token' = $token } -TimeoutSec 5 | Out-Null
    $duration = [int]((Get-Date) - $started).TotalMilliseconds
    Write-Wps7TrayLog "$Action requested via $serverUrl in ${duration}ms"
    if ($Action -eq 'restart') {
      $notifyIcon.ShowBalloonTip(1500, 'wps7', 'Restart requested.', [System.Windows.Forms.ToolTipIcon]::Info)
    }
  } catch {
    Write-Wps7TrayLog "$Action failed: $($_.Exception.Message)"
    [System.Windows.Forms.MessageBox]::Show("wps7 $Action failed: $($_.Exception.Message)", 'wps7') | Out-Null
  }
}

function Invoke-Wps7ServiceControl {
  param([ValidateSet('Start', 'Restart', 'Stop')][string]$Action)
  $taskName = "wps7-service-$($Action.ToLowerInvariant())"
  $started = Get-Date
  try {
    Start-ScheduledTask -TaskName $taskName
    $duration = [int]((Get-Date) - $started).TotalMilliseconds
    Write-Wps7TrayLog "$Action requested through scheduled task $taskName in ${duration}ms"
    $notifyIcon.ShowBalloonTip(1500, 'wps7', "$Action requested.", [System.Windows.Forms.ToolTipIcon]::Info)
    return
  } catch {
    Write-Wps7TrayLog "$Action scheduled task failed: $($_.Exception.Message)"
  }

  $controlScript = Join-Path $Root 'scripts\control-wps7-service.ps1'
  try {
    Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList @(
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-WindowStyle',
      'Hidden',
      '-File',
      "`"$controlScript`"",
      '-Root',
      "`"$Root`"",
      '-Action',
      $Action
    ) | Out-Null
    Write-Wps7TrayLog "$Action requested through elevated service control"
  } catch {
    Write-Wps7TrayLog "$Action service control failed: $($_.Exception.Message)"
    [System.Windows.Forms.MessageBox]::Show("wps7 $Action failed: $($_.Exception.Message)", 'wps7') | Out-Null
  }
}

$sessionId = [System.Diagnostics.Process]::GetCurrentProcess().SessionId
Write-Wps7TrayLog "starting tray companion as $([System.Security.Principal.WindowsIdentity]::GetCurrent().Name), session $sessionId, root $Root"
if ($sessionId -eq 0) {
  $message = 'wps7 tray icon cannot display from Windows session 0. Start this script from the logged-in desktop session.'
  Write-Wps7TrayLog $message
  [Console]::Error.WriteLine($message)
  exit 2
}

$iconState = New-Wps7Icon
$icon = $iconState.Icon
$form = New-Object System.Windows.Forms.Form
$form.Text = 'wps7 tray host'
$form.ShowInTaskbar = $false
$form.WindowState = [System.Windows.Forms.FormWindowState]::Minimized
$form.Size = New-Object System.Drawing.Size(0, 0)
$form.Opacity = 0
$form.add_Shown({ $form.Hide() })

$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = $icon
$notifyIcon.Text = 'wps7 terminal workspace'
$notifyIcon.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$statusItem = $menu.Items.Add('Status: checking...')
$statusItem.Enabled = $false
$menu.Items.Add('-') | Out-Null
$openItem = $menu.Items.Add('Open Web UI')
$startItem = $menu.Items.Add('Start wps7')
$saveItem = $menu.Items.Add('Save Now')
$restartItem = $menu.Items.Add('Restart wps7')
$stopItem = $menu.Items.Add('Stop wps7')
$menu.Items.Add('-') | Out-Null
$logsItem = $menu.Items.Add('View Logs')
$diagnosticsItem = $menu.Items.Add('Diagnostics')
$menu.Items.Add('-') | Out-Null
$exitItem = $menu.Items.Add('Exit Icon')

$openItem.add_Click({ Start-Process (Resolve-Wps7ServerUrl) })
$startItem.add_Click({ Invoke-Wps7ServiceControl -Action 'Start' })
$saveItem.add_Click({ Invoke-Wps7Runtime -Action 'save' })
$restartItem.add_Click({ Invoke-Wps7ServiceControl -Action 'Restart' })
$stopItem.add_Click({ Invoke-Wps7ServiceControl -Action 'Stop' })
$logsItem.add_Click({ Open-Wps7Logs })
$diagnosticsItem.add_Click({ Show-Wps7Diagnostics })
$exitItem.add_Click({ $form.Close() })
$notifyIcon.add_DoubleClick({ Start-Process (Resolve-Wps7ServerUrl) })
$notifyIcon.ContextMenuStrip = $menu
$notifyIcon.ShowBalloonTip(1500, 'wps7', 'wps7 tray icon is running.', [System.Windows.Forms.ToolTipIcon]::Info)

function Update-Wps7TrayStatus {
  try {
    $status = Get-Wps7RuntimeStatus
    $script:LatestStatus = $status
    $statusItem.Text = "Status: $($status.State)"
    $notifyIcon.Text = Format-Wps7Tooltip -Status $status

    $serviceInstalled = $status.ServiceStatus -ne 'NotInstalled'
    $openItem.Enabled = $status.HttpOk
    $saveItem.Enabled = $status.HttpOk
    $startItem.Enabled = $serviceInstalled -and $status.ServiceStatus -ne 'Running'
    $restartItem.Enabled = $serviceInstalled -and $status.ServiceStatus -eq 'Running'
    $stopItem.Enabled = $serviceInstalled -and $status.ServiceStatus -eq 'Running'
  } catch {
    Write-Wps7TrayLog "status update failed: $($_.Exception.Message)"
    $statusItem.Text = 'Status: unknown'
    $notifyIcon.Text = 'wps7: status unknown'
  }
}

$statusTimer = New-Object System.Windows.Forms.Timer
$statusTimer.Interval = 3000
$statusTimer.add_Tick({ Update-Wps7TrayStatus })
$statusTimer.Start()
Update-Wps7TrayStatus

[System.Windows.Forms.Application]::add_ThreadException({
  param($sender, $eventArgs)
  Write-Wps7TrayLog "thread exception: $($eventArgs.Exception.Message)"
})
[AppDomain]::CurrentDomain.add_UnhandledException({
  param($sender, $eventArgs)
  Write-Wps7TrayLog "unhandled exception: $($eventArgs.ExceptionObject)"
})

Write-Wps7TrayLog "notify icon visible for $(Resolve-Wps7ServerUrl)"

try {
  [System.Windows.Forms.Application]::Run($form)
} finally {
  Write-Wps7TrayLog 'tray companion exiting'
  $notifyIcon.Visible = $false
  $notifyIcon.Dispose()
  $statusTimer.Stop()
  $statusTimer.Dispose()
  $form.Dispose()
  $icon.Dispose()
  if ($iconState.Generated) {
    $iconState.Graphics.Dispose()
    $iconState.Bitmap.Dispose()
    $iconState.Pen.Dispose()
    $iconState.Background.Dispose()
    $iconState.Foreground.Dispose()
  }
}
