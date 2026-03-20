import type { IpcChannel } from './constants.js';

// --- Bridge server configuration ---

export interface BridgeServerConfig {
  readonly port: number;
  readonly host: string;
  readonly corsOrigins: readonly string[];
  readonly wsPath: string;
  readonly httpPrefix: string;
}

export const DEFAULT_BRIDGE_CONFIG: BridgeServerConfig = {
  port: 4545,
  host: '127.0.0.1',
  corsOrigins: ['http://localhost:3002', 'http://127.0.0.1:3002'],
  wsPath: '/ws',
  httpPrefix: '/bridge'
};

// --- Bridge capability detection ---

export interface BridgeCapabilityReport {
  readonly available: boolean;
  readonly version: string;
  readonly mode: 'web-local';
  readonly transport: readonly ('http' | 'websocket')[];
  readonly channels: readonly IpcChannel[];
  readonly capabilities: BridgeFeatureCapabilities;
  readonly endpoints: BridgeEndpointMap;
}

export interface BridgeFeatureCapabilities {
  readonly workspaceAccess: boolean;
  readonly filesystemAccess: boolean;
  readonly gitAccess: boolean;
  readonly worktreeSwitching: boolean;
  readonly sessionManagement: boolean;
  readonly runtimeControl: boolean;
  readonly eventStreaming: boolean;
  readonly interventionDelivery: boolean;
  readonly auditLog: boolean;
}

export interface BridgeEndpointMap {
  readonly http: string;
  readonly ws: string;
  readonly health: string;
  readonly capabilities: string;
}

// --- Bridge HTTP request/response ---

export interface BridgeHttpRequest {
  readonly channel: IpcChannel;
  readonly payload: Record<string, unknown>;
  readonly requestId?: string | undefined;
  readonly workspaceId?: string | undefined;
  readonly sessionId?: string | undefined;
}

export interface BridgeHttpResponse {
  readonly ok: boolean;
  readonly channel: IpcChannel;
  readonly payload: unknown;
  readonly requestId?: string | undefined;
  readonly error?: BridgeError | undefined;
  readonly timestamp: string;
}

export interface BridgeError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown> | undefined;
}

// --- Bridge WebSocket messages ---

export type BridgeWsChannel = IpcChannel | 'runtime-events' | 'audit-events';

export type BridgeWsMessageType = 'subscribe' | 'unsubscribe' | 'event' | 'response' | 'error';

export interface BridgeWsMessage {
  readonly type: BridgeWsMessageType;
  readonly channel?: BridgeWsChannel | undefined;
  readonly payload: unknown;
  readonly requestId?: string | undefined;
  readonly sessionId?: string | undefined;
  readonly runId?: string | undefined;
  readonly timestamp: string;
  readonly ok?: boolean | undefined;
  readonly error?: BridgeError | undefined;
}

export interface BridgeWsSubscriptionRequest {
  readonly type: 'subscribe';
  readonly channel: 'runtime-events' | 'audit-events';
  readonly sessionId?: string | undefined;
  readonly runId?: string | undefined;
}

export interface BridgeWsUnsubscribeRequest {
  readonly type: 'unsubscribe';
  readonly subscriptionId: string;
}
