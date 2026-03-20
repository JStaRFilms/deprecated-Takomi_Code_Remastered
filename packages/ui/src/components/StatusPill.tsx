import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';

export type StatusVariant = 'running' | 'idle' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface StatusPillProps {
  readonly theme: ThemeTokens;
  readonly variant: StatusVariant;
  readonly label?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; fg: string; border: string; pulseDot?: boolean }> = {
  running: {
    bg: 'rgba(250, 204, 21, 0.10)',
    fg: '#FACC15',
    border: 'rgba(250, 204, 21, 0.20)',
    pulseDot: true,
  },
  idle: {
    bg: 'rgba(148, 163, 184, 0.10)',
    fg: '#94A3B8',
    border: 'rgba(148, 163, 184, 0.20)',
  },
  paused: {
    bg: 'rgba(245, 158, 11, 0.10)',
    fg: '#F59E0B',
    border: 'rgba(245, 158, 11, 0.20)',
  },
  completed: {
    bg: 'rgba(16, 185, 129, 0.10)',
    fg: '#10B981',
    border: 'rgba(16, 185, 129, 0.20)',
  },
  failed: {
    bg: 'rgba(239, 68, 68, 0.10)',
    fg: '#EF4444',
    border: 'rgba(239, 68, 68, 0.20)',
  },
  cancelled: {
    bg: 'rgba(148, 163, 184, 0.10)',
    fg: '#94A3B8',
    border: 'rgba(148, 163, 184, 0.20)',
  },
};

/** Reusable compact status indicator pill */
export function StatusPill({
  theme: _theme,
  variant,
  label,
}: StatusPillProps): ReactElement {
  const style = variantStyles[variant];
  const displayLabel = label ?? variant.charAt(0).toUpperCase() + variant.slice(1);

  return (
    <span
      data-component="status-pill"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: '2px 10px',
        borderRadius: '9999px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
        lineHeight: 1.4,
      }}
    >
      {style.pulseDot ? (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: style.fg,
            display: 'inline-block',
            /* Note: animation would require CSS keyframes; kept as static glow for type-check parity */
            boxShadow: `0 0 6px ${style.fg}`,
          }}
        />
      ) : (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: style.fg,
            display: 'inline-block',
          }}
        />
      )}
      {displayLabel}
    </span>
  );
}
