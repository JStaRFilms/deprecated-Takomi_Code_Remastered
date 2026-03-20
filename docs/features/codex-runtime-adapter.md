# Codex Runtime Adapter

## Overview

The Codex runtime adapter is the Codex SDK integration layer for Takomi Code. It isolates session creation, runtime streaming, intervention handling, and failure normalization from the shared React UI and orchestration core.

Codex SDK is the primary runtime integration. This feature doc intentionally treats CLI-style execution as non-central.

## Package Ownership

- `packages/contracts`
  - run request and result types
  - runtime state events
  - intervention payloads
  - transcript part payloads
- `packages/runtime-codex`
  - `CodexRuntimeManager` contract
  - desktop-local adapter
  - remote adapter
  - event normalizer
  - run registry and ownership tracking
- `packages/orchestration`
  - run lifecycle coordination
  - child-run correlation
- `packages/persistence`
  - runtime event history
  - run restore and audit metadata
- `apps/desktop`
  - Electron main local runtime host

## Core Contract

`CodexRuntimeManager` must support:

- `startRun`
- `cancelRun`
- `pauseRun`
- `resumeRun`
- `injectGuidance`
- `rerouteRun`
- `replaceRun`
- `migrateRun`
- `subscribe`

Each implementation must emit the same normalized event stream regardless of whether the runtime is local desktop or remote.

## Event Model

The adapter normalizes Codex SDK output into product events such as:

- `run.starting`
- `run.streaming`
- `run.command.started`
- `run.command.completed`
- `run.file_changes.updated`
- `run.pause_requested`
- `run.paused`
- `run.resumed`
- `run.completed`
- `run.failed`
- `run.cancelled`

These events power:
- transcript rendering
- task graph state
- intervention affordances
- audit logging
- recovery flows

## Desktop and Browser Split

### Desktop

- Electron main hosts local Codex SDK sessions close to the workspace.
- The renderer requests runtime actions through typed IPC plus shared service abstractions.

### Browser

- The browser build uses a remote transport that exposes the same contract.
- The UI must not fork its runtime logic based on shell type once the contract is wired.

## Failure Handling

The adapter treats these as first-class failures:

- invalid runtime request payloads
- workspace access problems
- authentication or authorization failures
- transport disconnects
- non-recoverable Codex SDK session errors
- explicit cancellation

## Acceptance Notes

- No feature surface should call Codex SDK directly from React components.
- Runtime ownership must remain explicit so interventions always target the correct run.
- Desktop-local and remote/browser-safe runtime paths must remain shape-compatible for persistence and audit correlation.
