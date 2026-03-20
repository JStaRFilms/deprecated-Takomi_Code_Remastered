import type {
  RuntimeTarget,
  SessionKind,
  SessionStatus,
  TranscriptPartKind,
  TranscriptPartRole
} from './constants.js';

export interface SessionLineage {
  readonly rootSessionId: string;
  readonly parentSessionId: string | null;
  readonly ancestorSessionIds: readonly string[];
  readonly depth: number;
  readonly inheritsWorkspace: boolean;
  readonly inheritedWorktreeId: string | null;
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
  readonly runtimeTarget?: RuntimeTarget;
  readonly worktreeId?: string | null;
  readonly lineage?: SessionLineage;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly closedAt?: string | null;
}

export interface TranscriptTextPart {
  readonly kind: 'text';
  readonly id: string;
  readonly sessionId: string;
  readonly role: TranscriptPartRole;
  readonly text: string;
  readonly timestamp: string;
  readonly runId?: string;
  readonly taskId?: string;
}

export interface TranscriptToolCallPart {
  readonly kind: 'tool-call';
  readonly id: string;
  readonly sessionId: string;
  readonly toolName: string;
  readonly input: Record<string, unknown>;
  readonly timestamp: string;
  readonly runId?: string;
  readonly taskId?: string;
}

export interface TranscriptToolResultPart {
  readonly kind: 'tool-result';
  readonly id: string;
  readonly sessionId: string;
  readonly toolName: string;
  readonly output: unknown;
  readonly timestamp: string;
  readonly runId?: string;
  readonly taskId?: string;
}

export interface TranscriptArtifactPart {
  readonly kind: 'artifact';
  readonly id: string;
  readonly sessionId: string;
  readonly artifactId: string;
  readonly label?: string;
  readonly timestamp: string;
  readonly runId?: string;
  readonly taskId?: string;
}

export interface TranscriptStatusPart {
  readonly kind: 'status';
  readonly id: string;
  readonly sessionId: string;
  readonly status: string;
  readonly message?: string;
  readonly timestamp: string;
  readonly runId?: string;
  readonly taskId?: string;
}

export type TranscriptPart =
  | TranscriptTextPart
  | TranscriptToolCallPart
  | TranscriptToolResultPart
  | TranscriptArtifactPart
  | TranscriptStatusPart;

export interface TranscriptSnapshot {
  readonly sessionId: string;
  readonly parts: readonly TranscriptPart[];
  readonly lastUpdatedAt: string;
}
