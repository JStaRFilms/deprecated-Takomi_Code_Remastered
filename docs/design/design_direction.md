# Design Direction: Takomi Code

## 1. Product Character

- **Performance-Luxury Hybrid:** Takomi should feel fast enough for active engineering work and refined enough to feel intentionally designed. The mood is controlled, technical, and premium.
- **Shared-Shell Consistency:** Desktop and browser must look like the same product family. The desktop shell adds capability and windowing, not a separate aesthetic.
- **State Transparency:** Runtime state, workspace state, task state, branch state, and recovery state should remain visible at all times.
- **Trust Through Structure:** Audit trails, interventions, and session lineage should feel inspectable and grounded, not hidden in menus.

## 2. Typography and Color

- **Headline Font:** `Space Grotesk`
- **Interface Font:** `Instrument Sans`
- **Code / Runtime Font:** `IBM Plex Mono`

### Core Palette

- `ink-950`: `#08090C`
- `ink-900`: `#101318`
- `panel-800`: `#171B22`
- `panel-700`: `#202631`
- `line-500`: `#364153`
- `text-strong`: `#F5F7FA`
- `text-muted`: `#99A4B5`
- `accent-brass`: `#F5B83D`
- `accent-ice`: `#6FD6FF`
- `success-mint`: `#60D394`
- `warning-amber`: `#FFB84D`
- `danger-coral`: `#FF6B57`

Use color as signal. Do not flood the interface with saturated accents.

## 3. Layout Model

### Desktop

- **Primary rail:** product-level navigation and workspace switching
- **Session explorer:** chat tree and child sessions
- **Main canvas:** transcript, task graph, artifacts, or recovery flow
- **Inspector:** context-aware details for workspace, runtime, task, artifact, or billing state
- **Bottom activity dock:** active runs, audit tail, connectivity, and background tasks

### Browser

- Preserve the same mental model with adaptive collapse:
  - rails become drawers or segmented panels
  - inspector becomes a panel or tab
  - activity dock becomes a stacked tray on smaller screens

## 4. Interaction Patterns

### Projects and Workspaces

- Enter through a workspace-focused selector, not a blank chat box.
- Show recent workspaces, runtime readiness, and the capability mode of the current shell.
- If the environment is browser-only, present remote workspace options and clearly explain what is desktop-only.

### Sessions and Task Graphs

- Parent/child sessions belong in a clear tree with status badges and lineage visibility.
- Task graphs should support both list and graph views when useful, but the underlying state model remains identical.
- Child sessions running in the background must remain visible without taking over the main canvas.

### Interventions

- Intervention controls must be close to active work, not buried in settings.
- Approval and recovery prompts should be visually distinct from ordinary assistant content.
- The user must always know whether an action affects the current session, a child session, or an entire subtree.

### Workspaces and Worktrees

- Same-workspace inheritance should be presented as the default badge on child sessions.
- Worktree overrides should use stronger visual labeling and require deliberate confirmation.
- Branch identity belongs in the header and inspector, not hidden in a separate Git page.

## 5. Motion and Feedback

- Use motion to explain state changes:
  - subtle pulse for active runs
  - short slide/fade for panel changes
  - progressive highlight for newly streamed content
- Keep animations brief and composited. Performance wins over flourish.
- Avoid heavy blur, oversized shadows, or ornamental glass effects that hurt streaming performance.

## 6. Design-System Rules

- Define tokens in CSS variables first so both Electron and web builds consume the same source of truth.
- Favor reusable layout primitives over page-specific one-offs.
- Keep technical surfaces consistent:
  - transcript blocks
  - command output cards
  - file diff summaries
  - pause/intervention prompts
  - audit events

## 7. Anti-Patterns

- No generic analytics-dashboard look
- No desktop-only assumptions in shared UI components
- No hidden state changes for worktree, runtime, or intervention actions
- No oversaturated purple-first palettes
- No design choices that depend on blocking renders or full-surface rerenders during streams
