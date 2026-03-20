Key V6 Structural Changes:

The four-panel layout now maps to the shared React renderer rather than a desktop-only shell:

- Far-left nav strip for global product movement and shell capability context
- Sessions sidebar for project chats, search, and quick session creation
- Main center stage for transcript, floating composer, activity ticker, and context switching
- Right sidebar for session details, active run state, and state-testing or debug tooling when needed

Aesthetic Lock-in:

- Ultra-dark structural tones remain the base
- Takomi brass/yellow remains the primary accent
- The premium floating composer stays central
- Status and engine state remain visible without overpowering the transcript

Implementation Note:

The chat-state work should now be implemented as shared React components backed by Codex SDK event mapping, with Electron adding native powers through typed IPC and the browser build using remote/browser-safe runtime transport.
