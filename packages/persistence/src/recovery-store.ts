import type {
  RecoveryStore,
  RecoveryDescriptor,
  RecoveryAction
} from '@takomi/contracts';

/**
 * In-memory recovery store.
 * Persists recovery descriptors and their associated actions.
 * Supports querying by session and filtering active recoveries.
 */
export function createInMemoryRecoveryStore(): RecoveryStore {
  const descriptors = new Map<string, RecoveryDescriptor>();
  const actions = new Map<string, RecoveryAction[]>();

  return {
    async save(descriptor: RecoveryDescriptor): Promise<void> {
      descriptors.set(descriptor.id, structuredClone(descriptor) as RecoveryDescriptor);
    },

    async get(id: string): Promise<RecoveryDescriptor | undefined> {
      return descriptors.get(id);
    },

    async listBySession(sessionId: string): Promise<readonly RecoveryDescriptor[]> {
      return Array.from(descriptors.values())
        .filter(d => d.sessionId === sessionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async listActive(): Promise<readonly RecoveryDescriptor[]> {
      return Array.from(descriptors.values())
        .filter(d => d.state === 'pending' || d.state === 'in-progress')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async saveAction(action: RecoveryAction): Promise<void> {
      const existing = actions.get(action.recoveryId) ?? [];
      existing.push(structuredClone(action) as RecoveryAction);
      actions.set(action.recoveryId, existing);
    },

    async listActions(recoveryId: string): Promise<readonly RecoveryAction[]> {
      return actions.get(recoveryId) ?? [];
    }
  };
}
