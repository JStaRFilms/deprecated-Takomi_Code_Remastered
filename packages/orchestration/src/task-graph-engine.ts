import type {
  TaskGraphNode,
  TaskGraphEdge,
  TaskGraphState,
  TaskGraphStore
} from '@takomi/contracts';

/**
 * Represents the resolved execution order and ready set for a task graph.
 */
export interface TaskGraphExecutionPlan {
  readonly rootSessionId: string;
  readonly executionOrder: readonly string[];
  readonly readyTaskIds: readonly string[];
  readonly blockedTaskIds: readonly string[];
  readonly completedTaskIds: readonly string[];
  readonly failedTaskIds: readonly string[];
}

/**
 * Validates that a set of nodes and edges forms a DAG (no cycles).
 * Returns true if valid, false if cycles detected.
 */
export function validateDAG(
  nodes: readonly TaskGraphNode[],
  edges: readonly TaskGraphEdge[]
): boolean {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.from);
    if (neighbors) {
      neighbors.push(edge.to);
    }
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  let processed = 0;
  while (queue.length > 0) {
    const current = queue.shift()!;
    processed += 1;

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return processed === nodes.length;
}

/**
 * Topologically sorts task nodes respecting dependency edges.
 * Returns nodes in execution order (dependencies first).
 */
export function topologicalSort(
  nodes: readonly TaskGraphNode[],
  edges: readonly TaskGraphEdge[]
): readonly string[] {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    const neighbors = adjacency.get(edge.from);
    if (neighbors) {
      neighbors.push(edge.to);
    }
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}

/**
 * Computes which tasks are ready to run (all dependencies completed, task is idle/queued).
 */
export function computeReadyTasks(
  nodes: readonly TaskGraphNode[],
  edges: readonly TaskGraphEdge[]
): readonly string[] {
  const completedIds = new Set(
    nodes.filter(n => n.state === 'completed').map(n => n.id)
  );

  const dependencyMap = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind === 'depends-on' || edge.kind === 'blocks' || !edge.kind) {
      const deps = dependencyMap.get(edge.to) ?? [];
      deps.push(edge.from);
      dependencyMap.set(edge.to, deps);
    }
  }

  return nodes
    .filter(n => {
      if (n.state !== 'idle' && n.state !== 'queued') {
        return false;
      }
      const deps = dependencyMap.get(n.id) ?? [];
      return deps.every(d => completedIds.has(d));
    })
    .map(n => n.id);
}

/**
 * Builds a full execution plan from the current graph state.
 */
export async function buildExecutionPlan(
  sessionId: string,
  store: TaskGraphStore
): Promise<TaskGraphExecutionPlan> {
  const nodes = await store.listNodes(sessionId);
  const edges = await store.listEdges(sessionId);

  const executionOrder = topologicalSort(nodes, edges);
  const readyTaskIds = computeReadyTasks(nodes, edges);

  const blockedTaskIds = nodes
    .filter(n => n.state === 'blocked')
    .map(n => n.id);

  const completedTaskIds = nodes
    .filter(n => n.state === 'completed')
    .map(n => n.id);

  const failedTaskIds = nodes
    .filter(n => n.state === 'failed')
    .map(n => n.id);

  return {
    rootSessionId: sessionId,
    executionOrder,
    readyTaskIds,
    blockedTaskIds,
    completedTaskIds,
    failedTaskIds
  };
}

/**
 * Allowed state transitions for task graph nodes.
 */
const ALLOWED_TRANSITIONS: Record<TaskGraphState, readonly TaskGraphState[]> = {
  idle: ['queued', 'running', 'cancelled'],
  queued: ['running', 'cancelled'],
  running: ['paused', 'completed', 'failed', 'cancelled'],
  paused: ['running', 'cancelled'],
  blocked: ['queued', 'running', 'cancelled'],
  completed: [],
  failed: ['queued'],
  cancelled: []
};

/**
 * Validates a state transition for a task graph node.
 */
export function canTransition(
  from: TaskGraphState,
  to: TaskGraphState
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Transitions a task node to a new state, validating the transition first.
 * Returns the updated node or throws if transition is invalid.
 */
export function transitionTaskState(
  node: TaskGraphNode,
  newState: TaskGraphState
): TaskGraphNode {
  if (!canTransition(node.state, newState)) {
    throw new Error(
      `Invalid task state transition: ${node.id} cannot go from '${node.state}' to '${newState}'`
    );
  }

  return {
    ...node,
    state: newState
  };
}
