# Task 01: Monorepo Foundation

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Follow the Takomi build workflow |
| `monorepo-management` | `C:/Users/johno/.codex/skills/monorepo-management/SKILL.md` | Set up the workspace and package boundaries |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep the shared React and TypeScript foundation disciplined |

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

Create the `pnpm` monorepo foundation for Takomi Code with app and package boundaries that support Electron desktop, browser delivery, and web-local development through a bundled local bridge.

## Dependencies

- None

## Source Docs

- `docs/Project_Requirements.md`
- `docs/architecture/system_architecture.md`
- `docs/architecture/solution_scaffold_decisions.md`
- `docs/Builder_Prompt.md`
- `.agent/Takomi-Agents/custom_modes.yaml`
- `.agent/Takomi-Agents/kilo-code-settings.json`

## Scope

- Create workspace root package management and TypeScript build structure
- Create `apps/desktop`, `apps/web`, and `apps/local-bridge`
- Create `packages/contracts`, `packages/orchestration`, `packages/runtime-codex`, `packages/persistence`, and `packages/ui`
- Add strict TS configuration, shared lint/format scripts, and baseline dev commands
- Add `pnpm dev:desktop`, `pnpm dev:web`, and `pnpm dev:web-local`
- Preserve `.agent/Takomi-Agents/` as an intentional product input and make sure the scaffold leaves a clean place for future default-agent ingestion rather than burying or ignoring it

## Out Of Scope

- Feature implementation inside the packages
- Final UI fidelity
- Runtime contract contents beyond what is required for scaffold references
- Full in-app editor for Takomi agent definitions

## Definition Of Done

- A working `pnpm` workspace exists at the repo root
- App and package directories exist with coherent package boundaries
- Shared TS config and root scripts are in place
- The repo can typecheck the scaffold without feature logic
- Dev commands for desktop, web, and web-local are documented in package scripts

## Expected Artifacts

- Root workspace config files
- App and package `package.json` files
- Shared TS config files
- Initial app entrypoints and placeholder package exports
- Short implementation note in the task result or commit summary
- A short note about where future app-owned Takomi brain/config ingestion should live

## Suggested Files To Create Or Modify

- `package.json`
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `apps/desktop/*`
- `apps/web/*`
- `apps/local-bridge/*`
- `packages/contracts/*`
- `packages/orchestration/*`
- `packages/runtime-codex/*`
- `packages/persistence/*`
- `packages/ui/*`
- `.agent/Takomi-Agents/*` only if references or metadata need to be added without mutating the defaults

## Verification

- Install dependencies successfully
- Run root typecheck successfully
- Run each declared dev command far enough to verify startup wiring
- Confirm path aliases and workspace references resolve
- Confirm the scaffold does not accidentally exclude `.agent/Takomi-Agents/` from future app access patterns

## Handoff Checklist

- Note any scaffold assumptions
- Record any placeholder entrypoints added for later tasks
- Call out anything intentionally stubbed so later tasks do not mistake it for completed feature work
- Record how the scaffold expects to ingest default Takomi agent definitions later
