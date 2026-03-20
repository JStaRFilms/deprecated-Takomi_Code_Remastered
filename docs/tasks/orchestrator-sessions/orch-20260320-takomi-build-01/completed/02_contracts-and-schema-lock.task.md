# Task 02: Contracts And Schema Lock

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Keep the build aligned with Takomi orchestration rules |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Define strict TypeScript contracts and shared boundaries |

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

Define the stable shared contracts and validation schemas that every runtime, UI, persistence, IPC, and bridge surface will consume.

## Dependencies

- Task `01_monorepo-foundation.task.md`

## Source Docs

- `docs/Project_Requirements.md`
- `docs/architecture/system_architecture.md`
- `docs/architecture/solution_scaffold_decisions.md`
- `docs/features/codex-runtime-adapter.md`
- `docs/features/chat-session-core.md`
- `docs/features/cloud-runtime.md`
- `.agent/Takomi-Agents/custom_modes.yaml`
- `.agent/Takomi-Agents/vibe-orchestrator.yaml`
- `.agent/Takomi-Agents/vibe-code.yaml`
- `.agent/Takomi-Agents/vibe-review.yaml`

## Scope

- Define shared types and schemas for:
  - runtime targets
  - normalized runtime events
  - transcript parts
  - sessions and session lineage
  - task graph entities
  - intervention requests and outcomes
  - audit event envelopes
  - workspace and worktree references
  - shell capabilities
  - Takomi agent mode definitions and app-owned configurable defaults
  - preload IPC payloads
  - localhost bridge HTTP and WebSocket payloads
- Lock names and shapes for the early interfaces called out in the master plan
- Define a contract boundary that can ingest the current `.agent/Takomi-Agents/` defaults without coupling the app forever to raw YAML file access

## Out Of Scope

- Full business logic for orchestration or persistence
- UI implementation
- Import/export adapter logic for session bundles
- Final migration from repo files into app-managed user settings

## Definition Of Done

- Contracts compile in `packages/contracts`
- Validation schemas exist for the boundary payloads
- `CodexRuntimeManager`, `ShellCapabilities`, and normalized event names are exported
- Agent-definition contracts for default Takomi modes are exported
- Desktop IPC and web-local bridge payloads are shape-compatible where they represent the same action

## Expected Artifacts

- Shared type definitions
- Shared runtime validation schemas
- Export surface for the locked interfaces
- Brief contract notes if any naming choices needed clarification

## Suggested Files To Create Or Modify

- `packages/contracts/src/*`
- `packages/contracts/package.json`
- any shared config or barrel export files needed by downstream packages

## Verification

- Run package-level typecheck
- Validate example payloads against the schemas
- Confirm downstream placeholder imports can compile without circular dependencies

## Handoff Checklist

- Record the finalized event names
- Record the finalized runtime target values
- Record any constraints later tasks must not break
- Record the chosen shape for app-owned Takomi agent definitions and how it maps back to the current `.agent/Takomi-Agents/` files
