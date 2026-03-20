import type { NormalizedRuntimeEvent, SessionStatus } from '@takomi/contracts';

export type RuntimeState =
  | 'idle'
  | 'draft-ready'
  | 'starting-run'
  | 'running-thought'
  | 'running-command'
  | 'applying-file-changes'
  | 'interleaved-streaming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused-resumable'
  | 'background-work'
  | 'media-rich-output'
  | 'dense-technical-output';

export type ComposerMode = 'send' | 'stop' | 'resume';

export interface RuntimePresentationState {
  readonly runtimeState: RuntimeState;
  readonly sessionStatus: SessionStatus;
  readonly composerMode: ComposerMode;
  readonly tickerLabel: string | null;
  readonly activityTone: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
}

export function deriveRuntimeState(
  sessionId: string,
  events: readonly NormalizedRuntimeEvent[]
): RuntimeState {
  const sessionEvents = events.filter((event) => event.sessionId === sessionId);
  const lastEvent = sessionEvents[sessionEvents.length - 1];

  if (!lastEvent) {
    return 'idle';
  }

  switch (lastEvent.kind) {
    case 'run.starting':
      return 'starting-run';

    case 'run.command.started':
      return isBackgroundWork(lastEvent) ? 'background-work' : 'running-command';

    case 'run.command.completed':
      return 'interleaved-streaming';

    case 'run.file_changes.updated':
      return 'applying-file-changes';

    case 'run.pause_requested':
    case 'run.paused':
      return 'paused-resumable';

    case 'run.completed':
      return 'completed';

    case 'run.failed':
      return 'failed';

    case 'run.cancelled':
      return 'cancelled';

    case 'run.resumed':
      return 'interleaved-streaming';

    case 'run.streaming':
      if (isThoughtEvent(lastEvent)) {
        return 'running-thought';
      }

      if (isMediaRichEvent(lastEvent)) {
        return 'media-rich-output';
      }

      if (isDenseTechnicalEvent(lastEvent)) {
        return 'dense-technical-output';
      }

      return 'interleaved-streaming';

    default:
      return 'idle';
  }
}

export function deriveRuntimePresentationState(
  sessionId: string,
  events: readonly NormalizedRuntimeEvent[]
): RuntimePresentationState {
  const runtimeState = deriveRuntimeState(sessionId, events);

  switch (runtimeState) {
    case 'idle':
      return {
        runtimeState,
        sessionStatus: 'idle',
        composerMode: 'send',
        tickerLabel: null,
        activityTone: 'idle',
      };

    case 'draft-ready':
      return {
        runtimeState,
        sessionStatus: 'idle',
        composerMode: 'send',
        tickerLabel: 'Draft ready',
        activityTone: 'idle',
      };

    case 'paused-resumable':
      return {
        runtimeState,
        sessionStatus: 'paused',
        composerMode: 'resume',
        tickerLabel: 'Run paused pending user input',
        activityTone: 'paused',
      };

    case 'completed':
      return {
        runtimeState,
        sessionStatus: 'completed',
        composerMode: 'send',
        tickerLabel: 'Run completed',
        activityTone: 'completed',
      };

    case 'failed':
      return {
        runtimeState,
        sessionStatus: 'failed',
        composerMode: 'send',
        tickerLabel: 'Run failed',
        activityTone: 'failed',
      };

    case 'cancelled':
      return {
        runtimeState,
        sessionStatus: 'cancelled',
        composerMode: 'send',
        tickerLabel: 'Run cancelled',
        activityTone: 'failed',
      };

    case 'running-command':
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Running command...',
        activityTone: 'running',
      };

    case 'applying-file-changes':
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Applying modifications to files...',
        activityTone: 'running',
      };

    case 'background-work':
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Process running in background',
        activityTone: 'running',
      };

    case 'running-thought':
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Thinking through the next steps...',
        activityTone: 'running',
      };

    case 'media-rich-output':
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Preparing media-rich output',
        activityTone: 'running',
      };

    case 'dense-technical-output':
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Rendering dense technical output',
        activityTone: 'running',
      };

    default:
      return {
        runtimeState,
        sessionStatus: 'running',
        composerMode: 'stop',
        tickerLabel: 'Takomi is actively processing steps in the background...',
        activityTone: 'running',
      };
  }
}

function isThoughtEvent(event: NormalizedRuntimeEvent): boolean {
  return asString(event.payload['role']) === 'thought' || asString(event.payload['type']) === 'thought';
}

function isMediaRichEvent(event: NormalizedRuntimeEvent): boolean {
  return Array.isArray(event.payload['attachments']) || asString(event.payload['mediaType']) !== undefined;
}

function isDenseTechnicalEvent(event: NormalizedRuntimeEvent): boolean {
  const text = asString(event.payload['text']) ?? '';
  return text.length > 280 || text.includes('```') || text.includes('\n- ') || text.includes('\n1.');
}

function isBackgroundWork(event: NormalizedRuntimeEvent): boolean {
  return Boolean(event.payload['background']) || asString(event.payload['timeElapsed']) !== undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
