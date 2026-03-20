# Feature: Project Selector

## Goal

Implement a high-fidelity project and workspace selection surface that works as the shared entry point for both Electron desktop and browser-compatible Takomi shells.

## Package Ownership

- `packages/contracts`
  - workspace metadata
  - recent project entries
  - shell capability state
- `packages/persistence`
  - recent workspace history
  - last-opened project state
- `packages/ui`
  - selector layout
  - recent workspaces list
  - runtime/capability status cards
- `apps/desktop`
  - folder picker
  - local clone/open flows
  - native dialog bridge
- `apps/web`
  - remote workspace connect flows
  - browser-safe recent workspace restore

## Surface Requirements

- Show recent workspaces and their last-known state.
- Show shell capability state:
  - desktop-local available
  - remote-only
  - disconnected or blocked
- Provide clear first actions:
  - open local workspace
  - clone/connect repository
  - reopen recent workspace
  - connect remote workspace

## Desktop and Browser Split

### Desktop

- Can open local folders, clone into local paths, and validate local runtime readiness.

### Browser

- Cannot assume local folder access.
- Must emphasize remote workspace connection and browser-safe runtime availability.

## Interaction Notes

- The selector should feel like a control room entry screen, not a plain file picker.
- Environment capability and runtime readiness should be visible before a project opens.
- Recent workspace entries should surface branch, runtime target, and unresolved recovery state when available.

## Acceptance Notes

- This surface is the first impression of the new architecture, so it must make the desktop-vs-browser distinction clear without fragmenting the product feel.
- It should route directly into the shared workspace shell after selection.
