import type { ProjectDescriptor, SessionDescriptor, WorkspaceDescriptor } from '@takomi/contracts';
import { AppShell } from '@takomi/ui';

export interface WebAppBootstrap {
  readonly workspace: WorkspaceDescriptor;
  readonly project: ProjectDescriptor;
  readonly sessions: readonly SessionDescriptor[];
}

export function createWebAppBootstrap(data: WebAppBootstrap): WebAppBootstrap {
  return data;
}

export function renderWebApp(data: WebAppBootstrap): JSX.Element {
  return (
    <AppShell
      workspace={data.workspace}
      sessions={data.sessions}
      headline={`Takomi Web · ${data.project.name}`}
    />
  );
}
