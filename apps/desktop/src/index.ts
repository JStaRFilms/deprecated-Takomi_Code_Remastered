import type { ReactElement } from 'react';
import type {
  NormalizedRuntimeEvent,
  SessionDescriptor,
  TranscriptPart,
  TranscriptRenderBlock,
  WorkspaceDescriptor,
} from '@takomi/contracts';
import {
  createMockTranscriptEvents,
  createMockTranscriptParts,
  materializeTranscript,
} from '@takomi/orchestration';
import { deriveRuntimePresentationState } from '@takomi/runtime-codex';
import type { ThemeMode } from '@takomi/ui';
import {
  AppShell,
  mockWorkspace,
  mockSessions,
  mockActiveSessionId,
} from '@takomi/ui';

export interface DesktopAppBootstrap {
  readonly workspace: WorkspaceDescriptor;
  readonly sessions: readonly SessionDescriptor[];
  readonly transcript?: readonly TranscriptPart[];
  readonly runtimeEvents?: readonly NormalizedRuntimeEvent[];
  readonly transcriptBlocks?: readonly TranscriptRenderBlock[];
  readonly activeSessionId?: string;
  readonly themeMode?: ThemeMode;
}

export function createDesktopAppBootstrap(data?: Partial<DesktopAppBootstrap>): DesktopAppBootstrap {
  const activeSessionId = data?.activeSessionId ?? mockActiveSessionId;
  const transcript = data?.transcript ?? createMockTranscriptParts().map((part) => ({
    ...part,
    sessionId: activeSessionId,
  }));
  const sessionProjectId = (data?.sessions ?? mockSessions)[0]?.projectId ?? 'proj-01';
  const runtimeEvents = data?.runtimeEvents ?? createMockTranscriptEvents().map((event) => ({
    ...event,
    sessionId: activeSessionId,
    workspaceId: data?.workspace?.id ?? mockWorkspace.id,
    projectId: sessionProjectId,
  }));

  return {
    workspace: data?.workspace ?? mockWorkspace,
    sessions: data?.sessions ?? mockSessions,
    transcript,
    runtimeEvents,
    transcriptBlocks:
      data?.transcriptBlocks ??
      materializeTranscript(activeSessionId, transcript, runtimeEvents),
    activeSessionId,
    themeMode: data?.themeMode ?? 'dark',
  };
}

export function renderDesktopApp(data: DesktopAppBootstrap): ReactElement {
  const presentation = data.activeSessionId
    ? deriveRuntimePresentationState(data.activeSessionId, data.runtimeEvents ?? [])
    : null;

  return AppShell({
    workspace: data.workspace,
    sessions: data.sessions,
    ...(data.transcript ? { transcript: data.transcript } : {}),
    ...(data.transcriptBlocks ? { transcriptBlocks: data.transcriptBlocks } : {}),
    ...(data.activeSessionId ? { activeSessionId: data.activeSessionId } : {}),
    ...(presentation
      ? {
          runStatus: presentation.sessionStatus,
          composerMode: presentation.composerMode,
          activityLabel: presentation.tickerLabel,
        }
      : {}),
    themeMode: data.themeMode ?? 'dark',
  });
}
