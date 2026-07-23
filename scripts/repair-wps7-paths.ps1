param(
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path

function Resolve-Wps7RuntimeRoot {
  if (Test-Path -LiteralPath (Join-Path $Root 'wps7.exe')) {
    return $Root
  }
  $distRoot = Join-Path $Root 'dist'
  if (Test-Path -LiteralPath (Join-Path $distRoot 'wps7.exe')) {
    return $distRoot
  }
  throw "wps7.exe was not found below $Root."
}

$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object System.Security.Principal.WindowsPrincipal($identity)
if (!$principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)) {
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Root `"$Root`""
  Write-Host 'Restarting path repair as Administrator...'
  $process = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -Verb RunAs -Wait -PassThru
  exit $process.ExitCode
}

$runtimeRoot = Resolve-Wps7RuntimeRoot
$controlScript = Join-Path $runtimeRoot 'scripts\control-wps7-service.ps1'
$trayScript = Join-Path $runtimeRoot 'scripts\wps7-tray-companion.ps1'
if (!(Test-Path -LiteralPath $controlScript) -or !(Test-Path -LiteralPath $trayScript)) {
  throw "Packaged scripts are missing below $runtimeRoot. Run npm run package:win first."
}

& $controlScript -Action Repair -Root $runtimeRoot

$controlSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
foreach ($actionName in @('Start', 'Restart', 'Stop')) {
  $taskName = "wps7-service-$($actionName.ToLowerInvariant())"
  $taskAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$controlScript`" -Root `"$runtimeRoot`" -Action $actionName"
  if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  }
  Register-ScheduledTask -TaskName $taskName -Action $taskAction -Settings $controlSettings -User $user -RunLevel Highest | Out-Null
}

$shell = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $shell.SpecialFolders.Item('Startup') 'wps7 tray.lnk'
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'powershell.exe'
$shortcut.Arguments = "-NoProfile -STA -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$trayScript`" -Root `"$runtimeRoot`""
$shortcut.WorkingDirectory = $runtimeRoot
$shortcut.WindowStyle = 7
$shortcut.Description = 'wps7 tray icon'
$shortcut.Save()

Write-Host "Repaired wps7 service paths: $runtimeRoot"
Write-Host 'Repaired service control tasks: wps7-service-start, wps7-service-restart, wps7-service-stop'
Write-Host "Repaired tray startup shortcut: $shortcutPath"
Write-Host "If the service account itself must change, rerun install-wps7-startup.ps1."
