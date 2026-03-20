# Takomi V6 UI Implementation Master Plan

**Target Agent:** You are the Principal WinUI / C# Application Architect handling the hardest, most complex UX/UI mapping task in the Takomi codebase.
**Objective:** Wire up the 14 real-time Codex SDK states directly into the Takomi Code WinUI 3 application using the pristine `takomi_chat_states_v6.html` mockups as the singular source of truth for aesthetics and flow.

## 🚨 MISSION PARAMETERS
This is a high-risk, high-reward implementation. Do NOT try to rush this by dumping thousands of lines of XAML at once. You must execute methodically, proving each core rendering mechanic before moving onto complex interleaving.
1. **Source of Truth - Aesthetics:** `docs/mockups/takomi_chat_states_v6.html`
2. **Source of Truth - Logic & Rules:** `docs/tasks/orchestrator-sessions/orch-20260315-173000/codex_sdk_state_map.md`
3. **Architecture:** WinUI 3, XAML, MVVM (CommunityToolkit.Mvvm).

---

## 🎨 AESTHETICS & THEME DICTIONARY
Before touching the primary Views, ensure the `App.xaml` or localized resource dictionaries contain the correct V6 color primitives. We are abandoning deep blues for ultra-dark blacks, deep grays, and the Takomi Yellow accent (`#FACC15`).

* **AppStrip:** `#09090A`
* **AppSidebar:** `#111112`
* **AppMain:** `#151516`
* **AppItemBg:** `#1E1E1F`
* **AppText:** `#E5E5E5`
* **AppMuted:** `#94A3B8`
* **TakomiAccent:** `#FACC15` (WinUI equivalent: `Color="#FFFACC15"`)
* **TakomiAccentSoft:** `rgba(250, 204, 21, 0.15)`

---

## 🏗️ PHASE 1: COMPONENT SEPARATION & VIEWMODELS
Do not dump everything into a monolithic `MainPage.xaml`. Ensure the architecture has strict separation.

### 1. The Transcript (Narrative Surface)
Implement an `ItemsControl` (or `ListView` with a custom style that removes default selection/hover chrome) driven by an `ObservableCollection<TranscriptItem>`.
* Create a `DataTemplateSelector` named `TranscriptItemTemplateSelector`.
* **UserTemplate:** Right-aligned, `#1C1C1E` background, white text. Includes optional `ItemsControl` for attachments (images, files).
* **AssistantTemplate:** Left-aligned. This template must handle an `ItemsControl` itself containing the interleaved `TurnParts`.

### 2. The TurnParts (Interleaved Content)
Within an Assistant's message response, you'll need another `ItemsControl` bound to `TurnParts` with a `TurnPartTemplateSelector`.
* **TextPartTemplate:** Contains a `RichTextBlock` or specialized Markdown renderer.
* **ThoughtPartTemplate:** A slightly dimmed card (`#1C1C1E`) with a yellow/purple indicator showing "Thinking...".
* **CommandPartTemplate:** A black (`#09090A`) box displaying terminal execution. Must bind to standard output stream arrays. Handles `in_progress` spinner vs. `failed` red 'X'.
* **FileChangePartTemplate:** A card representing modified files. Must feature a pulsing animation (using a WinUI `Storyboard` on `Opacity` or `Scale`) if the status is `in_progress`.
* **PauseRequestTemplate:** An Amber-colored alert box waiting for approval.

### 3. The Composer (Dynamic Input)
The Composer is highly stateful and must bind to the current session run state.
Create `ComposerViewModel` with properties:
* `IsInputEnabled`
* `MainActionMode` (Enum: `Send`, `Stop`, `Resume`)
* Bind the composer text box's `PlaceholderText` based on state (e.g., "Takomi is running..." when `MainActionMode == Stop`).

---

## 🗺️ PHASE 2: IMPLEMENTING THE 14 STATES

You must map these strictly against the `Codex SDK` responses. Use this guide to ensure every case is handled in the UI.

### State 1 & 2: Idle & Draft Ready
- **Logic:** No active run. 
- **Composer:** Input enabled. Main button = "Send" (Yellow accent).
- **Header:** Run Badge is Hidden.

### State 3: Starting Run
- **Logic:** User hits Send. A new Run is created.
- **Composer:** Input Disabled. Placeholder = "Takomi is running...". Button = "Stop" (Flat dark card with square icon).
- **Header:** Run Badge = Active (Yellow, pulsing).

### State 4 & 5: Running with Thinking / Command Execution
- **Transcript:** You receive a `part.started` event for a Thought or a Command. The `<TurnPartTemplateSelector>` routes it to the specific card. The card UI binds to `IsInProgress=true`, meaning the terminal spinner is spinning.
- **Ticker:** The Bottom Ticker `<TextBlock>` reads "Executing command...". This must translate directly from the SDK's low-level `item.started` updates. It is NOT part of the primary transcript.

### State 6: Running with File Changes
- **Transcript:** You receive `file_diff_card` chunks. Render the `FileChangePartTemplate`. Give it a subtle glowing border.
- **Ticker:** Updates to "Applying file modifications...".

### State 7: Interleaved Streaming
- **Logic:** This is the core complexity. Ensure the WinUI `ObservableCollection` handles updates properly on the UI thread (`DispatcherQueue.TryEnqueue`). It must seamlessly add text blocks, followed by a command block, followed by more text in real time.

### State 8, 9, 10: Completed, Failed, Cancelled
- **Logic:** `turn.completed` fires.
- **Action:** Any `in_progress` flags on TurnParts are set to false. Spinners turn to checkmarks (`Complete`), red Xs (`Failed`), or muted icons (`Cancelled`). 
- **Composer:** Mode flips back to "Send". Input is re-enabled.
- **Header:** Run Badge hidden.

### State 11: Paused / Resumable
- **Logic:** Takomi hits a blocking operation (e.g., prisma migrate requires an explicit 'Yes'). SDK fires a pause request.
- **Transcript:** Render the Amber `PauseRequestTemplate` card.
- **Composer:** Input is Disabled. The regular layout hides. A massive Amber "Resume Run" button takes over the composer block.
- **Sidebar Details:** Active Run Badge turns to Amber `PAUSED`.

### State 12: Long-Running Background
- **Logic:** Same as State 5 (Command), but ensure the Command block implements a running `TimeElapsed` property bound to a background timer to show duration.

### State 13 & 14: Media / Dense Technical output
- **Logic:** Ensure the `TextPartTemplate` can style `<code>` tags beautifully and distinctively. 
- **Aesthetic:** Unordered lists `<ul>` in paths should use a custom ItemContainerStyle rendering them as dark file cards with `<PathIcon Data="..."/>` file icons instead of default bullet points.

---

## 🚀 EXECUTION ROADMAP
1. **Bootstrap Visuals:** Add all colors, fonts, and base styles into generic `App.xaml` dictionaries.
2. **Build Data Models:** Setup C# primitive wrapper classes (`TranscriptMessage`, `MessagePart`, `CommandPart` derived models).
3. **Build the Shell:** Re-create the 4-panel structural layout. Set `<Grid>` rows and columns.
4. **Build the Sidebar:** Setup the Workspace Selected and Session history lists.
5. **Build the Transcript & Templates:** Start writing the `DataTemplates`. Dummy-load the 14 states into the ViewModel to verify pixel-perfect styling.
6. **Build the Composer:** Implement the stateful composer bottom bar.
7. **Wire the Event Stream:** Connect the Codex SDK C# bindings to update the `ObservableCollection` dynamically.

**WARNING:** Do not skip the dummy-data phase (Step 5). Create a `MockStateGenerator.cs` to force the UI into State 1 through 14 without relying on real LLM calls until the XAML is flawless.

*Good hunting. Takomi V6 is now in your hands.*
