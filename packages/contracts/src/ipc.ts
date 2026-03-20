import type { IpcChannel, RuntimeTarget, RuntimeTransport, SessionKind } from './constants.js';
import type { AuditEventEnvelope } from './audit.js';
import type { InterventionRequest } from './intervention.js';
import type { RuntimeEventEnvelope, RuntimeSessionRequest } from './runtime.js';

export interface TransportEnvelope<TChannel extends string, TPayload> {
  readonly id: string;
  readonly channel: TChannel;
  readonly payload: TPayload;
  readonly workspaceId?: string;
  readonly sessionId?: string;
  readonly requestId?: string;
  readonly timestamp?: string;
  readonly version?: number;
}

export interface IpcEnvelope<TPayload> extends TransportEnvelope<IpcChannel, TPayload> {}

export interface IpcResponseEnvelope<TPayload> extends TransportEnvelope<IpcChannel, TPayload> {
  readonly ok: boolean;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

export interface WorkspaceListIpcPayload {
  readonly rootPath?: string;
  readonly includeArchived?: boolean;
}

export interface WorkspaceOpenIpcPayload {
  readonly path: string;
}

export interface WorkspaceStatusIpcPayload {
  readonly workspaceId: string;
}

export interface WorkspaceWorktreeCreateIpcPayload {
  readonly workspaceId: string;
  readonly branchName: string;
  readonly taskSlug: string;
  /** Human-readable label, e.g. "takomi-refactor-auth-agent-1" */
  readonly label: string;
  /** Optional: run bootstrap after creation (env carryover + dependency install) */
  readonly runBootstrap?: boolean;
  /** Optional: allowlist of env files to carry over (defaults to project config) */
  readonly envCarryoverAllowlist?: readonly string[];
  /** Optional: run dependency install (e.g. pnpm install) after worktree creation */
  readonly installDependencies?: boolean;
  readonly reason?: string;
}

export interface WorkspaceWorktreeSwitchIpcPayload {
  readonly workspaceId: string;
  readonly worktreeId: string;
  readonly sessionSubtreeRootSessionId?: string;
  readonly reason?: string;
}

export interface WorkspaceGitRefreshIpcPayload {
  readonly workspaceId: string;
}

export interface SessionListIpcPayload {
  readonly workspaceId?: string;
  readonly projectId?: string;
}

export interface SessionCreateIpcPayload extends RuntimeSessionRequest {
  readonly kind: SessionKind;
  readonly name: string;
  readonly worktreePath?: string | null;
}

export interface RuntimeConnectIpcPayload {
  readonly workspaceId: string;
  readonly sessionId: string;
  readonly runtimeTarget: RuntimeTarget;
  readonly transport: RuntimeTransport;
}

export interface RuntimeSubscribeIpcPayload {
  readonly sessionId: string;
  readonly runId?: string;
}

export interface RuntimeControlIpcPayload {
  readonly runId: string;
  readonly sessionId?: string;
  readonly action: 'cancel' | 'pause' | 'resume';
  readonly payload?: Record<string, unknown>;
}

export interface InterventionSubmitIpcPayload {
  readonly request: InterventionRequest;
}

export interface AuditAppendIpcPayload {
  readonly event: AuditEventEnvelope;
}

export interface AgentDefaultsLoadIpcPayload {
  readonly source?: 'shipped' | 'workspace' | 'user';
}

export interface IpcPayloadMap {
  readonly 'takomi:workspace:list': WorkspaceListIpcPayload;
  readonly 'takomi:workspace:open': WorkspaceOpenIpcPayload;
  readonly 'takomi:workspace:status': WorkspaceStatusIpcPayload;
  readonly 'takomi:workspace:worktree:create': WorkspaceWorktreeCreateIpcPayload;
  readonly 'takomi:workspace:worktree:switch': WorkspaceWorktreeSwitchIpcPayload;
  readonly 'takomi:workspace:git:refresh': WorkspaceGitRefreshIpcPayload;
  readonly 'takomi:session:list': SessionListIpcPayload;
  readonly 'takomi:session:create': SessionCreateIpcPayload;
  readonly 'takomi:runtime:connect': RuntimeConnectIpcPayload;
  readonly 'takomi:runtime:subscribe': RuntimeSubscribeIpcPayload;
  readonly 'takomi:runtime:control': RuntimeControlIpcPayload;
  readonly 'takomi:intervention:submit': InterventionSubmitIpcPayload;
  readonly 'takomi:audit:append': AuditAppendIpcPayload;
  readonly 'takomi:agents:defaults:load': AgentDefaultsLoadIpcPayload;
}

export type IpcPayloadFor<TChannel extends IpcChannel> = TChannel extends keyof IpcPayloadMap
  ? IpcPayloadMap[TChannel]
  : never;

export type WorkspaceListIpcEnvelope = IpcEnvelope<WorkspaceListIpcPayload>;
export type WorkspaceOpenIpcEnvelope = IpcEnvelope<WorkspaceOpenIpcPayload>;
export type WorkspaceStatusIpcEnvelope = IpcEnvelope<WorkspaceStatusIpcPayload>;
export type WorkspaceWorktreeCreateIpcEnvelope = IpcEnvelope<WorkspaceWorktreeCreateIpcPayload>;
export type WorkspaceWorktreeSwitchIpcEnvelope = IpcEnvelope<WorkspaceWorktreeSwitchIpcPayload>;
export type WorkspaceGitRefreshIpcEnvelope = IpcEnvelope<WorkspaceGitRefreshIpcPayload>;
export type SessionListIpcEnvelope = IpcEnvelope<SessionListIpcPayload>;
export type SessionCreateIpcEnvelope = IpcEnvelope<SessionCreateIpcPayload>;
export type RuntimeConnectIpcEnvelope = IpcEnvelope<RuntimeConnectIpcPayload>;
export type RuntimeSubscribeIpcEnvelope = IpcEnvelope<RuntimeSubscribeIpcPayload>;
export type RuntimeControlIpcEnvelope = IpcEnvelope<RuntimeControlIpcPayload>;
export type InterventionSubmitIpcEnvelope = IpcEnvelope<InterventionSubmitIpcPayload>;
export type AuditAppendIpcEnvelope = IpcEnvelope<AuditAppendIpcPayload>;
export type AgentDefaultsLoadIpcEnvelope = IpcEnvelope<AgentDefaultsLoadIpcPayload>;

export interface LocalhostBridgeEnvelope<TPayload>
  extends TransportEnvelope<IpcChannel, TPayload> {
  readonly transport: 'http' | 'websocket';
}

export interface LocalhostBridgeHttpRequest<TPayload> extends LocalhostBridgeEnvelope<TPayload> {
  readonly transport: 'http';
  readonly method: 'POST';
}

export interface LocalhostBridgeWebSocketMessage<TPayload> extends LocalhostBridgeEnvelope<TPayload> {
  readonly transport: 'websocket';
  readonly messageType: 'request' | 'response' | 'event';
  readonly ok?: boolean;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
  };
}

export type LocalhostBridgeRequest<TPayload> = LocalhostBridgeHttpRequest<TPayload>;
export type LocalhostBridgeResponse<TPayload> = LocalhostBridgeWebSocketMessage<TPayload>;
