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
// File system abstraction — the desktop app wires the real implementation
// ---------------------------------------------------------------------------

export interface DesktopFileSystemBridge {
  readJsonFile(path: string): Promise<unknown | null>;
  writeJsonFile(path: string, data: unknown): Promise<void>;
  listDirectory(path: string): Promise<string[]>;
  ensureDirectory(path: string): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  removeFile(path: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// File-backed event store
// ---------------------------------------------------------------------------

interface FileEventStoreConfig {
  readonly baseDir: string;
  readonly fs: DesktopFileSystemBridge;
  readonly collectionName: string;
}

function createFileBackedEventStore<
  TEvent extends { readonly id: string; readonly sessionId: string; readonly timestamp: string }
>(config: FileEventStoreConfig): EventStore<TEvent> {
  const dirPath = `${config.baseDir}/${config.collectionName}`;

  async function loadAll(): Promise<TEvent[]> {
    const files = await config.fs.listDirectory(dirPath);
    const events: TEvent[] = [];
    for (const file of files.sort()) {
      if (!file.endsWith('.json')) continue;
      const data = await config.fs.readJsonFile(`${dirPath}/${file}`);
      if (Array.isArray(data)) {
        events.push(...(data as TEvent[]));
      }
    }
    return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async function appendToFile(sessionId: string, events: readonly TEvent[]): Promise<void> {
    const filePath = `${dirPath}/${sessionId}.json`;
    const existing = (await config.fs.readJsonFile(filePath)) as TEvent[] | null;
    const merged = [...(existing ?? []), ...events];
    await config.fs.writeJsonFile(filePath, merged);
  }

  return {
    async append(newEvents: readonly TEvent[]): Promise<AppendResult> {
      if (newEvents.length === 0) {
        throw new Error('Cannot append empty event batch');
      }

      // Group by session for file organization
      const bySession = new Map<string, TEvent[]>();
      for (const event of newEvents) {
        let sessionEvents = bySession.get(event.sessionId);
        if (!sessionEvents) {
          sessionEvents = [];
          bySession.set(event.sessionId, sessionEvents);
        }
        sessionEvents.push(event as TEvent);
      }

      for (const [sessionId, events] of bySession) {
        await config.fs.ensureDirectory(dirPath);
        await appendToFile(sessionId, events);
      }

      return {
        appended: newEvents.length,
        firstId: newEvents[0]!.id,
        lastId: newEvents[newEvents.length - 1]!.id
      };
    },

    async query(filter: EventStoreQuery): Promise<PaginatedResult<TEvent>> {
      let filtered: TEvent[];

      if (filter.sessionId) {
        const filePath = `${dirPath}/${filter.sessionId}.json`;
        const data = (await config.fs.readJsonFile(filePath)) as TEvent[] | null;
        filtered = data ?? [];
      } else {
        filtered = await loadAll();
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
      const all = await loadAll();
      return all.find(e => e.id === id);
    },

    async count(sessionId: string): Promise<number> {
      const filePath = `${dirPath}/${sessionId}.json`;
      const data = (await config.fs.readJsonFile(filePath)) as TEvent[] | null;
      return data?.length ?? 0;
    }
  };
}

// ---------------------------------------------------------------------------
// File-backed audit store
// ---------------------------------------------------------------------------

function createFileBackedAuditStore(config: FileEventStoreConfig): AuditEventStore {
  const dirPath = `${config.baseDir}/${config.collectionName}`;

  async function loadAll(): Promise<AuditEventEnvelope[]> {
    const files = await config.fs.listDirectory(dirPath);
    const events: AuditEventEnvelope[] = [];
    for (const file of files.sort()) {
      if (!file.endsWith('.json')) continue;
      const data = await config.fs.readJsonFile(`${dirPath}/${file}`);
      if (Array.isArray(data)) {
        events.push(...(data as AuditEventEnvelope[]));
      }
    }
    return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  return {
    async append(newEvents: readonly AuditEventEnvelope[]): Promise<AppendResult> {
      if (newEvents.length === 0) {
        throw new Error('Cannot append empty audit event batch');
      }
      const filePath = `${dirPath}/audit-events.json`;
      await config.fs.ensureDirectory(dirPath);
      const existing = (await config.fs.readJsonFile(filePath)) as AuditEventEnvelope[] | null;
      const merged = [...(existing ?? []), ...newEvents];
      await config.fs.writeJsonFile(filePath, merged);
      return {
        appended: newEvents.length,
        firstId: newEvents[0]!.id,
        lastId: newEvents[newEvents.length - 1]!.id
      };
    },

    async query(filter: AuditEventQuery): Promise<PaginatedResult<AuditEventEnvelope>> {
      let filtered = await loadAll();

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
      const all = await loadAll();
      return all.find(e => e.id === id);
    },

    async countByKind(kind: string): Promise<number> {
      const all = await loadAll();
      return all.filter(e => e.kind === kind).length;
    },

    async countBySubject(subjectId: string): Promise<number> {
      const all = await loadAll();
      return all.filter(e => e.subjectId === subjectId).length;
    }
  };
}

// ---------------------------------------------------------------------------
// File-backed restore snapshot store
// ---------------------------------------------------------------------------

function createFileBackedRestoreSnapshotStore(
  config: FileEventStoreConfig
): RestoreSnapshotStore {
  const dirPath = `${config.baseDir}/${config.collectionName}`;

  async function loadAll(): Promise<RestoreSnapshotDescriptor[]> {
    const files = await config.fs.listDirectory(dirPath);
    const snapshots: RestoreSnapshotDescriptor[] = [];
    for (const file of files.sort()) {
      if (!file.endsWith('.json')) continue;
      const data = await config.fs.readJsonFile(`${dirPath}/${file}`);
      if (data && typeof data === 'object' && 'id' in data) {
        snapshots.push(data as RestoreSnapshotDescriptor);
      }
    }
    return snapshots;
  }

  return {
    async create(
      snapshot: Omit<RestoreSnapshotDescriptor, 'id' | 'createdAt'>
    ): Promise<RestoreSnapshotDescriptor> {
      await config.fs.ensureDirectory(dirPath);
      const all = await loadAll();
      const id = `snapshot-${snapshot.sessionId}-${all.length + 1}`;
      const createdAt = new Date().toISOString();
      const full: RestoreSnapshotDescriptor = {
        ...snapshot,
        id,
        createdAt
      };
      const filePath = `${dirPath}/${id}.json`;
      await config.fs.writeJsonFile(filePath, full);
      return full;
    },

    async get(id: string): Promise<RestoreSnapshotDescriptor | undefined> {
      const filePath = `${dirPath}/${id}.json`;
      const data = await config.fs.readJsonFile(filePath);
      if (data && typeof data === 'object' && 'id' in data) {
        return data as RestoreSnapshotDescriptor;
      }
      return undefined;
    },

    async getLatest(sessionId: string): Promise<RestoreSnapshotDescriptor | undefined> {
      const all = await loadAll();
      return all
        .filter(s => s.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    },

    async list(sessionId: string): Promise<readonly RestoreSnapshotDescriptor[]> {
      const all = await loadAll();
      return all
        .filter(s => s.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async remove(id: string): Promise<boolean> {
      const filePath = `${dirPath}/${id}.json`;
      if (await config.fs.fileExists(filePath)) {
        await config.fs.removeFile(filePath);
        return true;
      }
      return false;
    }
  };
}

// ---------------------------------------------------------------------------
// File-backed generic JSON store (for interventions, task graph, etc.)
// ---------------------------------------------------------------------------

function createFileBackedJsonStore<T extends { readonly id: string }>(
  config: FileEventStoreConfig
): {
  save(record: T): Promise<void>;
  get(id: string): Promise<T | undefined>;
  list(): Promise<readonly T[]>;
  remove(id: string): Promise<boolean>;
} {
  const filePath = `${config.baseDir}/${config.collectionName}/store.json`;

  async function loadAll(): Promise<T[]> {
    const data = (await config.fs.readJsonFile(filePath)) as T[] | null;
    return data ?? [];
  }

  return {
    async save(record: T): Promise<void> {
      await config.fs.ensureDirectory(`${config.baseDir}/${config.collectionName}`);
      const all = await loadAll();
      const idx = all.findIndex(r => r.id === record.id);
      if (idx >= 0) {
        all[idx] = record;
      } else {
        all.push(record);
      }
      await config.fs.writeJsonFile(filePath, all);
    },

    async get(id: string): Promise<T | undefined> {
      const all = await loadAll();
      return all.find(r => r.id === id);
    },

    async list(): Promise<readonly T[]> {
      return loadAll();
    },

    async remove(id: string): Promise<boolean> {
      const all = await loadAll();
      const idx = all.findIndex(r => r.id === id);
      if (idx >= 0) {
        all.splice(idx, 1);
        await config.fs.writeJsonFile(filePath, all);
        return true;
      }
      return false;
    }
  };
}

// ---------------------------------------------------------------------------
// Desktop adapter factory
// ---------------------------------------------------------------------------

export interface DesktopPersistenceConfig {
  readonly fs: DesktopFileSystemBridge;
  readonly dataDir: string;
}

/**
 * Creates a file-backed persistence adapter for the Electron desktop app.
 *
 * Storage layout:
 *   <dataDir>/
 *     transcript-events/<sessionId>.json
 *     runtime-events/<sessionId>.json
 *     audit-events/audit-events.json
 *     restore-snapshots/<snapshotId>.json
 *     interventions/store.json
 *     task-graph-nodes/store.json
 *     task-graph-edges/store.json
 *     task-graph-artifacts/store.json
 *     orchestration-sessions/store.json
 */
export function createDesktopPersistenceAdapter(
  config: DesktopPersistenceConfig
): PersistenceAdapter {
  const baseConfig: Omit<FileEventStoreConfig, 'collectionName'> = {
    baseDir: config.dataDir,
    fs: config.fs
  };

  const transcriptEvents = createFileBackedEventStore<TranscriptPart>({
    ...baseConfig,
    collectionName: 'transcript-events'
  });

  const runtimeEvents = createFileBackedEventStore<RuntimeEventEnvelope>({
    ...baseConfig,
    collectionName: 'runtime-events'
  });

  const auditEvents = createFileBackedAuditStore({
    ...baseConfig,
    collectionName: 'audit-events'
  });

  const restoreSnapshots = createFileBackedRestoreSnapshotStore({
    ...baseConfig,
    collectionName: 'restore-snapshots'
  });

  const interventionStore = createFileBackedJsonStore<InterventionRequest>({
    ...baseConfig,
    collectionName: 'interventions'
  });
  const interventionOutcomeStore = createFileBackedJsonStore<InterventionOutcome>({
    ...baseConfig,
    collectionName: 'intervention-outcomes'
  });

  const nodeStore = createFileBackedJsonStore<TaskGraphNode>({
    ...baseConfig,
    collectionName: 'task-graph-nodes'
  });
  const edgeStore = createFileBackedJsonStore<TaskGraphEdge & { readonly id: string }>({
    ...baseConfig,
    collectionName: 'task-graph-edges'
  });
  const artifactStore = createFileBackedJsonStore<TaskGraphArtifact>({
    ...baseConfig,
    collectionName: 'task-graph-artifacts'
  });

  const sessionStore = createFileBackedJsonStore<OrchestrationSession>({
    ...baseConfig,
    collectionName: 'orchestration-sessions'
  });

  const interventions: InterventionStore = {
    saveRequest: (req) => interventionStore.save(req),
    getRequest: (id) => interventionStore.get(id),
    listRequests: async (sessionId) => {
      const all = await interventionStore.list();
      return all
        .filter(r => r.target.sessionId === sessionId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    },
    saveOutcome: (out) => interventionOutcomeStore.save(out),
    getOutcome: (requestId) => interventionOutcomeStore.get(requestId)
  };

  const taskGraph: TaskGraphStore = {
    saveNode: (node) => nodeStore.save(node),
    getNode: (id) => nodeStore.get(id),
    listNodes: async (sessionId) => {
      const all = await nodeStore.list();
      return all.filter(n => n.sessionId === sessionId);
    },
    saveEdge: (edge) => {
      const id = `${edge.from}->${edge.to}${edge.kind ? `:${edge.kind}` : ''}`;
      return edgeStore.save({ ...edge, id });
    },
    listEdges: async (sessionId) => {
      const nodes = await nodeStore.list();
      const nodeIds = new Set(
        nodes.filter(n => n.sessionId === sessionId).map(n => n.id)
      );
      const allEdges = await edgeStore.list();
      return allEdges.filter(e => nodeIds.has(e.from) || nodeIds.has(e.to));
    },
    removeNode: (id) => nodeStore.remove(id),
    saveArtifact: (artifact) => artifactStore.save(artifact),
    getArtifact: (id) => artifactStore.get(id),
    listArtifacts: async (sessionId) => {
      const all = await artifactStore.list();
      return all.filter(a => a.sessionId === sessionId);
    }
  };

  const orchestrationSessions: OrchestrationSessionStore = {
    save: (session) => sessionStore.save(session),
    get: (id) => sessionStore.get(id),
    list: async (workspaceId) => {
      const all = await sessionStore.list();
      if (workspaceId) return all.filter(s => s.workspaceId === workspaceId);
      return all;
    },
    remove: (id) => sessionStore.remove(id)
  };

  // Read models — derive views from the other stores
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
    taskGraph,
    orchestrationSessions,
    readModels
  };
}
