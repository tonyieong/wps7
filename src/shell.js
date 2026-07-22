const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function commandExists(command) {
  const result = spawnSync('where.exe', [command], { windowsHide: true, encoding: 'utf8' });
  return result.status === 0;
}

function resolveCommand(command) {
  if (path.isAbsolute(command) && fs.existsSync(command)) {
    return command;
  }
  if (commandExists(command)) {
    return command;
  }

  const knownPaths = [
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'PowerShell', '7', 'pwsh.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'PowerShell', '7', 'pwsh.exe')
  ];
  return knownPaths.find((candidate) => path.basename(candidate).toLowerCase() === command.toLowerCase() && fs.existsSync(candidate)) || '';
}

function resolveShell(config) {
  const preferred = resolveCommand(config.shell.preferred);
  if (preferred) {
    return {
      command: preferred,
      args: config.shell.args || [],
      usingFallback: false
    };
  }

  const fallback = resolveCommand(config.shell.fallback) || config.shell.fallback;
  return {
    command: fallback,
    args: config.shell.args || [],
    usingFallback: true,
    message: 'PowerShell 7 was not found. Install it from https://learn.microsoft.com/powershell/scripting/install/installing-powershell-on-windows'
  };
}

function normalizeCwd(cwd, root) {
  if (cwd && fs.existsSync(cwd)) {
    return cwd;
  }
  return root || path.dirname(process.execPath);
}

module.exports = {
  normalizeCwd,
  resolveShell
};
