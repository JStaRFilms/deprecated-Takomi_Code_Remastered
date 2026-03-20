import type {
  TaskGraphStore,
  TaskGraphNode,
  TaskGraphEdge,
  TaskGraphArtifact
} from '@takomi/contracts';

/**
 * In-memory task graph store.
 * Stores nodes, edges, and artifacts for orchestration task graphs.
 */
export function createInMemoryTaskGraphStore(): TaskGraphStore {
  const nodes = new Map<string, TaskGraphNode>();
  const edges: TaskGraphEdge[] = [];
  const artifacts = new Map<string, TaskGraphArtifact>();

  return {
    async saveNode(node: TaskGraphNode): Promise<void> {
      nodes.set(node.id, structuredClone(node) as TaskGraphNode);
    },

    async getNode(id: string): Promise<TaskGraphNode | undefined> {
      return nodes.get(id);
    },

    async listNodes(sessionId: string): Promise<readonly TaskGraphNode[]> {
      return Array.from(nodes.values()).filter(n => n.sessionId === sessionId);
    },

    async saveEdge(edge: TaskGraphEdge): Promise<void> {
      const idx = edges.findIndex(
        e => e.from === edge.from && e.to === edge.to && e.kind === edge.kind
      );
      if (idx === -1) {
        edges.push(structuredClone(edge) as TaskGraphEdge);
      }
    },

    async listEdges(sessionId: string): Promise<readonly TaskGraphEdge[]> {
      const nodeIds = new Set(
        Array.from(nodes.values())
          .filter(n => n.sessionId === sessionId)
          .map(n => n.id)
      );
      return edges.filter(e => nodeIds.has(e.from) || nodeIds.has(e.to));
    },

    async removeNode(id: string): Promise<boolean> {
      return nodes.delete(id);
    },

    async saveArtifact(artifact: TaskGraphArtifact): Promise<void> {
      artifacts.set(artifact.id, structuredClone(artifact) as TaskGraphArtifact);
    },

    async getArtifact(id: string): Promise<TaskGraphArtifact | undefined> {
      return artifacts.get(id);
    },

    async listArtifacts(sessionId: string): Promise<readonly TaskGraphArtifact[]> {
      return Array.from(artifacts.values()).filter(a => a.sessionId === sessionId);
    }
  };
}
