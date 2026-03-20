# Coding Guidelines

## Stack Rules

- Use TypeScript across Electron main, preload, shared packages, and React renderer code.
- Use React for all product UI. The Electron desktop app and browser build must share the same feature components wherever possible.
- Treat Codex SDK as the primary runtime integration. Do not make Codex CLI the architectural center of the product.
- Keep the renderer browser-safe: no direct Node.js imports, no filesystem access, and no process control from React components.
- Use strict typing at all boundaries. Shared contracts should live in a dedicated package and validate payloads with runtime schemas where appropriate.

## Package Boundary Rules

- Keep the workspace split into clear TypeScript-first packages, with a minimum expectation of:
  - `apps/desktop` for Electron main, preload, and desktop bootstrapping
  - `apps/web` for the browser-compatible shell
  - `packages/contracts` for shared types, schemas, IPC payloads, and event envelopes
  - `packages/orchestration` for Takomi modes, workflows, task graphs, interventions, recovery logic, and parent/child session rules
  - `packages/runtime-codex` for Codex SDK session management and runtime event normalization
  - `packages/persistence` for repositories and storage adapters
  - `packages/ui` for design tokens, layouts, and feature surfaces
- Renderer packages may depend on shared contracts, orchestration logic, and browser-safe persistence abstractions.
- Only Electron main/preload packages may depend on Node.js or operating-system APIs.
- Desktop-only adapters must not leak platform-specific types into shared React packages.

## IPC Rules

- All Electron renderer-to-native communication must go through preload-exposed, typed IPC methods.
- IPC channels must be defined centrally, documented, and versioned with the shared contract package.
- Validate IPC inputs and outputs at the boundary. Treat preload as a security boundary, not just a convenience layer.
- Never call `ipcRenderer.invoke` directly from feature components. Route native actions through shared service abstractions.

## Codex SDK Rules

- Model runtime operations around a `CodexRuntimeManager` contract, not ad hoc SDK calls from UI code.
- Normalize Codex SDK events into a product event stream that supports transcript rendering, task-graph updates, audit logging, and recovery.
- Support both desktop-local runtime hosting and remote/browser-safe runtime transport behind the same contract.
- Make pause, resume, cancel, reroute, replace, migrate, and guidance injection first-class operations in the runtime and orchestration layers.

## Orchestration Rules

- Takomi orchestration remains the product center: modes, workflows, task graphs, parent/child sessions, and recovery flows are not optional add-ons.
- Same-workspace inheritance is the default for child sessions; worktree reassignment must always be explicit.
- Parent/child relationships, artifacts, interventions, and audit events must keep stable correlation ids across storage, runtime, and UI layers.
- Mode and workflow files are runtime inputs, not hard-coded behavior.

## UX and Performance Rules

- Optimize for low-latency streaming. Transcript updates, task-tree changes, and audit tails must render incrementally without blocking typing or navigation.
- Keep expensive computation off the render path. Derive heavy task-graph and transcript views in selectors, workers, or stores rather than inline React rendering.
- Use virtualization for long transcripts, audit tables, and deep session trees where necessary.
- Favor a calm, highly legible interface with strong hierarchy, purposeful motion, and visible state.
- The product must feel designed from scratch, not like a generic admin dashboard or a thin desktop wrapper around a website.

## Data and Audit Rules

- Every run, intervention, entitlement change, verification change, workspace change, and runtime failure must produce a structured audit event.
- Persist transcript data as append-only event history plus materialized read models where it improves performance or restore speed.
- Keep billing, Bags, and secret-handling logic isolated from presentation components.
- Clearly distinguish desktop-only data paths from browser-safe or remote-backed paths.

## Quality Rules

- Prefer small modules with explicit responsibilities and named contracts.
- Add tests for orchestration logic, runtime event normalization, persistence adapters, IPC contracts, and session inheritance behavior.
- Verify both desktop and browser-safe behavior for shared features.
- Avoid hidden global mutable state. Shared stores should have clear ownership and teardown semantics.
- If a feature cannot work in the browser, document the fallback and render a deliberate product state instead of failing silently.

## Scope Rules

- No fee-sharing implementation in v0.001.
- No unapproved scope expansion beyond the PRD MUS features.
- Preserve same-workspace defaults while allowing explicit Git worktree switching.
- Do not let desktop-only convenience features drive shared architecture decisions for the whole product.
