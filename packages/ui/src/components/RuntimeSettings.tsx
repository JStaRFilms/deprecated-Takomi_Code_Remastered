import React, { type ReactElement } from 'react';
import type { RuntimeSettingsState } from '@takomi/contracts';
import type { ThemeTokens } from '../theme';

export interface RuntimeSettingsProps {
  readonly theme: ThemeTokens;
  readonly state: RuntimeSettingsState;
  readonly onSelectTarget?: ((target: RuntimeSettingsState['selectedTarget']) => void) | undefined;
  readonly onToggleAutoVerification?: ((enabled: boolean) => void) | undefined;
}

export function RuntimeSettings({
  theme,
  state,
  onSelectTarget,
  onToggleAutoVerification,
}: RuntimeSettingsProps): ReactElement {
  return (
    <section style={sectionStyle(theme)}>
      <SectionHeader
        theme={theme}
        eyebrow="Runtime"
        title="Runtime Target Settings"
        description="Select where Takomi should run and inspect the capability surface honestly."
      />

      <div style={gridStyle}>
        {state.options.map((option) => {
          const isSelected = option.id === state.selectedTarget;
          return (
            <button
              key={option.id}
              onClick={() => option.available && onSelectTarget?.(option.id)}
              disabled={!option.available}
              style={{
                textAlign: 'left',
                padding: '18px',
                borderRadius: '18px',
                border: `1px solid ${isSelected ? theme.accent : theme.borderInner}`,
                background: isSelected ? theme.accentSoft : theme.bgMain,
                color: theme.textPrimary,
                cursor: option.available ? 'pointer' : 'not-allowed',
                opacity: option.available ? 1 : 0.6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                <strong>{option.label}</strong>
                <span style={pillStyle(theme, option.available ? theme.success : theme.warning)}>
                  {option.available ? option.transport : 'Unavailable'}
                </span>
              </div>
              <p style={bodyStyle(theme)}>{option.description}</p>
              {option.disabledReason && (
                <div style={{ color: theme.warning, fontSize: '12px' }}>{option.disabledReason}</div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ ...subCardStyle(theme), display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <div>
            <div style={labelStyle(theme)}>Automatic verification</div>
            <div style={helperStyle(theme)}>
              Trigger readiness checks when the runtime target changes.
            </div>
          </div>
          <button
            onClick={() => onToggleAutoVerification?.(!state.autoVerificationEnabled)}
            style={toggleStyle(theme, state.autoVerificationEnabled)}
          >
            {state.autoVerificationEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        <div>
          <div style={labelStyle(theme)}>Current availability</div>
          <div style={helperStyle(theme)}>
            {state.availability.shellLabel} · {state.availability.connected ? 'Connected' : 'Offline'} · {state.availability.transport}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {state.availability.capabilities.map((capability) => (
            <div
              key={capability.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: theme.bgMain,
                border: `1px solid ${theme.borderInner}`,
              }}
            >
              <div>
                <div style={labelStyle(theme)}>{capability.label}</div>
                {capability.detail && <div style={helperStyle(theme)}>{capability.detail}</div>}
              </div>
              <span style={pillStyle(theme, capability.available ? theme.success : theme.warning)}>
                {capability.mode}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const gridStyle = {
  display: 'grid',
  gap: '14px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
} as const;

export const sectionStyle = (theme: ThemeTokens) =>
  ({
    display: 'grid',
    gap: '18px',
    padding: '24px',
    borderRadius: '24px',
    background: theme.bgElevated,
    border: `1px solid ${theme.borderInner}`,
  }) as const;

export const subCardStyle = (theme: ThemeTokens) =>
  ({
    padding: '18px',
    borderRadius: '18px',
    background: theme.bgSidebar,
    border: `1px solid ${theme.borderInner}`,
  }) as const;

export const labelStyle = (theme: ThemeTokens) =>
  ({
    color: theme.textPrimary,
    fontWeight: 700,
    fontSize: '13px',
  }) as const;

export const helperStyle = (theme: ThemeTokens) =>
  ({
    color: theme.textMuted,
    fontSize: '12px',
    lineHeight: 1.5,
    marginTop: '4px',
  }) as const;

export const bodyStyle = (theme: ThemeTokens) =>
  ({
    color: theme.textSecondary,
    fontSize: '13px',
    lineHeight: 1.6,
    margin: '8px 0 0 0',
  }) as const;

export const pillStyle = (theme: ThemeTokens, color: string) =>
  ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 10px',
    borderRadius: '999px',
    background: `${color}22`,
    color,
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  }) as const;

const toggleStyle = (theme: ThemeTokens, enabled: boolean) =>
  ({
    padding: '10px 14px',
    borderRadius: '14px',
    border: `1px solid ${enabled ? theme.accent : theme.borderInner}`,
    background: enabled ? theme.accentSoft : theme.bgMain,
    color: enabled ? theme.accent : theme.textMuted,
    fontWeight: 700,
    cursor: 'pointer',
  }) as const;

interface SectionHeaderProps {
  readonly theme: ThemeTokens;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
}

export function SectionHeader({
  theme,
  eyebrow,
  title,
  description,
}: SectionHeaderProps): ReactElement {
  return (
    <div>
      <div style={{ color: theme.accent, fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {eyebrow}
      </div>
      <h2 style={{ margin: '8px 0 6px 0', fontSize: '20px', color: theme.textPrimary }}>{title}</h2>
      <p style={{ margin: 0, color: theme.textSecondary, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}
