import type {
  AuditEventKind,
  TakomiAgentModeSlug
} from './constants.js';

export interface AuditActor {
  readonly id: string;
  readonly kind: 'human' | 'agent' | 'system';
  readonly displayName?: string | undefined;
  readonly modeSlug?: TakomiAgentModeSlug | undefined;
}

export interface AuditEventEnvelope<
  TKind extends AuditEventKind = AuditEventKind,
  TData extends Record<string, unknown> = Record<string, unknown>
> {
  readonly id: string;
  readonly kind: TKind;
  readonly timestamp: string;
  readonly subjectId: string;
  readonly subjectType?: 'workspace' | 'project' | 'session' | 'task' | 'run' | 'worktree' | 'runtime' | 'intervention' | 'billing' | 'bags' | undefined;
  readonly workspaceId?: string | undefined;
  readonly projectId?: string | undefined;
  readonly sessionId?: string | undefined;
  readonly taskId?: string | undefined;
  readonly runId?: string | undefined;
  readonly actor?: AuditActor | undefined;
  readonly correlationId?: string | undefined;
  readonly data: TData;
}

export type AuditEvent = AuditEventEnvelope;

export interface AuditEventBatch {
  readonly items: readonly AuditEventEnvelope[];
  readonly nextCursor?: string | null | undefined;
}
