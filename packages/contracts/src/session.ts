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
  readonly runtimeTarget?: RuntimeTarget | undefined;
  readonly worktreeId?: string | null | undefined;
  readonly lineage?: SessionLineage | undefined;
  readonly createdAt?: string | undefined;
  readonly updatedAt?: string | undefined;
  readonly closedAt?: string | null | undefined;
}

export interface TranscriptTextPart {
  readonly kind: 'text';
  readonly id: string;
  readonly sessionId: string;
  readonly role: TranscriptPartRole;
  readonly text: string;
  readonly timestamp: string;
  readonly runId?: string | undefined;
  readonly taskId?: string | undefined;
}

export interface TranscriptToolCallPart {
  readonly kind: 'tool-call';
  readonly id: string;
  readonly sessionId: string;
  readonly toolName: string;
  readonly input: Record<string, unknown>;
  readonly timestamp: string;
  readonly runId?: string | undefined;
  readonly taskId?: string | undefined;
}

export interface TranscriptToolResultPart {
  readonly kind: 'tool-result';
  readonly id: string;
  readonly sessionId: string;
  readonly toolName: string;
  readonly output?: unknown | undefined;
  readonly timestamp: string;
  readonly runId?: string | undefined;
  readonly taskId?: string | undefined;
}

export interface TranscriptArtifactPart {
  readonly kind: 'artifact';
  readonly id: string;
  readonly sessionId: string;
  readonly artifactId: string;
  readonly label?: string | undefined;
  readonly timestamp: string;
  readonly runId?: string | undefined;
  readonly taskId?: string | undefined;
}

export interface TranscriptStatusPart {
  readonly kind: 'status';
  readonly id: string;
  readonly sessionId: string;
  readonly status: string;
  readonly message?: string | undefined;
  readonly timestamp: string;
  readonly runId?: string | undefined;
  readonly taskId?: string | undefined;
}

export interface TranscriptSystemPart {
  readonly kind: 'system';
  readonly id: string;
  readonly sessionId: string;
  readonly message: string;
  readonly timestamp: string;
  readonly runId?: string | undefined;
  readonly taskId?: string | undefined;
}

export type TranscriptPart =
  | TranscriptTextPart
  | TranscriptToolCallPart
  | TranscriptToolResultPart
  | TranscriptArtifactPart
  | TranscriptStatusPart
  | TranscriptSystemPart;

export interface TranscriptSnapshot {
  readonly sessionId: string;
  readonly parts: readonly TranscriptPart[];
  readonly lastUpdatedAt: string;
}
