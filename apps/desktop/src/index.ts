import type { ProjectDescriptor, SessionDescriptor, WorkspaceDescriptor } from '@takomi/contracts';
import { AppShell } from '@takomi/ui';

export interface DesktopAppBootstrap {
  readonly workspace: WorkspaceDescriptor;
  readonly project: ProjectDescriptor;
  readonly sessions: readonly SessionDescriptor[];
}

export function createDesktopAppBootstrap(data: DesktopAppBootstrap): DesktopAppBootstrap {
  return data;
}

export function renderDesktopApp(data: DesktopAppBootstrap): JSX.Element {
  return (
    <AppShell
      workspace={data.workspace}
      sessions={data.sessions}
      headline={`Takomi Desktop · ${data.project.name}`}
    />
  );
}
