import type {
  InterventionStore,
  InterventionRequest,
  InterventionOutcome
} from '@takomi/contracts';

/**
 * In-memory intervention store.
 * Persists intervention requests and their outcomes.
 */
export function createInMemoryInterventionStore(): InterventionStore {
  const requests = new Map<string, InterventionRequest>();
  const outcomes = new Map<string, InterventionOutcome>();

  return {
    async saveRequest(request: InterventionRequest): Promise<void> {
      requests.set(request.id, structuredClone(request) as InterventionRequest);
    },

    async getRequest(id: string): Promise<InterventionRequest | undefined> {
      return requests.get(id);
    },

    async listRequests(sessionId: string): Promise<readonly InterventionRequest[]> {
      return Array.from(requests.values())
        .filter(r => r.target.sessionId === sessionId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    },

    async saveOutcome(outcome: InterventionOutcome): Promise<void> {
      outcomes.set(outcome.requestId, structuredClone(outcome) as InterventionOutcome);
    },

    async getOutcome(requestId: string): Promise<InterventionOutcome | undefined> {
      return outcomes.get(requestId);
    }
  };
}
