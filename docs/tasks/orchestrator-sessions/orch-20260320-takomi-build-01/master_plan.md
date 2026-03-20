# Takomi Orchestrator Master Plan

**Session ID:** `orch-20260320-takomi-build-01`  
**Mode:** `mode-orchestrator`  
**Operating Style:** Review-gated orchestration manager  
**Mission:** Coordinate the full Takomi Code Electron + React + Codex SDK build through narrow delegated tasks, strict dependency gates, and the standard Takomi execution loop.

## Summary

This orchestration session treats the existing repository documentation as the locked foundation for implementation. Design generation is out of scope. The orchestrator should delegate the build in small slices, enforce the review gate between slices, and keep the implementation aligned with the v6 workspace UX and the Codex SDK runtime contract.

An additional product-critical input exists in `.agent/Takomi-Agents/`. This folder contains the current default Takomi agent and mode definitions that act as the app's starting brain. These files are user-authored defaults, should be treated as important product inputs, and must be preserved as configurable defaults rather than discarded as development-only artifacts.

## Manager Protocol

This session is now run as a review-gated orchestration manager:

1. The user delegates one allowed task to a builder agent.
2. The user returns here and says the task is done.
3. The orchestration manager reviews the implementation against the task file, repo state, docs, and verification evidence.
4. If issues are found, the orchestration manager patches the repo directly where appropriate, reruns checks, and updates session records.
5. If the task still does not meet its definition of done, the orchestration manager withholds approval and names the remaining blockers clearly.
6. Only after the task passes review does the orchestration manager give the green light for the next valid task.

The orchestration manager does not unlock later tasks based only on a claim of completion. Approval is evidence-based and dependency-aware.

## Source Of Truth

- `docs/Project_Requirements.md`
- `docs/architecture/system_architecture.md`
- `docs/architecture/solution_scaffold_decisions.md`
- `docs/mockups/v6-session-workspace.html`
- `docs/mockups/takomi_chat_states_v6.html`
- `docs/Orchestrator_Review_Workflow.md`
- `.agent/Takomi-Agents/custom_modes.yaml`
- `.agent/Takomi-Agents/vibe-orchestrator.yaml`
- `.agent/Takomi-Agents/vibe-code.yaml`
- `.agent/Takomi-Agents/vibe-review.yaml`
- `.agent/Takomi-Agents/kilo-code-settings.json`

## Skills Registry

Only use the following skills for this orchestration session:

| Skill | Purpose |
|---|---|
| `takomi` | Primary orchestration protocol and workflow routing |
| `spawn-task` | Create and refine self-contained implementation packets |
| `monorepo-management` | Workspace structure, package boundaries, and dev command setup |
| `nextjs-standards` | Shared TypeScript and React implementation discipline |
| `frontend-design` | Translate the approved v6 mockups into production React surfaces |
| `webapp-testing` | Browser interaction, UI validation, and verification support |
| `sync-docs` | Keep docs aligned with implementation slices |
| `jstar-reviewer` | Review and audit support for quality gates |
| `security-audit` | Security and boundary review for runtime, IPC, and bridge surfaces |

## Workflow Registry

| Workflow | Path | Use |
|---|---|---|
| `mode-orchestrator` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-orchestrator.md` | Session control, delegation, and synthesis |
| `vibe-spawnTask` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-spawnTask.md` | Task packet generation/refinement |
| `vibe-build` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-build.md` | Main implementation workflow |
| `mode-code` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-code.md` | Focused coding workflow |
| `mode-review` | `C:/Users/johno/.codex/skills/takomi/workflows/mode-review.md` | Review gate workflow |
| `review_code` | `C:/Users/johno/.codex/skills/takomi/workflows/review_code.md` | Deep implementation review |
| `vibe-syncDocs` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-syncDocs.md` | Documentation sync and final synthesis |
| `vibe-primeAgent` | `C:/Users/johno/.codex/skills/takomi/workflows/vibe-primeAgent.md` | Required preflight for every delegated task |

## Locked Interfaces

These contracts must be treated as early locks rather than drift-prone implementation details:

- `CodexRuntimeManager`
- `TakomiSessionBundleV1`
- normalized runtime event names
- `ShellCapabilities`
- desktop preload IPC payloads
- localhost bridge HTTP and WebSocket payloads

Desktop IPC and web-local bridge responses must stay shape-compatible wherever the action is logically the same.

## Additional Product Constraint

- `.agent/Takomi-Agents/` is the current default Takomi brain/config source.
- The app should eventually ingest these defaults into its own configurable state model.
- End users must be able to customize the effective agent definitions later, but the files in `.agent/Takomi-Agents/` remain the initial source defaults for now.
- Early implementation tasks must not hardcode a conflicting agent-mode model that would make this migration painful later.

## Standard Delegation Loop

Every task in this session follows this loop:

1. Read the assigned Takomi workflow first.
2. Run `vibe-primeAgent`.
3. Load only the required skills listed in the task file.
4. Read the linked source docs for that slice.
5. Implement only the task scope.
6. Run task-local verification before handoff.
7. Send the result to review.
8. If review fails, reopen the same task and fix it.
9. Only after review passes, move the task to `completed/` and unlock the next dependent task.

## User Return Protocol

When the user comes back with completed work, use this exact control pattern:

1. Confirm the submitted task is currently allowed by the dependency graph.
2. Review the task file first, then inspect the changed code and docs.
3. Run the most relevant verification commands for that task.
4. Patch implementation or documentation issues directly when reasonable.
5. Update the session status to reflect one of:
   - `Approved`
   - `Changes requested`
   - `Blocked`
6. Give the next green-lit task only if the reviewed task is approved.

## Task Table

| # | Task | Status | Mode / Workflow | Skills | Depends On | Verification | Next Gate |
|---|---|---|---|---|---|---|---|
| 1 | `01_monorepo-foundation.task.md` | Approved | `mode-code` / `vibe-build` | `takomi`, `monorepo-management`, `nextjs-standards` | none | Workspace checks, dev wiring, and verification fallback passed | Task 02 |
| 2 | `02_contracts-and-schema-lock.task.md` | Approved | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 1 | Package typecheck and runtime schema validation passed | Task 03, plus the parallel 04/06/07 window |
| 3 | `03_session-bundle-interop.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 2 | Not started | Review |
| 4 | `04_shared-v6-shell.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `frontend-design`, `nextjs-standards` | 1, 2 | Not started | Review |
| 5 | `05_transcript-and-runtime-state.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 2, 4 | Not started | Review |
| 6 | `06_electron-runtime-and-ipc.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 2 | Not started | Review |
| 7 | `07_web-local-bridge.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `monorepo-management`, `nextjs-standards` | 2 | Not started | Review |
| 8 | `08_persistence-audit-restore.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 2, 3 | Not started | Review |
| 9 | `09_orchestration-engine.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 2, 5, 6, 7, 8 | Not started | Review |
| 10 | `10_git-worktree-controls.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 6, 7, 8, 9 | Not started | Review |
| 11 | `11_interventions-and-recovery.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `nextjs-standards` | 5, 6, 7, 9 | Not started | Review |
| 12 | `12_runtime-settings-billing-bags.task.md` | Pending | `mode-code` / `vibe-build` | `takomi`, `frontend-design`, `nextjs-standards` | 4, 8 | Not started | Review |
| 13 | `13_integration-hardening.task.md` | Pending | `mode-review` / `review_code` | `takomi`, `webapp-testing`, `jstar-reviewer`, `security-audit` | 3-12 | Not started | Review |
| 14 | `14_docs-sync-and-final-synthesis.task.md` | Pending | `mode-review` / `vibe-syncDocs` | `takomi`, `sync-docs`, `jstar-reviewer` | 13 | Not started | Final summary |

## Dependency Strategy

- Sequential foundation:
  - Task `1` -> Task `2` -> Task `3`
- Parallel window after Task `2` review passes:
  - Task `4`
  - Task `6`
  - Task `7`
  - Task `8` only after Task `3` review passes
- Follow-on sequence:
  - Task `5` after Task `4`
  - Task `9` after `5`, `6`, `7`, and `8`
  - Task `10` after `9`
  - Task `11` after `9` plus runtime state foundations
  - Task `12` after `4` and `8`
  - Task `13` after `3` through `12`
  - Task `14` after `13`

## Progress Checklist

- [x] Task 1 reviewed and approved
- [x] Task 2 reviewed and approved
- [ ] Task 3 reviewed and approved
- [ ] Task 4 reviewed and approved
- [ ] Task 5 reviewed and approved
- [ ] Task 6 reviewed and approved
- [ ] Task 7 reviewed and approved
- [ ] Task 8 reviewed and approved
- [ ] Task 9 reviewed and approved
- [ ] Task 10 reviewed and approved
- [ ] Task 11 reviewed and approved
- [ ] Task 12 reviewed and approved
- [ ] Task 13 reviewed and approved
- [ ] Task 14 reviewed and approved

## Review Status Legend

- `Pending`: not started yet
- `In review`: returned by builder and currently being checked
- `Changes requested`: review found issues and the task is not approved yet
- `Approved`: task passed review and its dependents may unlock
- `Blocked`: cannot proceed because of an unresolved dependency or external blocker

## Blockers Log

None recorded yet.

## Next Tasks Ready To Spawn

1. `03_session-bundle-interop.task.md`

## Acceptance Snapshot

The final orchestration summary must explicitly report:

- completed vs pending tasks
- desktop and web-local build status
- Codex runtime parity status
- v6 workspace fidelity status
- interop bundle status
- open risks and recommended next wave
