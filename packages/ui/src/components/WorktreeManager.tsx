import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';
import type {
  WorktreeReference,
  WorktreeBootstrapStatus,
  BrowserFallbackNote,
} from '@takomi/contracts';
import { BranchBadge } from './BranchBadge';

export interface WorktreeManagerProps {
  readonly theme: ThemeTokens;
  /** All worktrees for the workspace */
  readonly worktrees: readonly WorktreeReference[];
  /** Currently active worktree ID */
  readonly activeWorktreeId: string | null;
  /** Whether this target supports worktree operations */
  readonly canSwitchWorktree: boolean;
  /** Fallback note to show when operations are unavailable */
  readonly fallbackNote?: BrowserFallbackNote | undefined;
  /** Callback when user wants to switch worktree */
  readonly onSwitchWorktree?: ((worktreeId: string) => void) | undefined;
  /** Callback when user wants to create a new worktree */
  readonly onCreateWorktree?: (() => void) | undefined;
}

/**
 * Worktree manager card grid — shows worktree cards with branch, dirty state,
 * bootstrap status, and switch actions.
 * Based on the v6-worktree-manager mockup.
 */
export function WorktreeManager({
  theme,
  worktrees,
  activeWorktreeId,
  canSwitchWorktree,
  fallbackNote,
  onSwitchWorktree,
  onCreateWorktree,
}: WorktreeManagerProps): ReactElement {
  return (
    <div data-component="worktree-manager" style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: theme.textPrimary,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Worktree Manager
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: theme.textMuted,
              margin: '4px 0 0 0',
            }}
          >
            Manage isolated development environments.
          </p>
        </div>

        {canSwitchWorktree && onCreateWorktree && (
          <button
            onClick={onCreateWorktree}
            style={{
              background: theme.bgElevated,
              border: `1px solid ${theme.borderInner}`,
              color: theme.textSecondary,
              padding: '8px 16px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Spawn Worktree
          </button>
        )}
      </div>

      {/* Capability fallback banner */}
      {!canSwitchWorktree && fallbackNote && (
        <div
          data-role="capability-fallback"
          style={{
            background: theme.warningSoft,
            border: `1px solid ${theme.warning}30`,
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.warning}
            strokeWidth="2"
            style={{ flexShrink: 0, marginTop: '2px' }}
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: theme.textPrimary,
                marginBottom: '2px',
              }}
            >
              Worktree controls unavailable
            </div>
            <div
              style={{
                fontSize: '12px',
                color: theme.textMuted,
              }}
            >
              {fallbackNote.message}
              {fallbackNote.recommendedAction && (
                <span style={{ display: 'block', marginTop: '4px' }}>
                  {fallbackNote.recommendedAction}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Worktree cards grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}
      >
        {worktrees.map((wt) => (
          <WorktreeCard
            key={wt.id}
            theme={theme}
            worktree={wt}
            isActive={wt.id === activeWorktreeId}
            canSwitch={canSwitchWorktree && !wt.active}
            onSwitch={onSwitchWorktree}
          />
        ))}
      </div>

      {/* Empty state */}
      {worktrees.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: theme.textMuted,
            fontSize: '13px',
          }}
        >
          No worktrees found. This workspace may not have git initialized.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worktree Card
// ---------------------------------------------------------------------------

interface WorktreeCardProps {
  readonly theme: ThemeTokens;
  readonly worktree: WorktreeReference;
  readonly isActive: boolean;
  readonly canSwitch: boolean;
  readonly onSwitch?: ((worktreeId: string) => void) | undefined;
}

function WorktreeCard({
  theme,
  worktree,
  isActive,
  canSwitch,
  onSwitch,
}: WorktreeCardProps): ReactElement {
  const statusLabel = isActive ? 'Active Context' : worktree.explicit ? 'Background' : 'Inherited';

  return (
    <div
      data-component="worktree-card"
      data-active={isActive}
      style={{
        background: isActive ? `${theme.accent}08` : theme.bgElevated,
        border: `1px solid ${isActive ? theme.accent : theme.borderInner}`,
        borderRadius: '24px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? `0 0 20px ${theme.accent}15` : undefined,
      }}
    >
      {/* Active glow effect */}
      {isActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: `radial-gradient(circle at top right, ${theme.accent}15 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Status label + name */}
      <div style={{ marginBottom: '16px' }}>
        <span
          style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: isActive ? theme.accent : theme.textMuted,
            display: 'block',
            marginBottom: '6px',
          }}
        >
          {statusLabel}
        </span>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: theme.textPrimary,
            margin: '0 0 4px 0',
          }}
        >
          {worktree.label ?? worktree.id}
        </h3>
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.textMuted,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={worktree.rootPath}
        >
          {worktree.rootPath}
        </span>
      </div>

      {/* Branch badge */}
      <div style={{ marginBottom: '16px' }}>
        <BranchBadge
          theme={theme}
          branchName={worktree.branchName}
          dirty={worktree.dirty}
          headSha={worktree.headSha}
          compact
        />
      </div>

      {/* Bootstrap status */}
      {worktree.bootstrapStatus && (
        <BootstrapStatusBadge theme={theme} status={worktree.bootstrapStatus} />
      )}

      {/* Switch / Active button */}
      <div style={{ marginTop: '16px' }}>
        {isActive ? (
          <button
            disabled
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: `${theme.accent}15`,
              border: `1px solid ${theme.accent}30`,
              color: theme.accent,
              cursor: 'default',
            }}
          >
            Active
          </button>
        ) : canSwitch ? (
          <button
            onClick={() => onSwitch?.(worktree.id)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: theme.bgMain,
              border: `1px solid ${theme.borderInner}`,
              color: theme.textMuted,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Switch Context
          </button>
        ) : (
          <button
            disabled
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: theme.bgMain,
              border: `1px solid ${theme.borderInner}`,
              color: theme.textMuted,
              cursor: 'not-allowed',
              opacity: 0.5,
            }}
          >
            Unavailable
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bootstrap Status Badge
// ---------------------------------------------------------------------------

interface BootstrapStatusBadgeProps {
  readonly theme: ThemeTokens;
  readonly status: WorktreeBootstrapStatus;
}

function BootstrapStatusBadge({ theme, status }: BootstrapStatusBadgeProps): ReactElement {
  const stateConfig: Record<
    WorktreeBootstrapStatus['state'],
    { bg: string; fg: string; border: string; label: string }
  > = {
    pending: {
      bg: `${theme.textMuted}15`,
      fg: theme.textMuted,
      border: `${theme.textMuted}25`,
      label: 'Bootstrap Pending',
    },
    running: {
      bg: `${theme.accent}15`,
      fg: theme.accent,
      border: `${theme.accent}25`,
      label: 'Bootstrapping...',
    },
    completed: {
      bg: `${theme.success}15`,
      fg: theme.success,
      border: `${theme.success}25`,
      label: 'Ready',
    },
    failed: {
      bg: `${theme.danger}15`,
      fg: theme.danger,
      border: `${theme.danger}25`,
      label: 'Bootstrap Failed',
    },
    skipped: {
      bg: `${theme.textMuted}10`,
      fg: theme.textMuted,
      border: `${theme.textMuted}15`,
      label: 'Bootstrap Skipped',
    },
  };

  const config = stateConfig[status.state];

  const details: string[] = [];
  if (status.envFilesCopied.length > 0) {
    details.push(`Env files copied: ${status.envFilesCopied.join(', ')}`);
  }
  if (status.envFilesBlocked.length > 0) {
    details.push(`Env files blocked: ${status.envFilesBlocked.join(', ')}`);
  }
  if (status.dependencyInstallRan) {
    details.push(`Dependency install: exit code ${status.dependencyInstallExitCode ?? 'unknown'}`);
  }

  return (
    <div
      data-component="bootstrap-status"
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '11px',
        color: config.fg,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: details.length > 0 ? '4px' : 0 }}>
        {config.label}
      </div>
      {details.map((d, i) => (
        <div key={i} style={{ color: theme.textMuted, fontSize: '10px' }}>
          {d}
        </div>
      ))}
      {status.error && (
        <div style={{ color: theme.danger, fontSize: '10px', marginTop: '4px' }}>
          Error: {status.error}
        </div>
      )}
    </div>
  );
}
