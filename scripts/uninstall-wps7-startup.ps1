$ErrorActionPreference = 'Stop'
function Resolve-Nssm {
  $root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
  $candidates = @(
    (Join-Path $root 'tools\nssm\nssm.exe'),
    (Join-Path $root 'tools\nssm\win64\nssm.exe'),
    (Join-Path $root 'scripts\nssm.exe'),
    (Join-Path $root 'dist\tools\nssm\nssm.exe')
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
  return ''
}

Unregister-ScheduledTask -TaskName 'wps7-server' -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'wps7-tray' -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'wps7-service-start' -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'wps7-service-restart' -Confirm:$false -ErrorAction SilentlyContinue
Unregister-ScheduledTask -TaskName 'wps7-service-stop' -Confirm:$false -ErrorAction SilentlyContinue
$nssm = Resolve-Nssm
if ($nssm -and (Get-Service -Name 'wps7-server' -ErrorAction SilentlyContinue)) {
  & $nssm stop wps7-server | Out-Null
  & $nssm remove wps7-server confirm | Out-Null
} elseif (Get-Service -Name 'wps7-server' -ErrorAction SilentlyContinue) {
  sc.exe stop wps7-server | Out-Null
  sc.exe delete wps7-server | Out-Null
}
$shell = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $shell.SpecialFolders.Item('Startup') 'wps7 tray.lnk'
Remove-Item -LiteralPath $shortcutPath -Force -ErrorAction SilentlyContinue
Get-NetFirewallRule -Group 'wps7' -ErrorAction SilentlyContinue | Remove-NetFirewallRule
Write-Host 'Removed wps7 service, tray startup shortcut, control tasks, legacy tasks, and firewall rules.'
