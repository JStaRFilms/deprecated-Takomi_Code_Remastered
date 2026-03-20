import type {
  OrchestrationSession,
  SessionDescriptor,
  SessionKind,
  TaskGraphNode,
  TaskGraphEdge,
  TaskGraphArtifact,
  TaskGraphStore,
  OrchestrationSessionStore
} from '@takomi/contracts';

import {
  SessionLineageRegistry,
  resolveSessionLineage,
  collectDescendantSessionIds,
  isAncestor,
  getSessionPath
} from './session-lineage.js';

import {
  validateDAG,
  topologicalSort,
  computeReadyTasks,
  buildExecutionPlan,
  transitionTaskState,
  canTransition,
  type TaskGraphExecutionPlan
} from './task-graph-engine.js';

import {
  BackgroundExecutor,
  type BackgroundChildRun
} from './background-executor.js';

/**
 * Configuration for creating a new orchestration session.
 */
export interface CreateOrchestrationSessionInput {
  readonly id: string;
  readonly workspaceId: string;
  readonly projectId: string;
  readonly name: string;
  readonly kind: SessionKind;
  readonly parentSessionId?: string | null;
  readonly worktreePath?: string | null;
  readonly runtimeTarget?: 'desktop-local' | 'remote' | undefined;
  readonly worktreeId?: string | null;
  readonly taskGraphRootNodeId?: string;
}

/**
 * Configuration for adding a task to an orchestration session.
 */
export interface AddTaskInput {
  readonly id: string;
  readonly title: string;
  readonly kind?: 'task' | 'milestone' | 'group' | 'artifact' | 'branch';
  readonly parentId?: string | null;
  readonly dependencies?: readonly string[];
  readonly childSessionId?: string | undefined;
}

/**
 * The orchestration engine owns parent and child sessions, task graphs,
 * background child execution, and same-workspace inheritance behavior.
 *
 * It remains the state owner for task graph execution. The shared renderer
 * is a consumer of the engine's state, not the source of truth.
 */
export class OrchestrationEngine {
  private readonly sessionStore: OrchestrationSessionStore;
  private readonly taskGraphStore: TaskGraphStore;
  private readonly backgroundExecutor: BackgroundExecutor;
  private readonly lineageRegistry: SessionLineageRegistry;

  constructor(
    sessionStore: OrchestrationSessionStore,
    taskGraphStore: TaskGraphStore
  ) {
    this.sessionStore = sessionStore;
    this.taskGraphStore = taskGraphStore;
    this.backgroundExecutor = new BackgroundExecutor();
    this.lineageRegistry = new SessionLineageRegistry();
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  /**
   * Creates a new orchestration session with lineage tracking.
   * Child sessions inherit the same workspace by default.
   */
  async createSession(
    input: CreateOrchestrationSessionInput
  ): Promise<SessionDescriptor> {
    const now = new Date().toISOString();

    const descriptor: SessionDescriptor = {
      id: input.id,
      projectId: input.projectId,
      parentSessionId: input.parentSessionId ?? null,
      kind: input.kind,
      name: input.name,
      status: 'idle',
      workspaceId: input.workspaceId,
      worktreePath: input.worktreePath ?? null,
      runtimeTarget: input.runtimeTarget,
      worktreeId: input.worktreeId ?? null,
      createdAt: now,
      updatedAt: now
    };

    this.lineageRegistry.register(descriptor);
    const lineage = resolveSessionLineage(descriptor, this.lineageRegistry);

    const enrichedDescriptor: SessionDescriptor = {
      ...descriptor,
      lineage
    };

    const orchestrationSession: OrchestrationSession = {
      id: input.id,
      workspaceId: input.workspaceId,
      rootSessionId: lineage.rootSessionId,
      status: 'idle',
      projectId: input.projectId,
      parentSessionId: input.parentSessionId ?? null,
      kind: input.kind,
      name: input.name,
      worktreePath: input.worktreePath ?? null,
      worktreeId: input.worktreeId ?? null,
      createdAt: now,
      updatedAt: now,
      ...(input.runtimeTarget !== undefined ? { runtimeTarget: input.runtimeTarget } : {}),
      ...(input.taskGraphRootNodeId !== undefined ? { taskGraphRootNodeId: input.taskGraphRootNodeId } : {})
    };

    await this.sessionStore.save(orchestrationSession);

    return enrichedDescriptor;
  }

  /**
   * Gets a session descriptor by ID, including computed lineage.
   */
  async getSession(sessionId: string): Promise<SessionDescriptor | null> {
    const stored = this.lineageRegistry.getDescriptor(sessionId);
    if (stored) {
      return stored;
    }

    // Fallback: look up from persistence store
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      return null;
    }

    const descriptor: SessionDescriptor = {
      id: session.id,
      projectId: session.projectId ?? '',
      parentSessionId: session.parentSessionId ?? null,
      kind: session.kind ?? 'chat',
      name: session.name ?? session.id,
      status: session.status,
      workspaceId: session.workspaceId,
      worktreePath: session.worktreePath ?? null,
      runtimeTarget: session.runtimeTarget,
      worktreeId: session.worktreeId ?? null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };

    this.lineageRegistry.register(descriptor);
    const lineage = resolveSessionLineage(descriptor, this.lineageRegistry);
    const enrichedDescriptor: SessionDescriptor = {
      ...descriptor,
      lineage
    };
    this.lineageRegistry.register(enrichedDescriptor);

    return enrichedDescriptor;
  }

  /**
   * Lists all sessions in a workspace.
   */
  async listSessions(
    workspaceId?: string
  ): Promise<readonly OrchestrationSession[]> {
    return this.sessionStore.list(workspaceId);
  }

  /**
   * Updates a session's status.
   */
  async updateSessionStatus(
    sessionId: string,
    status: OrchestrationSession['status']
  ): Promise<void> {
    const session = await this.sessionStore.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    await this.sessionStore.save({
      ...session,
      status,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Creates a child session that delegates work.
   * Inherits the same workspace by default (same-workspace inheritance).
   * Optionally creates a background run if the child should not block the parent.
   */
  async createChildSession(
    parentId: string,
    childId: string,
    name: string,
    options: {
      readonly kind?: SessionKind;
      readonly taskId?: string;
      readonly background?: boolean;
      readonly runtimeTarget?: 'desktop-local' | 'remote' | undefined;
    } = {}
  ): Promise<SessionDescriptor> {
    const parent = await this.getSession(parentId);
    if (!parent) {
      throw new Error(`Parent session not found: ${parentId}`);
    }

    const childInput: CreateOrchestrationSessionInput = {
      id: childId,
      workspaceId: parent.workspaceId,
      projectId: parent.projectId,
      name,
      kind: options.kind ?? 'task',
      parentSessionId: parentId,
      worktreePath: parent.worktreePath,
      worktreeId: parent.worktreeId ?? null,
      ...(options.runtimeTarget !== undefined
        ? { runtimeTarget: options.runtimeTarget }
        : parent.runtimeTarget !== undefined
          ? { runtimeTarget: parent.runtimeTarget }
          : {}),
      ...(options.taskId !== undefined ? { taskGraphRootNodeId: options.taskId } : {})
    };

    const child = await this.createSession(childInput);

    if (options.background) {
      this.backgroundExecutor.registerRun(childId, parentId, options.taskId ?? null);
    }

    return child;
  }

  // ---------------------------------------------------------------------------
  // Task Graph Management
  // ---------------------------------------------------------------------------

  /**
   * Adds a task node to a session's task graph.
   */
  async addTask(
    sessionId: string,
    input: AddTaskInput
  ): Promise<TaskGraphNode> {
    const node: TaskGraphNode = {
      id: input.id,
      parentId: input.parentId ?? null,
      title: input.title,
      state: 'idle',
      sessionId,
      kind: input.kind ?? 'task',
      ...(input.dependencies !== undefined ? { dependencies: input.dependencies } : {}),
      ...(input.childSessionId !== undefined ? { childSessionId: input.childSessionId } : {})
    };

    await this.taskGraphStore.saveNode(node);

    // Save dependency edges
    if (input.dependencies && input.dependencies.length > 0) {
      for (const depId of input.dependencies) {
        await this.taskGraphStore.saveEdge({
          from: depId,
          to: input.id,
          kind: 'depends-on'
        });
      }
    }

    return node;
  }

  /**
   * Adds an explicit edge between two task nodes.
   */
  async addTaskEdge(
    from: string,
    to: string,
    kind: 'depends-on' | 'blocks' | 'follows' = 'depends-on'
  ): Promise<TaskGraphEdge> {
    const edge: TaskGraphEdge = { from, to, kind };
    await this.taskGraphStore.saveEdge(edge);
    return edge;
  }

  /**
   * Gets a task node by ID.
   */
  async getTask(taskId: string): Promise<TaskGraphNode | null> {
    const node = await this.taskGraphStore.getNode(taskId);
    return node ?? null;
  }

  /**
   * Lists all task nodes in a session's task graph.
   */
  async listTasks(sessionId: string): Promise<readonly TaskGraphNode[]> {
    return this.taskGraphStore.listNodes(sessionId);
  }

  /**
   * Lists all edges in a session's task graph.
   */
  async listTaskEdges(sessionId: string): Promise<readonly TaskGraphEdge[]> {
    return this.taskGraphStore.listEdges(sessionId);
  }

  /**
   * Transitions a task to a new state.
   * Validates the transition against the allowed state machine.
   */
  async transitionTask(
    taskId: string,
    newState: TaskGraphNode['state']
  ): Promise<TaskGraphNode> {
    const node = await this.taskGraphStore.getNode(taskId);
    if (!node) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const updated = transitionTaskState(node, newState);
    await this.taskGraphStore.saveNode(updated);
    return updated;
  }

  /**
   * Builds the execution plan for a session's task graph.
   * Returns the topological order, ready set, and status sets.
   */
  async getExecutionPlan(sessionId: string): Promise<TaskGraphExecutionPlan> {
    return buildExecutionPlan(sessionId, this.taskGraphStore);
  }

  /**
   * Validates that a session's task graph is a valid DAG (no cycles).
   */
  async validateTaskGraph(sessionId: string): Promise<boolean> {
    const nodes = await this.taskGraphStore.listNodes(sessionId);
    const edges = await this.taskGraphStore.listEdges(sessionId);
    return validateDAG(nodes, edges);
  }

  // ---------------------------------------------------------------------------
  // Background Child Execution
  // ---------------------------------------------------------------------------

  /**
   * Gets the background executor for subscribing to child run updates.
   */
  getBackgroundExecutor(): BackgroundExecutor {
    return this.backgroundExecutor;
  }

  /**
   * Gets all active background runs for a parent session.
   */
  getActiveBackgroundRuns(
    parentSessionId: string
  ): readonly BackgroundChildRun[] {
    return this.backgroundExecutor.getActiveRunsForParent(parentSessionId);
  }

  /**
   * Subscribes to background run status changes.
   * Returns an unsubscribe function.
   */
  subscribeToBackgroundRuns(
    listener: (run: BackgroundChildRun) => void
  ): () => void {
    return this.backgroundExecutor.subscribe(listener);
  }

  // ---------------------------------------------------------------------------
  // Artifacts
  // ---------------------------------------------------------------------------

  /**
   * Attaches an artifact to a task.
   */
  async attachArtifact(
    taskId: string,
    sessionId: string,
    workspaceId: string,
    artifact: {
      readonly id: string;
      readonly kind: 'document' | 'patch' | 'log' | 'bundle';
      readonly name: string;
      readonly uri: string;
    }
  ): Promise<TaskGraphArtifact> {
    const record: TaskGraphArtifact = {
      id: artifact.id,
      taskId,
      sessionId,
      workspaceId,
      kind: artifact.kind,
      name: artifact.name,
      uri: artifact.uri,
      createdAt: new Date().toISOString()
    };

    await this.taskGraphStore.saveArtifact(record);
    return record;
  }

  /**
   * Lists artifacts for a session.
   */
  async listArtifacts(sessionId: string): Promise<readonly TaskGraphArtifact[]> {
    return this.taskGraphStore.listArtifacts(sessionId);
  }

  // ---------------------------------------------------------------------------
  // Lineage & Recovery
  // ---------------------------------------------------------------------------

  /**
   * Checks if a candidate session is an ancestor of another session.
   */
  checkAncestor(
    candidateAncestorId: string,
    sessionId: string
  ): boolean {
    return isAncestor(candidateAncestorId, sessionId, this.lineageRegistry);
  }

  /**
   * Gets the full path from root to a specific session.
   */
  getLineagePath(
    sessionId: string
  ): readonly SessionDescriptor[] {
    return getSessionPath(sessionId, this.lineageRegistry);
  }

  /**
   * Collects all descendant session IDs for a root session.
   */
  getDescendants(
    rootSessionId: string
  ): readonly string[] {
    return collectDescendantSessionIds(rootSessionId, this.lineageRegistry);
  }

  /**
   * Gets the lineage registry for external access to lineage data.
   */
  getLineageRegistry(): SessionLineageRegistry {
    return this.lineageRegistry;
  }

  // ---------------------------------------------------------------------------
  // Reload & Restore
  // ---------------------------------------------------------------------------

  /**
   * Synchronizes the engine state from persisted data.
   * Call this after a reload to restore background run tracking.
   */
  async restoreFromPersistence(): Promise<void> {
    this.lineageRegistry.clear();

    const sessions = await this.sessionStore.list();
    for (const session of sessions) {
      const descriptor: SessionDescriptor = {
        id: session.id,
        projectId: session.projectId ?? '',
        parentSessionId: session.parentSessionId ?? null,
        kind: session.kind ?? 'chat',
        name: session.name ?? session.id,
        status: session.status,
        workspaceId: session.workspaceId,
        worktreePath: session.worktreePath ?? null,
        runtimeTarget: session.runtimeTarget,
        worktreeId: session.worktreeId ?? null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
      this.lineageRegistry.register(descriptor);
    }

    for (const [, descriptor] of this.lineageRegistry.getAllDescriptors()) {
      const lineage = resolveSessionLineage(descriptor, this.lineageRegistry);
      this.lineageRegistry.register({
        ...descriptor,
        lineage
      });
    }

    await this.backgroundExecutor.syncFromStore(
      this.sessionStore,
      this.taskGraphStore
    );
  }
}
