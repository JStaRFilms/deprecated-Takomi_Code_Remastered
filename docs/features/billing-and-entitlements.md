# Billing and Entitlements

## Goal

Provide a Paystack-oriented billing flow that supports checkout initiation, pending reference visibility, entitlement activation, and durable auditability in the shared React product surface.

## Package Ownership

- `packages/contracts`
  - entitlement records
  - checkout session payloads
  - billing audit events
- `packages/persistence`
  - local cache of entitlement state
  - pending checkout references
- `packages/ui`
  - billing settings and entitlement displays
- `apps/desktop`
  - external-link or system-browser checkout launch through typed IPC
- `apps/web`
  - browser-native checkout redirect flow

## Product Rules

- Billing state is workspace-aware where needed but must remain cleanly isolated from transcript and orchestration rendering.
- The billing success path must be explicit and auditable.
- Fee sharing does not belong in this feature scope.

## Desktop and Browser Split

### Desktop

- Checkout launch may open externally through Electron main.
- Pending checkout state and return flows are restored into the shared renderer.

### Browser

- Checkout launch happens through standard web navigation or a dedicated billing flow.
- Entitlement refresh uses the same shared billing service contract.

## Data Flow

- User enters billing identity details and starts checkout.
- The billing service creates a checkout reference and URL.
- The UI stores the pending reference and surfaces status until confirmation.
- On success, entitlement state is activated and cached for restore.
- Audit events capture checkout start, confirmation, and failure states.

## Audit Events

- `billing.checkout_started`
- `billing.entitlement_activated`
- `billing.checkout_failed`

## Acceptance Notes

- Desktop and browser must show the same entitlement and pending-checkout concepts.
- The success path must restore cleanly after reload.
- Billing audit events must be queryable alongside runtime and verification events without overloading session identity.
