import type { SessionStatus, TaskGraphState } from './constants.js';

export interface TaskGraphNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly title: string;
  readonly state: TaskGraphState;
  readonly sessionId?: string;
  readonly taskId?: string;
  readonly kind?: 'task' | 'milestone' | 'group' | 'artifact' | 'branch';
  readonly workspaceId?: string;
  readonly runId?: string;
  readonly artifactId?: string;
  readonly childSessionId?: string;
  readonly dependencies?: readonly string[];
}

export interface TaskGraphEdge {
  readonly from: string;
  readonly to: string;
  readonly kind?: 'depends-on' | 'blocks' | 'follows';
}

export interface TaskGraphArtifact {
  readonly id: string;
  readonly taskId: string;
  readonly sessionId: string;
  readonly workspaceId: string;
  readonly kind: 'document' | 'patch' | 'log' | 'bundle';
  readonly name: string;
  readonly uri: string;
  readonly createdAt?: string;
}

export interface OrchestrationSession {
  readonly id: string;
  readonly workspaceId: string;
  readonly rootSessionId: string;
  readonly status: SessionStatus;
  readonly taskGraphRootNodeId?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface OrchestrationGraph {
  readonly workspaceId: string;
  readonly rootSessionId: string;
  readonly nodes: readonly TaskGraphNode[];
  readonly edges: readonly TaskGraphEdge[];
}
