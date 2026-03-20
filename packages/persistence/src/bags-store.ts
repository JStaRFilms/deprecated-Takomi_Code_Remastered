import type {
  BagsLinkageRecord,
  BagsReadinessResult,
  BagsState,
  BagsStore,
} from '@takomi/contracts';

export interface InMemoryBagsStore extends BagsStore {}

export function createInMemoryBagsStore(): InMemoryBagsStore {
  const linkages = new Map<string, BagsLinkageRecord>();
  const readiness = new Map<string, BagsReadinessResult>();

  return {
    async getState(workspaceId: string): Promise<BagsState | undefined> {
      const linkage = linkages.get(workspaceId);
      const latestReadiness = readiness.get(workspaceId);
      return {
        workspaceId,
        ...(linkage !== undefined ? { linkage } : {}),
        ...(latestReadiness !== undefined ? { latestReadiness } : {}),
      };
    },

    async saveLinkage(record: BagsLinkageRecord): Promise<void> {
      linkages.set(record.workspaceId, structuredClone(record));
    },

    async clearLinkage(workspaceId: string): Promise<void> {
      linkages.delete(workspaceId);
    },

    async saveReadiness(result: BagsReadinessResult): Promise<void> {
      readiness.set(result.workspaceId, structuredClone(result));
    },
  };
}
