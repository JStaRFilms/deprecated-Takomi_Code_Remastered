import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  AgentDefaultsStateSchema,
  BagsStateSchema,
  BillingStateSchema,
  RuntimeSettingsStateSchema,
  createAgentDefaultsViewedAuditEvent,
  createAutoVerificationToggledAuditEvent,
  createBagsAuditEvent,
  createCheckoutStartedAuditEvent,
  createEntitlementActivatedAuditEvent,
} from '../packages/contracts/src/index.ts';
import { createInMemoryPersistenceAdapter } from '../packages/persistence/src/index.ts';
import {
  SettingsView,
  getTheme,
  mockAgentDefaultsState,
  mockBagsState,
  mockBillingState,
  mockRuntimeSettingsState,
} from '../packages/ui/src/index.ts';

globalThis.React = React;

const adapter = createInMemoryPersistenceAdapter();

assert.ok(adapter.billing, 'In-memory adapter should expose a billing store');
assert.ok(adapter.bags, 'In-memory adapter should expose a Bags store');
assert.ok(adapter.runtimeSettings, 'In-memory adapter should expose a runtime settings store');

RuntimeSettingsStateSchema.parse(mockRuntimeSettingsState);
BillingStateSchema.parse(mockBillingState);
BagsStateSchema.parse(mockBagsState);
AgentDefaultsStateSchema.parse(mockAgentDefaultsState);

await adapter.runtimeSettings.saveState(mockRuntimeSettingsState);
if (mockBillingState.activeCheckout) {
  await adapter.billing.saveCheckout(mockBillingState.activeCheckout);
}
if (mockBillingState.entitlement) {
  await adapter.billing.saveEntitlement(mockBillingState.entitlement);
}
if (mockBagsState.linkage) {
  await adapter.bags.saveLinkage(mockBagsState.linkage);
}
if (mockBagsState.latestReadiness) {
  await adapter.bags.saveReadiness(mockBagsState.latestReadiness);
}

const savedRuntime = await adapter.runtimeSettings.getState(mockRuntimeSettingsState.workspaceId);
const savedBilling = await adapter.billing.getState(mockBillingState.workspaceId);
const savedBags = await adapter.bags.getState(mockBagsState.workspaceId);

assert.equal(savedRuntime?.selectedTarget, 'desktop-local');
assert.equal(savedBilling?.entitlement?.status, 'active');
assert.equal(savedBags?.latestReadiness?.ready, true);

const auditEvents = [
  createAutoVerificationToggledAuditEvent(mockRuntimeSettingsState.workspaceId, true),
  createAgentDefaultsViewedAuditEvent(mockAgentDefaultsState),
];

if (mockBillingState.activeCheckout) {
  auditEvents.push(createCheckoutStartedAuditEvent(mockBillingState.activeCheckout));
}
if (mockBillingState.entitlement) {
  auditEvents.push(createEntitlementActivatedAuditEvent(mockBillingState.entitlement));
}
if (mockBagsState.linkage) {
  auditEvents.push(
    createBagsAuditEvent('bags.token_linked', mockBagsState.workspaceId, mockBagsState.linkage.id, {
      tokenLabel: mockBagsState.linkage.tokenLabel,
    })
  );
}
if (mockBagsState.latestReadiness) {
  auditEvents.push(
    createBagsAuditEvent('bags.verification_checked', mockBagsState.workspaceId, mockBagsState.latestReadiness.id, {
      ready: mockBagsState.latestReadiness.ready,
      summary: mockBagsState.latestReadiness.summary,
    })
  );
}

await adapter.auditEvents.append(auditEvents);

assert.equal(await adapter.auditEvents.countByKind('settings.auto_verification_toggled'), 1);
assert.equal(await adapter.auditEvents.countByKind('settings.agent_defaults_viewed'), 1);
assert.equal(await adapter.auditEvents.countByKind('billing.checkout_started'), 1);
assert.equal(await adapter.auditEvents.countByKind('billing.entitlement_activated'), 1);
assert.equal(await adapter.auditEvents.countByKind('bags.token_linked'), 1);
assert.equal(await adapter.auditEvents.countByKind('bags.verification_checked'), 1);

const html = renderToStaticMarkup(
  SettingsView({
    theme: getTheme('dark'),
    runtime: mockRuntimeSettingsState,
    billing: mockBillingState,
    bags: mockBagsState,
    agentDefaults: mockAgentDefaultsState,
  })
);

assert.match(html, /Runtime Target Settings/);
assert.match(html, /Paystack Entitlements/);
assert.match(html, /Bags Linkage/);
assert.match(html, /Takomi Default Agent Definitions/);

console.log('Settings, billing, and Bags verification passed.');
