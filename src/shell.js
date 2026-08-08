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

// Installed as a Windows service, wps7 runs as LocalSystem and inherits only
// the machine PATH, so user-scoped tool folders -- npm's global folder, where
// claude and codex live -- are missing and the shell answers "not recognized"
// for commands that work in a normal terminal. shell.extra_path adds them back.
// Appending rather than prepending keeps a machine-wide tool the one that wins.
function shellEnv(config, env = process.env) {
  const key = Object.keys(env).find((name) => name.toLowerCase() === 'path') || 'PATH';
  const current = env[key] || '';
  const existing = new Set(current.split(path.delimiter).filter(Boolean).map((entry) => entry.toLowerCase()));
  const additions = (config.shell?.extra_path || [])
    .map((entry) => String(entry).trim())
    .filter((entry) => entry && !existing.has(entry.toLowerCase()));
  if (!additions.length) {
    return { ...env };
  }
  return {
    ...env,
    [key]: [current, ...additions].filter(Boolean).join(path.delimiter)
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
  resolveShell,
  shellEnv
};
