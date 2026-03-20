# Task 13: Integration Hardening

**Status:** Pending  
**Priority:** High  
**Mode / Workflow:** `mode-review` / `review_code`

## Agent Setup (Do This First)

### Workflow To Follow
Read `C:/Users/johno/.codex/skills/takomi/workflows/review_code.md` first. Use `mode-review` discipline for findings and verification.

### Prime Agent Context
Run `vibe-primeAgent` first using `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md`.

### Session Skills Registry
This orchestration session is limited to:
`takomi`, `spawn-task`, `monorepo-management`, `nextjs-standards`, `frontend-design`, `webapp-testing`, `sync-docs`, `jstar-reviewer`, `security-audit`

### Required Skills

| Skill | Path | Why |
|---|---|---|
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Preserve orchestration intent while hardening the integrated system |
| `webapp-testing` | `C:/Users/johno/.codex/skills/webapp-testing/SKILL.md` | Validate browser-side behavior and shared UI flows |
| `jstar-reviewer` | `C:/Users/johno/.codex/skills/jstar-reviewer/SKILL.md` | Run structured review and code audit passes |
| `security-audit` | `C:/Users/johno/.codex/skills/security-audit/SKILL.md` | Review native boundaries, bridge contracts, and sensitive flows |

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

Run the integrated quality gate for desktop and web-local builds, verify parity expectations, identify defects, and fix the high-value issues that block the full-build handoff.

## Dependencies

- Tasks `03` through `12`

## Source Docs

- `docs/Project_Requirements.md`
- `docs/architecture/system_architecture.md`
- `docs/Orchestrator_Review_Workflow.md`
- `docs/tasks/Takomi_V6_UI_Implementation_Plan.md`

## Scope

- Run typecheck, build, and relevant test suites
- Verify Electron and web-local startup flows
- Validate v6 workspace fidelity
- Review Codex runtime parity expectations
- Check IPC and bridge security boundaries
- Fix critical or important issues discovered during the hardening pass

## Out Of Scope

- New feature expansion
- Optional polish that does not affect MUS readiness

## Definition Of Done

- The integrated system has been reviewed end to end
- Blocking defects found in the hardening pass are fixed or explicitly documented
- Verification evidence exists for desktop and web-local paths
- Remaining risks are documented clearly for final synthesis

## Expected Artifacts

- Verification notes
- Review findings and fixes
- Updated task or repo notes where necessary

## Suggested Files To Create Or Modify

- Any implementation files needed to fix hardening findings
- verification artifacts or notes as appropriate

## Verification

- Run the primary test and build commands
- Exercise the key product surfaces in browser and desktop
- Run review and security audit tooling where possible

## Handoff Checklist

- Report findings by severity
- Record anything still blocked by external setup
- Confirm whether the repo is ready for final docs sync
