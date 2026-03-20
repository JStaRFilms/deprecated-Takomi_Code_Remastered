import type { ReactElement } from 'react';
import type { ThemeTokens } from '../theme';

export interface FloatingComposerProps {
  readonly theme: ThemeTokens;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly mode?: 'send' | 'stop' | 'resume';
}

interface ComposerButtonStyle {
  readonly background: string;
  readonly color: string;
  readonly label: string;
}

/** Floating glass composer anchored to the bottom of the transcript center */
export function FloatingComposer({
  theme,
  placeholder = 'Ask Takomi to resolve something, explain code, or make changes…',
  disabled = false,
  mode = 'send',
}: FloatingComposerProps): ReactElement {
  const sendButtonStyle = (): ComposerButtonStyle => {
    switch (mode) {
      case 'stop':
        return {
          background: theme.hover,
          color: theme.textMuted,
          label: '■ Stop',
        };
      case 'resume':
        return {
          background: theme.warning,
          color: '#FFFFFF',
          label: '▶ Resume',
        };
      default:
        return {
          background: theme.accent,
          color: theme.textInverse,
          label: '↑',
        };
    }
  };

  const btn = sendButtonStyle();

  return (
    <div
      data-component="floating-composer"
      style={{
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '672px',
        padding: '0 24px',
        zIndex: 40,
      }}
    >
      <div
        style={{
          background: theme.glassBg,
          backdropFilter: `blur(${theme.glassBlur})`,
          border: `1px solid ${theme.glassBorder}`,
          borderRadius: '24px',
          padding: '8px',
          boxShadow: theme.shadowPremium,
        }}
      >
        {/* Textarea */}
        <div
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
            color: disabled ? theme.textMuted : theme.textPrimary,
            minHeight: '44px',
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {placeholder}
        </div>

        {/* Bottom toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px 4px',
          }}
        >
          {/* Left actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button style={{
              width: '32px', height: '32px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', background: 'transparent', color: theme.textMuted,
              cursor: 'pointer', fontSize: '12px',
            }}>
              📂
            </button>
            <button style={{
              width: '32px', height: '32px', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', background: 'transparent', color: theme.textMuted,
              cursor: 'pointer', fontSize: '12px',
            }}>
              📎
            </button>
            <div style={{ width: '1px', height: '16px', background: theme.borderInner, margin: '0 4px' }} />
            <button style={{
              padding: '4px 12px', borderRadius: '12px', border: 'none',
              background: 'transparent', color: theme.textMuted,
              cursor: 'pointer', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Search
            </button>
            <button style={{
              padding: '4px 12px', borderRadius: '12px', border: 'none',
              background: theme.accentSoft, color: theme.accent,
              cursor: 'pointer', fontSize: '11px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Think
            </button>
          </div>

          {/* Send/Stop/Resume */}
          <button
            style={{
              width: mode === 'send' ? '40px' : 'auto',
              height: '40px',
              padding: mode === 'send' ? '0' : '0 16px',
              borderRadius: '16px',
              border: 'none',
              background: btn.background,
              color: btn.color,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: mode === 'send' ? `0 0 15px ${theme.accentGlow}` : 'none',
            }}
          >
            {btn.label}
          </button>
        </div>
      </div>

      {/* Context line */}
      <p style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '10px',
        fontFamily: "'JetBrains Mono', monospace",
        color: theme.textMuted,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        Takomi v6 · 4.2k Context Available
      </p>
    </div>
  );
}
