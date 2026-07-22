param(
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name

$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($identity)
if (!$principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
  $scriptPath = $PSCommandPath
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`" -Root `"$Root`""
  Write-Host 'Restarting installer as Administrator...'
  Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -Verb RunAs -Wait
  exit $LASTEXITCODE
}

function Resolve-Wps7Launch {
  $exe = Join-Path $Root 'wps7.exe'
  if (Test-Path -LiteralPath $exe) {
    return @{ File = $exe; Args = @() }
  }
  $distExe = Join-Path $Root 'dist\wps7.exe'
  if (Test-Path -LiteralPath $distExe) {
    return @{ File = $distExe; Args = @() }
  }
  $node = (Get-Command node.exe -ErrorAction Stop).Source
  return @{ File = $node; Args = @(Join-Path $Root 'src\main.js') }
}

function Resolve-Nssm {
  $candidates = @(
    (Join-Path $Root 'tools\nssm\nssm.exe'),
    (Join-Path $Root 'tools\nssm\win64\nssm.exe'),
    (Join-Path $Root 'scripts\nssm.exe'),
    (Join-Path $Root 'dist\tools\nssm\nssm.exe')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }
  $command = Get-Command nssm.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }
  throw "nssm.exe was not found. Put nssm.exe at $Root\tools\nssm\nssm.exe or install NSSM on PATH, then rerun this installer."
}

function Read-Wps7ServerPort {
  $configPath = Join-Path $Root 'config.toml'
  if (!(Test-Path -LiteralPath $configPath)) {
    return 5000
  }
  $currentSection = ''
  foreach ($line in Get-Content -LiteralPath $configPath) {
    $trimmed = $line.Trim()
    if ($trimmed -match '^\[(.+)\]$') {
      $currentSection = $Matches[1]
      continue
    }
    if ($currentSection -eq 'server' -and $trimmed -match '^port\s*=\s*(\d+)$') {
      $port = [int]$Matches[1]
      if ($port -ge 1 -and $port -le 65535) {
        return $port
      }
    }
  }
  return 5000
}

function Read-Wps7ConfigValue {
  param(
    [string]$Section,
    [string]$Key,
    [string]$Default
  )
  $configPath = Join-Path $Root 'config.toml'
  if (!(Test-Path -LiteralPath $configPath)) {
    return $Default
  }
  $currentSection = ''
  foreach ($line in Get-Content -LiteralPath $configPath) {
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

$launch = Resolve-Wps7Launch
$nssm = Resolve-Nssm
$serviceName = 'wps7-server'
$serverHost = Read-Wps7ConfigValue -Section 'server' -Key 'host' -Default '127.0.0.1'
$passwordHash = Read-Wps7ConfigValue -Section 'auth' -Key 'password_hash' -Default ''
if ($serverHost -eq '0.0.0.0' -and !$passwordHash) {
  throw 'Refusing to install LAN-accessible wps7 without an auth.password_hash. Set a strong password or use host = "127.0.0.1".'
}

$passwordSecure = Read-Host "Enter Windows password for $user so wps7 can start before login" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordSecure)
try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  Unregister-ScheduledTask -TaskName 'wps7-server' -Confirm:$false -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName 'wps7-tray' -Confirm:$false -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName 'wps7-service-start' -Confirm:$false -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName 'wps7-service-restart' -Confirm:$false -ErrorAction SilentlyContinue
  Unregister-ScheduledTask -TaskName 'wps7-service-stop' -Confirm:$false -ErrorAction SilentlyContinue

  $existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
  if ($existingService) {
    & $nssm stop $serviceName | Out-Null
    & $nssm remove $serviceName confirm | Out-Null
  }

  & $nssm install $serviceName $launch.File @($launch.Args) | Out-Null
  & $nssm set $serviceName AppDirectory $Root | Out-Null
  & $nssm set $serviceName AppEnvironmentExtra WPS7_HEADLESS=1 WPS7_SERVICE_MANAGED=1 | Out-Null
  & $nssm set $serviceName AppStdout (Join-Path $Root 'data\service-stdout.log') | Out-Null
  & $nssm set $serviceName AppStderr (Join-Path $Root 'data\service-stderr.log') | Out-Null
  & $nssm set $serviceName AppRotateFiles 1 | Out-Null
  & $nssm set $serviceName AppRotateBytes 1048576 | Out-Null
  & $nssm set $serviceName AppExit Default Restart | Out-Null
  & $nssm set $serviceName AppRestartDelay 2000 | Out-Null
  & $nssm set $serviceName Start SERVICE_AUTO_START | Out-Null
  & $nssm set $serviceName ObjectName $user $password | Out-Null
  & $nssm start $serviceName | Out-Null

  $controlScript = Join-Path $Root 'scripts\control-wps7-service.ps1'
  $controlSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
  foreach ($actionName in @('Start', 'Restart', 'Stop')) {
    $taskName = "wps7-service-$($actionName.ToLowerInvariant())"
    $taskAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$controlScript`" -Root `"$Root`" -Action $actionName"
    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Settings $controlSettings -User $user -Password $password -RunLevel Highest | Out-Null
  }
} finally {
  if ($bstr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

$trayScript = Join-Path $Root 'scripts\wps7-tray-companion.ps1'
$shell = New-Object -ComObject WScript.Shell
$startupFolder = $shell.SpecialFolders.Item('Startup')
$shortcutPath = Join-Path $startupFolder 'wps7 tray.lnk'
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'powershell.exe'
$shortcut.Arguments = "-NoProfile -STA -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$trayScript`" -Root `"$Root`""
$shortcut.WorkingDirectory = $Root
$shortcut.WindowStyle = 7
$shortcut.Description = 'wps7 tray icon'
$shortcut.Save()

Get-NetFirewallRule -Group 'wps7' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
$serverPort = Read-Wps7ServerPort
New-NetFirewallRule -DisplayName "wps7 TCP $serverPort" -Group 'wps7' -Direction Inbound -Action Allow -Protocol TCP -LocalPort $serverPort -Profile Any | Out-Null

Write-Host "Installed NSSM service: $serviceName"
Write-Host "Installed service control tasks: wps7-service-start, wps7-service-restart, wps7-service-stop"
Write-Host "Installed tray startup shortcut: $shortcutPath"
Write-Host "Allowed inbound TCP $serverPort in Windows Firewall."
Write-Host "Server service starts at boot before login; tray icon starts after login."
