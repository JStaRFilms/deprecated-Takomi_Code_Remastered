# Takomi Agent Defaults

## Purpose

`.agent/Takomi-Agents/` is the current source of default Takomi agent and mode definitions for this repository. These files are not throwaway scaffolding. They represent the starting brain/config for the product.

## Current Source

The current defaults live in:

- `.agent/Takomi-Agents/custom_modes.yaml`
- `.agent/Takomi-Agents/vibe-orchestrator.yaml`
- `.agent/Takomi-Agents/vibe-code.yaml`
- `.agent/Takomi-Agents/vibe-review.yaml`
- `.agent/Takomi-Agents/kilo-code-settings.json`

## Foundation Decision

During the monorepo foundation phase, the scaffold should preserve these files as authoritative source defaults while leaving room for an app-owned configuration layer later.

## Intended Evolution

The app should eventually:

1. ingest the current defaults into a typed internal model
2. expose those defaults as user-configurable settings
3. allow end-user overrides without destroying the original shipped defaults
4. avoid hardcoding a conflicting agent-mode model that blocks this migration

## Immediate Guidance For Downstream Tasks

- Task 02 should define contracts for app-owned Takomi agent definitions.
- Task 09 should define how orchestration loads default agent definitions.
- Task 12 should expose the first app-facing management hook for these defaults.
