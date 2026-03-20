# Task 08: Persistence Audit Restore

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Preserve Takomi auditability and restore semantics |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep persistence abstractions typed and portable |

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

Implement append-first persistence, restore snapshots, audit logs, and read models for Takomi sessions across Electron and web-local execution paths.

## Dependencies

- Task `02_contracts-and-schema-lock.task.md`
- Task `03_session-bundle-interop.task.md`

## Source Docs

- `docs/features/chat-session-core.md`
- `docs/features/orchestrator-execution-engine.md`
- `docs/features/intervention-controls.md`
- `docs/architecture/system_architecture.md`

## Scope

- Implement event history storage for transcript and runtime events
- Implement restore snapshots and read models
- Implement audit event persistence for runs, interventions, worktree changes, billing state changes, and verification state changes
- Support both desktop and web-local adapters behind shared repository interfaces
- Leave room in the persistence model for app-owned Takomi agent definitions and user overrides, even if the full editor lands in a later task

## Out Of Scope

- Final long-term cloud sync design
- Advanced analytics
- Full cross-device sync
- Full Takomi brain editor UX

## Definition Of Done

- Session events can be durably stored and restored
- Read models can reconstruct session lists, task summaries, and transcript views
- Audit events are first-class records, not console leftovers
- Desktop and web-local adapters honor the same repository interfaces

## Expected Artifacts

- Repository interfaces
- Desktop persistence adapter
- Web-local persistence adapter or client
- Restore and read-model helpers
- Audit store support

## Suggested Files To Create Or Modify

- `packages/persistence/src/*`
- `packages/contracts/src/*audit*`
- adapter wiring in `apps/desktop` and `apps/web`

## Verification

- Persist and restore representative session fixtures
- Verify audit event append and query behavior
- Confirm the same session can be reconstructed without relying on in-memory state

## Handoff Checklist

- Note the chosen storage engines or temporary persistence mechanisms
- Call out any data retention or compaction work explicitly deferred
