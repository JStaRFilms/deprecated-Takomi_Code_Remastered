import type {
  InterventionAction,
  InterventionRequest,
  InterventionOutcome,
  InterventionStore,
  AuditEventStore,
  AuditEventEnvelope,
  InterventionAuditEventKind,
  SessionDescriptor,
  SessionStatus,
  RuntimeGuidanceRequest,
  RuntimeRerouteRequest,
  RuntimeReplaceRequest,
  RuntimeMigrateRequest,
} from '@takomi/contracts';

import type { CodexRuntimeManager } from '@takomi/runtime-codex';

import {
  validateInterventionRequest,
  resolveInterventionScope,
  createInterventionOutcome,
  createInterventionAuditEvent,
  type ResolvedScope,
  type ActionPolicyRule
} from './intervention-policy.js';

/**
 * Listener invoked after an intervention is processed.
 */
export type InterventionListener = (
  request: InterventionRequest,
  outcome: InterventionOutcome,
  scope: ResolvedScope
) => void | Promise<void>;

/**
 * Dependencies for the intervention handler.
 */
export interface InterventionHandlerDeps {
  readonly interventionStore: InterventionStore;
  readonly auditStore: AuditEventStore;
  readonly runtimeManager: CodexRuntimeManager;
  readonly sessionLookup: (sessionId: string) => SessionDescriptor | null;
  readonly descendantLookup: (rootSessionId: string) => readonly string[];
  readonly sessionStatusLookup: (sessionId: string) => SessionStatus;
  readonly policy?: readonly ActionPolicyRule[];
}

/**
 * The InterventionHandler orchestrates the full lifecycle of an intervention:
 * 1. Resolves scope
 * 2. Validates against policy
 * 3. Persists the request
 * 4. Dispatches to the runtime
 * 5. Records the outcome
 * 6. Writes audit events
 *
 * It is the single entry point for all intervention operations.
 */
export class InterventionHandler {
  private readonly deps: InterventionHandlerDeps;
  private readonly listeners = new Set<InterventionListener>();

  constructor(deps: InterventionHandlerDeps) {
    this.deps = deps;
  }

  /**
   * Subscribes to intervention completion events.
   * Returns an unsubscribe function.
   */
  subscribe(listener: InterventionListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Processes an intervention request end-to-end.
   * Returns the outcome record.
   */
  async handleRequest(request: InterventionRequest): Promise<InterventionOutcome> {
    // 1. Persist the request
    await this.deps.interventionStore.saveRequest(request);

    // 2. Resolve scope
    const scope = resolveInterventionScope(
      request.target,
      this.deps.sessionLookup,
      this.deps.descendantLookup
    );

    if (!scope.isSupported) {
      const detail = scope.unsupportedReason ?? 'Scope resolution failed';
      const outcome = createInterventionOutcome(request, 'unsupported', {
        detail
      });
      await this.deps.interventionStore.saveOutcome(outcome);
      const auditEvent = createInterventionAuditEvent('intervention.unsupported', request, {
        outcomeStatus: 'unsupported',
        detail
      });
      await this.appendAuditEvent(auditEvent);
      await this.notifyListeners(request, outcome, scope);
      return outcome;
    }

    // 3. Validate against policy
    const sessionStatus = this.deps.sessionStatusLookup(request.target.sessionId);
    const runtimeTarget = this.deps.runtimeManager.kind;
    const validation = validateInterventionRequest(
      request,
      sessionStatus,
      runtimeTarget,
      this.deps.policy
    );

    if (validation.outcomeStatus === 'unsupported') {
      const detail = validation.reason;
      const outcome = createInterventionOutcome(request, 'unsupported', {
        ...(detail !== undefined ? { detail } : {})
      });
      await this.deps.interventionStore.saveOutcome(outcome);
      const auditEvent = createInterventionAuditEvent('intervention.unsupported', request, {
        outcomeStatus: 'unsupported',
        ...(detail !== undefined ? { detail } : {})
      });
      await this.appendAuditEvent(auditEvent);
      await this.notifyListeners(request, outcome, scope);
      return outcome;
    }

    if (validation.outcomeStatus === 'failed') {
      const detail = validation.reason;
      const outcome = createInterventionOutcome(request, 'failed', {
        ...(detail !== undefined ? { detail } : {})
      });
      await this.deps.interventionStore.saveOutcome(outcome);
      const auditEvent = createInterventionAuditEvent('intervention.failed', request, {
        outcomeStatus: 'failed',
        ...(detail !== undefined ? { detail } : {})
      });
      await this.appendAuditEvent(auditEvent);
      await this.notifyListeners(request, outcome, scope);
      return outcome;
    }

    // 4. Write requested audit event
    const requestedAuditEvent = createInterventionAuditEvent('intervention.requested', request, {
      outcomeStatus: 'requested'
    });
    await this.appendAuditEvent(requestedAuditEvent);

    // 5. Dispatch to runtime
    try {
      await this.dispatchToRuntime(request, scope);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Runtime dispatch failed';
      const outcome = createInterventionOutcome(request, 'failed', {
        detail,
        auditEventId: requestedAuditEvent.id
      });
      await this.deps.interventionStore.saveOutcome(outcome);
      const failedAuditEvent = createInterventionAuditEvent('intervention.failed', request, {
        outcomeStatus: 'failed',
        detail
      });
      await this.appendAuditEvent(failedAuditEvent);
      await this.notifyListeners(request, outcome, scope);
      return outcome;
    }

    // 6. Record applied outcome
    const outcome = createInterventionOutcome(request, 'applied', {
      auditEventId: requestedAuditEvent.id
    });
    await this.deps.interventionStore.saveOutcome(outcome);
    const appliedAuditEvent = createInterventionAuditEvent('intervention.applied', request, {
      outcomeStatus: 'applied'
    });
    await this.appendAuditEvent(appliedAuditEvent);
    await this.notifyListeners(request, outcome, scope);
    return outcome;
  }

  /**
   * Gets the outcome for a previously submitted intervention request.
   */
  async getOutcome(requestId: string): Promise<InterventionOutcome | undefined> {
    return this.deps.interventionStore.getOutcome(requestId);
  }

  /**
   * Lists all intervention requests for a session.
   */
  async listRequests(sessionId: string): Promise<readonly InterventionRequest[]> {
    return this.deps.interventionStore.listRequests(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private async dispatchToRuntime(
    request: InterventionRequest,
    scope: ResolvedScope
  ): Promise<void> {
    const runId = request.target.runId;
    const sessionId = request.target.sessionId;
    const session = this.deps.sessionLookup(sessionId);
    const workspaceId = session?.workspaceId ?? '';

    switch (request.action) {
      case 'pause':
        if (runId) {
          await this.deps.runtimeManager.pauseRun(runId);
        }
        break;

      case 'resume':
        if (runId) {
          await this.deps.runtimeManager.resumeRun(runId);
        }
        break;

      case 'cancel':
        if (runId) {
          await this.deps.runtimeManager.cancelRun(runId);
        }
        break;

      case 'guidance': {
        const payload = request.payload as { instruction: string; context?: string };
        const guidanceRequest: RuntimeGuidanceRequest = {
          runId: runId ?? '',
          sessionId,
          workspaceId,
          instruction: payload.instruction,
          ...(payload.context !== undefined ? { context: payload.context } : {})
        };
        await this.deps.runtimeManager.injectGuidance(guidanceRequest);
        break;
      }

      case 'reroute': {
        const payload = request.payload as { destinationSessionId?: string; destinationRunId?: string; reason?: string };
        const rerouteRequest: RuntimeRerouteRequest = {
          runId: runId ?? '',
          sessionId,
          workspaceId,
          ...(payload.destinationSessionId !== undefined ? { destinationSessionId: payload.destinationSessionId } : {}),
          ...(payload.destinationRunId !== undefined ? { destinationRunId: payload.destinationRunId } : {}),
          ...(payload.reason !== undefined ? { reason: payload.reason } : {})
        };
        await this.deps.runtimeManager.rerouteRun(rerouteRequest);
        break;
      }

      case 'replace': {
        const payload = request.payload as { replacementSessionId?: string; replacementModeSlug?: string; reason?: string };
        const replaceRequest: RuntimeReplaceRequest = {
          runId: runId ?? '',
          sessionId,
          workspaceId,
          ...(payload.replacementSessionId !== undefined ? { replacementSessionId: payload.replacementSessionId } : {}),
          ...(payload.replacementModeSlug !== undefined ? { replacementModeSlug: payload.replacementModeSlug } : {}),
          ...(payload.reason !== undefined ? { reason: payload.reason } : {})
        };
        await this.deps.runtimeManager.replaceRun(replaceRequest);
        break;
      }

      case 'migrate': {
        const payload = request.payload as { destinationWorkspaceId: string; destinationWorktreeId?: string; reason?: string };
        const migrateRequest: RuntimeMigrateRequest = {
          runId: runId ?? '',
          sessionId,
          workspaceId,
          destinationWorkspaceId: payload.destinationWorkspaceId,
          ...(payload.destinationWorktreeId !== undefined ? { destinationWorktreeId: payload.destinationWorktreeId } : {}),
          ...(payload.reason !== undefined ? { reason: payload.reason } : {})
        };
        await this.deps.runtimeManager.migrateRun(migrateRequest);
        break;
      }

      default:
        throw new Error(`Unknown intervention action: ${request.action as string}`);
    }

    // For session-subtree targets, iterate over all descendant sessions
    if (request.target.kind === 'session-subtree' && scope.sessionIds.length > 1) {
      for (const sid of scope.sessionIds) {
        if (sid === sessionId) continue;
        // Subtree dispatch is limited to pause/cancel for safety
        if (request.action === 'pause' || request.action === 'cancel') {
          // Each child session would need its own run lookup — for now, skip
          // individual run dispatch and rely on the parent-level action
        }
      }
    }
  }

  private async appendAuditEvent(
    event: AuditEventEnvelope<InterventionAuditEventKind>
  ): Promise<void> {
    await this.deps.auditStore.append([event as AuditEventEnvelope]);
  }

  private async notifyListeners(
    request: InterventionRequest,
    outcome: InterventionOutcome,
    scope: ResolvedScope
  ): Promise<void> {
    for (const listener of this.listeners) {
      await listener(request, outcome, scope);
    }
  }
}
