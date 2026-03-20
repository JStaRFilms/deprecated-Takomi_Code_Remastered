import assert from 'node:assert/strict';

import {
  MOCK_SESSION_ID,
  createMockTranscriptEvents,
  createMockTranscriptParts,
  materializeTranscript,
  TranscriptStore,
} from '../packages/orchestration/dist/src/index.js';
import {
  deriveRuntimePresentationState,
  deriveRuntimeState,
} from '../packages/runtime-codex/dist/src/index.js';

const events = createMockTranscriptEvents();
const parts = createMockTranscriptParts();

const blocks = materializeTranscript(MOCK_SESSION_ID, parts, events);
assert.ok(blocks.some((block) => block.kind === 'plan'), 'Expected a plan block');
assert.ok(blocks.some((block) => block.kind === 'command'), 'Expected a command block');
assert.ok(blocks.some((block) => block.kind === 'file-change'), 'Expected a file change block');
assert.ok(blocks.some((block) => block.kind === 'intervention-card'), 'Expected an intervention card');

const store = new TranscriptStore(events, parts);
const fullState = store.getTranscriptState(MOCK_SESSION_ID);
assert.equal(fullState.window.totalBlocks, fullState.blocks.length, 'Expected full state to expose all blocks');

const windowedState = store.getTranscriptState(MOCK_SESSION_ID, { windowSize: 3 });
assert.equal(windowedState.blocks.length, 3, 'Expected windowed state to return the latest three blocks');
assert.equal(windowedState.window.totalBlocks, fullState.blocks.length, 'Expected window metadata to preserve total count');

const runtimeState = deriveRuntimeState(MOCK_SESSION_ID, events);
assert.equal(runtimeState, 'paused-resumable', 'Expected the final runtime state to be paused/resumable');

const presentationState = deriveRuntimePresentationState(MOCK_SESSION_ID, events);
assert.equal(presentationState.sessionStatus, 'paused', 'Expected paused session status');
assert.equal(presentationState.composerMode, 'resume', 'Expected resume composer mode');
assert.equal(presentationState.tickerLabel, 'Run paused pending user input', 'Expected paused ticker copy');

console.log('Transcript and runtime state verification passed.');
