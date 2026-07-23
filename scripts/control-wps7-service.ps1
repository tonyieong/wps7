param(
  [ValidateSet('Start', 'Stop', 'Restart', 'Repair')]
  [string]$Action,
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath)),
  [string]$ServiceName = 'wps7-server'
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path
$logPath = Join-Path $Root 'data\service-control.log'
New-Item -ItemType Directory -Path (Split-Path -Parent $logPath) -Force | Out-Null

function Write-Wps7ServiceLog {
  param([string]$Message)
  "$(Get-Date -Format o) $Message" | Add-Content -LiteralPath $logPath
}

Write-Wps7ServiceLog "$Action requested for $ServiceName"

switch ($Action) {
  'Start' {
    Start-Service -Name $ServiceName
  }
  'Stop' {
    Stop-Service -Name $ServiceName -Force
  }
  'Restart' {
    Restart-Service -Name $ServiceName -Force
  }
  'Repair' {
    $application = Join-Path $Root 'wps7.exe'
    if (!(Test-Path -LiteralPath $application)) {
      $application = Join-Path $Root 'dist\wps7.exe'
    }
    if (!(Test-Path -LiteralPath $application)) {
      throw "wps7.exe was not found below $Root."
    }

    $nssmCandidates = @(
      (Join-Path $Root 'tools\nssm\nssm.exe'),
      (Join-Path (Split-Path -Parent $Root) 'tools\nssm\nssm.exe')
    )
    $nssm = $nssmCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (!$nssm) {
      throw "nssm.exe was not found below $Root or its parent."
    }

    & sc.exe config $ServiceName "binPath= `"$nssm`"" | Out-Null
    & $nssm set $ServiceName Application $application | Out-Null
    & $nssm set $ServiceName AppDirectory $Root | Out-Null
    & $nssm set $ServiceName AppStdout (Join-Path $Root 'data\service-stdout.log') | Out-Null
    & $nssm set $ServiceName AppStderr (Join-Path $Root 'data\service-stderr.log') | Out-Null
  }
}

Write-Wps7ServiceLog "$Action completed for $ServiceName"
