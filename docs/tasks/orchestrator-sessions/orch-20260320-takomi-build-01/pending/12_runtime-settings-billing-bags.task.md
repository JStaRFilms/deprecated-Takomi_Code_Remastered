# Task 12: Runtime Settings Billing Bags

**Status:** Pending  
**Priority:** Medium  
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
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Keep settings and integrations aligned with Takomi runtime and verification flow |
| `frontend-design` | `C:/Users/johno/.codex/skills/frontend-design/SKILL.md` | Implement approved shared surfaces cleanly |
| `nextjs-standards` | `C:/Users/johno/.codex/skills/nextjs-standards/SKILL.md` | Keep integration code and UI contracts maintainable |

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

Implement runtime target settings, capability surfacing, Paystack entitlement flow, and Bags linkage and readiness screens as shared product surfaces.

## Dependencies

- Task `04_shared-v6-shell.task.md`
- Task `08_persistence-audit-restore.task.md`

## Source Docs

- `docs/features/cloud-runtime.md`
- `docs/features/billing-and-entitlements.md`
- `docs/features/bags-integration-and-verification.md`
- `docs/mockups/v6-runtime-settings.html`
- `docs/mockups/v6-billing-verification.html`

## Scope

- Implement runtime target settings UI and state
- Surface shell capabilities and runtime availability honestly
- Implement Paystack billing and entitlement success-path flow
- Implement Bags token linkage and verification readiness UI and state
- Ensure audit events are recorded for settings and integration changes

## Out Of Scope

- Fee sharing logic
- Advanced billing analytics
- Full production-grade verification ops beyond the documented readiness scope

## Definition Of Done

- Runtime settings surface reflects actual capability state
- Paystack and Bags flows exist on the documented success path
- Billing and verification state changes are auditable
- UI language remains shared across desktop and web-local

## Expected Artifacts

- Shared settings screens
- Integration service wiring
- Entitlement and readiness state handling
- Audit integration for settings changes

## Suggested Files To Create Or Modify

- `packages/ui/src/*settings*`
- `packages/ui/src/*billing*`
- `packages/ui/src/*verification*`
- integration service files in relevant apps or packages

## Verification

- Verify runtime target switching UI
- Verify entitlement happy path
- Verify Bags linkage and readiness display
- Confirm audit events are written for each change

## Handoff Checklist

- Note any provider sandbox assumptions
- Record any intentionally deferred failure-path UX
