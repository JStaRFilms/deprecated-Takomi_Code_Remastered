/* Layout Primitives */
export { AppShell } from './shell';
export type { AppShellProps } from './shell';

/* Design Tokens & Theme */
export { getTheme, uiTokens } from './tokens';
export type { ThemeMode, ThemeTokens } from './theme';

/* Components */
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

export { BranchBadge } from './components/BranchBadge';
export type { BranchBadgeProps } from './components/BranchBadge';

export { WorktreeManager } from './components/WorktreeManager';
export type { WorktreeManagerProps } from './components/WorktreeManager';

export { InterventionControls, deriveInterventionActions } from './components/InterventionControls';
export type {
  InterventionControlsProps,
  InterventionActionKind,
  InterventionActionDescriptor,
} from './components/InterventionControls';

export { RecoveryPrompt } from './components/RecoveryPrompt';
export type { RecoveryPromptProps, RecoveryFlowKind } from './components/RecoveryPrompt';

export { RuntimeSettings } from './components/RuntimeSettings';
export type { RuntimeSettingsProps } from './components/RuntimeSettings';

export { BillingSettings } from './components/BillingSettings';
export type { BillingSettingsProps } from './components/BillingSettings';

export { BagsSettings } from './components/BagsSettings';
export type { BagsSettingsProps } from './components/BagsSettings';

export { AgentDefinitionsSettings } from './components/AgentDefinitionsSettings';
export type { AgentDefinitionsSettingsProps } from './components/AgentDefinitionsSettings';

export { SettingsView } from './components/SettingsView';
export type { SettingsViewProps } from './components/SettingsView';

/* Mock Data */
export {
  mockWorkspace,
  mockSessions,
  mockTranscript,
  mockActiveSessionId,
  mockRuntimeSettingsState,
  mockBillingState,
  mockBagsState,
  mockAgentDefaultsState,
} from './mock-data';
