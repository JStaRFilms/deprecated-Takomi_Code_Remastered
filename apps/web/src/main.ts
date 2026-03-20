import type { WebAppBootstrap } from './index';

export function createWebMainConfig(data: WebAppBootstrap) {
  return {
    target: 'web' as const,
    workspaceId: data.workspace.id,
    projectId: data.project.id,
    sessionCount: data.sessions.length
  };
}
