import type {
  AuditEventKind,
  TakomiAgentModeSlug
} from './constants.js';

export interface AuditActor {
  readonly id: string;
  readonly kind: 'human' | 'agent' | 'system';
  readonly displayName?: string;
  readonly modeSlug?: TakomiAgentModeSlug;
}

export interface AuditEventEnvelope<
  TKind extends AuditEventKind = AuditEventKind,
  TData extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly kind: TKind;
  readonly timestamp: string;
  readonly subjectId: string;
  readonly subjectType?: 'workspace' | 'project' | 'session' | 'task' | 'run' | 'worktree' | 'runtime' | 'intervention' | 'billing' | 'bags';
  readonly workspaceId?: string;
  readonly projectId?: string;
  readonly sessionId?: string;
  readonly taskId?: string;
  readonly runId?: string;
  readonly actor?: AuditActor;
  readonly correlationId?: string;
  readonly data: TData;
}

export type AuditEvent = AuditEventEnvelope;

export interface AuditEventBatch {
  readonly items: readonly AuditEventEnvelope[];
  readonly nextCursor?: string | null;
}
