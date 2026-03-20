import type {
  SessionDescriptor,
  TaskGraphEdge,
  TaskGraphNode,
  WorkspaceDescriptor
} from '@takomi/contracts';

// Existing exports
export * from './transcript-materializer.js';
export * from './transcript-store.js';
export * from './test-fixtures.js';

// Orchestration engine modules
export * from './session-lineage.js';
export * from './task-graph-engine.js';
export * from './background-executor.js';
export * from './agent-definition-loader.js';
export { OrchestrationEngine } from './orchestration-engine.js';
export type {
  CreateOrchestrationSessionInput,
  AddTaskInput
} from './orchestration-engine.js';
export type { TaskGraphExecutionPlan } from './task-graph-engine.js';
export type { BackgroundChildRun, BackgroundRunListener } from './background-executor.js';
export type { RawCustomModeEntry, RawCustomModesFile } from './agent-definition-loader.js';

export interface OrchestrationGraph {
  readonly workspace: WorkspaceDescriptor;
  readonly rootSessionId: string;
  readonly nodes: readonly TaskGraphNode[];
  readonly edges: readonly TaskGraphEdge[];
}

export function inheritWorkspace(
  workspace: WorkspaceDescriptor,
  overrides: Partial<WorkspaceDescriptor> = {}
): WorkspaceDescriptor {
  return {
    ...workspace,
    ...overrides,
    id: overrides.id ?? workspace.id,
    name: overrides.name ?? workspace.name,
    rootPath: overrides.rootPath ?? workspace.rootPath,
    target: overrides.target ?? workspace.target
  };
}

export function createChildSession(
  parent: SessionDescriptor,
  childSessionId: string,
  name: string
): SessionDescriptor {
  return {
    ...parent,
    id: childSessionId,
    parentSessionId: parent.id,
    name,
    status: 'idle'
  };
}

export function createLinearTaskGraph(
  workspace: WorkspaceDescriptor,
  rootSessionId: string,
  nodes: readonly TaskGraphNode[]
): OrchestrationGraph {
  const edges: TaskGraphEdge[] = [];

  for (let index = 1; index < nodes.length; index += 1) {
    const current = nodes[index];
    const previous = nodes[index - 1];

    if (current && previous) {
      edges.push({ from: previous.id, to: current.id });
    }
  }

  return {
    workspace,
    rootSessionId,
    nodes: [...nodes],
    edges
  };
}
