import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';

export interface BranchBadgeProps {
  readonly theme: ThemeTokens;
  readonly branchName: string;
  readonly dirty: boolean;
  readonly headSha?: string | undefined;
  readonly upstreamBranchName?: string | undefined;
  readonly aheadCount?: number | undefined;
  readonly behindCount?: number | undefined;
  /** Show compact version (just branch dot + name) */
  readonly compact?: boolean;
}

/**
 * Displays the current Git branch name with dirty state indicator,
 * upstream tracking info, and ahead/behind counts.
 */
export function BranchBadge({
  theme,
  branchName,
  dirty,
  headSha: _headSha,
  upstreamBranchName,
  aheadCount,
  behindCount,
  compact = false,
}: BranchBadgeProps): ReactElement {
  const dotColor = dirty ? theme.warning : theme.success;
  const dotLabel = dirty ? 'Uncommitted changes' : 'Clean';

  if (compact) {
    return (
      <span
        data-component="branch-badge"
        data-dirty={dirty}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: theme.bgElevated,
          padding: '2px 8px',
          borderRadius: '6px',
          border: `1px solid ${theme.borderInner}`,
        }}
      >
        <span
          title={dotLabel}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: dotColor,
            display: 'inline-block',
            boxShadow: dirty ? `0 0 6px ${theme.warning}` : undefined,
          }}
        />
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {branchName}
        </span>
      </span>
    );
  }

  return (
    <div
      data-component="branch-badge"
      data-dirty={dirty}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: theme.bgElevated,
        padding: '4px 12px',
        borderRadius: '8px',
        border: `1px solid ${theme.borderInner}`,
      }}
    >
      {/* Branch icon */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.textSecondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>

      {/* Branch name */}
      <span
        style={{
          fontSize: '12px',
          fontFamily: "'JetBrains Mono', monospace",
          color: theme.textPrimary,
          fontWeight: 500,
        }}
      >
        {branchName}
      </span>

      {/* Dirty indicator */}
      <span
        title={dotLabel}
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: dotColor,
          display: 'inline-block',
          boxShadow: dirty ? `0 0 8px ${theme.warning}` : undefined,
        }}
      />

      {/* Upstream tracking */}
      {upstreamBranchName && (
        <span
          style={{
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            color: theme.textMuted,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.textMuted}
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          {upstreamBranchName}
          {aheadCount !== undefined && aheadCount > 0 && (
            <span style={{ color: theme.accent }}> +{aheadCount}</span>
          )}
          {behindCount !== undefined && behindCount > 0 && (
            <span style={{ color: theme.danger }}> -{behindCount}</span>
          )}
        </span>
      )}
    </div>
  );
}
