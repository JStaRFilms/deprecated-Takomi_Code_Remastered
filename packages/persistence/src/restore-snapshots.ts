import type {
  RestoreSnapshotDescriptor,
  RestoreSnapshotStore
} from '@takomi/contracts';

/**
 * In-memory restore snapshot store.
 * Snapshots capture session state at a point in time for restore/recovery.
 */
export function createInMemoryRestoreSnapshotStore(): RestoreSnapshotStore {
  const snapshots = new Map<string, RestoreSnapshotDescriptor>();
  let counter = 0;

  return {
    async create(
      snapshot: Omit<RestoreSnapshotDescriptor, 'id' | 'createdAt'>
    ): Promise<RestoreSnapshotDescriptor> {
      counter++;
      const id = `snapshot-${snapshot.sessionId}-${counter}`;
      const createdAt = new Date().toISOString();
      const full: RestoreSnapshotDescriptor = {
        ...structuredClone(snapshot) as typeof snapshot,
        id,
        createdAt
      };
      snapshots.set(id, full);
      return full;
    },

    async get(id: string): Promise<RestoreSnapshotDescriptor | undefined> {
      return snapshots.get(id);
    },

    async getLatest(sessionId: string): Promise<RestoreSnapshotDescriptor | undefined> {
      const sessionSnapshots = Array.from(snapshots.values())
        .filter(s => s.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return sessionSnapshots[0];
    },

    async list(sessionId: string): Promise<readonly RestoreSnapshotDescriptor[]> {
      return Array.from(snapshots.values())
        .filter(s => s.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async remove(id: string): Promise<boolean> {
      return snapshots.delete(id);
    }
  };
}
