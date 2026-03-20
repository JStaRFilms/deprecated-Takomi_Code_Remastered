# Solution Scaffold Decisions

## Overview

This document records the scaffold decisions for the Takomi Code reset architecture. These are the baseline decisions another agent should use when building the fresh Electron + React + TypeScript repository.

## Decision Summary

| ID | Decision | Rationale | Consequence |
|---|---|---|---|
| SD-001 | Use a TypeScript monorepo with separate desktop and web apps plus shared packages. | The product must support both Electron and browser delivery without duplicating feature code. | All domain logic, contracts, and most UI code live outside app-specific entrypoints. |
| SD-002 | Use Electron only for shell, native access, and local runtime hosting. | Native powers are required, but the renderer must remain browser-compatible. | Electron main/preload own filesystem, Git, secure storage, OS dialogs, and local runtime operations. |
| SD-003 | Use React for all product UI surfaces. | The desktop and browser versions need one shared interaction model. | UI work happens in shared packages and is mounted by both `apps/desktop` and `apps/web`. |
| SD-004 | Make Codex SDK the primary runtime integration behind a `CodexRuntimeManager` contract. | Takomi needs one execution model across desktop-local and remote/browser-safe runtime paths. | Runtime adapters normalize Codex SDK session events into shared product events. |
| SD-005 | Use typed IPC contracts exposed through preload only. | Renderer security and portability both depend on a strict native boundary. | No direct Node.js access in the renderer; all desktop-only features go through contract-defined bridges. |
| SD-006 | Store append-only event history plus derived read models. | Streaming transcripts, interventions, and auditability need durable history without slow restores. | Persistence packages manage both raw event logs and optimized restore views. |
| SD-007 | Preserve same-workspace inheritance by default and make worktree switching explicit. | This is core Takomi behavior and prevents silent context drift in parent/child sessions. | Session creation and worktree mutation logic must enforce inheritance rules consistently. |
| SD-008 | Treat browser support as first-class but capability-aware. | The user expects a browser-compatible build wherever possible. | Every native feature must define a browser fallback, remote equivalent, or explicit unavailable state. |

## Target Scaffold

### Applications

- `apps/desktop`
  - `src/main` for Electron bootstrap, native services, and local runtime hosting
  - `src/preload` for typed IPC bridge exposure
  - `src/renderer` for the shared React app mount
- `apps/web`
  - web entrypoint
  - web routing and browser-safe service wiring

### Packages

- `packages/contracts`
- `packages/orchestration`
- `packages/runtime-codex`
- `packages/persistence`
- `packages/ui`

Optional expansion packages can be added later for billing, Bags, analytics, or testing, but they should still follow the contract-first boundary model.

## Technical Choices

- **Language:** TypeScript with strict compiler settings
- **UI:** React
- **Desktop Shell:** Electron
- **Build Tooling:** workspace-friendly TypeScript build plus app-specific bundling
- **Validation:** runtime schema validation for IPC, persistence payloads, and external service payloads
- **Testing:** unit tests for orchestration and runtime packages, browser tests for shared UI, desktop integration tests for native bridges

## Persistence Baseline

- Desktop persistence should use a durable local store suited to event history, read models, and audit logs.
- Browser persistence should use browser-safe storage for cached state and remote sync handoff where needed.
- Artifact files remain associated with a workspace and referenced through contracts instead of hard-coded UI assumptions.

## Runtime Baseline

- Desktop-local execution lives in Electron main and hosts Codex SDK sessions close to the local workspace.
- Browser execution connects to a remote service that exposes the same run, event, and intervention contract.
- Runtime event normalization happens once in the runtime package, not separately in each UI surface.

## UX Baseline

- The shell must feel crafted, fast, and non-generic.
- Task trees, transcript streaming, and audit views must scale without blocking input.
- Desktop-only powers should feel integrated, but the shared React experience remains the primary product surface.
