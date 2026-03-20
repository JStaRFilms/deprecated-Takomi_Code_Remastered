import type {
  RecoveryDescriptor,
  RecoveryAction,
  RecoveryFlow,
  RecoveryState,
  InterventionRequest,
  InterventionOutcome,
  RestoreSnapshotStore,
  AuditEventEnvelope,
  RecoveryAuditEventKind
} from '@takomi/contracts';

/**
 * Options for triggering a recovery flow.
 */
export interface TriggerRecoveryInput {
  readonly sessionId: string;
  readonly runId?: string;
  readonly flow: RecoveryFlow;
  readonly triggeredBy: RecoveryDescriptor['triggeredBy'];
  readonly triggerDetail?: string;
  readonly interventionId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Listener invoked when recovery state changes.
 */
export type RecoveryListener = (
  descriptor: RecoveryDescriptor,
  action?: RecoveryAction
) => void | Promise<void>;

/**
 * Dependencies for the recovery manager.
 */
export interface RecoveryManagerDeps {
  readonly snapshotStore: RestoreSnapshotStore;
  readonly saveRecovery: (descriptor: RecoveryDescriptor) => Promise<void>;
  readonly getRecovery: (id: string) => Promise<RecoveryDescriptor | undefined>;
  readonly listRecoveriesBySession: (sessionId: string) => Promise<readonly RecoveryDescriptor[]>;
  readonly listActiveRecoveries: () => Promise<readonly RecoveryDescriptor[]>;
  readonly saveRecoveryAction: (action: RecoveryAction) => Promise<void>;
  readonly listRecoveryActions: (recoveryId: string) => Promise<readonly RecoveryAction[]>;
  readonly appendAuditEvent: (event: AuditEventEnvelope) => Promise<void>;
  readonly resumeRun: (runId: string) => Promise<void>;
  readonly cancelRun: (runId: string) => Promise<void>;
  readonly sessionStatusLookup: (sessionId: string) => string;
}

/**
 * The RecoveryManager tracks recovery flows triggered by interventions,
 * failures, or manual actions. It maintains recovery state that survives reload
 * and surfaces run status after failures or pauses.
 */
export class RecoveryManager {
  private readonly deps: RecoveryManagerDeps;
  private readonly listeners = new Set<RecoveryListener>();
  private counter = 0;

  constructor(deps: RecoveryManagerDeps) {
    this.deps = deps;
  }

  /**
   * Subscribes to recovery state changes.
   */
  subscribe(listener: RecoveryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Triggers a new recovery flow for a session.
   * Creates a recovery descriptor and optionally a snapshot.
   */
  async trigger(input: TriggerRecoveryInput): Promise<RecoveryDescriptor> {
    this.counter++;
    const now = new Date().toISOString();
    const id = `recovery-${input.sessionId}-${this.counter}`;

    let snapshotId: string | undefined;
    if (input.flow === 'continue-build' || input.flow === 'reset') {
      try {
        const snapshot = await this.deps.snapshotStore.create({
          sessionId: input.sessionId,
          label: `recovery-snapshot-${id}`,
          session: {} as RecoveryDescriptor['metadata'] as never,
          transcript: {
            sessionId: input.sessionId,
            parts: [],
            lastUpdatedAt: now
          }
        });
        snapshotId = snapshot.id;
      } catch {
        // Snapshot creation is best-effort
      }
    }

    const descriptor: RecoveryDescriptor = {
      id,
      sessionId: input.sessionId,
      ...(input.runId !== undefined ? { runId: input.runId } : {}),
      flow: input.flow,
      state: 'pending',
      triggeredBy: input.triggeredBy,
      ...(input.triggerDetail !== undefined ? { triggerDetail: input.triggerDetail } : {}),
      ...(input.interventionId !== undefined ? { interventionId: input.interventionId } : {}),
      ...(snapshotId !== undefined ? { snapshotId } : {}),
      createdAt: now,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {})
    };

    await this.deps.saveRecovery(descriptor);

    // Write audit event
    await this.deps.appendAuditEvent({
      id: `audit-recovery-triggered-${id}`,
      kind: 'recovery.triggered',
      timestamp: now,
      subjectId: id,
      subjectType: 'intervention',
      sessionId: input.sessionId,
      runId: input.runId,
      data: {
        flow: input.flow,
        triggeredBy: input.triggeredBy,
        ...(input.triggerDetail !== undefined ? { triggerDetail: input.triggerDetail } : {}),
        ...(snapshotId !== undefined ? { snapshotId } : {})
      }
    });

    await this.notifyListeners(descriptor);
    return descriptor;
  }

  /**
   * Triggers recovery automatically from an intervention outcome.
   */
  async triggerFromIntervention(
    request: InterventionRequest,
    outcome: InterventionOutcome
  ): Promise<RecoveryDescriptor | null> {
    if (outcome.applied) {
      return null;
    }

    // Map intervention failure types to recovery flows
    let flow: RecoveryFlow;
    if (outcome.status === 'unsupported') {
      flow = 'escalate';
    } else if (outcome.status === 'failed') {
      flow = 'continue-build';
    } else {
      return null;
    }

    return this.trigger({
      sessionId: request.target.sessionId,
      ...(request.target.runId !== undefined ? { runId: request.target.runId } : {}),
      flow,
      triggeredBy: 'intervention',
      ...(outcome.detail !== undefined ? { triggerDetail: outcome.detail } : {}),
      interventionId: request.id
    });
  }

  /**
   * Triggers recovery from a session failure event.
   */
  async triggerFromFailure(
    sessionId: string,
    runId: string | undefined,
    errorDetail: string
  ): Promise<RecoveryDescriptor> {
    return this.trigger({
      sessionId,
      ...(runId !== undefined ? { runId } : {}),
      flow: 'continue-build',
      triggeredBy: 'failure',
      triggerDetail: errorDetail
    });
  }

  /**
   * Performs a recovery action: resume, restart, reroute, escalate, or snapshot-restore.
   */
  async performAction(
    recoveryId: string,
    action: RecoveryAction['action'],
    options: {
      readonly targetSessionId?: string;
      readonly targetRunId?: string;
      readonly snapshotId?: string;
    } = {}
  ): Promise<RecoveryAction> {
    const recovery = await this.deps.getRecovery(recoveryId);
    if (!recovery) {
      throw new Error(`Recovery not found: ${recoveryId}`);
    }

    const now = new Date().toISOString();
    let result: 'success' | 'failure' = 'success';
    let detail: string | undefined;
    let nextState: RecoveryState | null = null;

    try {
      switch (action) {
        case 'resume':
          if (recovery.runId) {
            await this.deps.resumeRun(recovery.runId);
          } else {
            throw new Error('No run ID available for resume');
          }
          break;

        case 'restart':
          if (recovery.runId) {
            await this.deps.cancelRun(recovery.runId);
            // Restart requires a new run — the caller must initiate it
            detail = 'Run cancelled; caller must initiate new run';
          }
          break;

        case 'reroute':
          // Reroute is handled by the intervention handler
          detail = 'Reroute delegated to intervention handler';
          break;

        case 'escalate':
          // Mark the recovery as escalated
          nextState = 'escalated';
          detail = 'Recovery escalated to manual handling';
          break;

        case 'snapshot-restore': {
          const snapshot = await this.deps.snapshotStore.getLatest(recovery.sessionId);
          if (!snapshot) {
            throw new Error('No snapshot available for restore');
          }
          detail = `Restored from snapshot: ${snapshot.id}`;
          break;
        }

        default:
          throw new Error(`Unknown recovery action: ${action as string}`);
      }
    } catch (error) {
      result = 'failure';
      detail = error instanceof Error ? error.message : 'Recovery action failed';
    }

    const recoveryAction: RecoveryAction = {
      id: `ract-${recoveryId}-${Date.now()}`,
      recoveryId,
      action,
      ...(options.targetSessionId !== undefined ? { targetSessionId: options.targetSessionId } : {}),
      ...(options.targetRunId !== undefined ? { targetRunId: options.targetRunId } : {}),
      ...(options.snapshotId !== undefined ? { snapshotId: options.snapshotId } : {}),
      performedAt: now,
      result,
      ...(detail !== undefined ? { detail } : {})
    };

    await this.deps.saveRecoveryAction(recoveryAction);

    // Update recovery state
    const newState: RecoveryState =
      result === 'failure'
        ? 'failed'
        : nextState ?? 'resolved';
    const updatedRecovery: RecoveryDescriptor = {
      ...recovery,
      state: newState,
      ...(newState === 'resolved' || newState === 'escalated' ? { resolvedAt: now } : {})
    };
    await this.deps.saveRecovery(updatedRecovery);

    // Write audit event
    await this.deps.appendAuditEvent({
      id: `audit-recovery-action-${recoveryAction.id}`,
      kind: 'recovery.action_performed',
      timestamp: now,
      subjectId: recoveryId,
      subjectType: 'intervention',
      sessionId: recovery.sessionId,
      runId: recovery.runId,
      data: {
        action,
        result,
        ...(detail !== undefined ? { detail } : {})
      }
    });

    await this.appendStateAuditEvent(newState, recovery, detail, now);
    await this.notifyListeners(updatedRecovery, recoveryAction);

    return recoveryAction;
  }

  /**
   * Gets the current state of a recovery flow.
   */
  async getRecovery(id: string): Promise<RecoveryDescriptor | undefined> {
    return this.deps.getRecovery(id);
  }

  /**
   * Lists all active (non-resolved, non-failed) recoveries.
   */
  async getActiveRecoveries(): Promise<readonly RecoveryDescriptor[]> {
    return this.deps.listActiveRecoveries();
  }

  /**
   * Lists all recoveries for a session.
   */
  async getSessionRecoveries(sessionId: string): Promise<readonly RecoveryDescriptor[]> {
    return this.deps.listRecoveriesBySession(sessionId);
  }

  /**
   * Gets actions performed for a recovery.
   */
  async getRecoveryActions(recoveryId: string): Promise<readonly RecoveryAction[]> {
    return this.deps.listRecoveryActions(recoveryId);
  }

  /**
   * Gets the surfaced run status for a session after failure or pause.
   * This is the primary hook the UI uses to surface recovery options.
   */
  async getRecoveryStatus(sessionId: string): Promise<{
    readonly hasActiveRecovery: boolean;
    readonly recovery: RecoveryDescriptor | null;
    readonly actions: readonly RecoveryAction[];
    readonly canResume: boolean;
    readonly canRestore: boolean;
  }> {
    const active = await this.deps.listActiveRecoveries();
    const sessionRecovery = active.find(r => r.sessionId === sessionId) ?? null;

    if (!sessionRecovery) {
      return {
        hasActiveRecovery: false,
        recovery: null,
        actions: [],
        canResume: false,
        canRestore: false
      };
    }

    const actions = await this.deps.listRecoveryActions(sessionRecovery.id);
    const status = this.deps.sessionStatusLookup(sessionId);

    return {
      hasActiveRecovery: true,
      recovery: sessionRecovery,
      actions,
      canResume: status === 'paused',
      canRestore: sessionRecovery.snapshotId !== undefined
    };
  }

  private async notifyListeners(
    descriptor: RecoveryDescriptor,
    action?: RecoveryAction
  ): Promise<void> {
    for (const listener of this.listeners) {
      await listener(descriptor, action);
    }
  }

  private async appendStateAuditEvent(
    state: RecoveryState,
    recovery: RecoveryDescriptor,
    detail: string | undefined,
    timestamp: string
  ): Promise<void> {
    const kindByState: Partial<Record<RecoveryState, RecoveryAuditEventKind>> = {
      resolved: 'recovery.resolved',
      failed: 'recovery.failed',
      escalated: 'recovery.escalated',
    };
    const kind = kindByState[state];
    if (!kind) {
      return;
    }

    await this.deps.appendAuditEvent({
      id: `audit-${kind}-${recovery.id}-${Date.now()}`,
      kind,
      timestamp,
      subjectId: recovery.id,
      subjectType: 'intervention',
      sessionId: recovery.sessionId,
      runId: recovery.runId,
      data: {
        flow: recovery.flow,
        state,
        ...(detail !== undefined ? { detail } : {})
      }
    });
  }
}
