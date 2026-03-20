import type {
  NormalizedRuntimeEvent,
  TranscriptPart,
  TranscriptRenderBlock,
  TranscriptState,
  TranscriptWindow,
} from '@takomi/contracts';
import { materializeTranscript } from './transcript-materializer.js';

export interface TranscriptWindowOptions {
  readonly windowSize?: number | undefined;
  readonly anchor?: 'start' | 'end' | number | undefined;
}

export type TranscriptStoreListener = (state: TranscriptState) => void;

export class TranscriptStore {
  private events: NormalizedRuntimeEvent[] = [];
  private parts: TranscriptPart[] = [];
  private listeners = new Map<string, Set<TranscriptStoreListener>>();
  private materializedCache = new Map<string, readonly TranscriptRenderBlock[]>();
  private lastUpdatedAtBySession = new Map<string, string>();

  public constructor(
    initialEvents: readonly NormalizedRuntimeEvent[] = [],
    initialParts: readonly TranscriptPart[] = []
  ) {
    this.load(initialEvents, initialParts);
  }

  public addEvent(event: NormalizedRuntimeEvent): void {
    this.events.push(event);
    this.lastUpdatedAtBySession.set(event.sessionId, event.timestamp);
    this.invalidateCache(event.sessionId);
    this.notify(event.sessionId);
  }

  public addPart(part: TranscriptPart): void {
    this.parts.push(part);
    this.lastUpdatedAtBySession.set(part.sessionId, part.timestamp);
    this.invalidateCache(part.sessionId);
    this.notify(part.sessionId);
  }

  public addEvents(events: readonly NormalizedRuntimeEvent[]): void {
    for (const event of events) {
      this.events.push(event);
      this.lastUpdatedAtBySession.set(event.sessionId, event.timestamp);
      this.invalidateCache(event.sessionId);
    }

    this.notifyMany(events.map((event) => event.sessionId));
  }

  public addParts(parts: readonly TranscriptPart[]): void {
    for (const part of parts) {
      this.parts.push(part);
      this.lastUpdatedAtBySession.set(part.sessionId, part.timestamp);
      this.invalidateCache(part.sessionId);
    }

    this.notifyMany(parts.map((part) => part.sessionId));
  }

  public getTranscriptState(sessionId: string, options: TranscriptWindowOptions = {}): TranscriptState {
    const blocks = this.getMaterializedBlocks(sessionId);
    const window = computeWindow(blocks.length, options);

    return {
      sessionId,
      blocks: blocks.slice(window.startIndex, window.endIndex),
      lastUpdatedAt: this.lastUpdatedAtBySession.get(sessionId) ?? '',
      window,
    };
  }

  public getAllParts(sessionId: string): readonly TranscriptPart[] {
    return this.parts.filter((part) => part.sessionId === sessionId);
  }

  public getAllEvents(sessionId: string): readonly NormalizedRuntimeEvent[] {
    return this.events.filter((event) => event.sessionId === sessionId);
  }

  public subscribe(
    sessionId: string,
    listener: TranscriptStoreListener,
    options: TranscriptWindowOptions = {}
  ): () => void {
    const existingListeners = this.listeners.get(sessionId) ?? new Set<TranscriptStoreListener>();
    existingListeners.add(listener);
    this.listeners.set(sessionId, existingListeners);
    listener(this.getTranscriptState(sessionId, options));

    return () => {
      const currentListeners = this.listeners.get(sessionId);
      if (!currentListeners) {
        return;
      }

      currentListeners.delete(listener);
      if (currentListeners.size === 0) {
        this.listeners.delete(sessionId);
      }
    };
  }

  public load(events: readonly NormalizedRuntimeEvent[], parts: readonly TranscriptPart[]): void {
    this.events = [...events];
    this.parts = [...parts];
    this.materializedCache.clear();
    this.lastUpdatedAtBySession.clear();

    for (const event of this.events) {
      this.lastUpdatedAtBySession.set(event.sessionId, event.timestamp);
    }

    for (const part of this.parts) {
      this.lastUpdatedAtBySession.set(part.sessionId, part.timestamp);
    }

    const sessionIds = new Set<string>([
      ...this.events.map((event) => event.sessionId),
      ...this.parts.map((part) => part.sessionId),
    ]);
    this.notifyMany([...sessionIds]);
  }

  private getMaterializedBlocks(sessionId: string): readonly TranscriptRenderBlock[] {
    const cached = this.materializedCache.get(sessionId);
    if (cached) {
      return cached;
    }

    const materialized = materializeTranscript(sessionId, this.parts, this.events);
    this.materializedCache.set(sessionId, materialized);
    return materialized;
  }

  private invalidateCache(sessionId: string): void {
    this.materializedCache.delete(sessionId);
  }

  private notify(sessionId: string): void {
    const sessionListeners = this.listeners.get(sessionId);
    if (!sessionListeners || sessionListeners.size === 0) {
      return;
    }

    const state = this.getTranscriptState(sessionId);
    for (const listener of sessionListeners) {
      listener(state);
    }
  }

  private notifyMany(sessionIds: readonly string[]): void {
    const uniqueSessionIds = new Set(sessionIds);
    for (const sessionId of uniqueSessionIds) {
      this.notify(sessionId);
    }
  }
}

function computeWindow(totalBlocks: number, options: TranscriptWindowOptions): TranscriptWindow {
  if (totalBlocks === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      totalBlocks: 0,
    };
  }

  const requestedWindowSize = options.windowSize ?? totalBlocks;
  const windowSize = Math.max(1, Math.min(requestedWindowSize, totalBlocks));
  const anchor = options.anchor ?? 'end';

  if (anchor === 'start') {
    return {
      startIndex: 0,
      endIndex: windowSize,
      totalBlocks,
    };
  }

  if (typeof anchor === 'number' && Number.isFinite(anchor)) {
    const safeAnchor = Math.max(0, Math.min(anchor, totalBlocks - 1));
    const startIndex = Math.max(0, Math.min(safeAnchor, totalBlocks - windowSize));
    return {
      startIndex,
      endIndex: startIndex + windowSize,
      totalBlocks,
    };
  }

  return {
    startIndex: totalBlocks - windowSize,
    endIndex: totalBlocks,
    totalBlocks,
  };
}
