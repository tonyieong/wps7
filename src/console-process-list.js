// Reports every process attached to a ConPTY console, so a pane can tell an
// idle prompt from a command that is still running.
//
// GetConsoleProcessList only answers for the console the caller is attached to,
// and a process can hold one console at a time, so this has to run as its own
// short-lived child process instead of inside the server.

function reply(pids) {
  if (!process.send) {
    process.exit(0);
    return;
  }
  // Exit from the callback so the answer is flushed down the IPC channel first.
  process.send({ pids }, () => process.exit(0));
}

function consoleProcessList(shellPid) {
  if (!Number.isInteger(shellPid) || shellPid <= 0) {
    return [];
  }
  try {
    // No helper here (non-Windows, or a build without it) means nothing to report.
    const { getConsoleProcessList } = require('@homebridge/node-pty-prebuilt-multiarch/build/Release/conpty_console_list.node');
    return Array.from(getConsoleProcessList(shellPid) || []);
  } catch {
    return [];
  }
}

reply(consoleProcessList(Number.parseInt(process.argv[2], 10)));
