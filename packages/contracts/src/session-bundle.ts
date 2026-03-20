import type { AuditEventEnvelope } from './audit.js';
import type { RuntimeEventEnvelope } from './runtime.js';
import type { SessionDescriptor, TranscriptSnapshot } from './session.js';
import type { TaskGraphArtifact } from './task-graph.js';
import type { WorkspaceDescriptor, WorktreeReference } from './workspace.js';

export const TAKOMI_SESSION_BUNDLE_SCHEMA_VERSION = 1 as const;

export type TakomiSessionBundleSchemaVersion = typeof TAKOMI_SESSION_BUNDLE_SCHEMA_VERSION;

export type TakomiSessionBundleSourceKind = 'takomi' | 'foreign-codex';

export interface TakomiSessionBundleMetadata {
  readonly bundleId: string;
  readonly exportedAt: string;
  readonly exportedBy: string;
  readonly sourceKind: TakomiSessionBundleSourceKind;
  readonly sourceLabel?: string | undefined;
  readonly sourceAdapter?: string | undefined;
  readonly sourceVersion?: string | undefined;
  readonly compatibilityNotes?: readonly string[] | undefined;
}

export type TakomiSessionBundleWorkspace = WorkspaceDescriptor & {
  readonly worktrees: readonly WorktreeReference[];
};

export interface TakomiSessionBundleV1 {
  readonly schemaVersion: TakomiSessionBundleSchemaVersion;
  readonly metadata: TakomiSessionBundleMetadata;
  readonly session: SessionDescriptor;
  readonly transcript: TranscriptSnapshot;
  readonly runtimeEvents: readonly RuntimeEventEnvelope[];
  readonly artifacts: readonly TaskGraphArtifact[];
  readonly auditEvents: readonly AuditEventEnvelope[];
  readonly workspace: TakomiSessionBundleWorkspace;
}

export interface TakomiSessionBundleImportIssue {
  readonly path: string;
  readonly code: 'missing-field' | 'invalid-field' | 'unsupported-field' | 'unsupported-schema';
  readonly severity: 'warning' | 'error';
  readonly message: string;
}

export interface TakomiSessionBundleImportResult {
  readonly status: 'complete' | 'partial' | 'unsupported';
  readonly bundle: TakomiSessionBundleV1 | null;
  readonly issues: readonly TakomiSessionBundleImportIssue[];
}
