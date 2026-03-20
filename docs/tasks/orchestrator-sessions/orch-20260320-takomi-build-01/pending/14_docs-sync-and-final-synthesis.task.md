# Task 14: Docs Sync And Final Synthesis

**Status:** Pending  
**Priority:** High  
**Mode / Workflow:** `mode-review` / `vibe-syncDocs`

## Agent Setup (Do This First)

### Workflow To Follow
Read `C:/Users/johno/.codex/skills/takomi/workflows/vibe-syncDocs.md` first, then use the review discipline needed to confirm the docs match implementation reality.

### Prime Agent Context
Run `vibe-primeAgent` first using `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md`.

### Session Skills Registry
This orchestration session is limited to:
`takomi`, `spawn-task`, `monorepo-management`, `nextjs-standards`, `frontend-design`, `webapp-testing`, `sync-docs`, `jstar-reviewer`, `security-audit`

### Required Skills

| Skill | Path | Why |
|---|---|---|
| `takomi` | `C:/Users/johno/.codex/skills/takomi/SKILL.md` | Keep the final synthesis aligned with the orchestration session |
| `sync-docs` | `C:/Users/johno/.codex/skills/sync-docs/SKILL.md` | Update docs to reflect the implemented system accurately |
| `jstar-reviewer` | `C:/Users/johno/.codex/skills/jstar-reviewer/SKILL.md` | Support final verification-oriented review language where needed |

## Execution Note

1. Read the assigned Takomi workflow first.
2. Run `vibe-primeAgent`.
3. Load only the required skills listed in this file.
4. Read the linked source docs for this slice.
5. Implement only this task scope.
6. Run task-local verification before handoff.
7. Send the result to review.
8. If review fails, reopen this same task and fix it.
9. Only after review passes, move this task to `completed/` and close the session.

## Objective

Update implementation-facing docs, produce the final orchestrator synthesis, and verify that the repository documentation matches the code and MUS scope that actually shipped.

## Dependencies

- Task `13_integration-hardening.task.md`

## Source Docs

- `docs/Project_Requirements.md`
- `docs/PLAN.md`
- `docs/Builder_Handoff_Report.md`
- `docs/Orchestrator_Review_Workflow.md`
- `docs/tasks/orchestrator-sessions/orch-20260320-takomi-build-01/master_plan.md`

## Scope

- Update docs that drifted during implementation
- Update this session's `master_plan.md` statuses if needed
- Complete `Orchestrator_Summary.md`
- Summarize build status, parity status, v6 fidelity, interop status, risks, and recommended next wave
- Ensure MUS coverage is represented honestly

## Out Of Scope

- New implementation work unless needed to correct misleading docs
- Replanning the full project from scratch

## Definition Of Done

- Documentation reflects actual implementation state
- `Orchestrator_Summary.md` is complete and useful
- Remaining gaps are clearly named rather than hidden
- The session is ready for final handoff or next-wave planning

## Expected Artifacts

- Updated docs
- Completed orchestrator summary
- Final notes on blockers, tradeoffs, and next steps

## Suggested Files To Create Or Modify

- `docs/tasks/orchestrator-sessions/orch-20260320-takomi-build-01/master_plan.md`
- `docs/tasks/orchestrator-sessions/orch-20260320-takomi-build-01/Orchestrator_Summary.md`
- any implementation docs that drifted during the build

## Verification

- Cross-check docs against the actual code and verification outputs
- Confirm summary status lines match reality
- Confirm the task chain is reflected accurately

## Handoff Checklist

- Mark what shipped
- Mark what remains
- Mark what is risky
- Mark what should be done next
