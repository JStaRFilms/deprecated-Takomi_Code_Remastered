# Takomi V6 UI Implementation Plan

**Target Agent:** Principal Electron + React + TypeScript architect  
**Objective:** Implement the Takomi V6 shared renderer for both Electron desktop and browser-compatible delivery, using Codex SDK as the primary runtime integration and typed IPC for all native desktop powers.

## Mission Parameters

This is a shared-renderer build, not a desktop-only shell port. Do not build the Electron app first and “webify” it later. Establish shared UI, state, runtime contracts, and performance behavior from day one.

### Sources of Truth

1. `docs/design/Design_Brief.md`
2. `docs/design/design_direction.md`
3. `docs/architecture/system_architecture.md`
4. `docs/architecture/solution_scaffold_decisions.md`
5. `docs/tasks/orchestrator-sessions/orch-20260315-173000/codex_sdk_state_map.md` if it is still useful for event naming and run-state mapping

## Phase 1: Workspace and Contracts

### 1. Monorepo Foundation

- Create `apps/desktop` and `apps/web`.
- Create shared packages for contracts, orchestration, runtime, persistence, and UI.
- Lock strict TypeScript configuration and shared linting before feature work starts.

### 2. Shared Contracts

- Define transcript item types, turn part types, task graph entities, intervention payloads, audit event envelopes, workspace metadata, and runtime state events in `packages/contracts`.
- Define typed IPC channels for:
  - workspace open/connect
  - Git status
  - worktree create/switch
  - secure token storage
  - local runtime control
  - OS dialogs

### 3. Runtime Interface

- Introduce a `CodexRuntimeManager` contract.
- Implement a desktop-local adapter in Electron main.
- Implement a remote/browser-safe adapter for web delivery and optional desktop cloud mode.
- Normalize all runtime output into the same event stream shape before it reaches React state.

## Phase 2: Shared Shell and Design System

### 1. Design Tokens

- Build shared CSS variable tokens for color, typography, spacing, elevation, radius, and motion.
- Implement the V6 palette and typography system from the design docs.
- Keep tokens framework-agnostic enough that both desktop and web render identically.

### 2. Shell Layout

- Build the shared layout primitives:
  - primary rail
  - session explorer
  - main canvas
  - inspector
  - activity dock
- Add responsive collapse rules for browser and narrow window states without breaking the mental model.

### 3. Capability Model

- Add a shared capability layer that tells the renderer whether the current shell supports:
  - local workspace access
  - local Git
  - worktree mutation
  - local runtime hosting
  - secure local token storage
- Use these capabilities to drive UI affordances rather than shell-specific component forks.

## Phase 3: Transcript and Streaming Runtime UX

### 1. Transcript Model

- Build a transcript store that handles:
  - user messages
  - assistant text
  - thought/status parts
  - command execution parts
  - file change parts
  - pause/intervention cards
  - artifact summaries
- Persist append-only event history and derive render-ready items from that history.

### 2. Rendering Strategy

- Use keyed streaming updates and keep heavy transformation logic out of component render functions.
- Use virtualization or windowing when transcript size becomes large.
- Keep typing, scrolling, and panel switching responsive while runtime events continue streaming.

### 3. Codex SDK State Mapping

Implement the canonical runtime states in shared React state:

1. Idle
2. Draft ready
3. Starting run
4. Running thought
5. Running command
6. Applying file changes
7. Interleaved streaming
8. Completed
9. Failed
10. Cancelled
11. Paused / resumable
12. Long-running background work
13. Media-rich output
14. Dense technical output

Each state must drive:
- header and activity badges
- transcript part styling
- composer mode
- task graph updates
- audit event writes

## Phase 4: Orchestration and Session Hierarchy

### 1. Session Tree

- Implement project-scoped chats and parent/child session trees.
- Preserve same-workspace inheritance by default.
- Allow explicit worktree override per session subtree only through deliberate actions.

### 2. Task Graph Integration

- Build task graph views that stay synchronized with the orchestration core and runtime events.
- Show blocked, running, failed, paused, and completed states clearly.
- Keep background child runs visible without taking over the main transcript workspace.

### 3. Intervention Flow

- Surface pause, resume, cancel, reroute, replace, migrate, and guidance injection in both transcript and inspector contexts.
- Make it obvious whether an intervention targets one run, a child session, or a subtree.

## Phase 5: Desktop Bridge and Browser Fallbacks

### 1. Electron Main and Preload

- Implement desktop-only services in Electron main.
- Expose them through typed preload APIs only.
- Validate IPC payloads at both request and response boundaries.

### 2. Browser Fallback Rules

- For each desktop-only feature, provide one of:
  - remote equivalent
  - read-only view
  - explicit unavailable state
- Do not hide controls silently based on shell assumptions.

## Phase 6: Performance and Verification

### Performance Rules

- Transcript streaming must not block composer input.
- Task graph updates must not re-render the full workspace.
- Audit log tails must update incrementally.
- Expensive selectors should live in stores, workers, or derived-state utilities, not inline UI components.

### Verification Checklist

- Typecheck shared packages and both app targets.
- Test the renderer in both Electron and web shells.
- Test IPC contracts and shell capability detection.
- Test same-workspace inheritance and worktree override logic.
- Test runtime state mapping against representative Codex SDK event streams.
- Test pause/resume/cancel/recovery flows end to end.

## Execution Roadmap

1. Scaffold apps and packages.
2. Lock contracts and IPC surfaces.
3. Build the shared shell and design system.
4. Implement transcript streaming and Codex SDK state mapping.
5. Add orchestration tree, interventions, and recovery.
6. Add desktop-only bridges and browser fallbacks.
7. Harden performance, tests, and packaging.

## Warning

Do not let implementation drift into a desktop-first architecture with browser support added later. The shared renderer, typed contracts, and Codex SDK runtime model are the core of this reset.
