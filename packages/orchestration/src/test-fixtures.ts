import type {
  NormalizedRuntimeEvent,
  TranscriptPart,
} from '@takomi/contracts';

export const MOCK_SESSION_ID = 'session-123';
export const MOCK_PROJECT_ID = 'project-456';
export const MOCK_WORKSPACE_ID = 'workspace-789';
export const MOCK_RUN_ID = 'run-1';

export function createMockTranscriptEvents(): NormalizedRuntimeEvent[] {
  const base = {
    sessionId: MOCK_SESSION_ID,
    projectId: MOCK_PROJECT_ID,
    workspaceId: MOCK_WORKSPACE_ID,
    runtimeTarget: 'desktop-local' as const,
    transport: 'local' as const,
    runId: MOCK_RUN_ID,
  };

  return [
    {
      ...base,
      id: 'event-1',
      kind: 'run.starting',
      timestamp: '2026-03-20T11:00:00.000Z',
      payload: {},
    },
    {
      ...base,
      id: 'event-2',
      kind: 'run.streaming',
      timestamp: '2026-03-20T11:00:01.000Z',
      payload: { role: 'thought', text: 'Planning the work in phases.' },
    },
    {
      ...base,
      id: 'event-3',
      kind: 'run.command.started',
      timestamp: '2026-03-20T11:00:02.000Z',
      payload: { command: 'pnpm test -- login', logs: '> vitest', background: false },
    },
    {
      ...base,
      id: 'event-4',
      kind: 'run.command.completed',
      timestamp: '2026-03-20T11:00:03.000Z',
      payload: { command: 'pnpm test -- login', logs: 'PASS login.spec.ts', exitCode: 0 },
    },
    {
      ...base,
      id: 'event-5',
      kind: 'run.file_changes.updated',
      timestamp: '2026-03-20T11:00:04.000Z',
      payload: {
        count: 2,
        status: 'completed',
        files: [
          { path: 'src/components/Login.tsx', label: 'Updated (+3 -1)' },
          { path: 'src/components/Login.css', label: 'Updated (+8 -2)' },
        ],
      },
    },
    {
      ...base,
      id: 'event-6',
      kind: 'run.pause_requested',
      timestamp: '2026-03-20T11:00:05.000Z',
      payload: { message: 'Waiting for approval to deploy the migration.' },
    },
    {
      ...base,
      id: 'event-7',
      kind: 'run.paused',
      timestamp: '2026-03-20T11:00:06.000Z',
      payload: { message: 'Run paused pending user approval.' },
    },
  ];
}

export function createMockTranscriptParts(): TranscriptPart[] {
  return [
    {
      kind: 'text',
      id: 'part-1',
      sessionId: MOCK_SESSION_ID,
      role: 'user',
      text: 'Scan the project files and map the current architecture.',
      timestamp: '2026-03-20T11:00:00.500Z',
      runId: MOCK_RUN_ID,
    },
    {
      kind: 'status',
      id: 'part-2',
      sessionId: MOCK_SESSION_ID,
      status: 'plan.ready',
      message: '1. Inspect the repository\n2. Run the focused test suite\n3. Apply the login fixes',
      timestamp: '2026-03-20T11:00:01.500Z',
      runId: MOCK_RUN_ID,
    },
    {
      kind: 'text',
      id: 'part-3',
      sessionId: MOCK_SESSION_ID,
      role: 'assistant',
      text: 'I found the project files. The login flow touches the UI and the auth service.',
      timestamp: '2026-03-20T11:00:03.500Z',
      runId: MOCK_RUN_ID,
    },
    {
      kind: 'artifact',
      id: 'part-4',
      sessionId: MOCK_SESSION_ID,
      artifactId: 'artifact-1',
      label: 'login-fix-summary.md',
      timestamp: '2026-03-20T11:00:04.500Z',
      runId: MOCK_RUN_ID,
    },
    {
      kind: 'status',
      id: 'part-5',
      sessionId: MOCK_SESSION_ID,
      status: 'paused',
      message: 'Waiting for approval to deploy the migration.',
      timestamp: '2026-03-20T11:00:06.500Z',
      runId: MOCK_RUN_ID,
    },
  ];
}
