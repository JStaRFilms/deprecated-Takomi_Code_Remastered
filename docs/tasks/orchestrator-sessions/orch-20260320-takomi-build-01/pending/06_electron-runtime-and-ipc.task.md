# Task 06: Electron Runtime And IPC

**Status:** Pending  
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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Preserve Takomi runtime and orchestration expectations |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep the native boundary typed and safe |

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

Implement the Electron main/preload foundation, typed IPC surface, and desktop-local Codex runtime host so the shared renderer can access native capabilities without direct Node access.

## Dependencies

- Task `02_contracts-and-schema-lock.task.md`

## Source Docs

- `docs/architecture/system_architecture.md`
- `docs/features/codex-runtime-adapter.md`
- `docs/features/cloud-runtime.md`
- `docs/features/git-and-worktree-controls.md`
- `docs/Project_Requirements.md`

## Scope

- Wire Electron main bootstrap
- Implement preload bridge with typed APIs
- Implement desktop-local `CodexRuntimeManager` host
- Expose native actions through typed IPC:
  - workspace selection
  - filesystem access needed by the app
  - Git status and worktree operations
  - secure storage
  - runtime lifecycle control
  - OS dialog helpers

## Out Of Scope

- Full cloud or localhost bridge path
- Complete orchestration engine logic
- Final billing or verification integrations

## Definition Of Done

- Electron boots the shared renderer successfully
- Preload is the only native access surface used by the renderer
- Desktop-local runtime host implements the shared runtime contract
- IPC payloads validate against the shared contracts

## Expected Artifacts

- Electron main entrypoint
- Preload bridge implementation
- Desktop runtime manager
- IPC handlers and validation

## Suggested Files To Create Or Modify

- `apps/desktop/src/main/*`
- `apps/desktop/src/preload/*`
- `packages/runtime-codex/src/*desktop*`
- shared bridge contract integration points

## Verification

- Start the Electron app successfully
- Exercise at least one IPC request per major surface
- Confirm a mock or real local runtime session can emit normalized events

## Handoff Checklist

- Record any native APIs intentionally deferred
- Note any platform assumptions or Electron version constraints
