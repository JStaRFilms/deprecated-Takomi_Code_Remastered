import type { WebAppBootstrap } from './index';

export function createWebMainConfig(data: WebAppBootstrap) {
  return {
    target: 'web' as const,
    workspaceId: data.workspace.id,
    projectId: data.sessions[0]?.projectId ?? 'unassigned-project',
    sessionCount: data.sessions.length
  };
}
