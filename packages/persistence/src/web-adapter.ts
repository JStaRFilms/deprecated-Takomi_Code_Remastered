import type {
  AppendResult,
  AuditEventEnvelope,
  AuditEventQuery,
  AuditEventStore,
  EventStore,
  EventStoreQuery,
  InterventionOutcome,
  InterventionRequest,
  InterventionStore,
  RecoveryDescriptor,
  RecoveryAction,
  RecoveryStore,
  OrchestrationSession,
  OrchestrationSessionStore,
  PaginatedResult,
  PersistenceAdapter,
  ReadModelProvider,
  RestoreSnapshotDescriptor,
  RestoreSnapshotStore,
  RuntimeEventEnvelope,
  TaskGraphArtifact,
  TaskGraphEdge,
  TaskGraphNode,
  TaskGraphStore,
  TranscriptPart,
  TranscriptEventStore,
  RuntimeEventStore,
  SessionSummary,
  TaskSummary,
  TranscriptSnapshot
} from '@takomi/contracts';

// ---------------------------------------------------------------------------
// Storage backend abstraction — localStorage or in-memory fallback
// ---------------------------------------------------------------------------

export interface WebStorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

/**
 * Creates a localStorage-backed storage backend.
 * Falls back to in-memory if localStorage is unavailable (e.g., SSR, private browsing).
 */
export function createLocalStorageBackend(prefix: string = 'takomi'): WebStorageBackend {
  const memoryFallback = new Map<string, string>();
  let useLocalStorage = false;

  try {
    if (typeof localStorage !== 'undefined') {
      const testKey = `${prefix}.__test__`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      useLocalStorage = true;
    }
  } catch {
    useLocalStorage = false;
  }

  return {
    getItem(key: string): string | null {
      const fullKey = `${prefix}:${key}`;
      if (useLocalStorage) {
        return localStorage.getItem(fullKey);
      }
      return memoryFallback.get(fullKey) ?? null;
    },

    setItem(key: string, value: string): void {
      const fullKey = `${prefix}:${key}`;
      if (useLocalStorage) {
        localStorage.setItem(fullKey, value);
      } else {
        memoryFallback.set(fullKey, value);
      }
    },

    removeItem(key: string): void {
      const fullKey = `${prefix}:${key}`;
      if (useLocalStorage) {
        localStorage.removeItem(fullKey);
      } else {
        memoryFallback.delete(fullKey);
      }
    },

    keys(): string[] {
      const pfx = `${prefix}:`;
      if (useLocalStorage) {
        const result: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(pfx)) {
            result.push(key.slice(pfx.length));
          }
        }
        return result;
      }
      return Array.from(memoryFallback.keys()).map(k => k.slice(pfx.length));
    }
  };
}

// ---------------------------------------------------------------------------
// Web-local event store
// ---------------------------------------------------------------------------

interface WebEventStoreConfig {
  readonly storage: WebStorageBackend;
  readonly collectionName: string;
}

function createWebLocalEventStore<
  TEvent extends { readonly id: string; readonly sessionId: string; readonly timestamp: string }
>(config: WebEventStoreConfig): EventStore<TEvent> {
  const storageKey = `events:${config.collectionName}`;

  function loadAll(): TEvent[] {
    const raw = config.storage.getItem(storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as TEvent[];
    } catch {
      return [];
    }
  }

  function saveAll(events: TEvent[]): void {
    config.storage.setItem(storageKey, JSON.stringify(events));
  }

  return {
    async append(newEvents: readonly TEvent[]): Promise<AppendResult> {
      if (newEvents.length === 0) {
        throw new Error('Cannot append empty event batch');
      }
      const all = loadAll();
      for (const event of newEvents) {
        all.push(event as TEvent);
      }
      all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      saveAll(all);
      return {
        appended: newEvents.length,
        firstId: newEvents[0]!.id,
        lastId: newEvents[newEvents.length - 1]!.id
      };
    },

    async query(filter: EventStoreQuery): Promise<PaginatedResult<TEvent>> {
      let filtered = loadAll();

      if (filter.sessionId) {
        filtered = filtered.filter(e => e.sessionId === filter.sessionId);
      }
      if (filter.fromTimestamp) {
        filtered = filtered.filter(e => e.timestamp >= filter.fromTimestamp!);
      }
      if (filter.toTimestamp) {
        filtered = filtered.filter(e => e.timestamp <= filter.toTimestamp!);
      }

      let startIndex = 0;
      if (filter.cursor) {
        const cursorIdx = filtered.findIndex(e => e.id === filter.cursor!.value);
        if (cursorIdx !== -1) {
          startIndex =
            filter.cursor!.direction === 'forward'
              ? cursorIdx + 1
              : Math.max(0, cursorIdx - 1);
        }
      }

      const limit = filter.limit ?? 100;
      const page = filtered.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < filtered.length;
      const hasPrev = startIndex > 0;

      return {
        items: page,
        nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : null,
        prevCursor: hasPrev && page.length > 0 ? page[0]!.id : null,
        totalCount: filtered.length
      };
    },

    async getById(id: string): Promise<TEvent | undefined> {
      return loadAll().find(e => e.id === id);
    },

    async count(sessionId: string): Promise<number> {
      return loadAll().filter(e => e.sessionId === sessionId).length;
    }
  };
}

// ---------------------------------------------------------------------------
// Web-local audit store
// ---------------------------------------------------------------------------

function createWebLocalAuditStore(config: WebEventStoreConfig): AuditEventStore {
  const storageKey = `audit:${config.collectionName}`;

  function loadAll(): AuditEventEnvelope[] {
    const raw = config.storage.getItem(storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as AuditEventEnvelope[];
    } catch {
      return [];
    }
  }

  function saveAll(events: AuditEventEnvelope[]): void {
    config.storage.setItem(storageKey, JSON.stringify(events));
  }

  return {
    async append(newEvents: readonly AuditEventEnvelope[]): Promise<AppendResult> {
      if (newEvents.length === 0) {
        throw new Error('Cannot append empty audit event batch');
      }
      const all = loadAll();
      for (const event of newEvents) {
        all.push(event as AuditEventEnvelope);
      }
      all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      saveAll(all);
      return {
        appended: newEvents.length,
        firstId: newEvents[0]!.id,
        lastId: newEvents[newEvents.length - 1]!.id
      };
    },

    async query(filter: AuditEventQuery): Promise<PaginatedResult<AuditEventEnvelope>> {
      let filtered = loadAll();

      if (filter.kind) filtered = filtered.filter(e => e.kind === filter.kind);
      if (filter.subjectId) filtered = filtered.filter(e => e.subjectId === filter.subjectId);
      if (filter.subjectType) filtered = filtered.filter(e => e.subjectType === filter.subjectType);
      if (filter.workspaceId) filtered = filtered.filter(e => e.workspaceId === filter.workspaceId);
      if (filter.sessionId) filtered = filtered.filter(e => e.sessionId === filter.sessionId);
      if (filter.runId) filtered = filtered.filter(e => e.runId === filter.runId);
      if (filter.fromTimestamp) filtered = filtered.filter(e => e.timestamp >= filter.fromTimestamp!);
      if (filter.toTimestamp) filtered = filtered.filter(e => e.timestamp <= filter.toTimestamp!);

      let startIndex = 0;
      if (filter.cursor) {
        const cursorIdx = filtered.findIndex(e => e.id === filter.cursor!.value);
        if (cursorIdx !== -1) {
          startIndex =
            filter.cursor!.direction === 'forward'
              ? cursorIdx + 1
              : Math.max(0, cursorIdx - 1);
        }
      }

      const limit = filter.limit ?? 100;
      const page = filtered.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < filtered.length;
      const hasPrev = startIndex > 0;

      return {
        items: page,
        nextCursor: hasMore && page.length > 0 ? page[page.length - 1]!.id : null,
        prevCursor: hasPrev && page.length > 0 ? page[0]!.id : null,
        totalCount: filtered.length
      };
    },

    async getById(id: string): Promise<AuditEventEnvelope | undefined> {
      return loadAll().find(e => e.id === id);
    },

    async countByKind(kind: string): Promise<number> {
      return loadAll().filter(e => e.kind === kind).length;
    },

    async countBySubject(subjectId: string): Promise<number> {
      return loadAll().filter(e => e.subjectId === subjectId).length;
    }
  };
}

// ---------------------------------------------------------------------------
// Web-local restore snapshot store
// ---------------------------------------------------------------------------

function createWebLocalRestoreSnapshotStore(
  config: WebEventStoreConfig
): RestoreSnapshotStore {
  const storageKey = `snapshots:${config.collectionName}`;

  function loadAll(): RestoreSnapshotDescriptor[] {
    const raw = config.storage.getItem(storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as RestoreSnapshotDescriptor[];
    } catch {
      return [];
    }
  }

  function saveAll(snapshots: RestoreSnapshotDescriptor[]): void {
    config.storage.setItem(storageKey, JSON.stringify(snapshots));
  }

  return {
    async create(
      snapshot: Omit<RestoreSnapshotDescriptor, 'id' | 'createdAt'>
    ): Promise<RestoreSnapshotDescriptor> {
      const all = loadAll();
      const id = `snapshot-${snapshot.sessionId}-${all.length + 1}`;
      const createdAt = new Date().toISOString();
      const full: RestoreSnapshotDescriptor = { ...snapshot, id, createdAt };
      all.push(full);
      saveAll(all);
      return full;
    },

    async get(id: string): Promise<RestoreSnapshotDescriptor | undefined> {
      return loadAll().find(s => s.id === id);
    },

    async getLatest(sessionId: string): Promise<RestoreSnapshotDescriptor | undefined> {
      return loadAll()
        .filter(s => s.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    },

    async list(sessionId: string): Promise<readonly RestoreSnapshotDescriptor[]> {
      return loadAll()
        .filter(s => s.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async remove(id: string): Promise<boolean> {
      const all = loadAll();
      const idx = all.findIndex(s => s.id === id);
      if (idx >= 0) {
        all.splice(idx, 1);
        saveAll(all);
        return true;
      }
      return false;
    }
  };
}

// ---------------------------------------------------------------------------
// Web-local JSON collection store
// ---------------------------------------------------------------------------

function createWebLocalJsonStore<T extends { readonly id: string }>(
  config: WebEventStoreConfig
): {
  save(record: T): void;
  get(id: string): T | undefined;
  list(): T[];
  remove(id: string): boolean;
} {
  const storageKey = `store:${config.collectionName}`;

  function loadAll(): T[] {
    const raw = config.storage.getItem(storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }

  function saveAll(records: T[]): void {
    config.storage.setItem(storageKey, JSON.stringify(records));
  }

  return {
    save(record: T): void {
      const all = loadAll();
      const idx = all.findIndex(r => r.id === record.id);
      if (idx >= 0) {
        all[idx] = record;
      } else {
        all.push(record);
      }
      saveAll(all);
    },

    get(id: string): T | undefined {
      return loadAll().find(r => r.id === id);
    },

    list(): T[] {
      return loadAll();
    },

    remove(id: string): boolean {
      const all = loadAll();
      const idx = all.findIndex(r => r.id === id);
      if (idx >= 0) {
        all.splice(idx, 1);
        saveAll(all);
        return true;
      }
      return false;
    }
  };
}

// ---------------------------------------------------------------------------
// Web-local adapter factory
// ---------------------------------------------------------------------------

export interface WebLocalPersistenceConfig {
  readonly storage?: WebStorageBackend;
  readonly namespace?: string;
}

/**
 * Creates a localStorage-backed persistence adapter for the browser/web app.
 * Falls back to in-memory when localStorage is unavailable.
 *
 * Storage keys follow: takomi:<namespace>:<collection>:<key>
 */
export function createWebLocalPersistenceAdapter(
  config: WebLocalPersistenceConfig = {}
): PersistenceAdapter {
  const storage = config.storage ?? createLocalStorageBackend(config.namespace ?? 'takomi');

  const baseConfig: WebEventStoreConfig = {
    storage,
    collectionName: 'default'
  };

  const transcriptEvents = createWebLocalEventStore<TranscriptPart>({
    ...baseConfig,
    collectionName: 'transcript-events'
  });

  const runtimeEvents = createWebLocalEventStore<RuntimeEventEnvelope>({
    ...baseConfig,
    collectionName: 'runtime-events'
  });

  const auditEvents = createWebLocalAuditStore({
    ...baseConfig,
    collectionName: 'audit-events'
  });

  const restoreSnapshots = createWebLocalRestoreSnapshotStore({
    ...baseConfig,
    collectionName: 'restore-snapshots'
  });

  const requestStore = createWebLocalJsonStore<InterventionRequest>({
    ...baseConfig,
    collectionName: 'intervention-requests'
  });
  const outcomeStore = createWebLocalJsonStore<InterventionOutcome>({
    ...baseConfig,
    collectionName: 'intervention-outcomes'
  });

  const recoveryDescriptorStore = createWebLocalJsonStore<RecoveryDescriptor>({
    ...baseConfig,
    collectionName: 'recovery-descriptors'
  });
  const recoveryActionStore = createWebLocalJsonStore<RecoveryAction>({
    ...baseConfig,
    collectionName: 'recovery-actions'
  });

  const interventions: InterventionStore = {
    saveRequest: async (req) => { requestStore.save(req); },
    getRequest: async (id) => requestStore.get(id),
    listRequests: async (sessionId) => {
      return requestStore
        .list()
        .filter(r => r.target.sessionId === sessionId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    },
    saveOutcome: async (out) => { outcomeStore.save(out); },
    getOutcome: async (requestId) => outcomeStore.get(requestId),
    listByRunId: async (runId) => {
      return requestStore
        .list()
        .filter(r => r.target.runId === runId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    },
    listBySessionSubtree: async (rootSessionId, sessionIds) => {
      const idSet = new Set([rootSessionId, ...sessionIds]);
      return requestStore
        .list()
        .filter(r => idSet.has(r.target.sessionId) || (r.target.rootSessionId && idSet.has(r.target.rootSessionId)))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    }
  };

  const recovery: RecoveryStore = {
    save: async (descriptor) => { recoveryDescriptorStore.save(descriptor); },
    get: async (id) => recoveryDescriptorStore.get(id),
    listBySession: async (sessionId) => {
      return recoveryDescriptorStore
        .list()
        .filter(d => d.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    listActive: async () => {
      return recoveryDescriptorStore
        .list()
        .filter(d => d.state === 'pending' || d.state === 'in-progress')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    saveAction: async (action) => { recoveryActionStore.save(action); },
    listActions: async (recoveryId) => {
      return recoveryActionStore.list().filter(a => a.recoveryId === recoveryId);
    }
  };

  const nodeStore = createWebLocalJsonStore<TaskGraphNode>({
    ...baseConfig,
    collectionName: 'task-graph-nodes'
  });
  const edgeStore = createWebLocalJsonStore<TaskGraphEdge & { readonly id: string }>({
    ...baseConfig,
    collectionName: 'task-graph-edges'
  });
  const artifactStore = createWebLocalJsonStore<TaskGraphArtifact>({
    ...baseConfig,
    collectionName: 'task-graph-artifacts'
  });

  const taskGraph: TaskGraphStore = {
    saveNode: async (node) => { nodeStore.save(node); },
    getNode: async (id) => nodeStore.get(id),
    listNodes: async (sessionId) => {
      return nodeStore.list().filter(n => n.sessionId === sessionId);
    },
    saveEdge: async (edge) => {
      const id = `${edge.from}->${edge.to}${edge.kind ? `:${edge.kind}` : ''}`;
      edgeStore.save({ ...edge, id });
    },
    listEdges: async (sessionId) => {
      const nodes = nodeStore.list();
      const nodeIds = new Set(
        nodes.filter(n => n.sessionId === sessionId).map(n => n.id)
      );
      return edgeStore.list().filter(e => nodeIds.has(e.from) || nodeIds.has(e.to));
    },
    removeNode: async (id) => nodeStore.remove(id),
    saveArtifact: async (artifact) => { artifactStore.save(artifact); },
    getArtifact: async (id) => artifactStore.get(id),
    listArtifacts: async (sessionId) => {
      return artifactStore.list().filter(a => a.sessionId === sessionId);
    }
  };

  const sessionStore = createWebLocalJsonStore<OrchestrationSession>({
    ...baseConfig,
    collectionName: 'orchestration-sessions'
  });

  const orchestrationSessions: OrchestrationSessionStore = {
    save: async (session) => { sessionStore.save(session); },
    get: async (id) => sessionStore.get(id),
    list: async (workspaceId) => {
      const all = sessionStore.list();
      if (workspaceId) return all.filter(s => s.workspaceId === workspaceId);
      return all;
    },
    remove: async (id) => sessionStore.remove(id)
  };

  const readModels: ReadModelProvider = {
    async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
      const session = await orchestrationSessions.get(sessionId);
      if (!session) return null;

      const transcriptCount = await transcriptEvents.count(sessionId);
      const runtimeCount = await runtimeEvents.count(sessionId);
      const auditCount = await auditEvents.countBySubject(sessionId);
      const interventionList = await interventions.listRequests(sessionId);

      return {
        sessionId: session.id,
        name: session.id,
        status: session.status,
        workspaceId: session.workspaceId,
        transcriptPartCount: transcriptCount,
        runtimeEventCount: runtimeCount,
        auditEventCount: auditCount,
        interventionCount: interventionList.length,
        lastActivityAt: session.updatedAt ?? null,
        createdAt: session.createdAt ?? null
      };
    },

    async getSessionSummaries(workspaceId?: string): Promise<readonly SessionSummary[]> {
      const sessions = await orchestrationSessions.list(workspaceId);
      const summaries: SessionSummary[] = [];
      for (const session of sessions) {
        const summary = await this.getSessionSummary(session.id);
        if (summary) summaries.push(summary);
      }
      return summaries;
    },

    async getTaskSummary(taskId: string): Promise<TaskSummary | null> {
      const node = await taskGraph.getNode(taskId);
      if (!node) return null;

      const edges = await taskGraph.listEdges(node.sessionId ?? '');
      const artifacts = await taskGraph.listArtifacts(node.sessionId ?? '');
      const depCount = edges.filter(e => e.to === taskId).length;
      const artCount = artifacts.filter(a => a.taskId === taskId).length;

      return {
        taskId: node.id,
        sessionId: node.sessionId ?? '',
        title: node.title,
        state: node.state,
        dependencyCount: depCount,
        artifactCount: artCount,
        lastActivityAt: null
      };
    },

    async getTaskSummaries(sessionId: string): Promise<readonly TaskSummary[]> {
      const nodes = await taskGraph.listNodes(sessionId);
      const summaries: TaskSummary[] = [];
      for (const node of nodes) {
        const summary = await this.getTaskSummary(node.id);
        if (summary) summaries.push(summary);
      }
      return summaries;
    },

    async getTranscriptView(sessionId: string): Promise<TranscriptSnapshot | null> {
      const result = await transcriptEvents.query({ sessionId, limit: 10000 });
      if (result.items.length === 0) return null;
      return {
        sessionId,
        parts: result.items,
        lastUpdatedAt: result.items[result.items.length - 1]!.timestamp
      };
    }
  };

  return {
    transcriptEvents,
    runtimeEvents,
    auditEvents,
    restoreSnapshots,
    interventions,
    recovery,
    taskGraph,
    orchestrationSessions,
    readModels
  };
}
