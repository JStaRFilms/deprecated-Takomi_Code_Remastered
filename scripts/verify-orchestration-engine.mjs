import assert from 'node:assert/strict';

import { createInMemoryPersistenceAdapter } from '../packages/persistence/src/index.ts';
import {
  OrchestrationEngine,
  parseCustomModeEntry,
  buildExecutionPlan,
  validateDAG,
} from '../packages/orchestration/src/index.ts';

const now = new Date().toISOString();

async function testLineageAndWorkspaceInheritance() {
  const persistence = createInMemoryPersistenceAdapter();
  const engine = new OrchestrationEngine(
    persistence.orchestrationSessions,
    persistence.taskGraph
  );

  const parent = await engine.createSession({
    id: 'sess-root',
    workspaceId: 'ws-main',
    projectId: 'proj-01',
    name: 'Root Chat',
    kind: 'project',
    worktreePath: 'C:/repo',
    runtimeTarget: 'desktop-local',
    worktreeId: 'wt-main'
  });

  const child = await engine.createChildSession('sess-root', 'sess-child', 'Child Task', {
    kind: 'task',
    background: true,
    taskId: 'task-child-01'
  });

  assert.equal(child.workspaceId, parent.workspaceId, 'Child inherits workspace by default');
  assert.equal(child.worktreeId, parent.worktreeId, 'Child inherits worktree by default');
  assert.equal(child.projectId, parent.projectId, 'Child inherits project identity');
  assert.equal(child.parentSessionId, parent.id, 'Child records direct parent session');
  assert.equal(child.lineage?.rootSessionId, parent.id, 'Child lineage points at root session');
  assert.deepEqual(engine.getDescendants(parent.id), ['sess-child'], 'Descendant lookup includes child session');
  assert.equal(engine.checkAncestor(parent.id, child.id), true, 'Ancestor check succeeds');
  assert.deepEqual(
    engine.getLineagePath(child.id).map((session) => session.id),
    ['sess-root', 'sess-child'],
    'Lineage path preserves root-to-child order'
  );
}

async function testReloadRestore() {
  const persistence = createInMemoryPersistenceAdapter();
  const engineA = new OrchestrationEngine(
    persistence.orchestrationSessions,
    persistence.taskGraph
  );

  await engineA.createSession({
    id: 'sess-root-reload',
    workspaceId: 'ws-main',
    projectId: 'proj-01',
    name: 'Root Reload',
    kind: 'project',
    worktreePath: 'C:/repo',
    runtimeTarget: 'remote',
    worktreeId: 'wt-main'
  });

  await engineA.createChildSession('sess-root-reload', 'sess-child-reload', 'Reload Child', {
    kind: 'task',
    background: true,
    taskId: 'task-root-node'
  });

  const engineB = new OrchestrationEngine(
    persistence.orchestrationSessions,
    persistence.taskGraph
  );

  await engineB.restoreFromPersistence();

  const restored = await engineB.getSession('sess-child-reload');
  assert.ok(restored, 'Reloaded engine can restore child session');
  assert.equal(restored.parentSessionId, 'sess-root-reload', 'Reloaded child preserves direct parent');
  assert.equal(restored.lineage?.rootSessionId, 'sess-root-reload', 'Reloaded child preserves root lineage');

  const activeRuns = engineB.getActiveBackgroundRuns('sess-root-reload');
  assert.equal(activeRuns.length, 1, 'Background child run restored after reload');
  assert.equal(activeRuns[0]?.taskId, 'task-root-node', 'Background child run preserves correlated task ID');
}

async function testTaskGraphExecution() {
  const persistence = createInMemoryPersistenceAdapter();
  const engine = new OrchestrationEngine(
    persistence.orchestrationSessions,
    persistence.taskGraph
  );

  await engine.createSession({
    id: 'sess-graph',
    workspaceId: 'ws-main',
    projectId: 'proj-graph',
    name: 'Graph Session',
    kind: 'project'
  });

  await engine.addTask('sess-graph', { id: 'task-1', title: 'First task' });
  await engine.addTask('sess-graph', {
    id: 'task-2',
    title: 'Second task',
    dependencies: ['task-1']
  });
  await engine.addTask('sess-graph', {
    id: 'task-3',
    title: 'Third task',
    dependencies: ['task-2']
  });

  const nodes = await engine.listTasks('sess-graph');
  const edges = await engine.listTaskEdges('sess-graph');
  assert.equal(validateDAG(nodes, edges), true, 'Linear task graph validates as DAG');

  const initialPlan = await engine.getExecutionPlan('sess-graph');
  assert.deepEqual(initialPlan.readyTaskIds, ['task-1'], 'Only first task is initially ready');

  await engine.transitionTask('task-1', 'queued');
  await engine.transitionTask('task-1', 'running');
  await engine.transitionTask('task-1', 'completed');

  const nextPlan = await buildExecutionPlan('sess-graph', persistence.taskGraph);
  assert.equal(nextPlan.executionOrder.length, 3, 'Execution plan includes all tasks');
  assert.deepEqual(nextPlan.readyTaskIds, ['task-2'], 'Dependent task becomes ready after completion');

  const artifact = await engine.attachArtifact('task-2', 'sess-graph', 'ws-main', {
    id: 'artifact-1',
    kind: 'document',
    name: 'Spec',
    uri: 'takomi://artifact/spec'
  });
  assert.equal(artifact.taskId, 'task-2', 'Artifact correlation preserves task ownership');
  assert.equal((await engine.listArtifacts('sess-graph')).length, 1, 'Artifacts are listed per session');
}

function testAgentDefinitionParsing() {
  const parsed = parseCustomModeEntry({
    slug: 'vibe-orchestrator',
    name: 'Orchestrator',
    description: 'Coordinates work',
    roleDefinition: 'Delegate and coordinate',
    whenToUse: 'Use for orchestration',
    groups: [
      'read',
      ['edit', { fileRegex: '\\.(md|yaml)$', description: 'Docs only' }],
      'browser',
      'command',
      'mcp'
    ],
    customInstructions: 'Keep the project moving'
  }, '.agent/Takomi-Agents/custom_modes.yaml');

  assert.ok(parsed, 'Known Takomi mode slug is parsed');
  assert.equal(parsed?.permissions.length, 5, 'Custom mode groups map to permission entries');
  const editPermission = parsed?.permissions.find((permission) => permission.capability === 'edit');
  assert.equal(editPermission?.fileRegex, '\\.(md|yaml)$', 'Nested group metadata is preserved');
  assert.equal(parsed?.sourcePath, '.agent/Takomi-Agents/custom_modes.yaml', 'Source path is recorded');
}

async function main() {
  await testLineageAndWorkspaceInheritance();
  await testReloadRestore();
  await testTaskGraphExecution();
  testAgentDefinitionParsing();
  console.log('Orchestration engine verification passed.');
}

await main();
