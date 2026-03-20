import type {
  AppendResult,
  EventStore,
  EventStoreQuery,
  PaginatedResult
} from '@takomi/contracts';

/**
 * In-memory append-first event store.
 * Events are immutable once written. Supports cursor-based pagination.
 * Suitable for web-local and development environments.
 * Desktop adapter replaces this with file-backed storage.
 */
export function createInMemoryEventStore<
  TEvent extends { readonly id: string; readonly sessionId: string; readonly timestamp: string }
>(): EventStore<TEvent> {
  const events: TEvent[] = [];

  return {
    async append(newEvents: readonly TEvent[]): Promise<AppendResult> {
      if (newEvents.length === 0) {
        throw new Error('Cannot append empty event batch');
      }
      const startIndex = events.length;
      for (const event of newEvents) {
        events.push(structuredClone(event) as TEvent);
      }
      return {
        appended: newEvents.length,
        firstId: newEvents[0]!.id,
        lastId: newEvents[newEvents.length - 1]!.id
      };
    },

    async query(filter: EventStoreQuery): Promise<PaginatedResult<TEvent>> {
      let filtered = events;

      if (filter.sessionId) {
        filtered = filtered.filter(e => e.sessionId === filter.sessionId);
      }

      if (filter.fromTimestamp) {
        filtered = filtered.filter(e => e.timestamp >= filter.fromTimestamp!);
      }

      if (filter.toTimestamp) {
        filtered = filtered.filter(e => e.timestamp <= filter.toTimestamp!);
      }

      // Cursor-based pagination
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

    async getById(id: string): Promise<TEvent | undefined> {
      return events.find(e => e.id === id);
    },

    async count(sessionId: string): Promise<number> {
      return events.filter(e => e.sessionId === sessionId).length;
    }
  };
}
