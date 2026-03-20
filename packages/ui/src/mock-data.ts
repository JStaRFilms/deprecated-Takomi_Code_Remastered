import type {
  AgentDefaultsState,
  BagsState,
  BillingState,
  RuntimeSettingsState,
  SessionDescriptor,
  TakomiAgentDefaultsBundle,
  TranscriptPart,
  TranscriptSnapshot,
  WorkspaceDescriptor,
} from '@takomi/contracts';

/* ────────────────────────────────────────────────
 *  Mock data for the shared v6 shell scaffold.
 *  Replaced by live runtime wiring in later tasks.
 * ──────────────────────────────────────────────── */

export const mockWorkspace: WorkspaceDescriptor = {
  id: 'ws-a8b2',
  name: '2026-03-10_Takomi_Code',
  rootPath: '/home/dev/takomi-code',
  target: 'desktop',
  branchName: 'main',
  dirty: false,
  currentWorktreeId: 'main',
  git: {
    branchName: 'main',
    dirty: false,
    headSha: 'abc1234',
  },
  worktrees: [
    {
      id: 'main',
      workspaceId: 'ws-a8b2',
      rootPath: '/home/dev/takomi-code',
      branchName: 'main',
      headSha: 'abc1234',
      dirty: false,
      active: true,
      explicit: false,
      parentWorktreeId: null,
      inheritedFromWorkspaceId: null,
      label: 'main',
    },
    {
      id: 'wt-takomi-refactor-auth-agent-1',
      workspaceId: 'ws-a8b2',
      rootPath: '/home/dev/takomi-code/.takomi/worktrees/takomi-refactor-auth-agent-1',
      branchName: 'feat/refactor-auth',
      headSha: 'def5678',
      dirty: true,
      active: false,
      explicit: true,
      parentWorktreeId: 'main',
      inheritedFromWorkspaceId: null,
      label: 'takomi-refactor-auth-agent-1',
      createdAt: '2026-03-20T10:00:00Z',
      bootstrapStatus: {
        state: 'completed',
        envFilesCopied: ['.env', '.env.local'],
        envFilesBlocked: [],
        dependencyInstallRan: true,
        dependencyInstallExitCode: 0,
        startedAt: '2026-03-20T10:00:01Z',
        completedAt: '2026-03-20T10:00:15Z',
      },
    },
    {
      id: 'wt-takomi-ui-fix-agent-2',
      workspaceId: 'ws-a8b2',
      rootPath: '/home/dev/takomi-code/.takomi/worktrees/takomi-ui-fix-agent-2',
      branchName: 'fix/ui-glitch',
      headSha: 'ghi9012',
      dirty: false,
      active: false,
      explicit: true,
      parentWorktreeId: 'main',
      inheritedFromWorkspaceId: null,
      label: 'takomi-ui-fix-agent-2',
      createdAt: '2026-03-20T09:00:00Z',
      bootstrapStatus: {
        state: 'completed',
        envFilesCopied: ['.env'],
        envFilesBlocked: ['.env.production'],
        dependencyInstallRan: true,
        dependencyInstallExitCode: 0,
        startedAt: '2026-03-20T09:00:01Z',
        completedAt: '2026-03-20T09:00:12Z',
      },
    },
  ],
};

export const mockSessions: readonly SessionDescriptor[] = [
  {
    id: 'sess-01',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'project',
    name: 'Project Chat 1',
    status: 'running',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
  {
    id: 'sess-05',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'project',
    name: 'Project Chat 5',
    status: 'idle',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
  {
    id: 'sess-06',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'project',
    name: 'Project Chat 6',
    status: 'completed',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
  {
    id: 'sess-07',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'chat',
    name: 'Project Chat 7',
    status: 'idle',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
  {
    id: 'sess-08',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'project',
    name: 'Project Chat 8',
    status: 'idle',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
  {
    id: 'sess-09',
    projectId: 'proj-01',
    parentSessionId: null,
    kind: 'task',
    name: 'Project Chat 9',
    status: 'paused',
    workspaceId: 'ws-a8b2',
    worktreePath: null,
  },
] as const;

const ts = '2026-03-20T11:00:00Z';

export const mockTranscript: TranscriptSnapshot = {
  sessionId: 'sess-01',
  lastUpdatedAt: ts,
  parts: [
    {
      kind: 'text',
      id: 'tp-01',
      sessionId: 'sess-01',
      role: 'user',
      text: 'Refactor the authentication logic in auth.service.ts to use the new session provider.',
      timestamp: ts,
    },
    {
      kind: 'text',
      id: 'tp-02',
      sessionId: 'sess-01',
      role: 'assistant',
      text: "Understood. I'll need to update the imports and then migrate the `verifySession` method. First, let me check the current implementation.",
      timestamp: ts,
    },
    {
      kind: 'tool-call',
      id: 'tp-03',
      sessionId: 'sess-01',
      toolName: 'read_file',
      input: { path: 'src/services/auth.service.ts' },
      timestamp: ts,
    },
    {
      kind: 'tool-result',
      id: 'tp-04',
      sessionId: 'sess-01',
      toolName: 'read_file',
      output: '// auth.service.ts contents...',
      timestamp: ts,
    },
    {
      kind: 'text',
      id: 'tp-05',
      sessionId: 'sess-01',
      role: 'assistant',
      text: "I've identified the following changes. Proceed with the update?",
      timestamp: ts,
    },
    {
      kind: 'status',
      id: 'tp-06',
      sessionId: 'sess-01',
      status: 'paused',
      message: 'Waiting for approval to apply changes.',
      timestamp: ts,
    },
  ] satisfies readonly TranscriptPart[],
};

/** Active session ID for the default mock state */
export const mockActiveSessionId = 'sess-01';

const mockAgentBundle: TakomiAgentDefaultsBundle = {
  schemaVersion: 1,
  modes: [
    {
      slug: 'vibe-orchestrator',
      name: 'Vibe Orchestrator',
      description: 'Delegates, reviews, and sequences task work.',
      roleDefinition: 'Coordinate execution and unblock the project.',
      whenToUse: 'When a larger feature needs breakdown and review gates.',
      permissions: [{ capability: 'read' }, { capability: 'command' }, { capability: 'mcp' }],
      customInstructions: 'Keep the user in the loop and gate approvals carefully.',
      sourcePath: '.agent/Takomi-Agents/custom_modes.yaml',
      enabled: true,
    },
    {
      slug: 'vibe-code',
      name: 'Vibe Code',
      description: 'Implements focused changes inside the allowed scope.',
      roleDefinition: 'Build and verify the assigned slice.',
      whenToUse: 'When a scoped implementation task is ready to execute.',
      permissions: [{ capability: 'read' }, { capability: 'edit' }, { capability: 'command' }],
      customInstructions: 'Stay inside the task packet and verify before handoff.',
      sourcePath: '.agent/Takomi-Agents/custom_modes.yaml',
      enabled: true,
    },
  ],
  settings: {
    activeModeSlug: 'vibe-orchestrator',
    apiConfigName: 'codex-default',
    allowAutoApproval: false,
    allowBrowser: true,
    allowReadOnly: true,
    allowWrite: true,
    allowMcp: true,
    allowModeSwitch: true,
    allowSubtasks: true,
    allowExecute: true,
    browserToolEnabled: true,
    requestDelaySeconds: 1,
    followupAutoApproveTimeoutMs: 10000,
    showTaskTimeline: true,
    showTimestamps: true,
  },
  sources: [
    { path: '.agent/Takomi-Agents/custom_modes.yaml', kind: 'yaml', label: 'Shipped modes' },
    { path: '.agent/Takomi-Agents/kilo-code-settings.json', kind: 'json', label: 'Shipped settings' },
  ],
};

export const mockRuntimeSettingsState: RuntimeSettingsState = {
  workspaceId: 'ws-a8b2',
  selectedTarget: 'desktop-local',
  autoVerificationEnabled: true,
  options: [
    {
      id: 'desktop-local',
      label: 'Desktop Local',
      description: 'Use Electron and the local machine for native workspace, Git, and Codex control.',
      transport: 'local',
      available: true,
    },
    {
      id: 'remote',
      label: 'Remote / Web Local',
      description: 'Use the browser-safe or bridge-safe path when native shell powers are unavailable.',
      transport: 'browser-safe',
      available: true,
    },
  ],
  availability: {
    target: 'desktop-local',
    transport: 'local',
    connected: true,
    shellLabel: 'Desktop shell',
    capabilities: [
      { key: 'filesystem', label: 'Workspace filesystem', available: true, mode: 'full', detail: 'Full desktop filesystem access.' },
      { key: 'git', label: 'Git & worktrees', available: true, mode: 'full', detail: 'Readable branch state and worktree controls.' },
      { key: 'bridge', label: 'Remote bridge path', available: true, mode: 'read-only', detail: 'Browser-safe flows remain available.' },
    ],
  },
};

export const mockBillingState: BillingState = {
  workspaceId: 'ws-a8b2',
  plans: [
    { id: 'starter', label: 'Starter', monthlyPriceLabel: 'NGN 8k/mo', description: 'Entry plan for solo experimentation.' },
    { id: 'pro', label: 'Pro', monthlyPriceLabel: 'NGN 24k/mo', description: 'Most likely plan for active Takomi coding workflows.' },
    { id: 'team', label: 'Team', monthlyPriceLabel: 'NGN 60k/mo', description: 'Shared entitlement path for small teams.' },
  ],
  entitlement: {
    id: 'ent-01',
    workspaceId: 'ws-a8b2',
    provider: 'paystack',
    planId: 'pro',
    status: 'active',
    activatedAt: '2026-03-20T12:00:00Z',
    expiresAt: '2026-04-20T12:00:00Z',
  },
  activeCheckout: {
    id: 'checkout-01',
    workspaceId: 'ws-a8b2',
    provider: 'paystack',
    planId: 'team',
    status: 'ready',
    reference: 'PSK-TAKOMI-001',
    checkoutUrl: 'https://paystack.example/checkout/PSK-TAKOMI-001',
    startedAt: '2026-03-20T12:15:00Z',
  },
};

export const mockBagsState: BagsState = {
  workspaceId: 'ws-a8b2',
  linkage: {
    id: 'bags-link-01',
    workspaceId: 'ws-a8b2',
    tokenLabel: 'Primary Bags token',
    tokenMasked: 'bags_****_x91',
    linkedAt: '2026-03-20T11:30:00Z',
    lastVerifiedAt: '2026-03-20T12:20:00Z',
  },
  latestReadiness: {
    id: 'bags-ready-01',
    workspaceId: 'ws-a8b2',
    ready: true,
    checkedAt: '2026-03-20T12:20:00Z',
    summary: 'Workspace is ready for Bags-backed verification.',
    checks: [
      { key: 'token-linked', label: 'Token linked', ok: true, detail: 'A Bags token is attached to this workspace.' },
      { key: 'runtime-configured', label: 'Runtime configured', ok: true, detail: 'Desktop-local runtime target is selected.' },
      { key: 'entitlement-active', label: 'Entitlement active', ok: true, detail: 'Paystack entitlement is active.' },
      { key: 'agent-defaults-loaded', label: 'Agent defaults visible', ok: true, detail: 'Takomi default brain sources are surfaced in settings.' },
    ],
  },
};

export const mockAgentDefaultsState: AgentDefaultsState = {
  workspaceId: 'ws-a8b2',
  bundle: mockAgentBundle,
  configurability: {
    shippedDefaultsPath: '.agent/Takomi-Agents',
    workspaceOverridesEnabled: false,
    userOverridesEnabled: false,
  },
};
