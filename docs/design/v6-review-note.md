# Takomi v6 Visual Direction Review

## The New Vibe

The Takomi v6 visual direction moves away from generic admin-dashboard clutter toward a premium minimalist orchestration studio. The focus is on high-quality typography, intentional spacing, and a fast shared renderer that still feels luxurious.

### Key Visual Choices

- **Surface Strategy:** A dark graphite foundation with softer elevated panels instead of harsh borders.
- **Floating Composer:** The composer remains visually detached and high-priority, making the session workspace feel like an active control surface rather than a static chat log.
- **Elegant Status:** Progress appears through concise status pills, inline action blocks, and subtle motion rather than debug-heavy chrome.
- **Asset Language:** Warm brass accents for workspace and project affordances, restrained cool accents for runtime and system feedback.
- **Contextual Inspector:** The inspector remains lightweight so the transcript and task flow stay central.

## Primary Recommended Direction

`v6-session-workspace.html` remains a useful visual reference for balancing transcript focus, tool activity, and user collaboration. It should inform the shared React implementation rather than be treated as a desktop-only target.

## Next Steps

1. Implement the shared motion system in React for composer, dock, and state transitions.
2. Extract the shared shell pieces into reusable renderer components and layout primitives.
3. Use this visual spec as the north star for both Electron and browser delivery, with native desktop affordances added through shell capability features rather than a separate design language.
