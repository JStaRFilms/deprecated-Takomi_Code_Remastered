/* ── Layout Primitives ── */
export { AppShell } from './shell';
export type { AppShellProps } from './shell';

/* ── Design Tokens & Theme ── */
export { getTheme, uiTokens } from './tokens';
export type { ThemeMode, ThemeTokens } from './theme';

/* ── Components ── */
export { PrimaryRail } from './components/PrimaryRail';
export type { PrimaryRailProps } from './components/PrimaryRail';

export { SessionsSidebar } from './components/SessionsSidebar';
export type { SessionsSidebarProps } from './components/SessionsSidebar';

export { WorkspaceHeader } from './components/WorkspaceHeader';
export type { WorkspaceHeaderProps } from './components/WorkspaceHeader';

export { TranscriptPane } from './components/TranscriptPane';
export type { TranscriptPaneProps } from './components/TranscriptPane';

export { FloatingComposer } from './components/FloatingComposer';
export type { FloatingComposerProps } from './components/FloatingComposer';

export { Inspector } from './components/Inspector';
export type { InspectorProps } from './components/Inspector';

export { StatusPill } from './components/StatusPill';
export type { StatusPillProps, StatusVariant } from './components/StatusPill';

/* ── Mock Data ── */
export { mockWorkspace, mockSessions, mockTranscript, mockActiveSessionId } from './mock-data';
