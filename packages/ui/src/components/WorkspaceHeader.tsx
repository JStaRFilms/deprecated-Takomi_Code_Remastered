import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';
import type { StatusVariant } from './StatusPill';
import { StatusPill } from './StatusPill';

export interface WorkspaceHeaderProps {
  readonly theme: ThemeTokens;
  readonly projectName: string;
  readonly branchName: string;
  readonly workspaceShortId: string;
  readonly engineStatus: StatusVariant;
}

/** Top context bar showing project path, branch, and engine status */
export function WorkspaceHeader({
  theme,
  projectName,
  branchName,
  workspaceShortId,
  engineStatus,
}: WorkspaceHeaderProps): ReactElement {
  return (
    <header
      data-component="workspace-header"
      style={{
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: `1px solid ${theme.borderInner}`,
        background: theme.bgMain,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Left: breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: theme.textMuted, fontWeight: 500 }}>{projectName}</span>
        <span style={{ color: theme.textMuted, opacity: 0.4 }}>/</span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: theme.bgElevated,
            padding: '2px 8px',
            borderRadius: '6px',
            border: `1px solid ${theme.borderInner}`,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: theme.success,
              display: 'inline-block',
            }}
          />
          <span style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}>
            {branchName}
          </span>
        </div>
        <span style={{ color: theme.textMuted, opacity: 0.4 }}>/</span>
        <span style={{
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', monospace",
          color: theme.textMuted,
        }}>
          {workspaceShortId}
        </span>
      </div>

      {/* Right: engine status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <StatusPill theme={theme} variant={engineStatus} label="Local Engine" />
      </div>
    </header>
  );
}
