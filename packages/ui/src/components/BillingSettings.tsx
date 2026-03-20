import React, { type ReactElement } from 'react';
import type { BillingPlanId, BillingState } from '@takomi/contracts';
import type { ThemeTokens } from '../theme';
import { SectionHeader, bodyStyle, helperStyle, labelStyle, pillStyle, sectionStyle, subCardStyle } from './RuntimeSettings';

export interface BillingSettingsProps {
  readonly theme: ThemeTokens;
  readonly state: BillingState;
  readonly onStartCheckout?: ((planId: BillingPlanId) => void) | undefined;
}

export function BillingSettings({
  theme,
  state,
  onStartCheckout,
}: BillingSettingsProps): ReactElement {
  return (
    <section style={sectionStyle(theme)}>
      <SectionHeader
        theme={theme}
        eyebrow="Billing"
        title="Paystack Entitlements"
        description="Track the current entitlement state and the documented Paystack success path."
      />

      <div style={{ ...subCardStyle(theme), display: 'grid', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <div>
            <div style={labelStyle(theme)}>Current entitlement</div>
            <div style={helperStyle(theme)}>
              {state.entitlement
                ? `${state.entitlement.planId} · ${state.entitlement.status}`
                : 'No active entitlement recorded yet.'}
            </div>
          </div>
          {state.entitlement && (
            <span style={pillStyle(theme, state.entitlement.status === 'active' ? theme.success : theme.warning)}>
              {state.entitlement.status}
            </span>
          )}
        </div>

        {state.activeCheckout && (
          <div style={{ ...subCardStyle(theme), background: theme.bgMain }}>
            <div style={labelStyle(theme)}>Pending checkout</div>
            <div style={helperStyle(theme)}>
              Reference: {state.activeCheckout.reference}
              {state.activeCheckout.checkoutUrl ? ` · ${state.activeCheckout.checkoutUrl}` : ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {state.plans.map((plan) => (
          <div key={plan.id} style={{ ...subCardStyle(theme), background: theme.bgMain }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div style={labelStyle(theme)}>{plan.label}</div>
              <span style={pillStyle(theme, theme.accent)}>{plan.monthlyPriceLabel}</span>
            </div>
            <p style={bodyStyle(theme)}>{plan.description}</p>
            <button
              onClick={() => onStartCheckout?.(plan.id)}
              style={{
                marginTop: '8px',
                padding: '10px 14px',
                borderRadius: '14px',
                border: `1px solid ${theme.borderInner}`,
                background: theme.bgElevated,
                color: theme.textPrimary,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Start Paystack checkout
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
