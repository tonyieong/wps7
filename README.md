# wps7

English | [繁體中文](README.zh-TW.md)

Portable Windows web terminal workspace inspired by `tmux-continuum`. It serves
PowerShell sessions, a file manager, a notepad, a browser pane, an image viewer,
and a whiteboard to any browser on your machine, and rebuilds the layout after a
reboot.

> [!WARNING]
> **wps7 gives a web browser access to PowerShell and to your file system.**
> Anyone who can reach the listening port and pass authentication can run
> arbitrary commands as the account running the server.
>
> The default configuration binds to `127.0.0.1` with no password, which is
> intended for single-user desktop use. **Before changing `server.host` to
> `0.0.0.0`, set a strong password** — the installer refuses to expose wps7 on a
> LAN without `auth.password_hash` for this reason.
>
> There is no TLS. On a LAN, the password, the session token, and all terminal
> output travel unencrypted. For anything beyond a trusted network, put wps7
> behind a reverse proxy that terminates TLS. See [SECURITY.md](SECURITY.md).

![A wps7 workspace: a PowerShell pane, the file manager, the notepad, and the usage pane tiled on the board](docs/screenshots/workspace.png)

## A workspace that fits the task

Every pane can be moved and resized independently on a configurable grid. Make
a terminal wide, stack a file manager above your notes, or give the whiteboard
the whole height; wps7 preserves the layout and each pane's working directory.

![Terminal, file manager, notepad, and whiteboard panes arranged at different widths and heights](docs/screenshots/resizable-panes.png)

The desktop board has no fixed right edge. Add or move panes farther right and
the workspace keeps extending horizontally; the bottom scrollbar takes you
between groups without shrinking the panes you already arranged.

![The same workspace scrolled horizontally to panes farther to the right](docs/screenshots/horizontal-workspace.png)

On a phone, the same workspace shows one pane at a time, with a key bar for the
keys a touch keyboard does not have:

<img src="docs/screenshots/mobile.png" alt="The same workspace on a phone: the PowerShell pane full screen above a key bar with Esc, Tab, Ctrl, Alt and Shift" width="280">

## Where to run it

**On your own machine.** Leave the default `127.0.0.1` and use wps7 as a local
workbench: terminals, files, notes, and the whiteboard in a browser tab, with
the layout restored after every reboot. Nothing leaves the machine.

**On an always-on machine, reached over a VPN.** Run wps7 on the box that holds
your projects and your CLI logins — a home server, a spare desktop, a Windows
VM — and join that box to a private network (WireGuard, Tailscale, a company
VPN). Every other device then opens the same workspace in a browser: a laptop,
a tablet, or a phone can drive the Codex and Claude Code sessions running there,
watch a long build finish, and browse the file system, with nothing to install
on the client.

The VPN supplies what wps7 does not. There is no TLS, so the tunnel is what
encrypts the traffic, and the private network is what decides who can reach the
port at all. Set `server.host = "0.0.0.0"` so the VPN interface is covered —
`127.0.0.1` and `0.0.0.0` are the only values wps7 accepts — **set a strong
password**, and keep the port closed on every interface facing the internet.
Reaching the machine by its VPN address works as is; a hostname, such as a
Tailscale MagicDNS name, has to be listed in `server.allowed_hosts` or the
`Host` check rejects it.

## Download

Take `wps7-<version>-windows-x64.zip` from the [releases page](../../releases).
The "Source code" archives GitHub generates beside it hold the source tree only,
without `wps7.exe`.

Extract the zip to a folder, then double click `wps7.exe`. Opening anything
inside the Windows zip viewer unpacks that one file to a temp directory and
leaves the rest in the archive.

wps7 is not code signed, so SmartScreen warns the first time a downloaded build
runs. Compare the SHA256 with `SHA256SUMS.txt`, then clear the download mark
before extracting — right click the zip, open Properties, tick Unblock, press OK.
Otherwise start `wps7.exe` once yourself and choose "More info" then "Run
anyway"; dismissing that prompt is what makes the launcher report `800704C7`.

## Run from source

```powershell
npm install
npm start
```

The app creates `config.toml`, `data/state.json`, and opens `http://127.0.0.1:5000`.

When running the packaged app, `config.toml`, `data/`, and logs live beside the packaged executable.

## Start at logon

To start wps7 whenever you log in:

```powershell
npm run startup:install
```

This creates `Startup\wps7.lnk` pointing at `wps7.exe`. wps7 then runs as you, in your own session, and shows its tray icon there.

Running in your session is what makes the rest work: a GUI program started from a terminal pane appears on your desktop, your mapped drives and environment are the ones panes inherit, and the usage pane finds the Codex and Claude Code logins in your profile. A Windows service cannot do any of that, because services run in session 0 with no interactive desktop and under their own account.

Nothing here needs Administrator. Installing asks for elevation only in two cases: to remove a service installed by an earlier version, and to open a firewall port when `server.host = "0.0.0.0"`.

The tray icon exposes Open Web UI, Save Now, Restart wps7, View Logs, Diagnostics, and Exit. Exit saves state and stops the server.

If the icon disappears while wps7 is still running, it is relaunched a couple of seconds later; a tray that fails to start five times in a row is given up on. `data/runtime.log` records each attempt.

If you set `server.host = "0.0.0.0"` for LAN access, configure a strong web password first. The installer refuses to expose wps7 on the LAN without `auth.password_hash` because the app provides browser access to PowerShell.

To remove the startup shortcut, and any leftovers from an older service install:

```powershell
npm run startup:uninstall
```

## Package

```powershell
npm run package:win
```

The packaged executable is written to `dist/wps7.exe`. pkg builds on a
console-subsystem Node binary, which would give the server a console window for
as long as it runs, so packaging rewrites the PE subsystem to `windows`. Double
clicking `dist/wps7.exe` starts it with no console.

## Restore model

Windows cannot resume arbitrary process memory after reboot. wps7 saves sessions, panes, cwd metadata, terminal scrollback, and the last command hint. On restart it recreates panes and automatically reruns only commands in `restore.allowlist`.

## PowerShell

wps7 prefers `pwsh.exe` and falls back to `powershell.exe`. If fallback is used, the web UI shows a PowerShell 7 install warning.

## Usage pane

The usage pane shows how much of your Codex, Claude Code, and MiniMax quota is
left. It reads those figures on the machine running wps7, from credentials those
tools have already written there:

- `%USERPROFILE%\.codex\auth.json` — the Codex OAuth access token.
- `%USERPROFILE%\.claude\.credentials.json` — the Claude Code OAuth access token.
- `usage.minimax_api_key` in `config.toml`, or `MINIMAX_CODING_API_KEY` /
  `MINIMAX_API_KEY` from the environment.

Each token is sent only to the provider it belongs to, and only to read quota.
None of them is stored in `data/state.json`; `data/runtime.log` records a token's
length, never the token.

When wps7's own profile has no such credentials, the lookup **searches the other
user profiles beside it** and takes the most recent login. On a shared machine
that means wps7 can report another account's quota, if the account running wps7
is allowed to read that profile. Pin one folder with `usage.codex_home` and
`usage.claude_home`, or turn a provider off with `usage.show_codex`,
`show_claude`, or `show_minimax`. All three ship enabled.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup and the
repository conventions. Report security issues privately through the process in
[SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).

wps7 redistributes third-party code: the packaged executable embeds every
production dependency, and `public/vendor/` ships pre-built Excalidraw, React,
and xterm.js along with their fonts. Their notices are collected in
[THIRD-PARTY-LICENSES.md](THIRD-PARTY-LICENSES.md), regenerated with
`npm run licenses:generate`. Pinned upstream license files can be refreshed and
hash-verified first with `npm run licenses:sync`.

## Acknowledgements

- [Excalidraw](https://github.com/excalidraw/excalidraw) powers the whiteboard pane.
- [xterm.js](https://github.com/xtermjs/xterm.js) powers the terminal panes.
- [CodexBar](https://github.com/steipete/CodexBar) inspired the usage pane.
