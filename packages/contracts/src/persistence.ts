import type { AuditEventEnvelope } from './audit.js';
import type { RuntimeEventEnvelope } from './runtime.js';
import type {
  SessionDescriptor,
  TranscriptPart,
  TranscriptSnapshot
} from './session.js';
import type {
  OrchestrationSession,
  TaskGraphArtifact,
  TaskGraphEdge,
  TaskGraphNode
} from './task-graph.js';
import type { InterventionRequest, InterventionOutcome, RecoveryDescriptor, RecoveryAction } from './intervention.js';
import type { BillingState, CheckoutSession, EntitlementRecord } from './billing.js';
import type { BagsLinkageRecord, BagsReadinessResult, BagsState } from './bags.js';
import type { RuntimeSettingsState } from './settings.js';

// ---------------------------------------------------------------------------
// Cursor-based pagination
// ---------------------------------------------------------------------------

export interface PaginationCursor {
  readonly value: string;
  readonly direction: 'forward' | 'backward';
}

export interface PaginatedResult<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly prevCursor: string | null;
  readonly totalCount?: number;
}

// ---------------------------------------------------------------------------
// Event Store contract
// ---------------------------------------------------------------------------

export interface EventStoreQuery {
  readonly sessionId?: string;
  readonly runId?: string;
  readonly workspaceId?: string;
  readonly taskId?: string;
  readonly fromTimestamp?: string;
  readonly toTimestamp?: string;
  readonly limit?: number;
  readonly cursor?: PaginationCursor;
}

export interface AppendResult {
  readonly appended: number;
  readonly firstId: string;
  readonly lastId: string;
}

/**
 * Append-first event store. Events are immutable once written.
 * Supports cursor-based pagination for large histories.
 */
export interface EventStore<TEvent extends { readonly id: string; readonly sessionId: string; readonly timestamp: string }> {
  append(events: readonly TEvent[]): Promise<AppendResult>;
  query(filter: EventStoreQuery): Promise<PaginatedResult<TEvent>>;
  getById(id: string): Promise<TEvent | undefined>;
  count(sessionId: string): Promise<number>;
}

export type TranscriptEventStore = EventStore<TranscriptPart>;
export type RuntimeEventStore = EventStore<RuntimeEventEnvelope>;

// ---------------------------------------------------------------------------
// Audit Event Store
// ---------------------------------------------------------------------------

export interface AuditEventQuery {
  readonly kind?: string;
  readonly subjectId?: string;
  readonly subjectType?: string;
  readonly workspaceId?: string;
  readonly sessionId?: string;
  readonly runId?: string;
  readonly fromTimestamp?: string;
  readonly toTimestamp?: string;
  readonly limit?: number;
  readonly cursor?: PaginationCursor;
}

export interface AuditEventStore {
  append(events: readonly AuditEventEnvelope[]): Promise<AppendResult>;
  query(filter: AuditEventQuery): Promise<PaginatedResult<AuditEventEnvelope>>;
  getById(id: string): Promise<AuditEventEnvelope | undefined>;
  countByKind(kind: string): Promise<number>;
  countBySubject(subjectId: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Restore Snapshot Store
// ---------------------------------------------------------------------------

export interface RestoreSnapshotDescriptor {
  readonly id: string;
  readonly sessionId: string;
  readonly createdAt: string;
  readonly label?: string;
  readonly session: SessionDescriptor;
  readonly transcript: TranscriptSnapshot;
  readonly taskGraph?: {
    readonly nodes: readonly TaskGraphNode[];
    readonly edges: readonly TaskGraphEdge[];
  };
  readonly metadata?: Record<string, unknown>;
}

export interface RestoreSnapshotStore {
  create(snapshot: Omit<RestoreSnapshotDescriptor, 'id' | 'createdAt'>): Promise<RestoreSnapshotDescriptor>;
  get(id: string): Promise<RestoreSnapshotDescriptor | undefined>;
  getLatest(sessionId: string): Promise<RestoreSnapshotDescriptor | undefined>;
  list(sessionId: string): Promise<readonly RestoreSnapshotDescriptor[]>;
  remove(id: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Intervention Store
// ---------------------------------------------------------------------------

export interface InterventionStore {
  saveRequest(request: InterventionRequest): Promise<void>;
  getRequest(id: string): Promise<InterventionRequest | undefined>;
  listRequests(sessionId: string): Promise<readonly InterventionRequest[]>;
  saveOutcome(outcome: InterventionOutcome): Promise<void>;
  getOutcome(requestId: string): Promise<InterventionOutcome | undefined>;
  listByRunId(runId: string): Promise<readonly InterventionRequest[]>;
  listBySessionSubtree(rootSessionId: string, sessionIds: readonly string[]): Promise<readonly InterventionRequest[]>;
}

// ---------------------------------------------------------------------------
// Recovery Store
// ---------------------------------------------------------------------------

export interface RecoveryStore {
  save(descriptor: RecoveryDescriptor): Promise<void>;
  get(id: string): Promise<RecoveryDescriptor | undefined>;
  listBySession(sessionId: string): Promise<readonly RecoveryDescriptor[]>;
  listActive(): Promise<readonly RecoveryDescriptor[]>;
  saveAction(action: RecoveryAction): Promise<void>;
  listActions(recoveryId: string): Promise<readonly RecoveryAction[]>;
}

export interface BillingStore {
  getState(workspaceId: string): Promise<BillingState | undefined>;
  saveCheckout(session: CheckoutSession): Promise<void>;
  saveEntitlement(record: EntitlementRecord): Promise<void>;
}

export interface BagsStore {
  getState(workspaceId: string): Promise<BagsState | undefined>;
  saveLinkage(record: BagsLinkageRecord): Promise<void>;
  clearLinkage(workspaceId: string): Promise<void>;
  saveReadiness(result: BagsReadinessResult): Promise<void>;
}

export interface RuntimeSettingsStore {
  getState(workspaceId: string): Promise<RuntimeSettingsState | undefined>;
  saveState(state: RuntimeSettingsState): Promise<void>;
}

// ---------------------------------------------------------------------------
// Task Graph Store
// ---------------------------------------------------------------------------

export interface TaskGraphStore {
  saveNode(node: TaskGraphNode): Promise<void>;
  getNode(id: string): Promise<TaskGraphNode | undefined>;
  listNodes(sessionId: string): Promise<readonly TaskGraphNode[]>;
  saveEdge(edge: TaskGraphEdge): Promise<void>;
  listEdges(sessionId: string): Promise<readonly TaskGraphEdge[]>;
  removeNode(id: string): Promise<boolean>;
  saveArtifact(artifact: TaskGraphArtifact): Promise<void>;
  getArtifact(id: string): Promise<TaskGraphArtifact | undefined>;
  listArtifacts(sessionId: string): Promise<readonly TaskGraphArtifact[]>;
}

// ---------------------------------------------------------------------------
// Orchestration Session Store
// ---------------------------------------------------------------------------

export interface OrchestrationSessionStore {
  save(session: OrchestrationSession): Promise<void>;
  get(id: string): Promise<OrchestrationSession | undefined>;
  list(workspaceId?: string): Promise<readonly OrchestrationSession[]>;
  remove(id: string): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Read Models (materialized views from event stores)
// ---------------------------------------------------------------------------

export interface SessionSummary {
  readonly sessionId: string;
  readonly name: string;
  readonly status: string;
  readonly workspaceId: string;
  readonly transcriptPartCount: number;
  readonly runtimeEventCount: number;
  readonly auditEventCount: number;
  readonly interventionCount: number;
  readonly lastActivityAt: string | null;
  readonly createdAt: string | null;
}

export interface TaskSummary {
  readonly taskId: string;
  readonly sessionId: string;
  readonly title: string;
  readonly state: string;
  readonly dependencyCount: number;
  readonly artifactCount: number;
  readonly lastActivityAt: string | null;
}

/**
 * Read models reconstruct denormalized views from event stores and snapshots.
 * They do not own data — they derive it.
 */
export interface ReadModelProvider {
  getSessionSummary(sessionId: string): Promise<SessionSummary | null>;
  getSessionSummaries(workspaceId?: string): Promise<readonly SessionSummary[]>;
  getTaskSummary(taskId: string): Promise<TaskSummary | null>;
  getTaskSummaries(sessionId: string): Promise<readonly TaskSummary[]>;
  getTranscriptView(sessionId: string): Promise<TranscriptSnapshot | null>;
}

// ---------------------------------------------------------------------------
// Unified Persistence Adapter
// ---------------------------------------------------------------------------

/**
 * The full persistence surface an app shell (desktop or web) must provide.
 * Implementations differ in storage engines, but the contract is identical.
 */
export interface PersistenceAdapter {
  readonly transcriptEvents: TranscriptEventStore;
  readonly runtimeEvents: RuntimeEventStore;
  readonly auditEvents: AuditEventStore;
  readonly restoreSnapshots: RestoreSnapshotStore;
  readonly interventions: InterventionStore;
  readonly recovery: RecoveryStore;
  readonly billing?: BillingStore;
  readonly bags?: BagsStore;
  readonly runtimeSettings?: RuntimeSettingsStore;
  readonly taskGraph: TaskGraphStore;
  readonly orchestrationSessions: OrchestrationSessionStore;
  readonly readModels: ReadModelProvider;
}
