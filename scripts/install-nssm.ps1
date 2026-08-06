param(
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSCommandPath))
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path -LiteralPath $Root).Path
$toolsDir = Join-Path $Root 'tools\nssm'
$target = Join-Path $toolsDir 'nssm.exe'

# NSSM 2.24 win64. wps7 gives browser access to PowerShell, so the service
# manager it installs is pinned by hash rather than trusted on download alone.
$archiveUrl = 'https://nssm.cc/release/nssm-2.24.zip'
$archiveHash = '727D1E42275C605E0F04ABA98095C38A8E1E46DEF453CDFFCE42869428AA6743'
$executableHash = 'F689EE9AF94B00E9E3F0BB072B34CAAF207F32DCB4F5782FC9CA351DF9A06C97'

function Assert-Hash {
  param(
    [string]$Path,
    [string]$Expected,
    [string]$Label
  )
  $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
  if ($actual -ne $Expected) {
    throw "$Label SHA256 mismatch. Expected $Expected but got $actual."
  }
}

if (Test-Path -LiteralPath $target) {
  $existing = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
  if ($existing -eq $executableHash) {
    Write-Host "nssm.exe already verified: $target"
    exit 0
  }
  Write-Warning "Existing nssm.exe does not match the pinned hash. Replacing it."
}

$tempDir = Join-Path ([IO.Path]::GetTempPath()) "wps7-nssm-$([Guid]::NewGuid().ToString('N'))"
$zipPath = Join-Path $tempDir 'nssm.zip'
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null

try {
  Invoke-WebRequest -Uri $archiveUrl -OutFile $zipPath
  Assert-Hash -Path $zipPath -Expected $archiveHash -Label 'Downloaded archive'
  Expand-Archive -LiteralPath $zipPath -DestinationPath $tempDir -Force
  $source = Join-Path $tempDir 'nssm-2.24\win64\nssm.exe'
  if (!(Test-Path -LiteralPath $source)) {
    throw 'Downloaded NSSM archive did not contain win64\nssm.exe.'
  }
  Assert-Hash -Path $source -Expected $executableHash -Label 'Extracted nssm.exe'
  Copy-Item -LiteralPath $source -Destination $target -Force
  Write-Host "Installed nssm.exe: $target"
} finally {
  Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
