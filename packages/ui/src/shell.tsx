import type { ReactElement } from 'react';
import type { SessionDescriptor, TranscriptPart, WorkspaceDescriptor } from '@takomi/contracts';
import type { ThemeMode, ThemeTokens } from './theme';
import { getTheme } from './tokens';
import { PrimaryRail } from './components/PrimaryRail';
import { SessionsSidebar } from './components/SessionsSidebar';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { TranscriptPane } from './components/TranscriptPane';
import { FloatingComposer } from './components/FloatingComposer';
import { Inspector } from './components/Inspector';

export interface AppShellProps {
  readonly workspace: WorkspaceDescriptor;
  readonly sessions: readonly SessionDescriptor[];
  readonly transcript?: readonly TranscriptPart[];
  readonly activeSessionId?: string | null;
  readonly headline?: string;
  readonly themeMode?: ThemeMode;
  /** Collapse sidebars for narrow viewports */
  readonly compactMode?: boolean;
}

/**
 * Shared v6 workspace shell — the primary surface of Takomi.
 * Four-panel layout: PrimaryRail · SessionsSidebar · TranscriptCenter · Inspector
 * Runs identically in Electron and browser mounts.
 */
export function AppShell({
  workspace,
  sessions,
  transcript = [],
  activeSessionId = null,
  headline: _headline,
  themeMode = 'dark',
  compactMode = false,
}: AppShellProps): ReactElement {
  const theme: ThemeTokens = getTheme(themeMode);

  const activeSession = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId) ?? null
    : sessions[0] ?? null;

  const resolvedActiveId = activeSession?.id ?? null;

  return (
    <div
      data-component="app-shell"
      data-theme={themeMode}
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        color: theme.textPrimary,
        background: theme.bgApp,
        fontSize: '13px',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* 1. Primary rail */}
      <PrimaryRail theme={theme} />

      {/* 2. Sessions sidebar */}
      <SessionsSidebar
        theme={theme}
        sessions={sessions}
        activeSessionId={resolvedActiveId}
        workspaceName={workspace.name}
        collapsed={compactMode}
      />

      {/* 3. Center stage */}
      <div
        data-component="center-stage"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
          background: theme.bgMain,
          boxShadow: theme.mode === 'dark' ? '-10px 0 30px rgba(0,0,0,0.5)' : '-4px 0 12px rgba(0,0,0,0.06)',
          zIndex: 30,
        }}
      >
        <WorkspaceHeader
          theme={theme}
          projectName={workspace.name}
          branchName={workspace.branchName ?? 'main'}
          workspaceShortId={workspace.id}
          engineStatus={activeSession?.status === 'running' ? 'running' : 'idle'}
        />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <TranscriptPane
            theme={theme}
            parts={transcript}
            sessionName={activeSession?.name ?? 'New Session'}
          />

          <FloatingComposer
            theme={theme}
            mode={activeSession?.status === 'running' ? 'stop' : activeSession?.status === 'paused' ? 'resume' : 'send'}
            disabled={activeSession?.status === 'running'}
          />
        </div>
      </div>

      {/* 4. Right inspector */}
      <Inspector
        theme={theme}
        sessionName={activeSession?.name ?? 'No active session'}
        runStatus={activeSession?.status ?? 'idle'}
        runDescription={
          activeSession?.status === 'running'
            ? 'Takomi is actively processing steps in the background…'
            : activeSession?.status === 'paused'
              ? 'Execution is paused pending user approval or action.'
              : 'Waiting for Takomi output.'
        }
        collapsed={compactMode}
      />
    </div>
  );
}

export type { ThemeMode, ThemeTokens };
