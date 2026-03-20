import type {
  InterventionAction,
  InterventionOutcomeStatus,
  InterventionRequest,
  InterventionOutcome,
  InterventionTarget,
  AuditEventEnvelope,
  InterventionAuditEventKind,
  SessionDescriptor,
  SessionStatus
} from '@takomi/contracts';

/**
 * Represents the result of resolving an intervention target scope.
 */
export interface ResolvedScope {
  readonly target: InterventionTarget;
  readonly sessionIds: readonly string[];
  readonly runIds: readonly string[];
  readonly isSupported: boolean;
  readonly unsupportedReason?: string;
}

/**
 * Describes whether an action is allowed for a given session status.
 */
export interface ActionPolicyRule {
  readonly action: InterventionAction;
  readonly allowedStatuses: readonly SessionStatus[];
  readonly requiresRun: boolean;
  readonly supportedInBrowser: boolean;
}

/**
 * Default policy rules for each intervention action.
 * These define which session statuses allow each action,
 * whether an active run is required, and browser compatibility.
 */
export const DEFAULT_ACTION_POLICY: readonly ActionPolicyRule[] = [
  {
    action: 'pause',
    allowedStatuses: ['running'],
    requiresRun: true,
    supportedInBrowser: true
  },
  {
    action: 'resume',
    allowedStatuses: ['paused'],
    requiresRun: true,
    supportedInBrowser: true
  },
  {
    action: 'cancel',
    allowedStatuses: ['running', 'paused', 'idle'],
    requiresRun: false,
    supportedInBrowser: true
  },
  {
    action: 'guidance',
    allowedStatuses: ['running', 'paused'],
    requiresRun: true,
    supportedInBrowser: true
  },
  {
    action: 'reroute',
    allowedStatuses: ['running', 'paused'],
    requiresRun: true,
    supportedInBrowser: true
  },
  {
    action: 'replace',
    allowedStatuses: ['running', 'paused', 'failed'],
    requiresRun: false,
    supportedInBrowser: true
  },
  {
    action: 'migrate',
    allowedStatuses: ['running', 'paused', 'idle'],
    requiresRun: false,
    supportedInBrowser: false
  }
];

/**
 * Determines if a session status transition is valid for a given intervention action.
 */
export function isActionAllowedForStatus(
  action: InterventionAction,
  sessionStatus: SessionStatus,
  policy?: readonly ActionPolicyRule[]
): boolean {
  const rules = policy ?? DEFAULT_ACTION_POLICY;
  const rule = rules.find(r => r.action === action);
  if (!rule) return false;
  return (rule.allowedStatuses as readonly string[]).includes(sessionStatus);
}

/**
 * Checks if an action is supported on the given runtime target.
 */
export function isActionSupportedForTarget(
  action: InterventionAction,
  runtimeTarget: 'desktop-local' | 'remote',
  policy?: readonly ActionPolicyRule[]
): boolean {
  const rules = policy ?? DEFAULT_ACTION_POLICY;
  const rule = rules.find(r => r.action === action);
  if (!rule) return false;
  if (runtimeTarget === 'desktop-local') return true;
  return rule.supportedInBrowser;
}

/**
 * Resolves an intervention target into concrete session and run IDs.
 * For session-subtree targets, collects all descendant sessions.
 */
export function resolveInterventionScope(
  target: InterventionTarget,
  sessionLookup: (sessionId: string) => SessionDescriptor | null,
  descendantLookup: (rootSessionId: string) => readonly string[]
): ResolvedScope {
  const session = sessionLookup(target.sessionId);
  if (!session) {
    return {
      target,
      sessionIds: [],
      runIds: [],
      isSupported: false,
      unsupportedReason: `Session not found: ${target.sessionId}`
    };
  }

  switch (target.kind) {
    case 'current-run': {
      const runIds = target.runId ? [target.runId] : [];
      return {
        target,
        sessionIds: [target.sessionId],
        runIds,
        isSupported: true
      };
    }

    case 'child-run': {
      if (!target.childSessionId) {
        return {
          target,
          sessionIds: [],
          runIds: [],
          isSupported: false,
          unsupportedReason: 'child-run target requires childSessionId'
        };
      }
      const childSession = sessionLookup(target.childSessionId);
      if (!childSession) {
        return {
          target,
          sessionIds: [],
          runIds: [],
          isSupported: false,
          unsupportedReason: `Child session not found: ${target.childSessionId}`
        };
      }
      const runIds = target.runId ? [target.runId] : [];
      return {
        target,
        sessionIds: [target.childSessionId],
        runIds,
        isSupported: true
      };
    }

    case 'session-subtree': {
      const rootId = target.rootSessionId ?? target.sessionId;
      const descendantIds = descendantLookup(rootId);
      const allSessionIds = [rootId, ...descendantIds];
      return {
        target: { ...target, rootSessionId: rootId },
        sessionIds: allSessionIds,
        runIds: [],
        isSupported: true
      };
    }

    default:
      return {
        target,
        sessionIds: [],
        runIds: [],
        isSupported: false,
        unsupportedReason: `Unknown target kind: ${(target as InterventionTarget).kind}`
      };
  }
}

/**
 * Validates an intervention request against policy rules and returns
 * the initial outcome status.
 */
export function validateInterventionRequest(
  request: InterventionRequest,
  sessionStatus: SessionStatus,
  runtimeTarget: 'desktop-local' | 'remote',
  policy?: readonly ActionPolicyRule[]
): { valid: boolean; outcomeStatus: InterventionOutcomeStatus; reason?: string } {
  if (!isActionAllowedForStatus(request.action, sessionStatus, policy)) {
    return {
      valid: false,
      outcomeStatus: 'failed',
      reason: `Action '${request.action}' is not allowed for session status '${sessionStatus}'`
    };
  }

  if (!isActionSupportedForTarget(request.action, runtimeTarget, policy)) {
    return {
      valid: false,
      outcomeStatus: 'unsupported',
      reason: `Action '${request.action}' is not supported on '${runtimeTarget}' runtime`
    };
  }

  const rules = policy ?? DEFAULT_ACTION_POLICY;
  const rule = rules.find(r => r.action === request.action);
  if (rule?.requiresRun && !request.target.runId) {
    return {
      valid: false,
      outcomeStatus: 'failed',
      reason: `Action '${request.action}' requires an active run ID`
    };
  }

  return { valid: true, outcomeStatus: 'requested' };
}

/**
 * Creates an intervention outcome from a request.
 */
export function createInterventionOutcome(
  request: InterventionRequest,
  status: InterventionOutcomeStatus,
  options: {
    readonly detail?: string;
    readonly auditEventId?: string;
  } = {}
): InterventionOutcome {
  return {
    id: `outcome-${request.id}`,
    requestId: request.id,
    action: request.action,
    status,
    target: request.target,
    resolvedAt: new Date().toISOString(),
    supported: status !== 'unsupported',
    applied: status === 'applied',
    ...(options.detail !== undefined ? { detail: options.detail } : {}),
    ...(options.auditEventId !== undefined ? { auditEventId: options.auditEventId } : {})
  };
}

/**
 * Creates an audit event envelope for an intervention action.
 */
export function createInterventionAuditEvent(
  kind: InterventionAuditEventKind,
  request: InterventionRequest,
  options: {
    readonly outcomeStatus?: InterventionOutcomeStatus;
    readonly detail?: string;
    readonly actor?: AuditEventEnvelope['actor'];
    readonly correlationId?: string;
  } = {}
): AuditEventEnvelope<InterventionAuditEventKind> {
  return {
    id: `audit-${kind}-${request.id}-${Date.now()}`,
    kind,
    timestamp: new Date().toISOString(),
    subjectId: request.id,
    subjectType: 'intervention',
    workspaceId: undefined,
    sessionId: request.target.sessionId,
    runId: request.target.runId,
    ...(options.actor !== undefined ? { actor: options.actor } : {}),
    ...(options.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
    data: {
      action: request.action,
      targetKind: request.target.kind,
      requestedBy: request.requestedBy,
      ...(options.outcomeStatus !== undefined ? { outcomeStatus: options.outcomeStatus } : {}),
      ...(options.detail !== undefined ? { detail: options.detail } : {})
    }
  };
}
