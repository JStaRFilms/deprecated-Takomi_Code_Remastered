export type ShellTarget = 'desktop' | 'web';
export type SessionKind = 'project' | 'chat' | 'task' | 'recovery';
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed';
export type RuntimeTransport = 'local' | 'remote' | 'browser-safe';

export interface WorkspaceDescriptor {
  readonly id: string;
  readonly name: string;
  readonly rootPath: string;
  readonly target: ShellTarget;
}

export interface ProjectDescriptor {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string;
}

export interface SessionDescriptor {
  readonly id: string;
  readonly projectId: string;
  readonly parentSessionId: string | null;
  readonly kind: SessionKind;
  readonly name: string;
  readonly status: SessionStatus;
  readonly workspaceId: string;
  readonly worktreePath: string | null;
}

export interface TaskGraphNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly title: string;
  readonly state: SessionStatus;
}

export interface TaskGraphEdge {
  readonly from: string;
  readonly to: string;
}

export interface AuditEvent {
  readonly id: string;
  readonly kind: string;
  readonly subjectId: string;
  readonly timestamp: string;
  readonly data: Record<string, unknown>;
}

export interface RuntimeEventEnvelope {
  readonly id: string;
  readonly sessionId: string;
  readonly transport: RuntimeTransport;
  readonly timestamp: string;
  readonly kind: string;
  readonly payload: Record<string, unknown>;
}

export interface IpcEnvelope<TPayload> {
  readonly id: string;
  readonly channel: string;
  readonly payload: TPayload;
}

export const IPC_CHANNELS = {
  workspaceList: 'takomi:workspace:list',
  workspaceOpen: 'takomi:workspace:open',
  sessionCreate: 'takomi:session:create',
  runtimeConnect: 'takomi:runtime:connect',
  auditAppend: 'takomi:audit:append'
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface BrowserFallbackNote {
  readonly capability: string;
  readonly mode: 'remote' | 'unavailable';
  readonly message: string;
}
