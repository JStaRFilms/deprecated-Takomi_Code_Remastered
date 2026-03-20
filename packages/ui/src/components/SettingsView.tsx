import React, { type ReactElement } from 'react';
import type {
  AgentDefaultsState,
  BagsState,
  BillingState,
  RuntimeSettingsState,
} from '@takomi/contracts';
import type { ThemeTokens } from '../theme';
import { RuntimeSettings } from './RuntimeSettings';
import { BillingSettings } from './BillingSettings';
import { BagsSettings } from './BagsSettings';
import { AgentDefinitionsSettings } from './AgentDefinitionsSettings';

export interface SettingsViewProps {
  readonly theme: ThemeTokens;
  readonly runtime: RuntimeSettingsState;
  readonly billing: BillingState;
  readonly bags: BagsState;
  readonly agentDefaults: AgentDefaultsState;
}

export function SettingsView({
  theme,
  runtime,
  billing,
  bags,
  agentDefaults,
}: SettingsViewProps): ReactElement {
  return (
    <div
      data-component="settings-view"
      style={{
        display: 'grid',
        gap: '18px',
        padding: '28px',
        background: theme.bgMain,
      }}
    >
      <RuntimeSettings theme={theme} state={runtime} />
      <BillingSettings theme={theme} state={billing} />
      <BagsSettings theme={theme} state={bags} />
      <AgentDefinitionsSettings theme={theme} state={agentDefaults} />
    </div>
  );
}
