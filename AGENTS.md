# Repository Guidelines

## Project Structure & Module Organization

WPS7 is a Windows-focused Node.js terminal workspace. Server modules live in `src/`; `main.js` wires Express and WebSocket routes. Browser code lives in `public/`, tests in `test/`, runtime utilities in `scripts/`, and bundled resources in `assets/` and `tools/`.

Treat `data/`, `dist/`, `tmp-file-pane-test/`, and `qa-backup-*` as generated output unless packaging or migration is in scope.

## Build, Test, and Development Commands

- `npm install` installs runtime and packaging dependencies.
- `npm start` runs `src/main.js` and serves the app at `http://127.0.0.1:5000` by default.
- `npm test` runs the complete `node:test` suite.
- `node --test test/terminal.test.js` runs one test file during focused development.
- `npm run lint` runs ESLint. CI fails on errors; warnings are advisory.
- `npm run licenses:generate` rewrites `THIRD-PARTY-LICENSES.md`. Run it whenever you add or upgrade a dependency, because the packaged executable embeds them and CI fails when the file is stale.
- `npm run package:win` creates `dist/wps7.exe` and copies required Windows assets.
- `npm run startup:install` installs the per-user Startup shortcut and tray integration.

When packaging or deploying, never stop the WPS7 instance listening on port `5001`. Stop or restart only the installed WPS7 instance on port `5000`.

After every code modification, rebuild `dist/wps7.exe` via `npm run package:win` and run it. A green test suite is not enough for anything touching a native dependency: a packaged build unpacks its native modules on first use, so give the executable several seconds before judging a terminal pane that still looks empty.

The port `5000` packaged instance runs directly without NSSM or another service manager. Use this swap-and-launch flow when a running executable must be replaced:
1. `npx pkg . --targets node22-win-x64 --output dist\wps7-new.exe` — build to a new filename so the slow build step never touches the locked, currently-running `dist\wps7.exe`.
2. Read the loopback control token from `dist\data\control-token` and `POST http://127.0.0.1:5000/api/runtime/shutdown` with header `X-WPS7-Control-Token: <token>`. Wait for the exact port-5000 PID to exit and for port `5000` to be free. This saves state and avoids the old process relaunching itself.
3. Run `node scripts\set-windows-subsystem.js dist\wps7-new.exe`, refresh the packaged `scripts/` and `assets/` contents, then swap the file in (for example, .NET `[System.IO.File]::Replace('dist\wps7-new.exe', 'dist\wps7.exe', 'dist\wps7-backup.exe')`).
4. Start `dist\wps7.exe` in the active logged-in user's session with a one-shot Task Scheduler task configured for `InteractiveToken` / “Run only when user is logged on”; delete that temporary task after it starts. Do not launch it with `Start-Process` directly from a non-interactive shell, because such a shell may run in Session 0. If no interactive user session is available, stop and ask rather than falling back to Session 0.
5. After launch, resolve the listener PID for port `5000` and inspect its Windows `SessionId`. If it is `0`, treat the launch as failed: use the loopback control token to `POST /api/runtime/shutdown`, wait for that PID and port `5000` to stop, then relaunch with the interactive task and check the `SessionId` again. Never leave the port-5000 runtime running in Session 0.
6. Verify port `5000` health and that the port `5001` PID is unchanged. Never stop, replace, or restart the exe on port `5001` this way.

### Runtime Folder Relocation

Moving WPS7 does not automatically update the per-user Startup shortcut, which may still contain the old absolute folder path. From the new project root, run `npm run startup:repair`; it rewrites the shortcut to the packaged runtime root (`dist/` for `dist/wps7.exe`) and does not create a service or persistent scheduled task.

Afterward, verify port `5000` is healthy, no active process command line references the old path, and the port `5001` PID is unchanged. Never repoint, repair, stop, or restart the portable port `5001` instance.

Keep packaging relocation-safe: copy the contents of resource directories such as `scripts\*`, not the directory itself, so packaged paths do not become accidentally nested.

## Coding Style & Naming Conventions

Use CommonJS, two-space indentation, semicolons, and single quotes. Use `camelCase` for code identifiers, `PascalCase` for constructors, and kebab-case for CSS/data attributes. Prefer native APIs and avoid unrelated formatting.

`.gitattributes` pins line endings: LF for text, CRLF for Windows scripts. Do not override it locally, or generated files will look modified when they are not.

## Frontend Design Language

Keep pane chrome compact. Use `--pane-toolbar-height` (currently `28px`) for desktop titles and toolbars; mobile touch controls may be taller. Use theme tokens (`--surface-soft`, `--terminal-bg`, `--line`, `--accent`, `--accent-soft`) instead of fixed colors. Active panes use an accent border; hover, selection, and pressed states use the soft accent.

Use Segoe UI for interface text and Cascadia Mono/Consolas for terminal content, paths, titles, and data. Reuse single-stroke SVGs from `fileActionIcon()`; never stack icons. Controls need visible focus, accessible names, and larger mobile hit targets. User-facing copy says **Workspace**; `session` is internal legacy terminology.

When adding or changing user-facing UI copy, add or update its `zh-HK` entry in `public/i18n.js` and cover it in the relevant i18n test.

## Testing Guidelines

Use `node:test` with `node:assert/strict`; name files `*.test.js` and test observable behavior. Add a failing regression test before a bug fix, then run the focused file and `npm test`. Frontend source-contract tests live in `test/frontend.test.js`.

For any UI/frontend change, always visually verify it with screenshots (e.g. headless Chrome via CDP, or the `run` skill) in addition to automated/DOM assertions — confirm how it actually renders, not just that the underlying logic runs correctly.

The suite does not exercise Express routing, so verify anything that touches the HTTP layer against a running server: `:param` routes, body parsing, status codes, and the WebSocket upgrade.

## Commit & Pull Request Guidelines

Use short imperative commits such as `Fix mobile terminal long-press selection`. PRs should explain behavior, verification, configuration or restart needs, and include screenshots for UI changes.

Pushing to `main` runs CI on Windows: lint, the test suite, and a check that `THIRD-PARTY-LICENSES.md` is current. A tagged `v*` push builds the executable and publishes a release with SHA256 checksums.

The published history was rewritten once before the repository went public. Do not rewrite it again — anything already pushed must be corrected with a new commit.

## Security & Configuration Tips

Never commit passwords, hashes, control tokens, logs, or live `config.toml` values. Document defaults in `config.example.toml`. LAN binding (`0.0.0.0`) requires strong-password protection.

Every route rejects an untrusted `Host` header to block DNS rebinding, and WebSocket upgrades additionally require a same-origin `Origin`. A reverse proxy that forwards its own hostname needs that name in `server.allowed_hosts`, editable in `config.toml` or the Server section of Settings. A `*` entry accepts every name, which waives the rebinding protection entirely, so never make it a default.

Errors must not reach Express's built-in handler, which renders stack traces — and absolute host paths — into the response. Log the detail and return a status.

`StateStore.save()` writes atomically and keeps the previous copy as `state.json.bak`; `load()` falls back to it when `state.json` is unreadable. Preserve both when changing persistence.

Report vulnerabilities through [SECURITY.md](SECURITY.md); see [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup.
