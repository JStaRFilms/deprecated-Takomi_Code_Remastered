# Review Gate Protocol

**Session:** `orch-20260320-takomi-build-01`  
**Role:** Orchestration manager and review gatekeeper

## Purpose

This file defines how this session runs after task packets have been created. The user may delegate implementation to other agents, but this session remains the gatekeeper for approval, fixes, and next-task unlocks.

## Working Agreement

When the user says a task is done:

1. Check whether that task was actually the next valid task under the dependency graph.
2. Open the task file and review its definition of done before checking code.
3. Inspect the implementation, docs, and verification evidence.
4. Fix issues directly in the repo when doing so is faster and safer than bouncing the task back unchanged.
5. Re-run the most relevant verification after fixes.
6. Approve the task only if the repo state matches the task requirements.
7. Update the session records and then identify the next valid task.

When relevant, review must also confirm that `.agent/Takomi-Agents/` has been respected as the current source of default Takomi agent definitions and has not been bypassed by an incompatible replacement model.

## Approval Standard

A task gets a green light only when all of the following are true:

- Its dependencies were already approved.
- The implementation matches the assigned scope.
- The key verification for that task passes, or any external blocker is explicitly documented.
- The docs and task bookkeeping do not misrepresent repo reality.

## Non-Approval Cases

Do not approve a task if any of the following is true:

- The wrong task was implemented out of order.
- The implementation is partial but presented as done.
- The code exists but is not wired into the app path that matters.
- The claimed verification was not actually run, or the failing result is being ignored.
- The task changed locked interfaces without explicit reason and corresponding updates.

## Review Outputs

Each review should end with one of these outcomes:

- `Approved`: task passed; provide green light for the next valid task.
- `Changes requested`: task is close, but more work is needed; do not unlock the next task.
- `Blocked`: task cannot be approved because of dependency or external-tooling blockers; explain what must happen first.

## User Loop Note

After every review, also tell the user what they should personally inspect next. Keep it short and practical:

- visual UI to open or compare
- behavior to click through or sanity-check
- repo files worth skimming for confidence
- any mismatch between expected polish and current scaffold reality

## Next-Task Rule

Only one next task should be green-lit at a time unless the dependency graph clearly allows a parallel window. For this session:

- Start with Task `01`.
- After Task `02` is approved, Tasks `04`, `06`, and `07` may be green-lit in parallel.
- Task `08` must wait until Task `03` is approved.
- Tasks `09`, `10`, and `11` stay locked until their runtime and persistence dependencies are approved.

## Session Files To Update During Reviews

- `master_plan.md`
- `Orchestrator_Summary.md`
- task location changes between `pending/`, `in-progress/`, and `completed/` when warranted

## Source References

- `docs/Orchestrator_Review_Workflow.md`
- `docs/tasks/orchestrator-sessions/orch-20260320-takomi-build-01/master_plan.md`
