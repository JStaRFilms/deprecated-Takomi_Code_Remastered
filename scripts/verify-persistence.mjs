/**
 * Verification script for Task 08: Persistence Audit Restore
 *
 * Tests:
 * 1. Persist and restore representative session fixtures
 * 2. Verify audit event append and query behavior
 * 3. Confirm the same session can be reconstructed without in-memory state
 * 4. Verify both in-memory and web-local adapters work
 */

import {
  createInMemoryPersistenceAdapter,
  createWebLocalPersistenceAdapter
} from '../packages/persistence/src/index.js';

// ---------------------------------------------------------------------------
// In-memory storage backend for web adapter testing
// ---------------------------------------------------------------------------

function createTestStorageBackend() {
  const store = new Map();
  return {
    getItem(key) { return store.get(key) ?? null; },
    setItem(key, value) { store.set(key, value); },
    removeItem(key) { store.delete(key); },
    keys() { return Array.from(store.keys()); }
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const now = new Date().toISOString();

const sessionFixtures = {
  session: {
    id: 'session-test-001',
    workspaceId: 'ws-alpha',
    rootSessionId: 'session-test-001',
    status: 'running',
    createdAt: now,
    updatedAt: now
  },
  transcriptParts: [
    {
      kind: 'text',
      id: 'tp-001',
      sessionId: 'session-test-001',
      role: 'user',
      text: 'Build me a persistence layer',
      timestamp: now
    },
    {
      kind: 'text',
      id: 'tp-002',
      sessionId: 'session-test-001',
      role: 'assistant',
      text: 'Creating append-first event stores...',
      timestamp: now
    },
    {
      kind: 'tool-call',
      id: 'tp-003',
      sessionId: 'session-test-001',
      toolName: 'write_file',
      input: { path: 'packages/persistence/src/event-store.ts' },
      timestamp: now
    },
    {
      kind: 'tool-result',
      id: 'tp-004',
      sessionId: 'session-test-001',
      toolName: 'write_file',
      output: { success: true },
      timestamp: now
    }
  ],
  runtimeEvents: [
    {
      id: 're-001',
      runId: 'run-001',
      sessionId: 'session-test-001',
      workspaceId: 'ws-alpha',
      runtimeTarget: 'desktop-local',
      transport: 'local',
      kind: 'run.starting',
      timestamp: now,
      payload: {}
    },
    {
      id: 're-002',
      runId: 'run-001',
      sessionId: 'session-test-001',
      workspaceId: 'ws-alpha',
      runtimeTarget: 'desktop-local',
      transport: 'local',
      kind: 'run.completed',
      timestamp: now,
      payload: {}
    }
  ],
  auditEvents: [
    {
      id: 'ae-001',
      kind: 'intervention.requested',
      timestamp: now,
      subjectId: 'session-test-001',
      subjectType: 'session',
      workspaceId: 'ws-alpha',
      sessionId: 'session-test-001',
      data: { action: 'pause' }
    },
    {
      id: 'ae-002',
      kind: 'intervention.applied',
      timestamp: now,
      subjectId: 'session-test-001',
      subjectType: 'session',
      workspaceId: 'ws-alpha',
      sessionId: 'session-test-001',
      data: { action: 'pause', applied: true }
    },
    {
      id: 'ae-003',
      kind: 'billing.checkout_started',
      timestamp: now,
      subjectId: 'session-test-001',
      subjectType: 'billing',
      workspaceId: 'ws-alpha',
      data: { plan: 'pro' }
    }
  ]
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

async function testInMemoryAdapter() {
  console.log('\n📋 Test: In-Memory Persistence Adapter');
  const adapter = createInMemoryPersistenceAdapter();

  // Test transcript event store
  await adapter.transcriptEvents.append(sessionFixtures.transcriptParts);
  const transcriptResult = await adapter.transcriptEvents.query({ sessionId: 'session-test-001' });
  assert(transcriptResult.items.length === 4, 'Transcript events appended (4 parts)');
  assert(transcriptResult.totalCount === 4, 'Transcript totalCount matches');

  const tpById = await adapter.transcriptEvents.getById('tp-002');
  assert(tpById !== undefined, 'Transcript part retrievable by ID');
  assert(tpById.role === 'assistant', 'Retrieved correct transcript part');

  const tpCount = await adapter.transcriptEvents.count('session-test-001');
  assert(tpCount === 4, 'Transcript count by session correct');

  // Test runtime event store
  await adapter.runtimeEvents.append(sessionFixtures.runtimeEvents);
  const runtimeResult = await adapter.runtimeEvents.query({ sessionId: 'session-test-001' });
  assert(runtimeResult.items.length === 2, 'Runtime events appended (2 events)');

  // Test audit event store
  await adapter.auditEvents.append(sessionFixtures.auditEvents);
  // Query by sessionId returns 2 (billing event has no sessionId)
  const auditResult = await adapter.auditEvents.query({ sessionId: 'session-test-001' });
  assert(auditResult.items.length === 2, 'Audit events queryable by sessionId (2 session events)');
  // Query all returns all 3
  const allAuditResult = await adapter.auditEvents.query({});
  assert(allAuditResult.items.length === 3, 'All audit events appended (3 events total)');

  const auditByKind = await adapter.auditEvents.query({ kind: 'intervention.requested' });
  assert(auditByKind.items.length === 1, 'Audit query by kind works');

  const kindCount = await adapter.auditEvents.countByKind('intervention.applied');
  assert(kindCount === 1, 'Audit countByKind works');

  const subjectCount = await adapter.auditEvents.countBySubject('session-test-001');
  assert(subjectCount === 3, 'Audit countBySubject works');

  // Test restore snapshot store
  const snapshot = await adapter.restoreSnapshots.create({
    sessionId: 'session-test-001',
    session: sessionFixtures.session,
    transcript: {
      sessionId: 'session-test-001',
      parts: sessionFixtures.transcriptParts,
      lastUpdatedAt: now
    },
    label: 'pre-intervention'
  });
  assert(snapshot.id.startsWith('snapshot-'), 'Snapshot has generated ID');
  assert(snapshot.createdAt !== undefined, 'Snapshot has createdAt');

  const fetchedSnapshot = await adapter.restoreSnapshots.get(snapshot.id);
  assert(fetchedSnapshot.label === 'pre-intervention', 'Snapshot fetchable by ID');

  const latestSnapshot = await adapter.restoreSnapshots.getLatest('session-test-001');
  assert(latestSnapshot.id === snapshot.id, 'Latest snapshot matches');

  // Test orchestration session store
  await adapter.orchestrationSessions.save(sessionFixtures.session);
  const session = await adapter.orchestrationSessions.get('session-test-001');
  assert(session.workspaceId === 'ws-alpha', 'Orchestration session saved and retrieved');

  const sessionList = await adapter.orchestrationSessions.list('ws-alpha');
  assert(sessionList.length === 1, 'Sessions listable by workspace');

  // Test task graph store
  await adapter.taskGraph.saveNode({
    id: 'node-001',
    parentId: null,
    title: 'Implement persistence',
    state: 'running',
    sessionId: 'session-test-001',
    kind: 'task'
  });
  const node = await adapter.taskGraph.getNode('node-001');
  assert(node.title === 'Implement persistence', 'Task node saved and retrieved');

  await adapter.taskGraph.saveEdge({ from: 'node-001', to: 'node-002', kind: 'depends-on' });
  const edges = await adapter.taskGraph.listEdges('session-test-001');
  assert(edges.length === 1, 'Task edge saved');

  // Test intervention store
  const interventionReq = {
    id: 'int-001',
    action: 'pause',
    target: { kind: 'current-run', sessionId: 'session-test-001', runId: 'run-001' },
    requestedBy: 'user-001',
    requestedAt: now,
    payload: { reason: 'Review needed' }
  };
  await adapter.interventions.saveRequest(interventionReq);
  const fetchedReq = await adapter.interventions.getRequest('int-001');
  assert(fetchedReq.action === 'pause', 'Intervention request saved and retrieved');

  // Test read models
  const summary = await adapter.readModels.getSessionSummary('session-test-001');
  assert(summary !== null, 'Session summary generated');
  assert(summary.transcriptPartCount === 4, 'Summary has correct transcript count');
  assert(summary.runtimeEventCount === 2, 'Summary has correct runtime count');

  const transcriptView = await adapter.readModels.getTranscriptView('session-test-001');
  assert(transcriptView !== null, 'Transcript view generated from events');
  assert(transcriptView.parts.length === 4, 'Transcript view has all parts');
}

async function testSessionRestore() {
  console.log('\n📋 Test: Session Restore (no in-memory state)');

  // Step 1: Create adapter, persist data
  const adapter1 = createInMemoryPersistenceAdapter();
  await adapter1.transcriptEvents.append(sessionFixtures.transcriptParts);
  await adapter1.runtimeEvents.append(sessionFixtures.runtimeEvents);
  await adapter1.auditEvents.append(sessionFixtures.auditEvents);
  await adapter1.orchestrationSessions.save(sessionFixtures.session);

  // Create restore snapshot
  const snapshot = await adapter1.restoreSnapshots.create({
    sessionId: 'session-test-001',
    session: sessionFixtures.session,
    transcript: {
      sessionId: 'session-test-001',
      parts: sessionFixtures.transcriptParts,
      lastUpdatedAt: now
    }
  });

  // Step 2: Simulate "restart" — create new adapter, re-populate from snapshot
  const adapter2 = createInMemoryPersistenceAdapter();

  // Restore session from snapshot
  await adapter2.orchestrationSessions.save(snapshot.session);
  await adapter2.transcriptEvents.append(snapshot.transcript.parts);

  // Verify restored session matches original
  const restoredSession = await adapter2.orchestrationSessions.get('session-test-001');
  assert(restoredSession !== null, 'Session restored from snapshot');
  assert(restoredSession.workspaceId === 'ws-alpha', 'Restored session has correct workspace');

  const restoredTranscript = await adapter2.readModels.getTranscriptView('session-test-001');
  assert(restoredTranscript.parts.length === 4, 'Restored transcript has all parts');
  assert(restoredTranscript.sessionId === 'session-test-001', 'Restored transcript matches session ID');

  const restoredSummary = await adapter2.readModels.getSessionSummary('session-test-001');
  assert(restoredSummary.transcriptPartCount === 4, 'Restored summary reflects transcript count');
}

async function testWebLocalAdapter() {
  console.log('\n📋 Test: Web-Local Persistence Adapter');
  const storage = createTestStorageBackend();
  const adapter = createWebLocalPersistenceAdapter({ storage });

  await adapter.transcriptEvents.append(sessionFixtures.transcriptParts);
  const result = await adapter.transcriptEvents.query({ sessionId: 'session-test-001' });
  assert(result.items.length === 4, 'Web adapter transcript events work');

  await adapter.auditEvents.append(sessionFixtures.auditEvents);
  const auditResult = await adapter.auditEvents.query({ kind: 'billing.checkout_started' });
  assert(auditResult.items.length === 1, 'Web adapter audit query by kind works');

  await adapter.orchestrationSessions.save(sessionFixtures.session);
  const session = await adapter.orchestrationSessions.get('session-test-001');
  assert(session !== null, 'Web adapter session store works');

  // Verify data persists in storage
  const keys = storage.keys();
  assert(keys.length > 0, 'Storage backend has persisted keys');

  // Create a new adapter from the same storage to verify persistence
  const adapter2 = createWebLocalPersistenceAdapter({ storage });
  const restoredSession = await adapter2.orchestrationSessions.get('session-test-001');
  assert(restoredSession !== null, 'Session persists across adapter instances');
  assert(restoredSession.workspaceId === 'ws-alpha', 'Persisted session has correct data');
}

async function testAuditPersistence() {
  console.log('\n📋 Test: Audit Event Persistence');
  const adapter = createInMemoryPersistenceAdapter();

  // Append audit events across different categories
  await adapter.auditEvents.append([
    { id: 'ae-r1', kind: 'run.starting', timestamp: now, subjectId: 'run-001', subjectType: 'run', data: {} },
    { id: 'ae-i1', kind: 'intervention.requested', timestamp: now, subjectId: 'run-001', subjectType: 'intervention', data: {} },
    { id: 'ae-i2', kind: 'intervention.applied', timestamp: now, subjectId: 'run-001', subjectType: 'intervention', data: {} },
    { id: 'ae-w1', kind: 'workspace.worktree_switched', timestamp: now, subjectId: 'ws-alpha', subjectType: 'worktree', data: {} },
    { id: 'ae-b1', kind: 'billing.checkout_started', timestamp: now, subjectId: 'user-001', subjectType: 'billing', data: {} },
    { id: 'ae-b2', kind: 'billing.entitlement_activated', timestamp: now, subjectId: 'user-001', subjectType: 'billing', data: {} },
    { id: 'ae-v1', kind: 'bags.verification_checked', timestamp: now, subjectId: 'user-001', subjectType: 'bags', data: {} },
  ]);

  // Verify runs
  const runEvents = await adapter.auditEvents.query({ subjectType: 'run' });
  assert(runEvents.items.length === 1, 'Run audit events queryable');

  // Verify interventions
  const interventionEvents = await adapter.auditEvents.query({ subjectType: 'intervention' });
  assert(interventionEvents.items.length === 2, 'Intervention audit events queryable');

  // Verify worktree changes
  const worktreeEvents = await adapter.auditEvents.query({ subjectType: 'worktree' });
  assert(worktreeEvents.items.length === 1, 'Worktree audit events queryable');

  // Verify billing
  const billingEvents = await adapter.auditEvents.query({ subjectType: 'billing' });
  assert(billingEvents.items.length === 2, 'Billing audit events queryable');

  // Verify bags/verification
  const bagsEvents = await adapter.auditEvents.query({ subjectType: 'bags' });
  assert(bagsEvents.items.length === 1, 'Bags verification audit events queryable');

  // Total audit count
  const totalCount = (await adapter.auditEvents.query({})).totalCount;
  assert(totalCount === 7, 'Total audit event count is 7');
}

async function testPagination() {
  console.log('\n📋 Test: Cursor-Based Pagination');
  const adapter = createInMemoryPersistenceAdapter();

  const parts = [];
  for (let i = 0; i < 25; i++) {
    parts.push({
      kind: 'text',
      id: `tp-page-${String(i).padStart(3, '0')}`,
      sessionId: 'session-pagination',
      role: 'user',
      text: `Message ${i}`,
      timestamp: new Date(Date.now() + i * 1000).toISOString()
    });
  }
  await adapter.transcriptEvents.append(parts);

  // Page 1
  const page1 = await adapter.transcriptEvents.query({
    sessionId: 'session-pagination',
    limit: 10
  });
  assert(page1.items.length === 10, 'Page 1 has 10 items');
  assert(page1.nextCursor !== null, 'Page 1 has next cursor');
  assert(page1.totalCount === 25, 'Total count is 25');

  // Page 2
  const page2 = await adapter.transcriptEvents.query({
    sessionId: 'session-pagination',
    limit: 10,
    cursor: { value: page1.nextCursor, direction: 'forward' }
  });
  assert(page2.items.length === 10, 'Page 2 has 10 items');
  assert(page2.nextCursor !== null, 'Page 2 has next cursor');

  // Page 3
  const page3 = await adapter.transcriptEvents.query({
    sessionId: 'session-pagination',
    limit: 10,
    cursor: { value: page2.nextCursor, direction: 'forward' }
  });
  assert(page3.items.length === 5, 'Page 3 has 5 remaining items');
  assert(page3.nextCursor === null, 'Page 3 has no next cursor (end of data)');
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Task 08: Persistence Audit Restore — Verify');
  console.log('═══════════════════════════════════════════════');

  try {
    await testInMemoryAdapter();
    await testSessionRestore();
    await testWebLocalAdapter();
    await testAuditPersistence();
    await testPagination();
  } catch (err) {
    console.error('\n💥 Test error:', err);
    failed++;
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════');

  if (failed > 0) {
    process.exit(1);
  }
}

main();
