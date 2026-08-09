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

$runtimeRoot = Resolve-Wps7RuntimeRoot
$executable = Join-Path $runtimeRoot 'wps7.exe'

# The shortcut stores an absolute path, so moving the folder leaves it pointing
# at the old one. It is the only registration wps7 owns, which is why repairing
# a moved install needs no elevation.
$shell = New-Object -ComObject WScript.Shell
$shortcutPath = Join-Path $shell.SpecialFolders.Item('Startup') 'wps7.lnk'
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $executable
$shortcut.WorkingDirectory = $runtimeRoot
$shortcut.Description = 'wps7 terminal workspace'
$shortcut.Save()

Write-Host "Repaired startup shortcut: $shortcutPath -> $executable"
