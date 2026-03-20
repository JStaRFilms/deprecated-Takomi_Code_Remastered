# Cloud Runtime

## Goal

Allow Takomi Code to switch between desktop-local runtime hosting and remote/browser-safe execution without changing the shared runtime contract, transcript model, task graph behavior, or audit-event shape.

## Package Ownership

- `packages/contracts`
  - runtime target enum
  - run request and result contracts
  - normalized runtime events
- `packages/runtime-codex`
  - runtime target routing
  - remote transport client
  - event normalization
- `packages/persistence`
  - workspace runtime preference
  - run-state restore records
- `packages/ui`
  - runtime selection and status surfaces
- `apps/desktop`
  - optional local runtime host in Electron main
- `apps/web`
  - remote runtime connection path

## Runtime Targets

- `desktop-local`
  - available only in Electron
  - runs against a local workspace through Electron main
- `remote`
  - available in browser and desktop
  - uses a remote service that owns Codex SDK execution

## Data Flow

- The user selects a runtime target for the current workspace.
- A shared runtime router resolves the correct runtime manager.
- The chosen runtime emits normalized events into the transcript store, task graph, and audit log.
- Interventions route back to the runtime that owns the active run, even if the preferred workspace target changes later.

## Product Rules

- The renderer does not care whether a run is local or remote once the normalized event stream begins.
- Runtime target changes are workspace-aware and auditable.
- Cloud and local paths must support the same intervention vocabulary wherever the underlying runtime allows it.

## Acceptance Notes

- Browser users must be able to execute remote runs without any desktop dependency.
- Desktop users must be able to choose remote execution when local runtime hosting is unavailable or undesirable.
- Runtime target selection must be visible in the shell header, inspector, and audit log.
