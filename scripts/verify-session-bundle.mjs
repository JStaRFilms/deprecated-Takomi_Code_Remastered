import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localTsc = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');

function compilePackage(tsconfigPath) {
  const result = spawnSync(process.execPath, [localTsc, '-b', tsconfigPath], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

compilePackage('packages/contracts/tsconfig.json');
compilePackage('packages/persistence/tsconfig.json');

const contractsModule = await import(pathToFileURL(path.join(repoRoot, 'packages/contracts/dist/index.js')).href);
const persistenceModule = await import(pathToFileURL(path.join(repoRoot, 'packages/persistence/dist/index.js')).href);

const {
  TakomiSessionBundleV1Schema
} = contractsModule;

const {
  exportTakomiSessionBundle,
  importTakomiSessionBundle,
  importSupportedForeignCodexSessionData
} = persistenceModule;

const timestamp = '2026-03-20T10:00:00.000Z';

const exportState = {
  bundleId: 'bundle-takomi-001',
  exportedAt: timestamp,
  exportedBy: 'Takomi Code',
  sourceLabel: 'Takomi desktop export',
  sourceAdapter: 'takomi:persistence',
  sourceVersion: '1.0.0',
  session: {
    id: 'sess-001',
    projectId: 'proj-001',
    parentSessionId: null,
    kind: 'chat',
    name: 'Takomi bundle round-trip',
    status: 'running',
    workspaceId: 'ws-001',
    worktreePath: null,
    runtimeTarget: 'desktop-local',
    worktreeId: 'wt-001',
    lineage: {
      rootSessionId: 'sess-001',
      parentSessionId: null,
      ancestorSessionIds: [],
      depth: 0,
      inheritsWorkspace: true,
      inheritedWorktreeId: null
    }
  },
  workspace: {
    id: 'ws-001',
    name: 'Takomi Code',
    rootPath: 'C:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-03-20_Takomi_Code_Ts',
    target: 'desktop',
    branchName: 'main',
    dirty: false,
    currentWorktreeId: 'wt-001',
    worktrees: [
      {
        id: 'wt-001',
        workspaceId: 'ws-001',
        rootPath: 'C:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-03-20_Takomi_Code_Ts',
        branchName: 'main',
        headSha: 'abc123',
        dirty: false,
        active: true,
        explicit: false,
        parentWorktreeId: null,
        inheritedFromWorkspaceId: 'ws-001',
        createdAt: timestamp
      }
    ]
  },
  transcript: {
    sessionId: 'sess-001',
    lastUpdatedAt: timestamp,
    parts: [
      {
        id: 'part-001',
        sessionId: 'sess-001',
        kind: 'text',
        role: 'assistant',
        text: 'Round-trip export ready.',
        timestamp
      },
      {
        id: 'part-002',
        sessionId: 'sess-001',
        kind: 'system',
        message: 'Session exported through Takomi bundle interop.',
        timestamp
      }
    ]
  },
  runtimeEvents: [
    {
      id: 'evt-001',
      runId: 'run-001',
      sessionId: 'sess-001',
      workspaceId: 'ws-001',
      projectId: 'proj-001',
      runtimeTarget: 'desktop-local',
      transport: 'local',
      kind: 'run.starting',
      timestamp,
      payload: {
        mode: 'vibe-orchestrator'
      }
    }
  ],
  artifacts: [
    {
      id: 'artifact-001',
      taskId: 'task-001',
      sessionId: 'sess-001',
      workspaceId: 'ws-001',
      kind: 'bundle',
      name: 'takomi-session-bundle.json',
      uri: 'file:///artifacts/takomi-session-bundle.json',
      createdAt: timestamp
    }
  ],
  auditEvents: [
    {
      id: 'audit-001',
      kind: 'run.starting',
      timestamp,
      subjectId: 'run-001',
      subjectType: 'run',
      workspaceId: 'ws-001',
      projectId: 'proj-001',
      sessionId: 'sess-001',
      runId: 'run-001',
      data: {
        source: 'takomi'
      }
    }
  ]
};

const exportedBundle = exportTakomiSessionBundle(exportState);
const importedBundle = importTakomiSessionBundle(exportedBundle);

assert.equal(exportedBundle.schemaVersion, 1);
assert.equal(exportedBundle.metadata.sourceKind, 'takomi');
assert.equal(importedBundle.metadata.bundleId, exportState.bundleId);
assert.deepEqual(importedBundle, exportedBundle);
TakomiSessionBundleV1Schema.parse(exportedBundle);

const foreignPayload = {
  schemaVersion: 1,
  exportId: 'foreign-001',
  exportedAt: timestamp,
  source: {
    product: 'Codex Studio',
    adapter: 'codex-session-export',
    version: '2.4.1'
  },
  session: exportState.session,
  transcript: {
    items: exportState.transcript.parts,
    lastUpdatedAt: timestamp
  },
  runtime: {
    events: exportState.runtimeEvents
  },
  artifacts: exportState.artifacts,
  audit: {
    events: exportState.auditEvents
  },
  workspace: exportState.workspace,
  legacyConversationId: 'legacy-thread-77'
};

const foreignImport = importSupportedForeignCodexSessionData(foreignPayload);

assert.equal(foreignImport.status, 'partial');
assert.ok(foreignImport.bundle);
assert.equal(foreignImport.bundle.metadata.sourceKind, 'foreign-codex');
assert.equal(foreignImport.bundle.transcript.parts.length, exportState.transcript.parts.length);
assert.equal(foreignImport.bundle.runtimeEvents.length, exportState.runtimeEvents.length);
assert.ok(foreignImport.issues.some((issue) => issue.code === 'unsupported-field'));

const unsupportedImport = importSupportedForeignCodexSessionData({
  schemaVersion: 2,
  exportId: 'foreign-unsupported',
  exportedAt: timestamp,
  source: {
    product: 'Codex Studio',
    adapter: 'codex-session-export'
  },
  session: exportState.session,
  workspace: exportState.workspace
});

assert.equal(unsupportedImport.status, 'unsupported');
assert.equal(unsupportedImport.bundle, null);
assert.ok(unsupportedImport.issues.some((issue) => issue.code === 'unsupported-schema'));

console.log('Session bundle interop verification passed.');
