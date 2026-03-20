import {
  AuditEventEnvelopeSchema,
  NormalizedRuntimeEventSchema,
  SessionDescriptorSchema,
  TakomiSessionBundleV1Schema,
  TAKOMI_SESSION_BUNDLE_SCHEMA_VERSION,
  TaskGraphArtifactSchema,
  TranscriptPartSchema,
  TranscriptSnapshotSchema,
  WorkspaceDescriptorSchema,
  type AuditEventEnvelope,
  type RuntimeEventEnvelope,
  type SessionDescriptor,
  type TaskGraphArtifact,
  type TakomiSessionBundleImportIssue,
  type TakomiSessionBundleImportResult,
  type TakomiSessionBundleMetadata,
  type TakomiSessionBundleV1,
  type TakomiSessionBundleWorkspace,
  type TranscriptPart,
  type TranscriptSnapshot,
  type WorkspaceDescriptor,
  type WorktreeReference
} from '@takomi/contracts';

export interface TakomiSessionBundleExportState {
  readonly bundleId: string;
  readonly exportedAt: string;
  readonly exportedBy: string;
  readonly session: SessionDescriptor;
  readonly workspace: WorkspaceDescriptor;
  readonly transcript: TranscriptSnapshot;
  readonly runtimeEvents: readonly RuntimeEventEnvelope[];
  readonly artifacts: readonly TaskGraphArtifact[];
  readonly auditEvents: readonly AuditEventEnvelope[];
  readonly sourceLabel?: string;
  readonly sourceAdapter?: string;
  readonly sourceVersion?: string;
  readonly compatibilityNotes?: readonly string[];
}

export interface SupportedForeignCodexSessionDataV1 {
  readonly schemaVersion: 1;
  readonly exportId: string;
  readonly exportedAt: string;
  readonly source: {
    readonly product: string;
    readonly adapter: string;
    readonly version?: string;
  };
  readonly session: SessionDescriptor;
  readonly transcript?: {
    readonly items: readonly TranscriptPart[];
    readonly lastUpdatedAt?: string;
  };
  readonly runtime?: {
    readonly events: readonly RuntimeEventEnvelope[];
  };
  readonly artifacts?: readonly TaskGraphArtifact[];
  readonly audit?: {
    readonly events: readonly AuditEventEnvelope[];
  };
  readonly workspace: WorkspaceDescriptor;
}

const allowedForeignTopLevelKeys = new Set([
  'schemaVersion',
  'exportId',
  'exportedAt',
  'source',
  'session',
  'transcript',
  'runtime',
  'artifacts',
  'audit',
  'workspace'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createIssue(
  path: string,
  code: TakomiSessionBundleImportIssue['code'],
  severity: TakomiSessionBundleImportIssue['severity'],
  message: string
): TakomiSessionBundleImportIssue {
  return { path, code, severity, message };
}

function formatZodIssuePath(path: ReadonlyArray<string | number>): string {
  return path.length === 0 ? 'root' : path.map(String).join('.');
}

function pushUnknownFields(
  record: Record<string, unknown>,
  issues: TakomiSessionBundleImportIssue[],
  allowedKeys: ReadonlySet<string>,
  pathPrefix: string
): void {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.has(key)) {
      issues.push(
        createIssue(
          `${pathPrefix}.${key}`,
          'unsupported-field',
          'warning',
          `Ignored unsupported field at ${pathPrefix}.${key}`
        )
      );
    }
  }
}

function cloneTranscriptPart(part: TranscriptPart): TranscriptPart {
  return part as TranscriptPart;
}

function cloneRuntimeEvent(event: RuntimeEventEnvelope): RuntimeEventEnvelope {
  return event as RuntimeEventEnvelope;
}

function cloneAuditEvent(event: AuditEventEnvelope): AuditEventEnvelope {
  return event as AuditEventEnvelope;
}

function cloneArtifact(artifact: TaskGraphArtifact): TaskGraphArtifact {
  return artifact as TaskGraphArtifact;
}

function normalizeWorkspace(
  workspace: WorkspaceDescriptor,
  worktrees: readonly WorktreeReference[]
): TakomiSessionBundleWorkspace {
  const normalized: {
    id: string;
    name: string;
    rootPath: string;
    target: WorkspaceDescriptor['target'];
    branchName?: string | null | undefined;
    dirty?: boolean | undefined;
    currentWorktreeId?: string | null | undefined;
    git?: WorkspaceDescriptor['git'];
    capabilities?: WorkspaceDescriptor['capabilities'];
    worktrees: readonly WorktreeReference[];
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
  } = {
    id: workspace.id,
    name: workspace.name,
    rootPath: workspace.rootPath,
    target: workspace.target,
    worktrees: [...worktrees]
  };

  if (workspace.branchName !== undefined) {
    normalized.branchName = workspace.branchName;
  }

  if (workspace.dirty !== undefined) {
    normalized.dirty = workspace.dirty;
  }

  if (workspace.currentWorktreeId !== undefined) {
    normalized.currentWorktreeId = workspace.currentWorktreeId;
  }

  if (workspace.git !== undefined) {
    normalized.git = workspace.git;
  }

  if (workspace.capabilities !== undefined) {
    normalized.capabilities = workspace.capabilities;
  }

  if (workspace.createdAt !== undefined) {
    normalized.createdAt = workspace.createdAt;
  }

  if (workspace.updatedAt !== undefined) {
    normalized.updatedAt = workspace.updatedAt;
  }

  return normalized as unknown as TakomiSessionBundleWorkspace;
}

function normalizeSession(session: SessionDescriptor): SessionDescriptor {
  const normalized: {
    id: string;
    projectId: string;
    parentSessionId: string | null;
    kind: SessionDescriptor['kind'];
    name: string;
    status: SessionDescriptor['status'];
    workspaceId: string;
    worktreePath: string | null;
    runtimeTarget?: SessionDescriptor['runtimeTarget'] | undefined;
    worktreeId?: string | null | undefined;
    lineage?: SessionDescriptor['lineage'] | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    closedAt?: string | null | undefined;
  } = {
    id: session.id,
    projectId: session.projectId,
    parentSessionId: session.parentSessionId,
    kind: session.kind,
    name: session.name,
    status: session.status,
    workspaceId: session.workspaceId,
    worktreePath: session.worktreePath
  };

  if (session.runtimeTarget !== undefined) {
    normalized.runtimeTarget = session.runtimeTarget;
  }

  if (session.worktreeId !== undefined) {
    normalized.worktreeId = session.worktreeId;
  }

  if (session.lineage !== undefined) {
    normalized.lineage = {
      ...session.lineage,
      ancestorSessionIds: [...session.lineage.ancestorSessionIds]
    };
  }

  if (session.createdAt !== undefined) {
    normalized.createdAt = session.createdAt;
  }

  if (session.updatedAt !== undefined) {
    normalized.updatedAt = session.updatedAt;
  }

  if (session.closedAt !== undefined) {
    normalized.closedAt = session.closedAt;
  }

  return normalized as unknown as SessionDescriptor;
}

function normalizeTranscriptSnapshot(snapshot: TranscriptSnapshot): TranscriptSnapshot {
  return snapshot as unknown as TranscriptSnapshot;
}

function normalizeMetadata(metadata: TakomiSessionBundleMetadata): TakomiSessionBundleMetadata {
  const normalized: {
    bundleId: string;
    exportedAt: string;
    exportedBy: string;
    sourceKind: TakomiSessionBundleMetadata['sourceKind'];
    sourceLabel?: string;
    sourceAdapter?: string;
    sourceVersion?: string;
    compatibilityNotes?: readonly string[];
  } = {
    bundleId: metadata.bundleId,
    exportedAt: metadata.exportedAt,
    exportedBy: metadata.exportedBy,
    sourceKind: metadata.sourceKind
  };

  if (metadata.sourceLabel !== undefined) {
    normalized.sourceLabel = metadata.sourceLabel;
  }

  if (metadata.sourceAdapter !== undefined) {
    normalized.sourceAdapter = metadata.sourceAdapter;
  }

  if (metadata.sourceVersion !== undefined) {
    normalized.sourceVersion = metadata.sourceVersion;
  }

  if (metadata.compatibilityNotes !== undefined) {
    normalized.compatibilityNotes = [...metadata.compatibilityNotes];
  }

  return normalized as TakomiSessionBundleMetadata;
}

function parseBundleIssues(error: { issues: Array<{ path: Array<string | number>; code: string; message: string }> }): TakomiSessionBundleImportIssue[] {
  return error.issues.map((issue) =>
    createIssue(
      formatZodIssuePath(issue.path),
      'invalid-field',
      'error',
      `${issue.message} at ${formatZodIssuePath(issue.path)}`
    )
  );
}

function buildBundleStatus(issues: readonly TakomiSessionBundleImportIssue[]): TakomiSessionBundleImportResult['status'] {
  if (issues.some((issue) => issue.severity === 'error')) {
    return 'unsupported';
  }

  return issues.length > 0 ? 'partial' : 'complete';
}

export function exportTakomiSessionBundle(state: TakomiSessionBundleExportState): TakomiSessionBundleV1 {
  const metadata = normalizeMetadata({
    bundleId: state.bundleId,
    exportedAt: state.exportedAt,
    exportedBy: state.exportedBy,
    sourceKind: 'takomi',
    ...(state.sourceLabel ? { sourceLabel: state.sourceLabel } : {}),
    ...(state.sourceAdapter ? { sourceAdapter: state.sourceAdapter } : {}),
    ...(state.sourceVersion ? { sourceVersion: state.sourceVersion } : {}),
    ...(state.compatibilityNotes ? { compatibilityNotes: [...state.compatibilityNotes] } : {})
  } as TakomiSessionBundleMetadata);

  const workspace = normalizeWorkspace(state.workspace, state.workspace.worktrees ?? []);

  const bundleInput: TakomiSessionBundleV1 = {
    schemaVersion: TAKOMI_SESSION_BUNDLE_SCHEMA_VERSION,
    metadata,
    session: normalizeSession(state.session),
    transcript: normalizeTranscriptSnapshot(state.transcript),
    runtimeEvents: state.runtimeEvents.map(cloneRuntimeEvent),
    artifacts: state.artifacts.map(cloneArtifact),
    auditEvents: state.auditEvents.map(cloneAuditEvent),
    workspace
  };

  return TakomiSessionBundleV1Schema.parse(bundleInput);
}

export function importTakomiSessionBundle(bundle: TakomiSessionBundleV1): TakomiSessionBundleV1 {
  return TakomiSessionBundleV1Schema.parse(bundle);
}

export function importSupportedForeignCodexSessionData(
  input: unknown
): TakomiSessionBundleImportResult {
  const issues: TakomiSessionBundleImportIssue[] = [];

  if (!isRecord(input)) {
    return {
      status: 'unsupported',
      bundle: null,
      issues: [createIssue('root', 'missing-field', 'error', 'Foreign Codex session payload must be an object')]
    };
  }

  pushUnknownFields(input, issues, allowedForeignTopLevelKeys, 'root');

  const schemaVersion = input['schemaVersion'];
  if (schemaVersion !== TAKOMI_SESSION_BUNDLE_SCHEMA_VERSION) {
    issues.push(
      createIssue(
        'schemaVersion',
        'unsupported-schema',
        'error',
        `Unsupported foreign schema version: ${String(schemaVersion)}`
      )
    );
  }

  const sourceValue = input['source'];
  const source = isRecord(sourceValue) ? sourceValue : null;
  if (!source) {
    issues.push(createIssue('source', 'missing-field', 'error', 'Foreign Codex session payload is missing source metadata'));
  }

  const sessionValue = input['session'];
  const sessionParse = SessionDescriptorSchema.safeParse(sessionValue);
  if (!sessionParse.success) {
    issues.push(...parseBundleIssues(sessionParse.error));
  }

  const workspaceValue = input['workspace'];
  const workspaceParse = WorkspaceDescriptorSchema.safeParse(workspaceValue);
  if (!workspaceParse.success) {
    issues.push(...parseBundleIssues(workspaceParse.error));
  }

  let transcriptResult: TranscriptSnapshot | null = null;
  const transcriptValue = input['transcript'];
  if (isRecord(transcriptValue)) {
    const items = transcriptValue['items'];
    if (Array.isArray(items)) {
      const transcriptParts: TranscriptPart[] = [];
      for (const item of items) {
        const partParse = TranscriptPartSchema.safeParse(item);
        if (!partParse.success) {
          issues.push(...parseBundleIssues(partParse.error));
          transcriptResult = null;
          break;
        }
        transcriptParts.push(partParse.data as TranscriptPart);
      }

      if (issues.every((issue) => issue.severity !== 'error')) {
        const lastUpdatedAt =
          typeof transcriptValue['lastUpdatedAt'] === 'string'
            ? (transcriptValue['lastUpdatedAt'] as string)
            : String(input['exportedAt']);

        transcriptResult = TranscriptSnapshotSchema.parse({
          sessionId: sessionParse.success ? sessionParse.data.id : 'unknown-session',
          parts: transcriptParts,
          lastUpdatedAt
        }) as TranscriptSnapshot;
      }
    } else {
      issues.push(createIssue('transcript.items', 'missing-field', 'warning', 'Foreign transcript items were not provided'));
    }
  } else {
    issues.push(createIssue('transcript', 'missing-field', 'warning', 'Foreign transcript section was not provided'));
  }

  const runtimeEvents: RuntimeEventEnvelope[] = [];
  const runtimeValue = input['runtime'];
  if (isRecord(runtimeValue) && Array.isArray(runtimeValue['events'])) {
    for (const event of runtimeValue['events']) {
      const eventParse = NormalizedRuntimeEventSchema.safeParse(event);
      if (!eventParse.success) {
        issues.push(...parseBundleIssues(eventParse.error));
        break;
      }
      runtimeEvents.push(eventParse.data as RuntimeEventEnvelope);
    }
  } else {
    issues.push(createIssue('runtime', 'missing-field', 'warning', 'Foreign runtime events were not provided'));
  }

  const artifacts: TaskGraphArtifact[] = [];
  const artifactsValue = input['artifacts'];
  if (Array.isArray(artifactsValue)) {
    for (const artifact of artifactsValue) {
      const artifactParse = TaskGraphArtifactSchema.safeParse(artifact);
      if (!artifactParse.success) {
        issues.push(...parseBundleIssues(artifactParse.error));
        break;
      }
      artifacts.push(artifactParse.data as TaskGraphArtifact);
    }
  } else {
    issues.push(createIssue('artifacts', 'missing-field', 'warning', 'Foreign artifact metadata was not provided'));
  }

  const auditEvents: AuditEventEnvelope[] = [];
  const auditValue = input['audit'];
  if (isRecord(auditValue) && Array.isArray(auditValue['events'])) {
    for (const event of auditValue['events']) {
      const eventParse = AuditEventEnvelopeSchema.safeParse(event);
      if (!eventParse.success) {
        issues.push(...parseBundleIssues(eventParse.error));
        break;
      }
      auditEvents.push(eventParse.data as AuditEventEnvelope);
    }
  } else {
    issues.push(createIssue('audit', 'missing-field', 'warning', 'Foreign audit events were not provided'));
  }

  if (!sessionParse.success || !workspaceParse.success || !transcriptResult) {
    return {
      status: 'unsupported',
      bundle: null,
      issues
    };
  }

  const workspace = normalizeWorkspace(
    workspaceParse.data as WorkspaceDescriptor,
    (workspaceParse.data as WorkspaceDescriptor).worktrees ?? []
  );
  const bundleMetadata = normalizeMetadata({
    bundleId: String(input['exportId']),
    exportedAt: String(input['exportedAt']),
    exportedBy: 'Takomi Code interop importer',
    sourceKind: 'foreign-codex',
    ...(source && typeof source['product'] === 'string' ? { sourceLabel: source['product'] } : {}),
    ...(source && typeof source['adapter'] === 'string' ? { sourceAdapter: source['adapter'] } : {}),
    ...(source && typeof source['version'] === 'string' ? { sourceVersion: source['version'] } : {}),
    compatibilityNotes: issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message)
  } as TakomiSessionBundleMetadata);

  const bundleInput: TakomiSessionBundleV1 = {
    schemaVersion: TAKOMI_SESSION_BUNDLE_SCHEMA_VERSION,
    metadata: bundleMetadata,
    session: normalizeSession(sessionParse.data as SessionDescriptor),
    transcript: transcriptResult,
    runtimeEvents,
    artifacts,
    auditEvents,
    workspace
  };

  const bundle = TakomiSessionBundleV1Schema.parse(bundleInput);

  return {
    status: buildBundleStatus(issues),
    bundle: bundle as TakomiSessionBundleV1,
    issues
  };
}
