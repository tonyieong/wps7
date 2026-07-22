param(
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path
$toolsDir = Join-Path $Root 'tools\nssm'
$target = Join-Path $toolsDir 'nssm.exe'

if (Test-Path -LiteralPath $target) {
  Write-Host "nssm.exe already exists: $target"
  exit 0
}

$tempDir = Join-Path ([IO.Path]::GetTempPath()) "wps7-nssm-$([Guid]::NewGuid().ToString('N'))"
$zipPath = Join-Path $tempDir 'nssm.zip'
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null

try {
  Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile $zipPath
  Expand-Archive -LiteralPath $zipPath -DestinationPath $tempDir -Force
  $source = Join-Path $tempDir 'nssm-2.24\win64\nssm.exe'
  if (!(Test-Path -LiteralPath $source)) {
    throw 'Downloaded NSSM archive did not contain win64\nssm.exe.'
  }
  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "Installed nssm.exe: $target"
} finally {
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
