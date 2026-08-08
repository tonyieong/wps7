# Repository Guidelines

## Project Structure & Module Organization

WPS7 is a Windows-focused Node.js terminal workspace. Server modules live in `src/`; `main.js` wires Express and WebSocket routes. Browser code lives in `public/`, tests in `test/`, service utilities in `scripts/`, and bundled resources in `assets/` and `tools/`.

Treat `data/`, `dist/`, `tmp-file-pane-test/`, and `qa-backup-*` as generated output unless packaging or migration is in scope.

## Build, Test, and Development Commands

- `npm install` installs runtime and packaging dependencies.
- `npm start` runs `src/main.js` and serves the app at `http://127.0.0.1:5000` by default.
- `npm test` runs the complete `node:test` suite.
- `node --test test/terminal.test.js` runs one test file during focused development.
- `npm run lint` runs ESLint. CI fails on errors; warnings are advisory.
- `npm run licenses:generate` rewrites `THIRD-PARTY-LICENSES.md`. Run it whenever you add or upgrade a dependency, because the packaged executable embeds them and CI fails when the file is stale.
- `npm run package:win` creates `dist/wps7.exe` and copies required Windows assets.
- `npm run nssm:install` and `npm run startup:install` install the Windows service and tray integration.

After every code modification, rebuild `dist/wps7.exe` via `npm run package:win` and run it. A green test suite is not enough for anything touching a native dependency: a packaged build unpacks its native modules on first use, so give the executable several seconds before judging a terminal pane that still looks empty.

### Runtime Folder Relocation

Moving WPS7 does not automatically update Windows registrations because NSSM, scheduled tasks, log paths, and the Startup tray shortcut may still contain the old absolute folder path. From the new project root, run `npm run startup:repair`; approve UAC because repairing a service and elevated tasks changes system settings.

The repair must resolve the packaged runtime root (`dist/` for `dist/wps7.exe`) and update the NSSM application, working directory, logs, the WPS7 start/restart/stop tasks, and `wps7 tray.lnk`. It must preserve the existing service account; use `scripts/install-wps7-startup.ps1` when credentials need to change. Afterward, verify port `5000` is healthy and that no active registration or process command line references the old path.

Keep packaging relocation-safe: copy the contents of resource directories such as `scripts\*`, not the directory itself, so packaged paths do not become accidentally nested.

## Coding Style & Naming Conventions

Use CommonJS, two-space indentation, semicolons, and single quotes. Use `camelCase` for code identifiers, `PascalCase` for constructors, and kebab-case for CSS/data attributes. Prefer native APIs and avoid unrelated formatting.

`.gitattributes` pins line endings: LF for text, CRLF for Windows scripts. Do not override it locally, or generated files will look modified when they are not.

## Frontend Design Language

Keep pane chrome compact. Use `--pane-toolbar-height` (currently `28px`) for desktop titles and toolbars; mobile touch controls may be taller. Use theme tokens (`--surface-soft`, `--terminal-bg`, `--line`, `--accent`, `--accent-soft`) instead of fixed colors. Active panes use an accent border; hover, selection, and pressed states use the soft accent.

Use Segoe UI for interface text and Cascadia Mono/Consolas for terminal content, paths, titles, and data. Reuse single-stroke SVGs from `fileActionIcon()`; never stack icons. Controls need visible focus, accessible names, and larger mobile hit targets. User-facing copy says **Workspace**; `session` is internal legacy terminology.

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

Every route rejects an untrusted `Host` header to block DNS rebinding, and WebSocket upgrades additionally require a same-origin `Origin`. A reverse proxy that forwards its own hostname needs that name in `server.allowed_hosts`, which is deliberately editable only in `config.toml`, never through the web UI.

Errors must not reach Express's built-in handler, which renders stack traces — and absolute host paths — into the response. Log the detail and return a status.

`StateStore.save()` writes atomically and keeps the previous copy as `state.json.bak`; `load()` falls back to it when `state.json` is unreadable. Preserve both when changing persistence.

Report vulnerabilities through [SECURITY.md](SECURITY.md); see [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup.
