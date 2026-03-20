# Bags Integration and Verification

## Goal

Provide a clean Bags flow for token linkage, verification readiness checks, visible project readiness state, and auditable verification events across both Electron desktop and browser-safe product surfaces.

## Package Ownership

- `packages/contracts`
  - Bags token payloads
  - readiness status shapes
  - audit event schemas
- `packages/persistence`
  - workspace-scoped Bags metadata
  - verification status history
- `packages/ui`
  - Bags settings and readiness surfaces
- `apps/desktop`
  - optional secure local token storage through typed IPC
- `apps/web`
  - remote token-linking and readiness-check flows

## Product Rules

- Bags scope is limited to token linkage, API usage, verification readiness, and auditability.
- Fee sharing, payouts, and marketplace revenue logic remain out of scope.
- The renderer never handles secure token storage directly.

## Desktop and Browser Split

### Desktop

- Token entry can be stored through Electron main using a typed secure-storage bridge.
- The renderer requests linkage and readiness checks through shared service contracts.

### Browser

- Token linkage must use a remote-backed path or a session-scoped flow.
- If secure local persistence is unavailable, the UI must explain that the token is being handled remotely or is not persisted locally.

## Data Flow

- User links a Bags token to a workspace.
- The shared Bags service validates the payload and persists workspace-scoped metadata.
- The user requests readiness verification.
- A Bags integration client checks readiness and stores the result.
- Audit events are appended for linkage and verification outcomes.

## Audit Events

- `bags.token_linked`
- `bags.verification_checked`
- `bags.verification_failed`

## Acceptance Notes

- Bags status must be visible in the shared project/workspace experience.
- The same workspace correlation ids used elsewhere in Takomi must apply here.
- Browser and desktop must present the same feature language even when the storage path differs.
