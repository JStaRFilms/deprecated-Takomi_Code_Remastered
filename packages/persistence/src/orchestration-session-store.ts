import type {
  OrchestrationSessionStore,
  OrchestrationSession
} from '@takomi/contracts';

/**
 * In-memory orchestration session store.
 */
export function createInMemoryOrchestrationSessionStore(): OrchestrationSessionStore {
  const sessions = new Map<string, OrchestrationSession>();

  return {
    async save(session: OrchestrationSession): Promise<void> {
      sessions.set(session.id, structuredClone(session) as OrchestrationSession);
    },

    async get(id: string): Promise<OrchestrationSession | undefined> {
      return sessions.get(id);
    },

    async list(workspaceId?: string): Promise<readonly OrchestrationSession[]> {
      const all = Array.from(sessions.values());
      if (workspaceId) {
        return all.filter(s => s.workspaceId === workspaceId);
      }
      return all;
    },

    async remove(id: string): Promise<boolean> {
      return sessions.delete(id);
    }
  };
}
