# Takomi Code Design Brief

## Design Intent

Takomi Code should feel like a premium orchestration studio for builders: fast, focused, and visibly in control. The product must not look like a generic admin dashboard, and it must not feel like two different products between desktop and browser. The Electron shell should add power, not a different personality.

## Experience Goals

- Make project, workspace, branch, and runtime state legible at a glance.
- Keep orchestration visible without burying the main conversation and execution surfaces.
- Make background child runs feel alive, trustworthy, and easy to intervene in.
- Preserve calm under heavy activity: streaming output, task changes, and audit events should feel fluid rather than chaotic.
- Keep browser and desktop experiences visually unified, with desktop-only capabilities revealed as deliberate upgrades rather than surprising divergence.

## Primary Product Surfaces

- Project and workspace selector
- Orchestrator home
- Multi-session workspace
- Child run tree and execution timeline
- Git branch and worktree manager
- Intervention command center
- Settings and runtime configuration
- Billing and Bags verification screens
- Audit log and recovery history

## Visual Direction

- Dark graphite foundations with warm metallic accent energy rather than neon or default SaaS gradients
- Strong typography hierarchy with a distinct headline face and a disciplined monospace for technical state
- Layered surfaces, subtle depth, and motion that clarifies state transitions instead of decorating them
- Bright, confident focus states and intervention alerts that feel precise instead of alarming
- Dense information layout that still breathes through grouping, spacing, and rhythm

## Interaction Priorities

- Streaming-first transcript design
- Clear parent/child session hierarchy
- Persistent workspace and branch context
- One-click access to interventions and recovery actions
- Fast switching between chat, task graph, inspector, and audit views

## Product Constraints

- The shared React renderer is the primary interaction model.
- Desktop-only features must be presented through the same design system and language as browser-safe features.
- No renderer assumptions about local filesystem access or native APIs.
- Same-workspace inheritance must be obvious in the UI, and worktree overrides must be visibly explicit.
- Fee sharing stays out of billing and verification flows.
