import type {
  RuntimeEventEnvelope,
  RuntimeEventListener,
  RuntimeSubscription,
  RuntimeRunHandle,
  RuntimeGuidanceRequest,
  RuntimeRerouteRequest,
  RuntimeReplaceRequest,
  RuntimeMigrateRequest,
  RuntimeSessionHandle,
  RuntimeSessionRequest,
  RuntimeTarget,
  RuntimeTransport,
} from '@takomi/contracts';
import type { CodexRuntimeManager as ICodexRuntimeManager } from '@takomi/runtime-codex';
import { NORMALIZED_RUNTIME_EVENT_KINDS } from '@takomi/contracts';

interface ActiveRun {
  runId: string;
  workspaceId: string;
  projectId: string;
  sessionId: string;
  runtimeTarget: RuntimeTarget;
  transport: RuntimeTransport;
  startedAt: string;
  status: 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
}

export class DesktopCodexRuntimeManager implements ICodexRuntimeManager {
  readonly kind: 'desktop-local' = 'desktop-local';

  private listeners: Set<RuntimeEventListener> = new Set();
  private activeRuns: Map<string, ActiveRun> = new Map();
  private sessionMap: Map<string, RuntimeSessionHandle> = new Map();

  async startSession(request: RuntimeSessionRequest): Promise<RuntimeSessionHandle> {
    const sessionId = request.sessionId || `session-${Date.now()}`;
    const runtimeTarget: RuntimeTarget = request.runtimeTarget || 'desktop-local';
    const transport: RuntimeTransport = request.transport || 'local';
    const startedAt = new Date().toISOString();
    
    const handle: RuntimeSessionHandle = {
      runId: '',
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      sessionId,
      runtimeTarget,
      transport,
      startedAt,
    };

    this.sessionMap.set(sessionId, handle);

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId: '',
      sessionId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      runtimeTarget,
      transport,
      kind: NORMALIZED_RUNTIME_EVENT_KINDS[0],
      timestamp: startedAt,
      payload: { message: 'Session started' },
    });

    return handle;
  }

  async startRun(request: {
    workspaceId: string;
    projectId: string;
    sessionId: string;
    taskId?: string;
    parentRunId?: string;
    runtimeTarget: RuntimeTarget;
    transport: RuntimeTransport;
    prompt?: string;
    agentModeSlug?: string;
    metadata?: Record<string, unknown>;
  }): Promise<RuntimeRunHandle> {
    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const startedAt = new Date().toISOString();

    const activeRun: ActiveRun = {
      runId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      sessionId: request.sessionId,
      runtimeTarget: request.runtimeTarget,
      transport: request.transport,
      startedAt,
      status: 'running',
    };

    this.activeRuns.set(runId, activeRun);

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      taskId: request.taskId,
      runtimeTarget: request.runtimeTarget,
      transport: request.transport,
      kind: 'run.starting',
      timestamp: startedAt,
      payload: {
        prompt: request.prompt,
        agentModeSlug: request.agentModeSlug,
        metadata: request.metadata,
      },
    });

    return {
      runId,
      workspaceId: request.workspaceId,
      projectId: request.projectId,
      sessionId: request.sessionId,
      runtimeTarget: request.runtimeTarget,
      transport: request.transport,
      startedAt,
    };
  }

  async cancelRun(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    run.status = 'cancelled';
    this.activeRuns.set(runId, run);

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId,
      sessionId: run.sessionId,
      workspaceId: run.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.cancelled',
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }

  async pauseRun(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    run.status = 'paused';
    this.activeRuns.set(runId, run);

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId,
      sessionId: run.sessionId,
      workspaceId: run.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.paused',
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }

  async resumeRun(runId: string): Promise<void> {
    const run = this.activeRuns.get(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    run.status = 'running';
    this.activeRuns.set(runId, run);

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId,
      sessionId: run.sessionId,
      workspaceId: run.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.resumed',
      timestamp: new Date().toISOString(),
      payload: {},
    });
  }

  async injectGuidance(request: RuntimeGuidanceRequest): Promise<void> {
    const run = this.activeRuns.get(request.runId);
    if (!run) {
      throw new Error(`Run not found: ${request.runId}`);
    }

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId: request.runId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.streaming',
      timestamp: new Date().toISOString(),
      payload: {
        instruction: request.instruction,
        context: request.context,
        type: 'guidance',
      },
    });
  }

  async rerouteRun(request: RuntimeRerouteRequest): Promise<void> {
    const run = this.activeRuns.get(request.runId);
    if (!run) {
      throw new Error(`Run not found: ${request.runId}`);
    }

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId: request.runId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.streaming',
      timestamp: new Date().toISOString(),
      payload: {
        destinationSessionId: request.destinationSessionId,
        destinationRunId: request.destinationRunId,
        reason: request.reason,
        type: 'reroute',
      },
    });
  }

  async replaceRun(request: RuntimeReplaceRequest): Promise<void> {
    const run = this.activeRuns.get(request.runId);
    if (!run) {
      throw new Error(`Run not found: ${request.runId}`);
    }

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId: request.runId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.streaming',
      timestamp: new Date().toISOString(),
      payload: {
        replacementSessionId: request.replacementSessionId,
        replacementModeSlug: request.replacementModeSlug,
        reason: request.reason,
        type: 'replace',
      },
    });
  }

  async migrateRun(request: RuntimeMigrateRequest): Promise<void> {
    const run = this.activeRuns.get(request.runId);
    if (!run) {
      throw new Error(`Run not found: ${request.runId}`);
    }

    this.emitEvent({
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      runId: request.runId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      projectId: run.projectId,
      runtimeTarget: run.runtimeTarget,
      transport: run.transport,
      kind: 'run.streaming',
      timestamp: new Date().toISOString(),
      payload: {
        destinationWorkspaceId: request.destinationWorkspaceId,
        destinationWorktreeId: request.destinationWorktreeId,
        reason: request.reason,
        type: 'migrate',
      },
    });
  }

  subscribe(listener: RuntimeEventListener): RuntimeSubscription {
    this.listeners.add(listener);

    return {
      close: () => {
        this.listeners.delete(listener);
      },
    };
  }

  async pushEvent(event: RuntimeEventEnvelope): Promise<void> {
    this.emitEvent(event);
  }

  async closeSession(sessionId: string): Promise<void> {
    this.sessionMap.delete(sessionId);

    for (const [runId, run] of this.activeRuns.entries()) {
      if (run.sessionId === sessionId) {
        run.status = 'completed';
        this.activeRuns.set(runId, run);
      }
    }
  }

  close(): void {
    this.listeners.clear();
    this.activeRuns.clear();
    this.sessionMap.clear();
  }

  private emitEvent(event: RuntimeEventEnvelope): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in runtime event listener:', error);
      }
    }
  }
}

export function createDesktopCodexRuntimeManager(): DesktopCodexRuntimeManager {
  return new DesktopCodexRuntimeManager();
}
