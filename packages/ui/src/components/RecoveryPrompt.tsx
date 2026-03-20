import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';

export type RecoveryFlowKind = 'continue-build' | 'migrate' | 'reset' | 'escalate';

export interface RecoveryPromptProps {
  readonly theme: ThemeTokens;
  readonly sessionId: string;
  readonly recoveryId: string;
  readonly flow: RecoveryFlowKind;
  readonly state: 'pending' | 'in-progress' | 'resolved' | 'failed' | 'escalated';
  readonly triggerDetail?: string;
  readonly canResume: boolean;
  readonly canRestore: boolean;
  readonly snapshotId?: string;
  readonly onResume: () => void;
  readonly onRestore: () => void;
  readonly onEscalate: () => void;
  readonly onDismiss: () => void;
}

const flowLabels: Record<RecoveryFlowKind, string> = {
  'continue-build': 'Continue Build',
  'migrate': 'Migrate Session',
  'reset': 'Reset & Retry',
  'escalate': 'Escalate to Manual',
};

const flowDescriptions: Record<RecoveryFlowKind, string> = {
  'continue-build': 'Resume the interrupted run from the last checkpoint.',
  'migrate': 'Move this session to a different workspace or worktree.',
  'reset': 'Roll back to the last snapshot and retry the failed steps.',
  'escalate': 'Flag for manual review. No automated action will be taken.',
};

const stateColors: Record<
  RecoveryPromptProps['state'],
  (theme: ThemeTokens) => { bg: string; fg: string; border: string }
> = {
  pending: (t) => ({ bg: t.warningSoft, fg: t.warning, border: t.warning + '33' }),
  'in-progress': (t) => ({ bg: t.accentSoft, fg: t.accent, border: t.accent + '33' }),
  resolved: (t) => ({ bg: t.successSoft, fg: t.success, border: t.success + '33' }),
  failed: (t) => ({ bg: t.dangerSoft, fg: t.danger, border: t.danger + '33' }),
  escalated: (t) => ({ bg: t.warningSoft, fg: t.warning, border: t.warning + '33' }),
};

/**
 * Recovery prompt card displayed when a session requires user intervention
 * after a failure, pause, or unsupported intervention action.
 * Matches the v6 mockup visual language: rounded cards, accent treatment,
 * clear action hierarchy.
 */
export function RecoveryPrompt({
  theme,
  sessionId: _sessionId,
  recoveryId: _recoveryId,
  flow,
  state,
  triggerDetail,
  canResume,
  canRestore,
  snapshotId: _snapshotId,
  onResume,
  onRestore,
  onEscalate,
  onDismiss,
}: RecoveryPromptProps): ReactElement {
  const colors = stateColors[state](theme);
  const isResolved = state === 'resolved' || state === 'failed' || state === 'escalated';

  return (
    <div
      data-component="recovery-prompt"
      data-flow={flow}
      data-state={state}
      style={{
        background: theme.bgElevated,
        border: `1px solid ${colors.border}`,
        borderRadius: '24px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '16px',
            background: colors.bg,
            color: colors.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
          }}
        >
          {flow === 'continue-build' ? '▶' : flow === 'reset' ? '↺' : flow === 'escalate' ? '⚠' : '↗'}
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontFamily: "'Inter', sans-serif",
              fontSize: '1rem',
              fontWeight: 700,
              color: theme.textPrimary,
              letterSpacing: '-0.01em',
            }}
          >
            {flowLabels[flow]}
          </h3>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.65rem',
              color: theme.textMuted,
              letterSpacing: '0.03em',
            }}
          >
            Recovery: {state.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Description */}
      <p
        style={{
          margin: 0,
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.85rem',
          color: theme.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {flowDescriptions[flow]}
      </p>

      {/* Trigger detail */}
      {triggerDetail && (
        <div
          style={{
            background: 'rgba(0,0,0,0.25)',
            borderRadius: '12px',
            padding: '12px 16px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            color: theme.textMuted,
            lineHeight: 1.5,
          }}
        >
          {triggerDetail}
        </div>
      )}

      {/* Actions */}
      {!isResolved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '8px',
            borderTop: `1px solid ${theme.borderInner}`,
          }}
        >
          {canResume && (
            <button
              data-action="resume"
              onClick={onResume}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                background: theme.accent,
                color: theme.bgApp,
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'transform 100ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.01)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              Resume Run
            </button>
          )}

          {canRestore && (
            <button
              data-action="restore"
              onClick={onRestore}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '16px',
                border: `1px solid ${theme.borderInner}`,
                background: theme.bgElevated,
                color: theme.textPrimary,
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = theme.hover;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = theme.bgElevated;
              }}
            >
              Restore Snapshot
            </button>
          )}

          <button
            data-action="escalate"
            onClick={onEscalate}
            title="Escalate to manual handling"
            style={{
              padding: '12px 16px',
              borderRadius: '16px',
              border: `1px solid ${theme.borderInner}`,
              background: 'transparent',
              color: theme.textMuted,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = theme.textPrimary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = theme.textMuted;
            }}
          >
            ⚠
          </button>

          <button
            data-action="dismiss"
            onClick={onDismiss}
            style={{
              padding: '12px 16px',
              borderRadius: '16px',
              border: `1px solid ${theme.borderInner}`,
              background: 'transparent',
              color: theme.textMuted,
              fontSize: '0.75rem',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              transition: 'color 150ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = theme.textPrimary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = theme.textMuted;
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
