import type {
  SessionDescriptor,
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
