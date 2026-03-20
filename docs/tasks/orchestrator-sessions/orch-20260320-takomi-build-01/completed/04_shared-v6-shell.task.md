# Task 04: Shared V6 Shell

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Preserve the Takomi workspace structure |
| `frontend-design` | `C:/Users/johno/.codex/skills/frontend-design/SKILL.md` | Translate the approved v6 mockups into production React layout |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep the shared renderer implementation maintainable |

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

Build the shared React shell for the approved v6 Takomi workspace with mock data first, preserving the four-panel structure and premium transcript-centered interaction model.

## Dependencies

- Task `01_monorepo-foundation.task.md`
- Task `02_contracts-and-schema-lock.task.md`

## Source Docs

- `docs/mockups/v6-session-workspace.html`
- `docs/mockups/takomi_chat_states_v6.html`
- `docs/design/v6-review-note.md`
- `docs/design/mockup_review.md`
- `docs/issues/Chat State Alignment.md`

## Scope

- Build the primary rail, sessions sidebar, transcript center stage, floating composer, and right inspector
- Translate the v6 palette, spacing, typography, and status surfaces into reusable UI primitives
- Use mock data and placeholder stores where live runtime wiring is not ready yet
- Keep the renderer shared between desktop and web entrypoints
- Add responsive collapse behavior without changing the core mental model

## Out Of Scope

- Final runtime integration
- Real persistence
- Billing or verification surfaces outside the core workspace shell

## Definition Of Done

- The shared renderer visually matches the approved v6 direction
- The v6 session workspace is implemented as shared React components
- The shell runs in both Electron and web mounts with mock data
- Composer, transcript blocks, sidebars, and header states are present and coherent

## Expected Artifacts

- Shared layout primitives
- Shared design tokens or theme variables
- Mock-data-driven workspace page
- Basic responsive behavior for narrow widths

## Suggested Files To Create Or Modify

- `packages/ui/src/*`
- `apps/desktop/src/renderer/*`
- `apps/web/src/*`
- shared styling and token files

## Verification

- Run the shared UI in web and desktop shells
- Compare against the v6 mockup structure
- Check that panel collapse states do not break navigation or transcript readability

## Handoff Checklist

- Note any intentional deviations from raw HTML that were required for shared React composition
- Call out remaining mock-data seams to be replaced in later tasks
