# Git and Worktree Controls

## Goal

Expose Git branch state, dirty state, and explicit worktree management in a way that preserves Takomi's same-workspace defaults while enabling safe parallel execution across parent/child session trees.

## Package Ownership

- `packages/contracts`
  - branch status shapes
  - worktree mutation payloads
  - Git audit events
- `packages/orchestration`
  - session subtree inheritance logic
  - worktree reassignment rules
- `packages/ui`
  - branch badges
  - worktree manager
  - session header and inspector state
- `apps/desktop`
  - Git service in Electron main
  - typed IPC for status, create, validate, and switch operations
- `apps/web`
  - remote-backed Git status path or explicit read-only fallback

## Product Rules

- Same-workspace inheritance is the default for child sessions.
- Worktree switching is always explicit and must declare its scope.
- Only descendants still inheriting the prior workspace/worktree may be bulk-updated automatically.

## Desktop and Browser Split

### Desktop

- Full Git inspection and worktree mutation are available through Electron main.
- The renderer requests actions through typed IPC and updates the shared orchestration state once the native action succeeds.

### Browser

- Browser may show remote-backed Git state if available.
- If no remote Git service exists, the browser must present a clear read-only or unavailable state instead of pretending local worktree control exists.

## Data Flow

- Session selection loads current branch, dirty state, and workspace/worktree identity.
- Creating or switching a worktree validates the target through the desktop bridge or remote service.
- The selected session subtree is updated according to inheritance rules.
- Audit events record both creation and switching actions.

## Audit Events

- `workspace.worktree_created`
- `workspace.worktree_switched`
- `workspace.git_state_refreshed`

## Acceptance Notes

- Branch and worktree context must remain visible in the shared shell.
- Switching a worktree must never silently mutate unrelated session trees.
- Browser behavior must be capability-aware and honest about what is unavailable.
