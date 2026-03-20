# Task 03: Session Bundle Interop

**Status:** Approved  
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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Keep the interop model aligned with Takomi session rules |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Implement stable schemas and adapter surfaces cleanly |

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

Introduce `TakomiSessionBundleV1` and the first-pass import/export bridge for Codex-compatible session interchange without directly reading or writing another app's live session store.

## Dependencies

- Task `02_contracts-and-schema-lock.task.md`

## Source Docs

- `docs/Project_Requirements.md`
- `docs/features/chat-session-core.md`
- `docs/features/codex-runtime-adapter.md`
- `docs/PLAN.md`

## Scope

- Define `TakomiSessionBundleV1`
- Implement export from Takomi session state into the bundle
- Implement safe import from supported foreign Codex session data into the bundle
- Map transcript, runtime, lineage, artifact metadata, workspace refs, and audit metadata into a canonical interchange format
- Keep the implementation adapter-based rather than shared-store based

## Out Of Scope

- Live session synchronization with other Codex apps
- Full migration of unknown external formats
- UI for browsing imported sessions

## Definition Of Done

- `TakomiSessionBundleV1` is exported from shared contracts
- Import and export helpers compile and are covered by tests
- Unsupported or partial foreign data produces explicit failures or partial-import results rather than silent corruption
- No code path writes into another app's active internal session storage

## Expected Artifacts

- Bundle type and schema
- Import and export utilities
- Fixture tests for happy path and failure path mappings

## Suggested Files To Create Or Modify

- `packages/contracts/src/*session-bundle*`
- `packages/persistence/src/*interop*`
- `packages/runtime-codex/src/*interop*` only if needed for event mapping helpers

## Verification

- Round-trip Takomi export/import test
- Supported foreign payload import test
- Unsupported payload rejection test

## Handoff Checklist

- Document exactly what the first-pass importer supports
- Call out any fields preserved but not yet rendered in UI
- Note any intentional compatibility gaps for later phases
