import type {
  SessionStatus,
  OrchestrationSessionStore,
  TaskGraphStore
} from '@takomi/contracts';

/**
 * Represents a background child run that executes without blocking the parent.
 */
export interface BackgroundChildRun {
  readonly childSessionId: string;
  readonly parentSessionId: string;
  readonly taskId: string | null;
  readonly status: SessionStatus;
  readonly startedAt: string;
  readonly updatedAt: string;
}

/**
 * Listener for background child run status changes.
 */
export type BackgroundRunListener = (run: BackgroundChildRun) => void;

/**
 * Manages background child execution.
 * Child runs execute in parallel with the parent session and report
 * status updates through listeners without blocking the parent workspace.
 */
export class BackgroundExecutor {
  private activeRuns = new Map<string, BackgroundChildRun>();
  private listeners = new Set<BackgroundRunListener>();

  /**
   * Registers a background child run.
   * Called when a child session is created for delegated work.
   */
  registerRun(
    childSessionId: string,
    parentSessionId: string,
    taskId: string | null = null
  ): BackgroundChildRun {
    const now = new Date().toISOString();
    const run: BackgroundChildRun = {
      childSessionId,
      parentSessionId,
      taskId,
      status: 'idle',
      startedAt: now,
      updatedAt: now
    };

    this.activeRuns.set(childSessionId, run);
    this.notifyListeners(run);
    return run;
  }

  /**
   * Updates the status of a background child run.
   */
  updateRunStatus(
    childSessionId: string,
    status: SessionStatus
  ): BackgroundChildRun | null {
    const existing = this.activeRuns.get(childSessionId);
    if (!existing) {
      return null;
    }

    const updated: BackgroundChildRun = {
      ...existing,
      status,
      updatedAt: new Date().toISOString()
    };

    this.activeRuns.set(childSessionId, updated);
    this.notifyListeners(updated);

    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      this.activeRuns.delete(childSessionId);
    }

    return updated;
  }

  /**
   * Gets the current state of a background child run.
   */
  getRun(childSessionId: string): BackgroundChildRun | null {
    return this.activeRuns.get(childSessionId) ?? null;
  }

  /**
   * Lists all active background runs for a given parent session.
   * These are the runs that have not yet completed, failed, or been cancelled.
   */
  getActiveRunsForParent(parentSessionId: string): readonly BackgroundChildRun[] {
    return Array.from(this.activeRuns.values())
      .filter(run => run.parentSessionId === parentSessionId);
  }

  /**
   * Lists all currently active background runs across all parents.
   */
  getAllActiveRuns(): readonly BackgroundChildRun[] {
    return Array.from(this.activeRuns.values());
  }

  /**
   * Subscribes to background run status changes.
   * Returns an unsubscribe function.
   */
  subscribe(listener: BackgroundRunListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Synchronizes active runs with the session store.
   * Rebuilds the active run map from persisted session state.
   * Call this after a reload to restore background run tracking.
   */
  async syncFromStore(
    sessionStore: OrchestrationSessionStore,
    _taskGraphStore: TaskGraphStore
  ): Promise<void> {
    this.activeRuns.clear();
    const allSessions = await sessionStore.list();

    for (const session of allSessions) {
      if (session.rootSessionId === session.id) {
        continue;
      }

      if (
        session.status === 'running' ||
        session.status === 'paused' ||
        session.status === 'idle'
      ) {
        const existing = this.activeRuns.get(session.id);
        if (!existing) {
          const now = new Date().toISOString();
          const run: BackgroundChildRun = {
            childSessionId: session.id,
            parentSessionId: session.parentSessionId ?? session.rootSessionId,
            taskId: session.taskGraphRootNodeId ?? null,
            status: session.status,
            startedAt: session.createdAt ?? now,
            updatedAt: session.updatedAt ?? now
          };
          this.activeRuns.set(session.id, run);
        }
      }
    }
  }

  private notifyListeners(run: BackgroundChildRun): void {
    for (const listener of this.listeners) {
      try {
        listener(run);
      } catch {
        // Listener errors must not propagate and break other listeners
      }
    }
  }
}
