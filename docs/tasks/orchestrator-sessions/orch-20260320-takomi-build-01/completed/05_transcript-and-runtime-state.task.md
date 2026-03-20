# Task 05: Transcript And Runtime State

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Align transcript behavior with Takomi orchestration semantics |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Implement robust state handling and renderer-safe data flow |

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

Implement transcript state, render-ready transcript blocks, and Codex runtime state mapping so the shared v6 shell can display realistic streaming activity and run phases from normalized events.

## Dependencies

- Task `02_contracts-and-schema-lock.task.md`
- Task `04_shared-v6-shell.task.md`

## Source Docs

- `docs/features/chat-session-core.md`
- `docs/features/codex-runtime-adapter.md`
- `docs/mockups/takomi_chat_states_v6.html`
- `docs/mockups/v6-session-workspace.html`
- `docs/tasks/Takomi_V6_UI_Implementation_Plan.md`

## Scope

- Implement transcript stores backed by normalized runtime events
- Materialize render-ready blocks outside React render functions
- Support user text, assistant text, command status, file changes, plan blocks, intervention cards, and completion states
- Map canonical runtime states into header badges, transcript styling, composer state, and activity indicators
- Keep the system ready for large transcripts and frequent event updates

## Out Of Scope

- Final persistence durability
- Full orchestration engine logic
- Desktop or web-local runtime hosting

## Definition Of Done

- The shared UI can consume normalized events and render the expected transcript shapes
- Canonical runtime states are represented in stores and UI
- Event ingestion does not force heavy synchronous transforms inside component bodies
- Long transcript behavior accounts for virtualization or incremental windowing strategy

## Expected Artifacts

- Transcript store and selectors
- Render block model
- Runtime state mapping utilities
- Shared test fixtures for representative event streams

## Suggested Files To Create Or Modify

- `packages/ui/src/*transcript*`
- `packages/runtime-codex/src/*state-map*`
- `packages/orchestration/src/*stores*` if shared state is hosted there

## Verification

- Feed representative event fixtures through the store
- Verify state transitions in the UI
- Confirm typing remains responsive while events append

## Handoff Checklist

- Record the canonical UI states implemented
- Call out any deferred transcript content types not yet mapped
