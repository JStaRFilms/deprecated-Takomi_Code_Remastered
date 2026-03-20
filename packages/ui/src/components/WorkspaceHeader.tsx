import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';
import type { StatusVariant } from './StatusPill';
import { StatusPill } from './StatusPill';
import { BranchBadge } from './BranchBadge';

export interface WorkspaceHeaderProps {
  readonly theme: ThemeTokens;
  readonly projectName: string;
  readonly branchName: string;
  readonly workspaceShortId: string;
  readonly engineStatus: StatusVariant;
  /** Git dirty state */
  readonly dirty?: boolean;
  /** Git HEAD SHA */
  readonly headSha?: string | undefined;
  /** Upstream branch name */
  readonly upstreamBranchName?: string | undefined;
  /** Commits ahead of upstream */
  readonly aheadCount?: number | undefined;
  /** Commits behind upstream */
  readonly behindCount?: number | undefined;
  /** Current worktree label (human-readable) */
  readonly worktreeLabel?: string | null | undefined;
  /** Current worktree filesystem path */
  readonly worktreePath?: string | null | undefined;
  /** Whether worktree switching is available */
  readonly worktreeSwitchAvailable?: boolean | undefined;
  /** Callback to open worktree manager */
  readonly onOpenWorktreeManager?: (() => void) | undefined;
}

/** Top context bar showing project path, branch, worktree, and engine status */
export function WorkspaceHeader({
  theme,
  projectName,
  branchName,
  workspaceShortId,
  engineStatus,
  dirty = false,
  headSha,
  upstreamBranchName,
  aheadCount,
  behindCount,
  worktreeLabel,
  worktreePath,
  worktreeSwitchAvailable = false,
  onOpenWorktreeManager,
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
      {/* Left: breadcrumb with branch badge and worktree context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: theme.textMuted, fontWeight: 500 }}>{projectName}</span>
        <span style={{ color: theme.textMuted, opacity: 0.4 }}>/</span>

        <BranchBadge
          theme={theme}
          branchName={branchName}
          dirty={dirty}
          headSha={headSha}
          upstreamBranchName={upstreamBranchName}
          aheadCount={aheadCount}
          behindCount={behindCount}
          compact
        />

        {/* Worktree context */}
        {worktreeLabel && (
          <>
            <span style={{ color: theme.textMuted, opacity: 0.4 }}>/</span>
            {worktreeSwitchAvailable && onOpenWorktreeManager ? (
              <button
                onClick={onOpenWorktreeManager}
                title={`Worktree: ${worktreePath ?? worktreeLabel}\nClick to manage worktrees`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: theme.textMuted,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  transition: 'background 0.15s ease',
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 3v12" />
                  <circle cx="18" cy="6" r="3" />
                  <circle cx="6" cy="18" r="3" />
                  <path d="M18 9a9 9 0 0 1-9 9" />
                </svg>
                {worktreeLabel}
              </button>
            ) : (
              <span
                title={worktreePath ?? undefined}
                style={{
                  fontSize: '11px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: theme.textMuted,
                }}
              >
                {worktreeLabel}
              </span>
            )}
          </>
        )}

        {/* Workspace ID */}
        <span style={{ color: theme.textMuted, opacity: 0.4 }}>/</span>
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.textMuted,
          }}
        >
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
