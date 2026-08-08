# wps7

English | [繁體中文](README.zh-TW.md)

Portable Windows web terminal workspace inspired by `tmux-continuum`. It serves
PowerShell sessions, a file manager, a notepad, a browser pane, and a whiteboard
to any browser on your machine, and rebuilds the layout after a reboot.

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

## Run

```powershell
npm install
npm start
```

The app creates `config.toml`, `data/state.json`, and opens `http://127.0.0.1:5000`.

When running the packaged app, `config.toml`, `data/`, and logs live beside the packaged executable.

## Start at boot

To run the web server before Windows login and show the tray icon after login:

```powershell
npm run nssm:install
npm run startup:install
```

The installer uses NSSM to install the server as a Windows service and creates a per-user Startup shortcut for the tray icon.

- `wps7-server`: NSSM-managed Windows service; starts the server at boot in headless mode.
- `Startup\wps7 tray.lnk`: starts the tray icon after you log in.
- `wps7-service-start` / `wps7-service-restart` / `wps7-service-stop`: elevated on-demand tasks used by the tray menu.

`npm run nssm:install` downloads the NSSM release build from `nssm.cc` and stores `nssm.exe` at `tools\nssm\nssm.exe`. You can also put `nssm.exe` there yourself or install NSSM on `PATH`. Windows has no taskbar before login, so the icon cannot appear until a user session exists. The installer asks for your Windows password once because the service and elevated control tasks run under your account.

The tray icon is the user-facing control plane. It stays open independently from the server and exposes Open, Start, Save, Restart, Stop, View Logs, and Diagnostics. The tooltip and menu status update every few seconds from the service and local runtime health.

If you set `server.host = "0.0.0.0"` for LAN access, configure a strong web password first. The installer refuses to expose wps7 on the LAN without `auth.password_hash` because the app provides browser access to PowerShell.

To remove the service, tray shortcut, control tasks, and firewall rule:

```powershell
npm run startup:uninstall
```

## Package

```powershell
npm run package:win
```

The packaged executable is written to `dist/wps7.exe`. Double click `dist/start-wps7.vbs` to launch it without showing a console window.

## Restore model

Windows cannot resume arbitrary process memory after reboot. wps7 saves sessions, panes, cwd metadata, terminal scrollback, and the last command hint. On restart it recreates panes and automatically reruns only commands in `restore.allowlist`.

## PowerShell

wps7 prefers `pwsh.exe` and falls back to `powershell.exe`. If fallback is used, the web UI shows a PowerShell 7 install warning.

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
`npm run licenses:generate`.

## Acknowledgements

- [Excalidraw](https://github.com/excalidraw/excalidraw) powers the whiteboard pane.
- [xterm.js](https://github.com/xtermjs/xterm.js) powers the terminal panes.
- [CodexBar](https://github.com/steipete/CodexBar) inspired the usage pane.
- [NSSM](https://nssm.cc/) runs wps7 as a Windows service.
