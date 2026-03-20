# Mockup Review: Takomi Code vNext

**Target:** Takomi shared renderer direction for desktop and browser  
**Reviewer:** Architecture and design reset pass  
**Date:** 2026-03-20

## Build Gate Decision

**STATUS: APPROVED AS DIRECTION, NOT AS A PIXEL-FOR-PIXEL LEGACY PORT**

The new product direction is strong when it emphasizes orchestration clarity, session hierarchy, and a high-trust streaming workspace. The design should move forward as a shared React renderer that powers both Electron and browser, rather than a direct translation of previous desktop-native mockups.

## What Should Carry Forward

- High information density for serious builders
- Clear separation between global navigation, session hierarchy, main work, and inspection
- Strong visibility for active runs, blocked states, and intervention moments
- A premium dark interface with deliberate accent usage
- A transcript surface that treats command output, file changes, thoughts, and pause requests as different content types

## What Must Change for the New Architecture

- The shell can no longer assume desktop-only layout, filesystem access, or native controls.
- All major screens must be designed as shared React surfaces with browser-responsive behavior.
- Runtime and workspace controls need explicit capability states:
  - desktop-local
  - remote/browser-safe
  - unavailable in current shell
- Streaming-heavy views must be designed for incremental rendering and list virtualization from the start.

## Refinement Checklist

- [ ] Verify the project selector has clear browser and desktop capability messaging.
- [ ] Confirm the session explorer remains legible with deep parent/child trees and narrow widths.
- [ ] Ensure intervention prompts and pause states are visually distinct from normal transcript cards.
- [ ] Design the activity dock to scale from wide desktop monitors down to compact browser layouts.
- [ ] Keep motion lightweight enough for long-running transcript streams and frequent task updates.
- [ ] Validate color contrast for alert, warning, and success states against the dark graphite palette.

## Screen-Level Guidance

| Surface | Status | Guidance |
|---|---|---|
| Project selector | Keep | Make environment capability explicit and support remote workspace entry for browser. |
| Orchestrator home | Keep | Focus on run health, blocked work, and recent session recovery. |
| Session workspace | Keep | This remains the primary product surface and should receive the most polish. |
| Task tree monitor | Keep | Needs both list and compact-graph thinking, with performance-sensitive rendering. |
| Intervention controls | Keep | Must show scope of action and recovery impact clearly. |
| Worktree manager | Keep with adaptation | Desktop gets full control; browser gets status or remote-backed actions only. |
| Billing and verification | Keep | Use shared product language, not separate “settings app” styling. |
| Runtime settings | Keep | Center the Codex SDK runtime model and shell capability states. |
