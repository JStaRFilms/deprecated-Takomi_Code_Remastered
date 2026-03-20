# Project Requirements Document

## Project Overview

**Name:** Takomi Code  
**Mission:** Build a performance-first agentic coding product with an Electron desktop shell and a browser-compatible React application that both run the Takomi orchestration model through a shared TypeScript platform.  
**Default Stack:** Electron + React + TypeScript.  
**Primary Runtime Model:** Codex SDK first. Takomi owns orchestration, task graphs, session state, workspace awareness, auditability, and interventions; Codex SDK owns agent session execution through a dedicated runtime manager.  
**Product Shape:** One shared React/TypeScript experience with two delivery targets:
- Electron desktop for native workspace, Git, secure storage, and local runtime powers
- Browser build for cloud-connected orchestration, session review, and browser-safe execution paths

## Goals

- Deliver a beautiful, high-trust orchestration product that feels intentional on desktop and coherent on the web.
- Preserve the Takomi lifecycle and operating model: modes, workflows, task graphs, parent/child sessions, interventions, recovery flows, audit logs, and workspace awareness.
- Keep same-workspace inheritance as the default behavior for child sessions while making Git worktree switching explicit and inspectable.
- Make Codex SDK the default execution integration for local desktop and remote/browser-safe runtime flows.
- Keep native access behind Electron main/preload and expose it to the renderer through typed IPC only.
- Maintain low-latency streaming UX with non-blocking rendering, responsive navigation, and resilient persistence.

## Target Users

- Solo builders using Takomi workflows to ship product work quickly.
- Small teams coordinating research, design, build, review, and recovery through parent/child agent sessions.
- Power users who want a dedicated orchestration shell with desktop-native powers without giving up browser access.

## Functional Requirements

| FR ID | Description | User Story | Status |
| :--- | :--- | :--- | :--- |
| FR-001 | Project and workspace management | As a builder, I want to open, connect, and manage multiple workspaces so that I can move across products without losing context. | MUS |
| FR-002 | Multi-chat session system | As a builder, I want multiple chats per project so that strategy, build, review, and recovery work stay separated. | MUS |
| FR-003 | Parent/child session hierarchy | As a builder, I want child sessions under a parent chat so that orchestration chains stay organized and reviewable. | MUS |
| FR-004 | Takomi mode loader | As a builder, I want the app to load Takomi mode definitions so that orchestration behavior stays aligned with the workflow contracts. | MUS |
| FR-005 | Workflow loader | As a builder, I want the app to load Takomi workflow documents so that lifecycle stages remain configurable and auditable. | MUS |
| FR-006 | Orchestrator task graph engine | As a builder, I want the orchestrator to create and manage task graphs so that larger efforts can be delegated safely. | MUS |
| FR-007 | Background child execution | As a builder, I want child runs to continue in the background so that I can keep working in the parent session. | MUS |
| FR-008 | Live intervention controls | As a builder, I want to inject guidance, pause, resume, reroute, replace, cancel, migrate, and recover runs so that I stay in control of agent execution. | MUS |
| FR-009 | Codex SDK runtime manager | As a builder, I want Takomi to run Codex sessions through a dedicated Codex SDK runtime layer so that execution is consistent across desktop and browser-safe targets. | MUS |
| FR-010 | Electron shell and shared React navigation | As a builder, I want a polished Electron shell and shared React UI with project navigation, session tabs, inspectors, and responsive layouts so that the workflow feels clear and fast everywhere. | MUS |
| FR-011 | Transcript and artifact persistence | As a builder, I want chats, run events, and generated artifacts saved durably so that sessions can be resumed reliably. | MUS |
| FR-012 | Git and worktree controls | As a builder, I want branch visibility and explicit worktree switching so that parallel work stays manageable and understandable. | MUS |
| FR-013 | Audit event log | As a builder, I want every run, intervention, billing event, and verification change logged so that execution is trustworthy and reviewable. | MUS |
| FR-014 | Shared design system and browser-compatible UI flow | As a builder, I want the desktop shell and browser build to share one design system and interaction model so that the product feels like one platform rather than two separate apps. | MUS |
| FR-015 | Paystack billing and entitlements | As a builder, I want fiat billing and entitlement checks so that paid access can be enforced. | MUS |
| FR-016 | Bags token and verification readiness | As a builder, I want Bags token linkage and Bags-backed readiness checks so that the product supports the hackathon verification scope. | MUS |
| FR-017 | Desktop-local and remote/browser runtime parity | As a builder, I want to switch between desktop-local and remote/browser-safe execution so that work can continue under different runtime conditions. | MUS |
| FR-018 | Recovery workflows | As a builder, I want continue-build, migration, reset, and escalation flows so that long-running projects remain recoverable. | MUS |
| FR-019 | Packaging and onboarding polish | As a builder, I want stronger onboarding and packaging polish so that setup friction is minimized. | Future |
| FR-020 | Team collaboration primitives | As a builder, I want shared sessions and team-level visibility so that multiple humans can coordinate in one product. | Future |
| FR-021 | Usage analytics dashboard | As a builder, I want throughput, cost, and effectiveness analytics so that I can understand how the system is performing. | Future |
| FR-022 | Skill marketplace and remote installs | As a builder, I want to browse and install skill bundles from the product so that extending Takomi is easier. | Future |

## Non-Negotiable Constraints

- Electron + React + TypeScript is the default product stack.
- The renderer must remain browser-compatible wherever capabilities do not require desktop privileges.
- Codex SDK is the primary runtime integration and the main execution contract.
- Native capabilities live in Electron main/preload and are exposed to the renderer through typed IPC only.
- Same-workspace inheritance is the default for child sessions.
- Git worktree switching must be explicit, visible, and reversible.
- Performance is a first-class requirement: streaming updates must not block typing, navigation, or inspection workflows.
- Fee sharing must not appear in requirements, tasks, payments, or Bags integration scope.

## Acceptance Gates

- The product demonstrates the full Takomi lifecycle from Genesis through Finalize with modes, workflows, interventions, and recovery flows intact.
- Electron desktop and browser builds share the same React feature surfaces, contracts, and orchestration logic wherever native access is not required.
- Codex SDK runtime operations flow through one runtime manager contract with desktop-local and remote/browser-safe implementations.
- Typed IPC covers all desktop-only capabilities including filesystem access, Git/worktree operations, secure secret handling, OS dialogs, and local runtime hosting.
- Parent/child task graphs, background child execution, workspace inheritance, and audit logs are functional and queryable.
- Browser-incompatible actions are called out explicitly with a fallback, remote path, or disabled state instead of hidden failure.
- Paystack billing and entitlement checks work on the success path.
- Bags scope remains limited to token linkage, Bags API usage, verification readiness, and related audit logging.
