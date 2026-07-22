param(
  [ValidateSet('Start', 'Stop', 'Restart')]
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
}

Write-Wps7ServiceLog "$Action completed for $ServiceName"
