# Takomi Chat UI - Design Spec

This document serves as the design specification for the Takomi Chat UI, designed to closely follow the real Codex/Takomi runtime state model.

## 1. Top Header
**Purpose:** Provides calm, workspace-level context only.
**What appears here:**
- The name of the active workspace (e.g., `Takomi_Code`).
- A subtle, high-level status indicator for the workspace (not the individual message). 
  - *Examples:* "Workspace ready", "1 run active in this workspace", "1 paused run".
**What does NOT appear here:**
- Spastic terminal output, live transcript text, streaming code, or low-level status updates. The header must remain a stable anchor point.

## 2. Main Transcript
**Purpose:** The primary narrative surface for the user-assistant interaction.
**What appears here:**
- User messages (including image and file attachments).
- Assistant text (streamed live responses).
- Tool activity sequence (Commands, File Changes, Thinking, Pauses).
**Style rules:**
- Items appear chronologically. Tool activity interleaved with assistant text must feel native to the continuous narrative.
- Dense technical content (long paths, code chunks) uses proper formatting (code blocks and file chips) to remain clean. No massive unformatted blocks.

## 3. Tool Activity & Completion vs. File Changes
- **Tool Activity (In-Progress):** Displays what the assistant is currently doing (e.g., Command Execution, Thinking) using subtle loading animations. 
- **File Changes:** Represent an active, ongoing piece of evidence (`file_change` status: `completed`), *not* final terminal completion. File changes are rendered compactly as file chips rather than overwhelmingly large diff panels. They denote workflow progress.
- **Completion (Success / Failed / Cancelled):** Only the final terminal execution of a message yields a visual completion shift. 
  - *Success:* Assumes standard response formatting.
  - *Failed:* Shows a distinct visual error treatment at the end of the run.
  - *Cancelled:* The stream is truncated with a faded or crossed-out terminal marker.

## 4. Bottom Ticker
**Purpose:** A dedicated slot to communicate exactly one line of the latest low-level event during active runs.
**What appears here:**
- The absolute latest granular status update from the runtime (e.g., "Reading codex_sdk_state_map.md" or "Running command npm run build").
- Designed to be compact, machine-like, and ephemeral. When idle, the ticker clears up.

## 5. Composer State Transitions
The composer's primary action directly mirrors the Codex SDK state map lock configurations:
- **Idle / Failed / Completed / Cancelled** -> Action: `Send`. (No active run for the selected session. Submitting starts a new run.)
- **Starting / Queued / Running** -> Action: `Stop`. (Button transforms to red or subtle interruption styling to let users cancel the live run.)
- **Paused** -> Action: `Resume`. (Used *only* when the execution yields for user approval. Exposes a distinct visual state, like a blue or orange primary button.)

## Summary
By keeping the header broad, the ticker narrow, and treating the transcript as the sole timeline of events, the Takomi interface achieves the premium, clean, "desktop application" feel. It eliminates redundant visual noise and stays tightly bound to the reality of the Codex SDK state map.
