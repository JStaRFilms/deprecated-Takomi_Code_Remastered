import type { RuntimeEventEnvelope, RuntimeTransport } from '@takomi/contracts';

export interface RuntimeSessionRequest {
  readonly workspaceId: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly transport: RuntimeTransport;
}

export interface RuntimeSessionHandle {
  readonly sessionId: string;
  readonly transport: RuntimeTransport;
  readonly startedAt: string;
}

export interface CodexRuntimeManager {
  readonly kind: 'desktop-local' | 'remote';
  startSession(request: RuntimeSessionRequest): Promise<RuntimeSessionHandle>;
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
