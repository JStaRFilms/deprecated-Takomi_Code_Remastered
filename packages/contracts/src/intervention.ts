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
