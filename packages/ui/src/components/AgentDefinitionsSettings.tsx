import React, { type ReactElement } from 'react';
import type { AgentDefaultsState } from '@takomi/contracts';
import type { ThemeTokens } from '../theme';
import { SectionHeader, helperStyle, labelStyle, pillStyle, sectionStyle, subCardStyle } from './RuntimeSettings';

export interface AgentDefinitionsSettingsProps {
  readonly theme: ThemeTokens;
  readonly state: AgentDefaultsState;
}

export function AgentDefinitionsSettings({
  theme,
  state,
}: AgentDefinitionsSettingsProps): ReactElement {
  return (
    <section style={sectionStyle(theme)}>
      <SectionHeader
        theme={theme}
        eyebrow="Agents"
        title="Takomi Default Agent Definitions"
        description="Keep the shipped `.agent/Takomi-Agents` defaults visible and explicit while preparing for future overrides."
      />

      <div style={{ ...subCardStyle(theme), display: 'grid', gap: '10px' }}>
        <div style={labelStyle(theme)}>Defaults relationship</div>
        <div style={helperStyle(theme)}>Shipped defaults path: {state.configurability.shippedDefaultsPath}</div>
        <div style={helperStyle(theme)}>
          Workspace overrides: {state.configurability.workspaceOverridesEnabled ? 'enabled' : 'not yet enabled'} · User overrides: {state.configurability.userOverridesEnabled ? 'enabled' : 'not yet enabled'}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '10px' }}>
        {state.bundle.sources.map((source) => (
          <div key={`${source.kind}:${source.path}`} style={{ ...subCardStyle(theme), background: theme.bgMain }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={labelStyle(theme)}>{source.label ?? source.kind}</div>
                <div style={helperStyle(theme)}>{source.path}</div>
              </div>
              <span style={pillStyle(theme, theme.accent)}>{source.kind}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {state.bundle.modes.map((mode) => (
          <div key={mode.slug} style={{ ...subCardStyle(theme), background: theme.bgMain }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
              <div>
                <div style={labelStyle(theme)}>{mode.name}</div>
                <div style={helperStyle(theme)}>{mode.description}</div>
              </div>
              <span style={pillStyle(theme, mode.enabled ? theme.success : theme.warning)}>
                {mode.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {mode.permissions.map((permission, index) => (
                <span key={`${mode.slug}-${permission.capability}-${index}`} style={pillStyle(theme, theme.textMuted)}>
                  {permission.capability}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
