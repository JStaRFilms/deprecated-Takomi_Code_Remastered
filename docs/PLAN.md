# Takomi Code Delivery Plan vNext

## Summary

- This repository handoff resets Takomi Code around an Electron + React + TypeScript architecture with a browser-compatible build wherever possible.
- Codex SDK is the primary runtime integration. Local desktop and remote/browser-safe execution must share one runtime contract.
- Takomi remains the orchestration center: modes, workflows, task graphs, parent/child sessions, interventions, recovery flows, audit logs, and workspace awareness stay intact.
- The renderer is shared across Electron and web. Native powers remain isolated behind typed preload IPC.

## Program Rules

- Default orchestration mode is `vibe-orchestrator`.
- Use Takomi workflows for planning, design, build, review, and recovery.
- Same-workspace inheritance is the default for parent/child sessions.
- Worktree switching must remain explicit and visible.
- Browser support is required wherever native capabilities are not necessary.
- Performance work is not a polish phase; it is built into the first-pass architecture.

## Workstream Sequence

### Wave 0: Architecture Reset

- Rewrite the docs set so the new stack is the only target architecture.
- Freeze the baseline package map, runtime contract, IPC boundary, and browser fallback rules.
- Treat any existing WinUI/C# implementation details as non-authoritative.

### Wave 1: Monorepo Scaffold

- Create the TypeScript workspace foundation:
  - `apps/desktop`
  - `apps/web`
  - `packages/contracts`
  - `packages/orchestration`
  - `packages/runtime-codex`
  - `packages/persistence`
  - `packages/ui`
- Establish linting, formatting, shared TS config, and package build boundaries.
- Define contract-first event types for runtime, transcript, task graph, intervention, billing, Bags, and audit flows.

### Wave 2: Runtime and Native Boundary

- Implement the `CodexRuntimeManager` contract with:
  - a desktop-local Codex SDK host in Electron main
  - a remote/browser-safe transport for web and cloud execution
- Build preload-exposed typed IPC for:
  - workspace selection
  - Git status and worktree operations
  - secure storage
  - OS dialogs
  - local runtime lifecycle control
- Normalize runtime events into a shared stream model for transcript rendering and orchestration state updates.

### Wave 3: Shared Product Shell

- Build the shared React shell for:
  - project selector
  - workspace overview
  - session explorer
  - transcript workspace
  - task graph monitor
  - inspector and audit surfaces
  - settings, billing, and verification screens
- Ensure the desktop shell and browser app use the same UI packages and routing primitives where possible.
- Design for responsive degradation rather than maintaining a desktop-only layout assumption.

### Wave 4: Orchestration Features

- Implement project/workspace management.
- Implement multi-chat sessions with parent/child session trees.
- Implement orchestrator task graphs and background child execution.
- Implement live intervention flows and recovery actions.
- Implement durable persistence and restore.
- Implement Git/worktree visibility with same-workspace inheritance defaults.

### Wave 5: Integrations

- Implement Paystack billing and entitlements.
- Implement Bags token linkage and verification readiness.
- Preserve clear audit trails for all commercial and verification state changes.
- Keep fee sharing out of scope.

### Wave 6: Product Hardening

- Add performance instrumentation for streaming and task-tree updates.
- Add test coverage for orchestration rules, IPC contracts, runtime normalization, and browser-safe fallbacks.
- Run desktop and web verification passes.
- Prepare final packaging, onboarding, and handoff materials.

## Definition of Done

- Electron desktop and browser builds share one React/TypeScript product surface wherever native access is not required.
- Codex SDK runtime operations work through a single contract with desktop-local and remote/browser-safe implementations.
- Modes, workflows, parent/child sessions, interventions, recovery flows, and audit logs are fully represented in the UI and persistence model.
- Desktop-only features are clearly marked and use typed IPC.
- Same-workspace inheritance and explicit worktree switching are both functional.
- Streaming UI remains responsive under long transcripts, deep task trees, and high-frequency runtime events.
- All rewritten documentation remains internally consistent with the target architecture.
