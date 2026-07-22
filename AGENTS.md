# Repository Guidelines

## Project Structure & Module Organization

WPS7 is a Windows-focused Node.js terminal workspace. Server modules live in `src/`; `main.js` wires Express and WebSocket routes. Browser code lives in `public/`, tests in `test/`, service utilities in `scripts/`, and bundled resources in `assets/` and `tools/`.

Treat `data/`, `dist/`, `tmp-file-pane-test/`, and `qa-backup-*` as generated output unless packaging or migration is in scope.

## Build, Test, and Development Commands

- `npm install` installs runtime and packaging dependencies.
- `npm start` runs `src/main.js` and serves the app at `http://127.0.0.1:5000` by default.
- `npm test` runs the complete `node:test` suite.
- `node --test test/terminal.test.js` runs one test file during focused development.
- `npm run package:win` creates `dist/wps7.exe` and copies required Windows assets.
- `npm run nssm:install` and `npm run startup:install` install the Windows service and tray integration.

When packaging or deploying, never stop the WPS7 instance listening on port `5001`. Stop or restart only the installed WPS7 instance on port `5000`.

After every code modification, rebuild a new `dist/wps7.exe` via `npm run package:win`, then run the new exe.

For the port `5000` service-managed instance (NSSM `AppExit Default: Restart`), avoid Administrator `Stop-Service`/`Start-Service` by using the no-admin swap-in-place flow instead:
1. `npx pkg . --targets node18-win-x64 --output dist\wps7-new.exe` — builds to a new filename, so the slow build step never touches the locked, currently-running `dist\wps7.exe`.
2. Read the loopback control token from `dist\data\control-token` and `POST http://127.0.0.1:5000/api/runtime/restart` with header `X-WPS7-Control-Token: <token>` to make the running process save state and exit gracefully.
3. Immediately swap the file in (e.g. .NET `[System.IO.File]::Replace('dist\wps7-new.exe', 'dist\wps7.exe', 'dist\wps7-backup.exe')`) — this fast rename fits inside NSSM's ~2s auto-restart window, so NSSM picks up the new exe on its own.
This only needs write access to `dist/`, no elevation required. Never restart the exe on port `5001` this way.

## Coding Style & Naming Conventions

Use CommonJS, two-space indentation, semicolons, and single quotes. Use `camelCase` for code identifiers, `PascalCase` for constructors, and kebab-case for CSS/data attributes. Prefer native APIs and avoid unrelated formatting.

## Frontend Design Language

Keep pane chrome compact. Use `--pane-toolbar-height` (currently `28px`) for desktop titles and toolbars; mobile touch controls may be taller. Use theme tokens (`--surface-soft`, `--terminal-bg`, `--line`, `--accent`, `--accent-soft`) instead of fixed colors. Active panes use an accent border; hover, selection, and pressed states use the soft accent.

Use Segoe UI for interface text and Cascadia Mono/Consolas for terminal content, paths, titles, and data. Reuse single-stroke SVGs from `fileActionIcon()`; never stack icons. Controls need visible focus, accessible names, and larger mobile hit targets. User-facing copy says **Workspace**; `session` is internal legacy terminology.

## Testing Guidelines

Use `node:test` with `node:assert/strict`; name files `*.test.js` and test observable behavior. Add a failing regression test before a bug fix, then run the focused file and `npm test`. Frontend source-contract tests live in `test/frontend.test.js`.

For any UI/frontend change, always visually verify it with screenshots (e.g. headless Chrome via CDP, or the `run` skill) in addition to automated/DOM assertions — confirm how it actually renders, not just that the underlying logic runs correctly.

## Commit & Pull Request Guidelines

This checkout has no Git history. Use short imperative commits such as `Fix mobile terminal long-press selection`. PRs should explain behavior, verification, configuration or restart needs, and include screenshots for UI changes.

## Security & Configuration Tips

Never commit passwords, hashes, control tokens, logs, or live `config.toml` values. Document defaults in `config.example.toml`. LAN binding (`0.0.0.0`) requires strong-password protection.
