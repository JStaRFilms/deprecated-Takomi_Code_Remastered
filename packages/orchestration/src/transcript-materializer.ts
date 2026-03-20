import type {
  AssistantMessageStatus,
  CommandBlock,
  CommandBlockStatus,
  CompletionStateBlock,
  CompletionStateStatus,
  FileChangeBlock,
  FileChangeBlockStatus,
  FileChangeEntry,
  InterventionCardBlock,
  InterventionCardStatus,
  NormalizedRuntimeEvent,
  PlanBlock,
  PlanStep,
  PlanStepStatus,
  TranscriptPart,
  TranscriptRenderBlock,
} from '@takomi/contracts';

export function materializeTranscript(
  sessionId: string,
  parts: readonly TranscriptPart[],
  events: readonly NormalizedRuntimeEvent[]
): TranscriptRenderBlock[] {
  const sessionParts = parts
    .filter((part) => part.sessionId === sessionId)
    .sort((left, right) => compareTimestamps(left.timestamp, right.timestamp));
  const sessionEvents = events
    .filter((event) => event.sessionId === sessionId)
    .sort((left, right) => compareTimestamps(left.timestamp, right.timestamp));

  const blocks: TranscriptRenderBlock[] = [];

  for (const part of sessionParts) {
    switch (part.kind) {
      case 'text':
        if (part.role === 'user') {
          blocks.push({
            id: part.id,
            kind: 'user-message',
            role: 'user',
            text: part.text,
            timestamp: part.timestamp,
            sessionId: part.sessionId,
            ...(part.runId ? { runId: part.runId } : {}),
          });
          break;
        }

        if (part.role === 'assistant') {
          blocks.push({
            id: part.id,
            kind: 'assistant-message',
            role: 'assistant',
            text: part.text,
            status: getAssistantStatusFromEvents(
              sessionEvents.filter((event) => event.runId === part.runId && compareTimestamps(event.timestamp, part.timestamp) >= 0)
            ),
            streaming: isStreamingText(part.text),
            dense: isDenseTechnicalText(part.text),
            timestamp: part.timestamp,
            sessionId: part.sessionId,
            ...(part.runId ? { runId: part.runId } : {}),
          });
          break;
        }

        blocks.push({
          id: part.id,
          kind: 'system-message',
          role: 'system',
          text: part.text,
          timestamp: part.timestamp,
          sessionId: part.sessionId,
          ...(part.runId ? { runId: part.runId } : {}),
        });
        break;

      case 'status': {
        const planBlock = toPlanBlock(part);
        if (planBlock) {
          blocks.push(planBlock);
          break;
        }

        const interventionBlock = toInterventionBlockFromStatus(part);
        if (interventionBlock) {
          blocks.push(interventionBlock);
          break;
        }

        const completionBlock = toCompletionBlockFromStatus(part);
        if (completionBlock) {
          blocks.push(completionBlock);
          break;
        }

        blocks.push({
          id: part.id,
          kind: 'status-message',
          status: part.status,
          text: part.message ?? part.status,
          timestamp: part.timestamp,
          sessionId: part.sessionId,
          ...(part.runId ? { runId: part.runId } : {}),
        });
        break;
      }

      case 'artifact':
        blocks.push({
          id: part.id,
          kind: 'artifact-summary',
          artifactId: part.artifactId,
          label: part.label ?? part.artifactId,
          timestamp: part.timestamp,
          sessionId: part.sessionId,
          ...(part.runId ? { runId: part.runId } : {}),
        });
        break;

      case 'system':
        blocks.push({
          id: part.id,
          kind: 'system-message',
          role: 'system',
          text: part.message,
          timestamp: part.timestamp,
          sessionId: part.sessionId,
          ...(part.runId ? { runId: part.runId } : {}),
        });
        break;

      case 'tool-call': {
        const command = extractCommand(part.input);
        if (!command) {
          break;
        }

        blocks.push({
          id: part.id,
          kind: 'command',
          command,
          status: 'in-progress',
          timestamp: part.timestamp,
          sessionId: part.sessionId,
          ...(part.runId ? { runId: part.runId } : {}),
        });
        break;
      }

      case 'tool-result':
        if (typeof part.output === 'string' && blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.kind === 'command' && lastBlock.runId === part.runId) {
            const updated: CommandBlock = {
              ...lastBlock,
              status: 'completed',
              logs: part.output,
            };
            blocks[blocks.length - 1] = updated;
          }
        }
        break;
    }
  }

  for (const event of sessionEvents) {
    const eventBlock = materializeBlockFromEvent(event);
    if (!eventBlock) {
      continue;
    }

    if (shouldReplaceExistingBlock(blocks, eventBlock)) {
      replaceExistingBlock(blocks, eventBlock);
      continue;
    }

    blocks.push(eventBlock);
  }

  return blocks.sort((left, right) => compareTimestamps(left.timestamp, right.timestamp));
}

function materializeBlockFromEvent(event: NormalizedRuntimeEvent): TranscriptRenderBlock | null {
  switch (event.kind) {
    case 'run.command.started':
    case 'run.command.completed':
      return {
        id: event.id,
        kind: 'command',
        command: asString(event.payload['command']) ?? 'command',
        status: event.kind === 'run.command.started' ? 'in-progress' : toCommandStatus(event.payload['exitCode']),
        logs: asString(event.payload['logs']),
        exitCode: asNumber(event.payload['exitCode']),
        timeElapsed: asString(event.payload['timeElapsed']),
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        runId: event.runId,
      };

    case 'run.file_changes.updated':
      return {
        id: event.id,
        kind: 'file-change',
        count: asNumber(event.payload['count']) ?? 0,
        status: toFileChangeStatus(event.payload['status']),
        files: toFileChangeEntries(event.payload['files']),
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        runId: event.runId,
      };

    case 'run.pause_requested':
    case 'run.paused':
      return {
        id: event.id,
        kind: 'intervention-card',
        action: event.kind === 'run.pause_requested' ? 'pause' : 'resume',
        text: asString(event.payload['message']) ?? defaultInterventionMessage(event.kind),
        status: event.kind === 'run.pause_requested' ? 'requested' : 'pending',
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        runId: event.runId,
      };

    case 'run.completed':
    case 'run.failed':
    case 'run.cancelled':
      return {
        id: event.id,
        kind: 'completion-state',
        status: toCompletionStatus(event.kind),
        summary: asString(event.payload['summary']) ?? defaultCompletionSummary(event.kind),
        timestamp: event.timestamp,
        sessionId: event.sessionId,
        runId: event.runId,
      };

    default:
      return null;
  }
}

function shouldReplaceExistingBlock(
  blocks: readonly TranscriptRenderBlock[],
  incoming: TranscriptRenderBlock
): boolean {
  if (incoming.kind === 'command') {
    return blocks.some(
      (block) =>
        block.kind === 'command' &&
        block.runId === incoming.runId &&
        block.command === incoming.command
    );
  }

  if (incoming.kind === 'completion-state') {
    return blocks.some(
      (block) => block.kind === 'completion-state' && block.runId === incoming.runId
    );
  }

  return false;
}

function replaceExistingBlock(blocks: TranscriptRenderBlock[], incoming: TranscriptRenderBlock): void {
  const index = blocks.findIndex((block) => {
    if (incoming.kind === 'command' && block.kind === 'command') {
      return block.runId === incoming.runId && block.command === incoming.command;
    }

    if (incoming.kind === 'completion-state' && block.kind === 'completion-state') {
      return block.runId === incoming.runId;
    }

    return false;
  });

  if (index >= 0) {
    blocks[index] = incoming;
  }
}

function toPlanBlock(part: Extract<TranscriptPart, { kind: 'status' }>): PlanBlock | null {
  const message = part.message?.trim();
  if (!message) {
    return null;
  }

  const lines = message
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const planLines = lines.filter((line) => /^([-*]|\d+[.)])\s+/.test(line));

  if (!part.status.toLowerCase().includes('plan') && planLines.length < 2) {
    return null;
  }

  const steps = (planLines.length > 0 ? planLines : lines).map<PlanStep>((line, index) => ({
    label: line.replace(/^([-*]|\d+[.)])\s+/, ''),
    status: index === 0 ? 'in-progress' : 'pending',
  }));

  return {
    id: part.id,
    kind: 'plan',
    title: 'Orchestration Plan',
    steps,
    timestamp: part.timestamp,
    sessionId: part.sessionId,
    ...(part.runId ? { runId: part.runId } : {}),
  };
}

function toInterventionBlockFromStatus(
  part: Extract<TranscriptPart, { kind: 'status' }>
): InterventionCardBlock | null {
  const status = part.status.toLowerCase();
  const text = part.message ?? part.status;

  if (!status.includes('pause') && !text.toLowerCase().includes('approval')) {
    return null;
  }

  return {
    id: part.id,
    kind: 'intervention-card',
    action: status.includes('resume') ? 'resume' : 'pause',
    text,
    status: 'pending',
    timestamp: part.timestamp,
    sessionId: part.sessionId,
    runId: part.runId ?? 'unknown-run',
  };
}

function toCompletionBlockFromStatus(
  part: Extract<TranscriptPart, { kind: 'status' }>
): CompletionStateBlock | null {
  const status = part.status.toLowerCase();
  if (!status.includes('complete') && !status.includes('fail') && !status.includes('cancel')) {
    return null;
  }

  return {
    id: part.id,
    kind: 'completion-state',
    status: status.includes('fail') ? 'failed' : status.includes('cancel') ? 'cancelled' : 'completed',
    summary: part.message ?? part.status,
    timestamp: part.timestamp,
    sessionId: part.sessionId,
    ...(part.runId ? { runId: part.runId } : {}),
  };
}

function getAssistantStatusFromEvents(events: readonly NormalizedRuntimeEvent[]): AssistantMessageStatus {
  const lastEvent = events[events.length - 1];
  if (!lastEvent) {
    return 'in-progress';
  }

  switch (lastEvent.kind) {
    case 'run.completed':
      return 'completed';
    case 'run.failed':
      return 'failed';
    case 'run.cancelled':
      return 'cancelled';
    case 'run.paused':
      return 'paused';
    default:
      return 'in-progress';
  }
}

function toCommandStatus(exitCode: unknown): CommandBlockStatus {
  if (typeof exitCode === 'number' && exitCode !== 0) {
    return 'failed';
  }

  return 'completed';
}

function toFileChangeStatus(value: unknown): FileChangeBlockStatus {
  const status = typeof value === 'string' ? value.toLowerCase() : '';
  if (status.includes('fail')) {
    return 'failed';
  }

  if (status.includes('progress') || status.includes('pending')) {
    return 'in-progress';
  }

  return 'completed';
}

function toCompletionStatus(kind: NormalizedRuntimeEvent['kind']): CompletionStateStatus {
  switch (kind) {
    case 'run.failed':
      return 'failed';
    case 'run.cancelled':
      return 'cancelled';
    default:
      return 'completed';
  }
}

function toFileChangeEntries(value: unknown): readonly FileChangeEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const path = asString((entry as Record<string, unknown>)['path']);
      if (!path) {
        return null;
      }

      return {
        path,
        label: asString((entry as Record<string, unknown>)['label']) ?? 'Updated',
      } satisfies FileChangeEntry;
    })
    .filter((entry): entry is FileChangeEntry => entry !== null);
}

function extractCommand(input: Record<string, unknown>): string | null {
  const directCommand = asString(input['command']);
  if (directCommand) {
    return directCommand;
  }

  const path = asString(input['path']);
  return path ? `read ${path}` : null;
}

function isStreamingText(text: string): boolean {
  return !/[.!?]$/.test(text.trim());
}

function isDenseTechnicalText(text: string): boolean {
  return text.length > 240 || text.includes('```') || text.includes('\n- ') || text.includes('\n1.');
}

function defaultInterventionMessage(kind: 'run.pause_requested' | 'run.paused'): string {
  return kind === 'run.pause_requested'
    ? 'Waiting for approval before continuing the run.'
    : 'Run paused pending user input.';
}

function defaultCompletionSummary(
  kind: 'run.completed' | 'run.failed' | 'run.cancelled'
): string {
  switch (kind) {
    case 'run.failed':
      return 'Run failed before completion.';
    case 'run.cancelled':
      return 'Run was cancelled.';
    default:
      return 'Run completed successfully.';
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function compareTimestamps(left: string, right: string): number {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);

  if (Number.isNaN(leftMs) || Number.isNaN(rightMs)) {
    return left.localeCompare(right);
  }

  return leftMs - rightMs;
}
