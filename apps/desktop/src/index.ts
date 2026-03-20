import type { ReactElement } from 'react';
import type { SessionDescriptor, TranscriptPart, WorkspaceDescriptor } from '@takomi/contracts';
import type { ThemeMode } from '@takomi/ui';
import {
  AppShell,
  mockWorkspace,
  mockSessions,
  mockTranscript,
  mockActiveSessionId,
} from '@takomi/ui';

export interface DesktopAppBootstrap {
  readonly workspace: WorkspaceDescriptor;
  readonly sessions: readonly SessionDescriptor[];
  readonly transcript?: readonly TranscriptPart[];
  readonly activeSessionId?: string;
  readonly themeMode?: ThemeMode;
}

export function createDesktopAppBootstrap(data?: Partial<DesktopAppBootstrap>): DesktopAppBootstrap {
  return {
    workspace: data?.workspace ?? mockWorkspace,
    sessions: data?.sessions ?? mockSessions,
    transcript: data?.transcript ?? mockTranscript.parts,
    activeSessionId: data?.activeSessionId ?? mockActiveSessionId,
    themeMode: data?.themeMode ?? 'dark',
  };
}

export function renderDesktopApp(data: DesktopAppBootstrap): ReactElement {
  return AppShell({
    workspace: data.workspace,
    sessions: data.sessions,
    ...(data.transcript ? { transcript: data.transcript } : {}),
    ...(data.activeSessionId ? { activeSessionId: data.activeSessionId } : {}),
    themeMode: data.themeMode ?? 'dark',
  });
}
