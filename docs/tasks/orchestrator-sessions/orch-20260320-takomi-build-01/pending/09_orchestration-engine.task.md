# Task 09: Orchestration Engine

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | This task implements the core Takomi orchestration model |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep state ownership and contracts clean |

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

Implement the Takomi orchestration engine that owns parent and child sessions, task graphs, background child execution, and same-workspace inheritance behavior.

## Dependencies

- Task `02_contracts-and-schema-lock.task.md`
- Task `05_transcript-and-runtime-state.task.md`
- Task `06_electron-runtime-and-ipc.task.md`
- Task `07_web-local-bridge.task.md`
- Task `08_persistence-audit-restore.task.md`

## Source Docs

- `docs/features/orchestrator-execution-engine.md`
- `docs/features/chat-session-core.md`
- `docs/Project_Requirements.md`
- `docs/PLAN.md`
- `.agent/Takomi-Agents/custom_modes.yaml`
- `.agent/Takomi-Agents/vibe-orchestrator.yaml`
- `.agent/Takomi-Agents/vibe-code.yaml`
- `.agent/Takomi-Agents/vibe-review.yaml`

## Scope

- Implement orchestration sessions and task graph state ownership
- Create parent and child chat sessions tied to delegated work
- Preserve same-workspace inheritance by default
- Support background child execution without blocking the parent workspace
- Correlate tasks, sessions, runs, and artifacts consistently
- Add the loader path or internal service that treats `.agent/Takomi-Agents/` as the current source of default mode and agent definitions for orchestration behavior

## Out Of Scope

- Final recovery action UI
- Full billing or verification logic
- Cross-team collaboration features
- Full end-user editing UI for the Takomi brain

## Definition Of Done

- The engine can create and track orchestration sessions and dependent tasks
- Parent and child session lineage survives reload
- Background child runs remain visible without taking over the active workspace
- Runtime ownership and artifact correlation remain stable across runtime targets
- Default agent and mode definitions can be loaded from the current Takomi defaults path or a mapped internal equivalent

## Expected Artifacts

- Orchestration engine or scheduler
- Session lineage logic
- Task graph models and selectors
- Persistence integration for orchestration state

## Suggested Files To Create Or Modify

- `packages/orchestration/src/*`
- `packages/persistence/src/*orchestration*`
- `packages/ui/src/*task-graph*` where store integration is needed

## Verification

- Simulate multi-task orchestration with parent and child sessions
- Reload and confirm lineage survives
- Confirm same-workspace inheritance is the default until explicitly overridden later

## Handoff Checklist

- Note any intentionally simplified scheduling rules
- Record how runtime ownership IDs are assigned and preserved
- Record how the engine resolves default agent definitions and how later user overrides should layer on top
