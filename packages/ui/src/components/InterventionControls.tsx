import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';

export type InterventionActionKind = 'pause' | 'resume' | 'cancel' | 'guidance' | 'reroute' | 'replace' | 'migrate';

export interface InterventionActionDescriptor {
  readonly action: InterventionActionKind;
  readonly label: string;
  readonly icon: string;
  readonly variant: 'primary' | 'secondary' | 'danger';
  readonly enabled: boolean;
  readonly reason?: string;
}

export interface InterventionControlsProps {
  readonly theme: ThemeTokens;
  readonly sessionId: string;
  readonly runId?: string;
  readonly sessionStatus: string;
  readonly actions: readonly InterventionActionDescriptor[];
  readonly onAction: (action: InterventionActionKind) => void;
  readonly pendingAction?: InterventionActionKind;
}

const actionIcons: Record<InterventionActionKind, string> = {
  pause: '⏸',
  resume: '▶',
  cancel: '✕',
  guidance: '💬',
  reroute: '↪',
  replace: '⇄',
  migrate: '↗',
};

const actionLabels: Record<InterventionActionKind, string> = {
  pause: 'Pause',
  resume: 'Resume',
  cancel: 'Cancel',
  guidance: 'Inject Guidance',
  reroute: 'Reroute',
  replace: 'Replace',
  migrate: 'Migrate',
};

function createAction(
  action: InterventionActionKind,
  variant: InterventionActionDescriptor['variant'],
  enabled: boolean,
  reason?: string
): InterventionActionDescriptor {
  return {
    action,
    label: actionLabels[action],
    icon: actionIcons[action],
    variant,
    enabled,
    ...(reason !== undefined ? { reason } : {})
  };
}

/**
 * Derives the available intervention actions based on current session status.
 */
export function deriveInterventionActions(
  sessionStatus: string,
  runtimeTarget: 'desktop-local' | 'remote'
): InterventionActionDescriptor[] {
  const actions: InterventionActionDescriptor[] = [];

  const desktopOnly = runtimeTarget === 'remote'
    ? 'Not supported on remote runtime'
    : undefined;

  if (sessionStatus === 'running') {
    actions.push(
      createAction('pause', 'secondary', true),
      createAction('cancel', 'danger', true),
      createAction('guidance', 'primary', true),
      createAction('reroute', 'secondary', true),
      createAction('replace', 'secondary', true),
      createAction('migrate', 'secondary', !desktopOnly, desktopOnly)
    );
  } else if (sessionStatus === 'paused') {
    actions.push(
      createAction('resume', 'primary', true),
      createAction('cancel', 'danger', true),
      createAction('guidance', 'primary', true),
      createAction('reroute', 'secondary', true),
      createAction('replace', 'secondary', true),
      createAction('migrate', 'secondary', !desktopOnly, desktopOnly)
    );
  } else if (sessionStatus === 'idle') {
    actions.push(
      createAction('cancel', 'danger', true),
      createAction('migrate', 'secondary', !desktopOnly, desktopOnly)
    );
  } else if (sessionStatus === 'failed') {
    actions.push(
      createAction('replace', 'secondary', true)
    );
  }

  return actions;
}

/**
 * Inline-style intervention controls bar.
 * Renders available actions as compact buttons based on session state.
 */
export function InterventionControls({
  theme,
  sessionId: _sessionId,
  runId: _runId,
  sessionStatus,
  actions,
  onAction,
  pendingAction,
}: InterventionControlsProps): ReactElement {
  return (
    <div
      data-component="intervention-controls"
      data-session-status={sessionStatus}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '12px',
        background: theme.bgElevated,
        border: `1px solid ${theme.borderInner}`,
      }}
    >
      {actions.map((action) => {
        const isPending = pendingAction === action.action;
        const baseColor = action.variant === 'danger'
          ? theme.danger
          : action.variant === 'primary'
            ? theme.accent
            : theme.textSecondary;
        const softColor = action.variant === 'danger'
          ? theme.dangerSoft
          : action.variant === 'primary'
            ? theme.accentSoft
            : 'rgba(148, 163, 184, 0.10)';

        return (
          <button
            key={action.action}
            data-action={action.action}
            data-enabled={action.enabled}
            disabled={!action.enabled || isPending}
            onClick={() => action.enabled && onAction(action.action)}
            title={action.reason ?? action.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: `1px solid ${action.enabled ? (action.variant === 'danger' ? theme.danger + '33' : theme.borderInner) : theme.borderInner}`,
              background: isPending ? softColor : 'transparent',
              color: action.enabled ? baseColor : theme.textMuted,
              cursor: action.enabled ? 'pointer' : 'not-allowed',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.02em',
              transition: 'background 150ms ease, opacity 150ms ease',
              opacity: action.enabled ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (action.enabled) {
                (e.currentTarget as HTMLElement).style.background = softColor;
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isPending ? softColor : 'transparent';
            }}
          >
            <span style={{ fontSize: '0.85rem' }}>{action.icon}</span>
            <span>{action.label}</span>
            {isPending && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: baseColor,
                  animation: 'pulse 1.2s ease-in-out infinite',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
