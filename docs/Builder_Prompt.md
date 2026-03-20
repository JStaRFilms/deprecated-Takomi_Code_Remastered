# Builder Prompt

## Product Context

Takomi Code is an Electron desktop shell with a shared React + TypeScript renderer that also powers a browser-compatible build wherever possible. The product owns orchestration, task graphs, auditability, project/workspace management, Git/worktree switching, and local/remote runtime routing. Codex SDK is the primary execution integration.

## Stack-Specific Instructions

- Build the product in TypeScript.
- Use React for all UI surfaces shared by desktop and web.
- Keep native powers in Electron main/preload and expose them through typed IPC only.
- Treat Codex SDK as the default runtime integration, wrapped by a `CodexRuntimeManager` contract.
- Preserve same-workspace chat inheritance by default.
- Treat worktree switching as an explicit user action that updates the active workspace context for the current session subtree.
- Use the approved design docs and mockups as guidance, but implement a coherent shared renderer rather than a desktop-only shell.

## MUS Priority Order

1. FR-010: Electron shell and shared React navigation
2. FR-001: Project and workspace management
3. FR-002: Multi-chat session system
4. FR-003: Parent/child session hierarchy
5. FR-004: Takomi mode loader
6. FR-005: Workflow loader
7. FR-006: Orchestrator task graph engine
8. FR-007: Background child execution
9. FR-008: Live intervention controls
10. FR-009: Codex SDK runtime manager
11. FR-011: Transcript and artifact persistence
12. FR-012: Git and worktree controls
13. FR-013: Audit event log
14. FR-014: Shared design system and browser-compatible UI flow
15. FR-015: Paystack billing and entitlements
16. FR-016: Bags token and verification readiness
17. FR-017: Desktop-local and remote/browser runtime parity
18. FR-018: Recovery workflows

## Special Considerations

- Fee sharing is removed from scope.
- Bags implementation is token linkage, API usage, and verification readiness only.
- Desktop-only features must have typed IPC and a documented browser fallback.
- The local and remote runtime contracts must stay shape-compatible.
