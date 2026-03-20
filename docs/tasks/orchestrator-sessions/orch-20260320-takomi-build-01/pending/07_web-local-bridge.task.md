# Task 07: Web Local Bridge

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Keep the web-local path aligned with Takomi runtime rules |
| `monorepo-management` | `C:/Users/johno/.codex/skills/monorepo-management/SKILL.md` | Structure the local bridge cleanly within the workspace |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep transport and app boundaries strict |

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

Build the localhost companion service that lets the browser app act as a serious local Takomi client with Codex, workspace, Git, and event-stream access through typed transport.

## Dependencies

- Task `02_contracts-and-schema-lock.task.md`

## Source Docs

- `docs/features/cloud-runtime.md`
- `docs/architecture/system_architecture.md`
- `docs/Project_Requirements.md`
- `docs/PLAN.md`

## Scope

- Implement the local bridge service in `apps/local-bridge`
- Expose typed HTTP and WebSocket endpoints aligned with the shared contracts
- Support local Codex runtime access, workspace actions, Git state, and streaming event delivery
- Wire `pnpm dev:web-local` so the web app and local bridge start together
- Provide capability detection so the web app knows when local powers are available

## Out Of Scope

- Cloud-hosted remote runtime service
- Final auth hardening for production remote deployment
- UI implementation beyond what is needed to consume capability state

## Definition Of Done

- The browser app can run locally with the bridge and reach the shared contracts
- The bridge exposes shape-compatible payloads with the Electron IPC path
- Event streaming works through WebSocket or equivalent push transport
- The dev command for web-local mode starts successfully

## Expected Artifacts

- Local bridge server
- HTTP and WebSocket handlers
- Dev orchestration scripts
- Transport client wiring for the web app

## Suggested Files To Create Or Modify

- `apps/local-bridge/src/*`
- `apps/web/src/*transport*`
- root script files or task runner config
- `packages/runtime-codex/src/*remote*`

## Verification

- Start `pnpm dev:web-local`
- Confirm the browser app detects the local bridge
- Exercise one request/response path and one streamed event path

## Handoff Checklist

- Record the local bridge port strategy
- Call out any endpoints intentionally left behind capability flags
