# Contributing to wps7

## Before you start

Read [AGENTS.md](AGENTS.md). It is the working agreement for this repository and
covers project layout, the design language for pane chrome, packaging, and the
Windows service/tray registration flow. Everything below assumes it.

Security issues go through [SECURITY.md](SECURITY.md), never a public issue.

## Development

```powershell
npm install
npm start          # serves http://127.0.0.1:5000
npm test           # full node:test suite
node --test test/terminal.test.js   # one file while iterating
```

wps7 targets Windows and depends on ConPTY through
`@homebridge/node-pty-prebuilt-multiarch`, so the terminal features cannot be
developed or tested on Linux or macOS.

If you already run wps7 as an installed service, do not develop against that
instance. Use a separate port and data directory so a crash in your build cannot
take down the service you rely on.

## Code style

CommonJS, two-space indentation, semicolons, single quotes. `camelCase` for
identifiers, `PascalCase` for constructors, kebab-case for CSS and data
attributes. Prefer native APIs over new dependencies, and do not reformat code
you are not otherwise changing.

User-facing copy says **Workspace**. `session` is internal legacy terminology.

## Tests

Use `node:test` with `node:assert/strict`, name files `*.test.js`, and test
observable behavior. For a bug fix, add the failing regression test first, then
make it pass. Frontend source-contract tests live in `test/frontend.test.js`.

For any UI change, verify it visually with a screenshot as well as with
assertions. Attach the screenshot to the pull request.

## Pull requests

Use short imperative commit subjects, for example `Fix mobile terminal
long-press selection`. In the description, explain the behavior change, how you
verified it, and whether it needs a config change or a restart.

Upgrading a native dependency such as node-pty requires building
`dist/wps7.exe` and running it, not just a green test suite.

When you do, give the executable time before judging the result. A packaged
build unpacks its native modules on first use, so a terminal pane can still be
empty for several seconds after the HTTP server starts answering. Probing the
moment the port opens reports a broken ConPTY that is merely slow to warm up.

If you add or upgrade a dependency, run `npm run licenses:generate` and commit the
regenerated `THIRD-PARTY-LICENSES.md` alongside it. The packaged executable
embeds every production dependency, so that file is how their license notices
reach the people who download a release.
