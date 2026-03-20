import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { createInMemoryPersistenceAdapter } from '../packages/persistence/src/index.ts';
import { InterventionHandler, RecoveryManager } from '../packages/orchestration/src/index.ts';
import {
  AppShell,
  getTheme,
  mockActiveSessionId,
  mockSessions,
  mockTranscript,
  mockWorkspace,
} from '../packages/ui/src/index.ts';

globalThis.React = React;

function createRuntimeManager(kind = 'desktop-local') {
  const calls = [];
  const listeners = new Set();

  return {
    kind,
    calls,
    async startRun() {
      throw new Error('Not used in verifier');
    },
    async cancelRun(runId) {
      calls.push({ method: 'cancelRun', runId });
    },
    async pauseRun(runId) {
      calls.push({ method: 'pauseRun', runId });
    },
    async resumeRun(runId) {
      calls.push({ method: 'resumeRun', runId });
    },
    async injectGuidance(request) {
      calls.push({ method: 'injectGuidance', request });
    },
    async rerouteRun(request) {
      calls.push({ method: 'rerouteRun', request });
    },
    async replaceRun(request) {
      calls.push({ method: 'replaceRun', request });
    },
    async migrateRun(request) {
      calls.push({ method: 'migrateRun', request });
    },
    subscribe(listener) {
      listeners.add(listener);
      return {
        close() {
          listeners.delete(listener);
        },
      };
    },
  };
}

const adapter = createInMemoryPersistenceAdapter();

const sessions = [
  {
    id: 'sess-root',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'project',
    name: 'Project Chat 1',
    status: 'paused',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
  {
    id: 'sess-child',
    projectId: 'proj-01',
    parentSessionId: 'sess-root',
    kind: 'task',
    name: 'Child Task',
    status: 'running',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
];

const sessionLookup = (sessionId) => sessions.find((session) => session.id === sessionId) ?? null;
const descendantLookup = (rootSessionId) => (rootSessionId === 'sess-root' ? ['sess-child'] : []);
const sessionStatusLookup = (sessionId) => sessionLookup(sessionId)?.status ?? 'idle';

const desktopRuntime = createRuntimeManager('desktop-local');
const remoteRuntime = createRuntimeManager('remote');

const desktopHandler = new InterventionHandler({
  interventionStore: adapter.interventions,
  auditStore: adapter.auditEvents,
  runtimeManager: desktopRuntime,
  sessionLookup,
  descendantLookup,
  sessionStatusLookup,
});

const remoteHandler = new InterventionHandler({
  interventionStore: adapter.interventions,
  auditStore: adapter.auditEvents,
  runtimeManager: remoteRuntime,
  sessionLookup,
  descendantLookup,
  sessionStatusLookup,
});

const resumeRequest = {
  id: 'intr-01',
  action: 'resume',
  target: {
    kind: 'current-run',
    sessionId: 'sess-root',
    runId: 'run-root',
  },
  requestedBy: 'review-manager',
  requestedAt: '2026-03-20T19:00:00Z',
  payload: {},
};

const resumeOutcome = await desktopHandler.handleRequest(resumeRequest);
assert.equal(resumeOutcome.status, 'applied');
assert.equal(desktopRuntime.calls.some((call) => call.method === 'resumeRun' && call.runId === 'run-root'), true);

const migrateRequest = {
  id: 'intr-02',
  action: 'migrate',
  target: {
    kind: 'current-run',
    sessionId: 'sess-root',
    runId: 'run-root',
  },
  requestedBy: 'review-manager',
  requestedAt: '2026-03-20T19:01:00Z',
  payload: {
    destinationWorkspaceId: 'ws-remote',
  },
};

const migrateOutcome = await remoteHandler.handleRequest(migrateRequest);
assert.equal(migrateOutcome.status, 'unsupported');
assert.equal(await adapter.auditEvents.countByKind('intervention.unsupported'), 1);

const recoveryManager = new RecoveryManager({
  snapshotStore: adapter.restoreSnapshots,
  saveRecovery: (descriptor) => adapter.recovery.save(descriptor),
  getRecovery: (id) => adapter.recovery.get(id),
  listRecoveriesBySession: (sessionId) => adapter.recovery.listBySession(sessionId),
  listActiveRecoveries: () => adapter.recovery.listActive(),
  saveRecoveryAction: (action) => adapter.recovery.saveAction(action),
  listRecoveryActions: (recoveryId) => adapter.recovery.listActions(recoveryId),
  appendAuditEvent: async (event) => {
    await adapter.auditEvents.append([event]);
  },
  resumeRun: async (runId) => {
    desktopRuntime.calls.push({ method: 'resumeRun', runId });
  },
  cancelRun: async (runId) => {
    desktopRuntime.calls.push({ method: 'cancelRun', runId });
  },
  sessionStatusLookup,
});

const failedRequest = {
  id: 'intr-03',
  action: 'guidance',
  target: {
    kind: 'current-run',
    sessionId: 'sess-root',
  },
  requestedBy: 'review-manager',
  requestedAt: '2026-03-20T19:02:00Z',
  payload: {
    instruction: 'Continue safely.',
  },
};

const failedOutcome = {
  id: 'outcome-intr-03',
  requestId: 'intr-03',
  action: 'guidance',
  status: 'failed',
  target: failedRequest.target,
  resolvedAt: '2026-03-20T19:02:10Z',
  supported: true,
  applied: false,
  detail: 'Runtime dispatch failed',
};

const recovery = await recoveryManager.triggerFromIntervention(failedRequest, failedOutcome);
assert.ok(recovery);
assert.equal(recovery?.flow, 'continue-build');

const escalatedAction = await recoveryManager.performAction(recovery.id, 'escalate');
assert.equal(escalatedAction.result, 'success');

const persistedRecovery = await recoveryManager.getRecovery(recovery.id);
assert.equal(persistedRecovery?.state, 'escalated');

const reloadedManager = new RecoveryManager({
  snapshotStore: adapter.restoreSnapshots,
  saveRecovery: (descriptor) => adapter.recovery.save(descriptor),
  getRecovery: (id) => adapter.recovery.get(id),
  listRecoveriesBySession: (sessionId) => adapter.recovery.listBySession(sessionId),
  listActiveRecoveries: () => adapter.recovery.listActive(),
  saveRecoveryAction: (action) => adapter.recovery.saveAction(action),
  listRecoveryActions: (recoveryId) => adapter.recovery.listActions(recoveryId),
  appendAuditEvent: async (event) => {
    await adapter.auditEvents.append([event]);
  },
  resumeRun: async () => {},
  cancelRun: async () => {},
  sessionStatusLookup,
});

const restoredRecovery = await reloadedManager.getRecovery(recovery.id);
assert.equal(restoredRecovery?.state, 'escalated');

const html = renderToStaticMarkup(
  AppShell({
    workspace: mockWorkspace,
    sessions: mockSessions,
    transcript: mockTranscript.parts,
    activeSessionId: mockActiveSessionId,
    runStatus: 'paused',
    runtimeTarget: 'desktop-local',
    themeMode: 'dark',
    recoveryPrompt: {
      recoveryId: recovery.id,
      flow: 'continue-build',
      state: 'pending',
      triggerDetail: 'Execution is paused pending user approval or action.',
      canResume: true,
      canRestore: true,
      snapshotId: 'snap-01',
    },
  })
);

assert.match(html, /Resume Run/);
assert.match(html, /Restore Snapshot/);
assert.match(html, /Inject Guidance/);
assert.match(html, /Recovery: PENDING/);
assert.ok(getTheme('dark'));

console.log('Interventions and recovery verification passed.');
