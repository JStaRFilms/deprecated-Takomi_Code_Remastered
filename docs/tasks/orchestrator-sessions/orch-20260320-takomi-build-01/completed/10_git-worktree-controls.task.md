# Task 10: Git Worktree Controls

**Status:** Completed  
**Priority:** High  
**Mode / Workflow:** `mode-code` / `vibe-build`

## Agent Setup (Do This First)

### Workflow To Follow
Read `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md` before making changes.

### Prime Agent Context
Run `vibe-primeAgent` first using `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md`.

### Session Skills Registry
This orchestration session is limited to:
`takomi`, `spawn-task`, `monorepo-management`, `nextjs-standards`, `frontend-design`, `webapp-testing`, `sync-docs`, `jstar-reviewer`, `security-audit`

### Required Skills

| Skill | Path | Why |
|---|---|---|
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Preserve Takomi worktree and inheritance rules |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep Git state and capability boundaries explicit |

## Execution Note

1. Read the assigned Takomi workflow first.
2. Run `vibe-primeAgent`.
3. Load only the required skills listed in this file.
4. Read the linked source docs for this slice.
5. Implement only this task scope.
6. Run task-local verification before handoff.
7. Send the result to review.
8. If review fails, reopen this same task and fix it.
9. Only after review passes, move this task to `completed/` and let the orchestrator unlock dependent tasks.

## Objective

Implement branch visibility, explicit worktree switching, subtree scoping, and honest capability-aware browser behavior for Git and workspace context.

## Dependencies

- Task `06_electron-runtime-and-ipc.task.md`
- Task `07_web-local-bridge.task.md`
- Task `08_persistence-audit-restore.task.md`
- Task `09_orchestration-engine.task.md`

## Source Docs

- `docs/features/git-and-worktree-controls.md`
- `docs/features/chat-session-core.md`
- `docs/mockups/v6-worktree-manager.html`
- `docs/Project_Requirements.md`

## Scope

- Show current branch, dirty state, workspace, and worktree identity
- Implement explicit worktree create and switch flows
- Make worktree naming human-readable and task-oriented rather than opaque:
  - prefer a dedicated worktree root folder such as `.takomi/worktrees/` or another clearly documented equivalent
  - prefer generated folder names shaped like `<project-slug>-<task-slug>-agent-<n>` or `<project-slug>-<session-slug>-agent-<n>` instead of random IDs alone
  - surface both the readable label and the actual filesystem path in UI and persistence
- Apply worktree changes only to the intended session subtree
- Add first-run worktree bootstrapping for delegated agent work:
  - copy or rehydrate expected local project files that do not normally come across with a bare worktree setup, especially `.env`-style files when safe and configured
  - define clear allowlist-based behavior for env/bootstrap file carryover rather than blind copying
  - support optional dependency bootstrap such as `pnpm install` after worktree creation when the project uses `pnpm`
  - persist and display bootstrap status so the user can tell whether the worktree is ready to use
- Expose capability-aware browser behavior:
  - remote-backed path if available
  - read-only or unavailable state if not
- Write audit events for worktree creation, switching, and Git refresh

## Out Of Scope

- Advanced Git conflict resolution UX
- Full merge or rebase tooling
- Cross-repo orchestration

## Definition Of Done

- Worktree context is visible in the shared shell
- Switching a worktree is explicit and scoped
- Worktree names and paths are understandable to a human scanning the UI or filesystem
- New delegated worktrees can be prepared into a usable state with bootstrap steps such as env carryover and dependency install, with safety guards and visible status
- Unavailable browser behavior is clear rather than silently hidden
- Audit and persistence layers reflect Git state changes

## Expected Artifacts

- Git status service integration
- Worktree manager logic and UI hooks
- Audit event wiring for Git actions

## Suggested Files To Create Or Modify

- `apps/desktop/src/main/*git*`
- `apps/local-bridge/src/*git*`
- `packages/orchestration/src/*worktree*`
- `packages/ui/src/*worktree*`

## Verification

- Refresh branch and dirty state
- Create or switch a worktree in a controlled test repo
- Verify the created worktree folder naming is readable and stable
- Verify the configured bootstrap path:
  - expected env files are copied or rehydrated only through explicit safe rules
  - dependency install runs when enabled
  - bootstrap success or failure is visible to the user
- Confirm subtree scoping behavior in orchestration state

## Handoff Checklist

- Note any platform-specific Git assumptions
- Record any safety guards added around destructive operations
- Record the final worktree path template and naming scheme
- Record which files are allowed to copy into a new worktree and which are intentionally blocked
- Record whether dependency bootstrap is automatic, optional, retryable, and how failure is reported
