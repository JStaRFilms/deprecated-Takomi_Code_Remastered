import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localTsc = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const compileResult = spawnSync(process.execPath, [localTsc, '-p', 'packages/contracts/tsconfig.json'], {
  cwd: repoRoot,
  stdio: 'inherit'
});

if (compileResult.status !== 0) {
  process.exit(compileResult.status ?? 1);
}

const contractsModule = await import(pathToFileURL(path.join(repoRoot, 'packages/contracts/dist/index.js')).href);

const {
  AgentDefaultsLoadIpcPayloadSchema,
  IpcEnvelopeSchema,
  NormalizedRuntimeEventSchema,
  RuntimeConnectIpcPayloadSchema,
  SessionDescriptorSchema,
  ShellCapabilitiesSchema,
  TakomiAgentDefaultsBundleSchema,
  TranscriptPartSchema,
  WorkspaceDescriptorSchema
} = contractsModule;

const representativePayloads = [
  [
    'workspace descriptor',
    WorkspaceDescriptorSchema,
    {
      id: 'ws-a8b2',
      name: 'Takomi Code',
      rootPath: 'C:/CreativeOS/01_Projects/Code/Personal_Stuff/2026-03-20_Takomi_Code_Ts',
      target: 'desktop',
      branchName: 'main',
      dirty: false,
      capabilities: {
        shell: 'desktop',
        browserCompatible: true,
        nativeBridge: true,
        filesystemAccess: true,
        gitAccess: true,
        worktreeSwitching: true,
        secureStorage: true,
        osDialogs: true,
        localRuntimeHosting: true,
        remoteRuntimeTransport: true,
        websocketBridge: false
      }
    }
  ],
  [
    'session descriptor',
    SessionDescriptorSchema,
    {
      id: 'sess-root',
      projectId: 'proj-1',
      parentSessionId: null,
      kind: 'project',
      name: 'Project Chat 1',
      status: 'running',
      workspaceId: 'ws-a8b2',
      worktreePath: null,
      runtimeTarget: 'desktop-local',
      lineage: {
        rootSessionId: 'sess-root',
        parentSessionId: null,
        ancestorSessionIds: [],
        depth: 0,
        inheritsWorkspace: true,
        inheritedWorktreeId: null
      }
    }
  ],
  [
    'runtime event',
    NormalizedRuntimeEventSchema,
    {
      id: 'evt-1',
      runId: 'run-1',
      sessionId: 'sess-root',
      workspaceId: 'ws-a8b2',
      runtimeTarget: 'desktop-local',
      transport: 'local',
      kind: 'run.streaming',
      timestamp: new Date().toISOString(),
      payload: {
        chunk: 'Planning next step'
      }
    }
  ],
  [
    'system transcript part',
    TranscriptPartSchema,
    {
      id: 'part-1',
      sessionId: 'sess-root',
      kind: 'system',
      message: 'Background child session resumed',
      timestamp: new Date().toISOString()
    }
  ],
  [
    'shell capabilities',
    ShellCapabilitiesSchema,
    {
      shell: 'web',
      browserCompatible: true,
      nativeBridge: false,
      filesystemAccess: false,
      gitAccess: false,
      worktreeSwitching: false,
      secureStorage: false,
      osDialogs: false,
      localRuntimeHosting: false,
      remoteRuntimeTransport: true,
      websocketBridge: true
    }
  ],
  [
    'runtime connect payload',
    RuntimeConnectIpcPayloadSchema,
    {
      workspaceId: 'ws-a8b2',
      sessionId: 'sess-root',
      runtimeTarget: 'remote',
      transport: 'remote'
    }
  ],
  [
    'agent defaults load payload',
    AgentDefaultsLoadIpcPayloadSchema,
    {
      source: 'shipped'
    }
  ],
  [
    'ipc envelope',
    IpcEnvelopeSchema,
    {
      id: 'ipc-1',
      channel: 'takomi:agents:defaults:load',
      payload: {
        source: 'shipped'
      },
      workspaceId: 'ws-a8b2',
      timestamp: new Date().toISOString(),
      version: 1
    }
  ],
  [
    'takomi defaults bundle',
    TakomiAgentDefaultsBundleSchema,
    {
      schemaVersion: 1,
      modes: [
        {
          slug: 'vibe-orchestrator',
          name: 'Vibe Orchestrator',
          description: 'Coordinates Takomi work',
          roleDefinition: 'You are the Takomi Orchestrator.',
          whenToUse: 'Use when delegating multi-step work.',
          permissions: [{ capability: 'read' }, { capability: 'edit' }],
          customInstructions: 'Follow the Takomi loop.',
          sourcePath: '.agent/Takomi-Agents/vibe-orchestrator.yaml',
          enabled: true
        }
      ],
      settings: {
        activeModeSlug: 'vibe-orchestrator',
        apiConfigName: 'default',
        allowAutoApproval: true,
        allowBrowser: false,
        allowReadOnly: true,
        allowWrite: true,
        allowMcp: true,
        allowModeSwitch: true,
        allowSubtasks: true,
        allowExecute: true,
        browserToolEnabled: true,
        requestDelaySeconds: 10,
        followupAutoApproveTimeoutMs: 60000,
        showTaskTimeline: true,
        showTimestamps: true
      },
      sources: [
        {
          path: '.agent/Takomi-Agents/custom_modes.yaml',
          kind: 'yaml',
          label: 'shipped-defaults'
        }
      ]
    }
  ]
];

for (const [label, schema, payload] of representativePayloads) {
  schema.parse(payload);
  console.log(`validated ${label}`);
}
