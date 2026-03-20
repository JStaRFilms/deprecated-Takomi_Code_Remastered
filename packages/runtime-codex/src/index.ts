import type { 
  RuntimeEventEnvelope, 
  RuntimeTransport,
  RuntimeRunHandle,
  RuntimeRunRequest,
  RuntimeGuidanceRequest,
  RuntimeRerouteRequest,
  RuntimeReplaceRequest,
  RuntimeMigrateRequest,
  RuntimeSessionRequest,
  RuntimeSessionHandle,
  RuntimeEventListener,
  RuntimeSubscription,
} from '@takomi/contracts';

export * from './state-map.js';
export * from './remote-transport.js';

export interface CodexRuntimeManager {
  readonly kind: 'desktop-local' | 'remote';
  startSession(request: RuntimeSessionRequest): Promise<RuntimeSessionHandle>;
  startRun(request: RuntimeRunRequest): Promise<RuntimeRunHandle>;
  cancelRun(runId: string): Promise<void>;
  pauseRun(runId: string): Promise<void>;
  resumeRun(runId: string): Promise<void>;
  injectGuidance(request: RuntimeGuidanceRequest): Promise<void>;
  rerouteRun(request: RuntimeRerouteRequest): Promise<void>;
  replaceRun(request: RuntimeReplaceRequest): Promise<void>;
  migrateRun(request: RuntimeMigrateRequest): Promise<void>;
  subscribe(listener: RuntimeEventListener): RuntimeSubscription;
  pushEvent(event: RuntimeEventEnvelope): Promise<void>;
  closeSession(sessionId: string): Promise<void>;
}

export function normalizeRuntimeEvent(
  event: RuntimeEventEnvelope,
  overrides: Partial<RuntimeEventEnvelope> = {}
): RuntimeEventEnvelope {
  return {
    ...event,
    ...overrides,
    id: overrides.id ?? event.id,
    sessionId: overrides.sessionId ?? event.sessionId,
    transport: overrides.transport ?? event.transport,
    timestamp: overrides.timestamp ?? event.timestamp,
    kind: overrides.kind ?? event.kind,
    payload: overrides.payload ?? event.payload
  };
}
