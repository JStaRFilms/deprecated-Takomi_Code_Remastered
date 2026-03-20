# Task 12: Runtime Settings, Billing, And Bags

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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Keep runtime target and product settings aligned with Takomi workflow expectations |
| `frontend-design` | `C:/Users/johno/.codex/skills/frontend-design/SKILL.md` | Translate the approved settings surfaces into the shared v6 shell language |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep typed settings, billing, and Bags state consistent across app shells |

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

Implement runtime target settings, capability surfacing, Paystack entitlement state, Bags linkage readiness, and default Takomi brain visibility in a shared settings surface.

## Dependencies

- Task `04_shared-v6-shell.task.md`
- Task `08_persistence-audit-restore.task.md`

## Source Docs

- `docs/Project_Requirements.md`
- `docs/architecture/system_architecture.md`
- `docs/architecture/takomi_agent_defaults.md`
- `docs/mockups/v6-session-workspace.html`
- `docs/mockups/takomi_chat_states_v6.html`

## Scope

- Implement runtime target settings state for desktop-local and remote paths
- Surface capability availability and shell transport status clearly
- Add first-pass Paystack entitlement and checkout state contracts
- Add first-pass Bags linkage and readiness state contracts
- Surface shipped Takomi agent defaults from `.agent/Takomi-Agents`
- Expose a shared settings view that can render in web, desktop, and web-local shells
- Persist settings, billing, and Bags state through the shared persistence adapter
- Record audit events for runtime-target changes, auto-verification toggles, billing activation, and Bags linkage verification

## Out Of Scope

- Live payment processing
- Real Bags token exchange
- Full user override editing UI for agent definitions

## Definition Of Done

- Shared settings contracts exist for runtime, billing, Bags, and agent defaults
- Shared settings UI renders in all dev shells
- Persistence adapter can store and reload the first-pass settings state
- Audit-event hooks exist for the key state transitions
- Repo-level verification proves the contract, persistence, and render path

## Expected Artifacts

- Shared contracts and schemas for settings, billing, and Bags
- Persistence stores for the new state families
- Shared React settings view components
- Repo-level verifier for this task slice

## Suggested Files To Create Or Modify

- `packages/contracts/src/*settings*`
- `packages/contracts/src/*billing*`
- `packages/contracts/src/*bags*`
- `packages/persistence/src/*settings*`
- `packages/ui/src/components/*Settings*`
- `scripts/*settings*`

## Verification

- Validate the mock settings, billing, Bags, and defaults state against schemas
- Persist and reload the new settings state through the in-memory adapter
- Render the shared settings surface and assert the key sections exist

## Handoff Checklist

- Record the current billing and Bags limitations clearly
- Record how `.agent/Takomi-Agents` is surfaced in the settings experience
- Record any runtime capability differences between desktop-local and web-local
