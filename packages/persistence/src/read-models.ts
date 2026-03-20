import type {
  AuditEventStore,
  InterventionStore,
  OrchestrationSessionStore,
  ReadModelProvider,
  RestoreSnapshotStore,
  RuntimeEventStore,
  SessionSummary,
  TaskGraphStore,
  TaskSummary,
  TranscriptEventStore,
  TranscriptSnapshot
} from '@takomi/contracts';

interface ReadModelAdapterDeps {
  readonly transcriptEvents: TranscriptEventStore;
  readonly runtimeEvents: RuntimeEventStore;
  readonly auditEvents: AuditEventStore;
  readonly restoreSnapshots: RestoreSnapshotStore;
  readonly interventions: InterventionStore;
  readonly taskGraph: TaskGraphStore;
  readonly orchestrationSessions: OrchestrationSessionStore;
}

/**
 * Read models reconstruct denormalized views from event stores and snapshots.
 * They do not own data — they derive it from the event sources.
 */
export function createInMemoryReadModelProvider(
  adapter: ReadModelAdapterDeps
): ReadModelProvider {
  return {
    async getSessionSummary(sessionId: string): Promise<SessionSummary | null> {
      const session = await adapter.orchestrationSessions.get(sessionId);
      if (!session) return null;

      const transcriptCount = await adapter.transcriptEvents.count(sessionId);
      const runtimeCount = await adapter.runtimeEvents.count(sessionId);
      const auditCount = await adapter.auditEvents.countBySubject(sessionId);
      const interventions = await adapter.interventions.listRequests(sessionId);

      return {
        sessionId: session.id,
        name: session.id,
        status: session.status,
        workspaceId: session.workspaceId,
        transcriptPartCount: transcriptCount,
        runtimeEventCount: runtimeCount,
        auditEventCount: auditCount,
        interventionCount: interventions.length,
        lastActivityAt: session.updatedAt ?? null,
        createdAt: session.createdAt ?? null
      };
    },

    async getSessionSummaries(workspaceId?: string): Promise<readonly SessionSummary[]> {
      const sessions = await adapter.orchestrationSessions.list(workspaceId);
      const summaries: SessionSummary[] = [];
      for (const session of sessions) {
        const summary = await this.getSessionSummary(session.id);
        if (summary) summaries.push(summary);
      }
      return summaries;
    },

    async getTaskSummary(taskId: string): Promise<TaskSummary | null> {
      const node = await adapter.taskGraph.getNode(taskId);
      if (!node) return null;

      const edges = await adapter.taskGraph.listEdges(node.sessionId ?? '');
      const artifacts = await adapter.taskGraph.listArtifacts(node.sessionId ?? '');
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
      const nodes = await adapter.taskGraph.listNodes(sessionId);
      const summaries: TaskSummary[] = [];
      for (const node of nodes) {
        const summary = await this.getTaskSummary(node.id);
        if (summary) summaries.push(summary);
      }
      return summaries;
    },

    async getTranscriptView(sessionId: string): Promise<TranscriptSnapshot | null> {
      const result = await adapter.transcriptEvents.query({ sessionId, limit: 10000 });
      if (result.items.length === 0) return null;

      return {
        sessionId,
        parts: result.items,
        lastUpdatedAt: result.items[result.items.length - 1]!.timestamp
      };
    }
  };
}
