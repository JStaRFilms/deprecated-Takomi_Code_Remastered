import type {
  NormalizedRuntimeEventKind,
  RuntimeTarget,
  RuntimeTransport
} from './constants.js';

export interface RuntimeRunRequest {
  readonly workspaceId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly taskId?: string;
  readonly parentRunId?: string | null;
  readonly runtimeTarget: RuntimeTarget;
  readonly transport: RuntimeTransport;
  readonly prompt?: string;
  readonly agentModeSlug?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface RuntimeRunHandle {
  readonly runId: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly runtimeTarget: RuntimeTarget;
  readonly transport: RuntimeTransport;
  readonly startedAt: string;
}

export interface RuntimeGuidanceRequest {
  readonly runId: string;
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly instruction: string;
  readonly context?: string;
}

export interface RuntimeRerouteRequest {
  readonly runId: string;
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly destinationSessionId?: string;
  readonly destinationRunId?: string;
  readonly reason?: string;
}

export interface RuntimeReplaceRequest {
  readonly runId: string;
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly replacementSessionId?: string;
  readonly replacementModeSlug?: string;
  readonly reason?: string;
}

export interface RuntimeMigrateRequest {
  readonly runId: string;
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly destinationWorkspaceId: string;
  readonly destinationWorktreeId?: string;
  readonly reason?: string;
}

export interface NormalizedRuntimeEvent {
  readonly id: string;
  readonly runId: string;
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly projectId?: string;
  readonly taskId?: string;
  readonly runtimeTarget: RuntimeTarget;
  readonly transport: RuntimeTransport;
  readonly kind: NormalizedRuntimeEventKind;
  readonly timestamp: string;
  readonly payload: Record<string, unknown>;
}

export type RuntimeEventEnvelope = NormalizedRuntimeEvent;

export type RuntimeEventListener = (event: RuntimeEventEnvelope) => void | Promise<void>;

export interface RuntimeSubscription {
  readonly close: () => void;
}

export interface RuntimeSessionRequest extends RuntimeRunRequest {}

export interface RuntimeSessionHandle extends RuntimeRunHandle {}

export interface CodexRuntimeManager {
  readonly kind: 'desktop-local' | 'remote';
  startRun(request: RuntimeRunRequest): Promise<RuntimeRunHandle>;
  cancelRun(runId: string): Promise<void>;
  pauseRun(runId: string): Promise<void>;
  resumeRun(runId: string): Promise<void>;
  injectGuidance(request: RuntimeGuidanceRequest): Promise<void>;
  rerouteRun(request: RuntimeRerouteRequest): Promise<void>;
  replaceRun(request: RuntimeReplaceRequest): Promise<void>;
  migrateRun(request: RuntimeMigrateRequest): Promise<void>;
  subscribe(listener: RuntimeEventListener): RuntimeSubscription;
  startSession?(request: RuntimeSessionRequest): Promise<RuntimeSessionHandle>;
  pushEvent?(event: RuntimeEventEnvelope): Promise<void>;
  closeSession?(sessionId: string): Promise<void>;
}
