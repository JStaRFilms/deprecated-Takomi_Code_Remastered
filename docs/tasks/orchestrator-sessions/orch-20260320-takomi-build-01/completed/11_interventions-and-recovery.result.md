# Task Completion Summary

**Task:** 11_interventions-and-recovery
**Completed At:** 2026-03-20T18:39:25+01:00
**Mode:** vibe-code

## Results

Implemented the full intervention and recovery system for Takomi, spanning contracts, orchestration, persistence, runtime integration, and UI components.

### Intervention Actions Implemented
- **pause** / **resume** — pause and resume active runs
- **cancel** — cancel running or paused sessions
- **inject guidance** — push instructions to active agent runs
- **reroute** — redirect a run to a different session/run
- **replace** — swap a run with a different session or mode
- **migrate** — move a run to a different workspace/worktree

### Scope Targeting
- `current-run` — targets the specific run in the current session
- `child-run` — targets a run in a child session
- `session-subtree` — collects all descendant sessions for batch operations

### Audit Trail
Four audit event kinds wired end-to-end:
- `intervention.requested`
- `intervention.applied`
- `intervention.unsupported`
- `intervention.failed`

### Recovery Flows
Four recovery flow types with full state machine:
- `continue-build` — resume from last checkpoint
- `migrate` — move to different workspace
- `reset` — roll back to snapshot and retry
- `escalate` — flag for manual handling

### Recovery Actions
- `resume` — resume a paused run
- `restart` — cancel and allow new run initiation
- `reroute` — delegate to intervention handler
- `escalate` — mark for manual review
- `snapshot-restore` — restore from persisted snapshot

## Files Created/Modified

### Created
- `packages/orchestration/src/intervention-policy.ts` — Policy rules, scope resolution, validation, audit event creation
- `packages/orchestration/src/intervention-handler.ts` — Full lifecycle orchestration: validate → persist → dispatch → audit
- `packages/orchestration/src/recovery-manager.ts` — Recovery flows, state tracking, surfaced status for UI
- `packages/persistence/src/recovery-store.ts` — In-memory recovery descriptor and action persistence
- `packages/ui/src/components/InterventionControls.tsx` — Compact inline intervention action bar
- `packages/ui/src/components/RecoveryPrompt.tsx` — Recovery card with resume/restore/escalate actions

### Modified
- `packages/contracts/src/intervention.ts` — Added recovery types (RecoveryDescriptor, RecoveryAction, RecoveryFlow, RecoveryState)
- `packages/contracts/src/constants.ts` — Added RECOVERY_AUDIT_EVENT_KINDS and updated AUDIT_EVENT_KINDS
- `packages/contracts/src/persistence.ts` — Extended InterventionStore with listByRunId/listBySessionSubtree; added RecoveryStore interface; updated PersistenceAdapter
- `packages/orchestration/src/index.ts` — Exported intervention-policy, intervention-handler, recovery-manager
- `packages/persistence/src/intervention-store.ts` — Added listByRunId and listBySessionSubtree methods
- `packages/persistence/src/index.ts` — Added recovery store to factory and re-exports
- `packages/persistence/src/desktop-adapter.ts` — Added RecoveryStore, InterventionStore expanded methods
- `packages/persistence/src/web-adapter.ts` — Added RecoveryStore, InterventionStore expanded methods
- `packages/ui/src/index.ts` — Exported InterventionControls, deriveInterventionActions, RecoveryPrompt

## Verification Status
- [x] TypeScript: PASS
- [x] All contracts, orchestration, persistence, UI, and runtime-codex packages type-check cleanly

## Notes
- Subtree targeting for pause/cancel dispatch is scoped but does not individually dispatch to child run IDs yet — this requires per-child run lookup which depends on runtime event correlation. The policy and store layers are ready for this when run IDs become available per child session.
- The `migrate` action is marked desktop-only in the policy (not supported on remote/browser-safe runtime). The UI reflects this by disabling the button on remote targets.
- Recovery state survives reload via the persisted store. The RecoveryManager.getRecoveryStatus() method is the primary hook for UI surfaces to show recovery options after failures or pauses.
- The InterventionHandler uses a listener pattern so other systems (e.g., task graph engine) can react to intervention outcomes asynchronously.
