# Takomi Chat UI V5 - Design Spec

This spec outlines the V5 direction for Takomi's chat and runtime states, blending the V4 layout preferences with the premium, “glassy” aesthetic of V6, all strictly mapped to the true underlying Codex SDK states.

## 1. Top Bar (Context & Status)
**What appears here:**
- Strict workspace-level context only (e.g., repository name, current branch, worktree identifier).
- No noisy or fast-moving transcript text.
- Global status indicator for active runs. E.g., showing a calm "RUN ACTIVE" or "PAUSED" badge only when a run is executing or waiting on user input.

## 2. Main Transcript (The Narrative)
**What appears here:**
- This is the primary storytelling surface.
- Assistant streamer output interleaved seamlessly with tool activity (`thought`, `command`, `file_diff_card`, `pause_request`).
- Distinct visual blocks for different artifact types (e.g. commands look like inline terminals, thoughts look like subtle notes, file diffs look like GitHub-style change summaries).
- It remains focused on conversation. It should read as a history of decisions and actions, keeping dense output readable through accordion-style boxes and monospace `<code>` snips for paths.

## 3. Bottom Ticker (The Machine heartbeat)
**What appears here:**
- The absolute latest, granular `item.started` / `item.updated` status line (e.g., "Applying modifications to files..." or "Running command...").
- A compact, one-line, all-caps or monospace string mapping to the background activity stream.
- Not a duplicate of the full `assistant_stream`; designed to be a subtle ambient pulse for the developer to know Takomi is structurally working.

## 4. Distinguishing File Changes vs. Completion
- **File Changes (Mid-run):** When `file_change` items map to `in_progress`, they render as a pulsing, highlighted card. They signify Takomi is *currently editing* the codebase but the turn is *not over*.
- **Completion (Final state):** When the `turn` hits `completed`, the activity cards drop their pulsing animations and glow. A final success or summary message might appear. There are no "terminal run completion" UI treatments (like giant green checkmarks) for intermediate file modifications, only when the entire overarching request succeeds.

## 5. Composer Dynamic States
The composer is tightly coupled to the underlying runtime session state:
- **`Send` State (Idle / Completed / Failed):** Shows a standard textarea, an upward arrow, and attachment icons. Ready to dispatch an orchestration request.
- **`Stop` State (Starting / Running / Thinking / Command Execution):** Text input gets disabled. Placeholder switches to "Takomi is running...". The send button transforms into a `Stop` square to cancel the underlying task.
- **`Resume` State (Paused for Approval):** Standard interface hides; a prominent "Resume Run" action requires explicit click to unblock the session. Text input tells the user the run is paused.

## 6. Recommended Direction (The V5 Aesthetic)
The recommended direction leverages the V4 state management but imports the V6 colors—dark background (`#0C0C0D`), deep surface layers (`#151516`), and very subtle, non-intrusive borders (`rgba(255, 255, 255, 0.05)`). We maintain the classic `TakomiBlue` (#3B82F6) alongside the V6 Yellow accent (`#FACC15`) to preserve Takomi's identity while feeling like an elite desktop app instead of a bloated admin panel. The composer is modeled as an elevated floating component (a-la 21st.dev), reinforcing that the user commands direct the whole orchestration flow.
