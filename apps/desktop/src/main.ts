import type { DesktopAppBootstrap } from './index';

export function createDesktopMainConfig(data: DesktopAppBootstrap) {
  return {
    target: 'desktop' as const,
    workspaceId: data.workspace.id,
    projectId: data.sessions[0]?.projectId ?? 'unassigned-project',
    sessionCount: data.sessions.length
  };
}
