import type {
  AppendResult,
  AuditEventEnvelope,
  AuditEventQuery,
  AuditEventStore,
  PaginatedResult
} from '@takomi/contracts';

/**
 * In-memory audit event store.
 * Audit events are first-class records — not console leftovers.
 */
export function createInMemoryAuditEventStore(): AuditEventStore {
  const events: AuditEventEnvelope[] = [];

  return {
    async append(newEvents: readonly AuditEventEnvelope[]): Promise<AppendResult> {
      if (newEvents.length === 0) {
        throw new Error('Cannot append empty audit event batch');
      }
      for (const event of newEvents) {
        events.push(structuredClone(event) as AuditEventEnvelope);
      }
      return {
        appended: newEvents.length,
        firstId: newEvents[0]!.id,
        lastId: newEvents[newEvents.length - 1]!.id
      };
    },

    async query(filter: AuditEventQuery): Promise<PaginatedResult<AuditEventEnvelope>> {
      let filtered = events;

      if (filter.kind) {
        filtered = filtered.filter(e => e.kind === filter.kind);
      }
      if (filter.subjectId) {
        filtered = filtered.filter(e => e.subjectId === filter.subjectId);
      }
      if (filter.subjectType) {
        filtered = filtered.filter(e => e.subjectType === filter.subjectType);
      }
      if (filter.workspaceId) {
        filtered = filtered.filter(e => e.workspaceId === filter.workspaceId);
      }
      if (filter.sessionId) {
        filtered = filtered.filter(e => e.sessionId === filter.sessionId);
      }
      if (filter.runId) {
        filtered = filtered.filter(e => e.runId === filter.runId);
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
          startIndex = filter.cursor!.direction === 'forward' ? cursorIdx + 1 : Math.max(0, cursorIdx - 1);
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
      return events.find(e => e.id === id);
    },

    async countByKind(kind: string): Promise<number> {
      return events.filter(e => e.kind === kind).length;
    },

    async countBySubject(subjectId: string): Promise<number> {
      return events.filter(e => e.subjectId === subjectId).length;
    }
  };
}
