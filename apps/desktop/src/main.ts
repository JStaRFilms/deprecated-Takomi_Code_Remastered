import type { DesktopAppBootstrap } from './index';

export function createDesktopMainConfig(data: DesktopAppBootstrap) {
  return {
    target: 'desktop' as const,
    workspaceId: data.workspace.id,
    projectId: data.project.id,
    sessionCount: data.sessions.length
  };
}
