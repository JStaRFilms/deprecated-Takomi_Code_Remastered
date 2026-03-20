import type {
  InterventionStore,
  InterventionRequest,
  InterventionOutcome
} from '@takomi/contracts';

/**
 * In-memory intervention store.
 * Persists intervention requests and their outcomes.
 * Supports querying by session, run, and subtree scope.
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
    },

    async listByRunId(runId: string): Promise<readonly InterventionRequest[]> {
      return Array.from(requests.values())
        .filter(r => r.target.runId === runId)
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    },

    async listBySessionSubtree(
      rootSessionId: string,
      sessionIds: readonly string[]
    ): Promise<readonly InterventionRequest[]> {
      const idSet = new Set([rootSessionId, ...sessionIds]);
      return Array.from(requests.values())
        .filter(r => idSet.has(r.target.sessionId) || (r.target.rootSessionId && idSet.has(r.target.rootSessionId)))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    }
  };
}
