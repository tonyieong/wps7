---
name: wps7-main-integration
description: "Coordinate WPS7 main-branch integration across ai/task-1 and ai/task-2: inspect and commit completed work, merge and resolve conflicts, rebase task worktrees, synchronize safe ignored instruction files, run validation, package the Windows executable safely, and run the UI audit. Use when AI1 or AI2 reports completion or the user asks to integrate, rebase, build, deploy, or audit WPS7."
---

# WPS7 Main Integration

Use this skill from the repository root as the main-branch coordinator. Read `AGENTS.md` before changing anything; its deployment and port-safety rules take precedence over this workflow.

## Guardrails

- Worktrees are `.` (main), `..\wps7-ai-1` (AI1), and `..\wps7-ai-2` (AI2).
- Keep task work isolated. Do not modify a task worktree that is still working.
- Never use `git reset --hard`, `git checkout --`, broad deletion, or history rewriting.
- Do not push, create a release, or change remote settings unless explicitly requested.
- Never stop, replace, or restart the port-5001 instance. Do not launch the port-5000 executable directly from Session 0.
- Do not commit ignored files, secrets, `config.toml`, runtime state, logs, or generated output.

## 1. Inspect and commit completed task work

1. Check each worktree with `git status --short --branch`, `git log`, and `git diff --check`.
2. Confirm which agents are actually complete. If one is still working, leave that worktree untouched unless the user explicitly asks to integrate only the completed agent.
3. In each completed task worktree, read the diff and the affected files before staging anything. Run the relevant focused tests, `npm run lint`, and `npm test`.
4. Commit only that task's changes, using a short imperative message. Keep local instructions and ignored files out of the commit.

## 2. Merge into main

1. Ensure main has no unrelated tracked changes.
2. Merge completed branches one at a time with an explicit merge commit, for example:
   `git merge --no-ff ai/task-1 -m "Merge ai/task-1 into main"`
3. Resolve conflicts surgically. Preserve both valid behaviors and tests; do not accept a whole side blindly. Search for conflict markers before committing.
4. After conflict resolution, run the affected tests, `npm run lint`, and `npm test` on main.

## 3. Rebase every task worktree

After main contains all completed merges, run `git rebase main` from each task worktree. If a rebase conflicts, inspect and resolve it one commit at a time; never discard work to make the command finish.

Verify all three worktrees have the same `HEAD`, no tracked changes, and no unmerged paths. A task branch that is already at main is valid; do not create an unnecessary empty commit.

## 4. Synchronize safe ignored files

Copy the canonical main `AGENTS.md` and `CLAUDE.md` to both task worktrees. If main has a `.claude/` directory, synchronize its contents as well. Use literal paths and preserve the destination directory structure.

Do not blindly mirror `config.toml`, `data/`, `dist/`, `node_modules/`, `.playwright-mcp/`, screenshots, `Test_image/`, `output/`, or other scratch directories. These may contain passwords, control tokens, per-worktree state, a locked executable, or generated artifacts. Report that these files remain per-worktree unless the user explicitly chooses a canonical source for a specific one.

## 5. Final validation

Run on main:

- `npm run lint`
- `npm test`

Record the pass/fail totals and any expected noisy child-process diagnostics separately from actual failures. Recheck worktree status and verify the port-5001 PID remains unchanged.

## 6. Package and deploy safely

Only package after merge, rebase, and final tests pass. Follow the exact Windows swap-and-launch flow in `AGENTS.md`:

1. Build to a new filename such as `dist\wps7-new.exe`; never overwrite a locked running executable.
2. Read the port-5000 control token, request the authenticated loopback shutdown, and wait for the exact port-5000 PID to exit and the port to become free. Do not contact port 5001.
3. Apply the Windows subsystem setting, refresh packaged `scripts/` and `assets/` contents without nesting their directories, and swap the new executable into place using the documented recoverable method.
4. Start it only through a temporary InteractiveToken / "Run only when user is logged on" Task Scheduler task. Delete that one-shot task after launch.
5. Verify port-5000 health and that port 5001 is still served by the same PID.

If the user only requested git integration, stop after validation and do not package or restart services without confirmation.

## 7. UI audit

After a successful build, invoke the available `ui-audit` skill against the running website. Use port `5333`; if it is occupied, use `5334`. Keep this temporary audit server separate from ports 5000 and 5001, and shut it down after the audit.

## Report

Return the AI1/AI2 commit hashes, main merge hash, final `HEAD` values, ignored-file synchronization result, test totals, package/deploy result, UI-audit result, port checks, and any unresolved risk or blocker. Mention explicitly when packaging, restart, push, or release was intentionally not performed.
