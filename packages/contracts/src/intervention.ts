import type {
  InterventionAction,
  InterventionOutcomeStatus,
  TakomiAgentModeSlug
} from './constants.js';

export interface InterventionTarget {
  readonly kind: 'current-run' | 'child-run' | 'session-subtree';
  readonly sessionId: string;
  readonly runId?: string;
  readonly childSessionId?: string;
  readonly rootSessionId?: string;
}

export interface GuidanceInterventionPayload {
  readonly instruction: string;
  readonly context?: string;
}

export interface PauseResumeInterventionPayload {
  readonly reason?: string;
}

export interface CancelInterventionPayload {
  readonly reason?: string;
}

export interface RerouteInterventionPayload {
  readonly destinationSessionId?: string;
  readonly destinationRunId?: string;
  readonly reason?: string;
}

export interface ReplaceInterventionPayload {
  readonly replacementSessionId?: string;
  readonly replacementModeSlug?: TakomiAgentModeSlug;
  readonly reason?: string;
}

export interface MigrateInterventionPayload {
  readonly destinationWorkspaceId: string;
  readonly destinationWorktreeId?: string;
  readonly reason?: string;
}

export interface InterventionPayloadMap {
  readonly guidance: GuidanceInterventionPayload;
  readonly pause: PauseResumeInterventionPayload;
  readonly resume: PauseResumeInterventionPayload;
  readonly cancel: CancelInterventionPayload;
  readonly reroute: RerouteInterventionPayload;
  readonly replace: ReplaceInterventionPayload;
  readonly migrate: MigrateInterventionPayload;
}

export type InterventionPayload<TAction extends InterventionAction = InterventionAction> = InterventionPayloadMap[TAction];

export interface InterventionRequest<TAction extends InterventionAction = InterventionAction> {
  readonly id: string;
  readonly action: TAction;
  readonly target: InterventionTarget;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly payload: InterventionPayload<TAction>;
  readonly correlationId?: string;
}

export interface InterventionOutcome<TAction extends InterventionAction = InterventionAction> {
  readonly id: string;
  readonly requestId: string;
  readonly action: TAction;
  readonly status: InterventionOutcomeStatus;
  readonly target: InterventionTarget;
  readonly resolvedAt: string;
  readonly supported: boolean;
  readonly applied: boolean;
  readonly detail?: string;
  readonly auditEventId?: string;
}

// ---------------------------------------------------------------------------
// Recovery Types
// ---------------------------------------------------------------------------

export const RECOVERY_FLOWS = ['continue-build', 'migrate', 'reset', 'escalate'] as const;
export type RecoveryFlow = (typeof RECOVERY_FLOWS)[number];

export const RECOVERY_STATES = ['pending', 'in-progress', 'resolved', 'failed', 'escalated'] as const;
export type RecoveryState = (typeof RECOVERY_STATES)[number];

export interface RecoveryDescriptor {
  readonly id: string;
  readonly sessionId: string;
  readonly runId?: string;
  readonly flow: RecoveryFlow;
  readonly state: RecoveryState;
  readonly triggeredBy: 'intervention' | 'failure' | 'timeout' | 'manual';
  readonly triggerDetail?: string;
  readonly interventionId?: string;
  readonly snapshotId?: string;
  readonly createdAt: string;
  readonly resolvedAt?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface RecoveryAction {
  readonly id: string;
  readonly recoveryId: string;
  readonly action: 'resume' | 'restart' | 'reroute' | 'escalate' | 'snapshot-restore';
  readonly targetSessionId?: string;
  readonly targetRunId?: string;
  readonly snapshotId?: string;
  readonly performedAt: string;
  readonly result: 'success' | 'failure';
  readonly detail?: string;
}
