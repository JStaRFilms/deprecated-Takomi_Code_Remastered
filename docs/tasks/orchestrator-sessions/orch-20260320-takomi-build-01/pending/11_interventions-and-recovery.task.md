# Task 11: Interventions And Recovery

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | This task implements core Takomi control and recovery behaviors |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep intervention flows typed, auditable, and safe |

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

Implement live intervention controls and recovery actions so Takomi runs can be paused, resumed, cancelled, guided, rerouted, replaced, migrated, and recovered with explicit audit history.

## Dependencies

- Task `05_transcript-and-runtime-state.task.md`
- Task `06_electron-runtime-and-ipc.task.md`
- Task `07_web-local-bridge.task.md`
- Task `09_orchestration-engine.task.md`

## Source Docs

- `docs/features/intervention-controls.md`
- `docs/features/orchestrator-execution-engine.md`
- `docs/mockups/v6-intervention-controls.html`
- `docs/Project_Requirements.md`

## Scope

- Implement intervention action handling for:
  - pause
  - resume
  - cancel
  - inject guidance
  - reroute
  - replace
  - migrate
- Preserve scope targeting for current run, child run, or session subtree
- Record requested, applied, unsupported, and failed outcomes
- Implement recovery flow hooks and surfaced run status after failures or pauses

## Out Of Scope

- Advanced team approval workflows
- Arbitrary human workflow engines beyond the Takomi recovery set

## Definition Of Done

- Intervention actions are routed through the shared runtime contract
- Scope resolution is explicit and auditable
- Recovery state survives reload
- Unsupported backend actions produce explicit UI and audit outcomes

## Expected Artifacts

- Intervention policy logic
- Runtime command integration
- Recovery state and UI hooks
- Audit event wiring for interventions

## Suggested Files To Create Or Modify

- `packages/orchestration/src/*intervention*`
- `packages/runtime-codex/src/*intervention*`
- `packages/ui/src/*intervention*`
- `packages/persistence/src/*intervention*`

## Verification

- Exercise supported intervention paths against runtime fixtures or integration paths
- Verify unsupported actions log correctly
- Reload and confirm intervention state persists

## Handoff Checklist

- Note any intervention actions that remain backend-limited
- Record how subtree targeting is resolved and persisted
