import React, { type ReactElement } from 'react';
import type { BagsState } from '@takomi/contracts';
import type { ThemeTokens } from '../theme';
import { SectionHeader, helperStyle, labelStyle, pillStyle, sectionStyle, subCardStyle } from './RuntimeSettings';

export interface BagsSettingsProps {
  readonly theme: ThemeTokens;
  readonly state: BagsState;
  readonly onLinkToken?: (() => void) | undefined;
  readonly onUnlinkToken?: (() => void) | undefined;
  readonly onCheckReadiness?: (() => void) | undefined;
}

export function BagsSettings({
  theme,
  state,
  onLinkToken,
  onUnlinkToken,
  onCheckReadiness,
}: BagsSettingsProps): ReactElement {
  return (
    <section style={sectionStyle(theme)}>
      <SectionHeader
        theme={theme}
        eyebrow="Verification"
        title="Bags Linkage & Readiness"
        description="Link a Bags token, inspect readiness checks, and keep the documented verification path visible."
      />

      <div style={{ ...subCardStyle(theme), display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <div>
            <div style={labelStyle(theme)}>Linked token</div>
            <div style={helperStyle(theme)}>
              {state.linkage ? `${state.linkage.tokenLabel} · ${state.linkage.tokenMasked}` : 'No token linked yet.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => onLinkToken?.()} style={primaryButtonStyle(theme)}>
              Link token
            </button>
            <button onClick={() => onUnlinkToken?.()} style={secondaryButtonStyle(theme)}>
              Unlink
            </button>
          </div>
        </div>
      </div>

      {state.latestReadiness && (
        <div style={{ ...subCardStyle(theme), display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
            <div>
              <div style={labelStyle(theme)}>Latest readiness</div>
              <div style={helperStyle(theme)}>{state.latestReadiness.summary}</div>
            </div>
            <span style={pillStyle(theme, state.latestReadiness.ready ? theme.success : theme.warning)}>
              {state.latestReadiness.ready ? 'Ready' : 'Pending'}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            {state.latestReadiness.checks.map((check) => (
              <div key={check.key} style={{ ...subCardStyle(theme), background: theme.bgMain }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={labelStyle(theme)}>{check.label}</div>
                    {check.detail && <div style={helperStyle(theme)}>{check.detail}</div>}
                  </div>
                  <span style={pillStyle(theme, check.ok ? theme.success : theme.warning)}>
                    {check.ok ? 'Pass' : 'Needs work'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => onCheckReadiness?.()} style={primaryButtonStyle(theme)}>
            Run readiness check
          </button>
        </div>
      )}
    </section>
  );
}

const primaryButtonStyle = (theme: ThemeTokens) =>
  ({
    padding: '10px 14px',
    borderRadius: '14px',
    border: 'none',
    background: theme.accent,
    color: theme.bgApp,
    fontWeight: 700,
    cursor: 'pointer',
  }) as const;

const secondaryButtonStyle = (theme: ThemeTokens) =>
  ({
    padding: '10px 14px',
    borderRadius: '14px',
    border: `1px solid ${theme.borderInner}`,
    background: theme.bgMain,
    color: theme.textPrimary,
    fontWeight: 700,
    cursor: 'pointer',
  }) as const;
