import type {
  BridgeCapabilityReport,
  BridgeHttpRequest,
  BridgeHttpResponse,
  BridgeWsMessage,
  BridgeWsSubscriptionRequest,
  RuntimeRunRequest,
  RuntimeSessionRequest,
  RuntimeRunHandle,
  RuntimeSessionHandle,
  RuntimeEventEnvelope,
  RuntimeEventListener,
  RuntimeSubscription,
  IpcChannel
} from '@takomi/contracts';

export interface BridgeTransportConfig {
  readonly httpBase: string;
  readonly wsUrl: string;
  readonly timeoutMs: number;
}

const DEFAULT_CONFIG: BridgeTransportConfig = {
  httpBase: 'http://127.0.0.1:4545/bridge',
  wsUrl: 'ws://127.0.0.1:4545/ws',
  timeoutMs: 10_000
};

// --- HTTP transport ---

export async function sendBridgeRequest(
  channel: IpcChannel,
  payload: Record<string, unknown>,
  config?: Partial<BridgeTransportConfig>
): Promise<BridgeHttpResponse> {
  const resolved = { ...DEFAULT_CONFIG, ...config };
  const requestId = crypto.randomUUID();

  const body: BridgeHttpRequest = {
    channel,
    payload,
    requestId
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), resolved.timeoutMs);

  try {
    const response = await fetch(resolved.httpBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeout);
    return (await response.json()) as BridgeHttpResponse;
  } catch (error) {
    clearTimeout(timeout);
    return {
      ok: false,
      channel,
      payload: null,
      requestId,
      error: {
        code: 'TRANSPORT_ERROR',
        message: error instanceof Error ? error.message : 'Bridge request failed'
      },
      timestamp: new Date().toISOString()
    };
  }
}

// --- Capability detection ---

export async function detectBridgeCapabilities(
  config?: Partial<BridgeTransportConfig>
): Promise<BridgeCapabilityReport | null> {
  const resolved = { ...DEFAULT_CONFIG, ...config };

  try {
    const healthUrl = resolved.httpBase.replace(/\/bridge$/, '/health');
    const capUrl = resolved.httpBase.replace(/\/bridge$/, '/capabilities');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const healthResponse = await fetch(healthUrl, {
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!healthResponse.ok) return null;

    const capController = new AbortController();
    const capTimeout = setTimeout(() => capController.abort(), 3000);

    const capResponse = await fetch(capUrl, {
      signal: capController.signal
    });
    clearTimeout(capTimeout);

    if (!capResponse.ok) return null;

    return (await capResponse.json()) as BridgeCapabilityReport;
  } catch {
    return null;
  }
}

// --- WebSocket event streaming ---

export interface BridgeEventStream {
  readonly subscribe: (
    channel: 'runtime-events' | 'audit-events',
    sessionId?: string,
    runId?: string
  ) => RuntimeSubscription;
  readonly onMessage: (listener: (message: BridgeWsMessage) => void) => RuntimeSubscription;
  readonly close: () => void;
  readonly isConnected: () => boolean;
}

export function createBridgeEventStream(
  config?: Partial<BridgeTransportConfig>
): BridgeEventStream {
  const resolved = { ...DEFAULT_CONFIG, ...config };
  let ws: WebSocket | null = null;
  const messageListeners = new Set<(message: BridgeWsMessage) => void>();
  const eventListeners = new Set<RuntimeEventListener>();
  const subscriptions = new Map<string, { channel: string; listener: RuntimeEventListener }>();

  function connect(): WebSocket {
    if (ws && ws.readyState === WebSocket.OPEN) return ws;

    ws = new WebSocket(resolved.wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as BridgeWsMessage;

        for (const listener of messageListeners) {
          listener(message);
        }

        // If it's a runtime event, also notify event listeners
        if (message.type === 'event' && message.channel === 'runtime-events') {
          const envelope = message.payload as RuntimeEventEnvelope;
          for (const listener of eventListeners) {
            listener(envelope);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      // Auto-reconnect after 2 seconds
      setTimeout(() => {
        if (messageListeners.size > 0 || eventListeners.size > 0) {
          connect();
        }
      }, 2000);
    };

    return ws;
  }

  function send(message: BridgeWsSubscriptionRequest): void {
    const socket = connect();
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      socket.addEventListener('open', () => {
        socket.send(JSON.stringify(message));
      }, { once: true });
    }
  }

  return {
    subscribe(channel, sessionId?, runId?) {
      const subId = crypto.randomUUID();
      send({ type: 'subscribe', channel, sessionId, runId });

      const sub = { channel, listener: (() => {}) as RuntimeEventListener };
      subscriptions.set(subId, sub);

      return {
        close() {
          subscriptions.delete(subId);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'unsubscribe', subscriptionId: subId }));
          }
        }
      };
    },

    onMessage(listener) {
      messageListeners.add(listener);
      connect();
      return {
        close() {
          messageListeners.delete(listener);
        }
      };
    },

    close() {
      if (ws) {
        ws.close();
        ws = null;
      }
      messageListeners.clear();
      eventListeners.clear();
      subscriptions.clear();
    },

    isConnected() {
      return ws !== null && ws.readyState === WebSocket.OPEN;
    }
  };
}

// --- Remote Codex Runtime Manager via Bridge ---

export interface RemoteCodexRuntimeManagerConfig {
  readonly bridgeConfig?: Partial<BridgeTransportConfig>;
}

/**
 * Creates a remote runtime manager that delegates all operations
 * through the local bridge HTTP/WS transport.
 */
export function createRemoteCodexRuntimeManager(config?: RemoteCodexRuntimeManagerConfig) {
  const transportConfig = config?.bridgeConfig;
  const eventStream = createBridgeEventStream(transportConfig);
  const listeners = new Set<RuntimeEventListener>();

  // Forward WS runtime events to registered listeners
  eventStream.onMessage((message) => {
    if (message.type === 'event' && message.channel === 'runtime-events') {
      const envelope = message.payload as RuntimeEventEnvelope;
      for (const listener of listeners) {
        listener(envelope);
      }
    }
  });

  return {
    kind: 'remote' as const,

    async startSession(request: RuntimeSessionRequest): Promise<RuntimeSessionHandle> {
      const response = await sendBridgeRequest('takomi:runtime:connect', {
        workspaceId: request.workspaceId,
        sessionId: request.sessionId,
        runtimeTarget: request.runtimeTarget,
        transport: request.transport,
      }, transportConfig);
      if (!response.ok) {
        throw new Error(response.error?.message ?? 'Failed to start session');
      }

      const payload = response.payload as { sessionId: string; transport: string; startedAt: string };
      return {
        runId: '',
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        sessionId: payload.sessionId,
        runtimeTarget: request.runtimeTarget,
        transport: payload.transport as RuntimeSessionHandle['transport'],
        startedAt: payload.startedAt,
      };
    },

    async startRun(request: RuntimeRunRequest): Promise<RuntimeRunHandle> {
      const session = await this.startSession({
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        sessionId: request.sessionId,
        runtimeTarget: request.runtimeTarget,
        transport: request.transport,
        ...(request.taskId ? { taskId: request.taskId } : {}),
        ...(request.parentRunId ? { parentRunId: request.parentRunId } : {}),
        ...(request.prompt ? { prompt: request.prompt } : {}),
        ...(request.agentModeSlug ? { agentModeSlug: request.agentModeSlug } : {}),
        ...(request.metadata ? { metadata: request.metadata } : {}),
      });

      eventStream.subscribe('runtime-events', request.sessionId);

      const response = await sendBridgeRequest('takomi:runtime:subscribe', {
        sessionId: request.sessionId,
      }, transportConfig);
      if (!response.ok) {
        throw new Error(response.error?.message ?? 'Failed to subscribe to remote run');
      }

      const payload = response.payload as { subscribed: boolean; sessionId: string; runId?: string };
      return {
        runId: payload.runId ?? `run-${Date.now()}`,
        workspaceId: request.workspaceId,
        projectId: request.projectId,
        sessionId: request.sessionId,
        runtimeTarget: session.runtimeTarget,
        transport: session.transport,
        startedAt: session.startedAt,
      };
    },

    async cancelRun(runId: string) {
      await sendBridgeRequest('takomi:runtime:control', {
        runId,
        action: 'cancel'
      }, transportConfig);
    },

    async pauseRun(runId: string) {
      await sendBridgeRequest('takomi:runtime:control', {
        runId,
        action: 'pause'
      }, transportConfig);
    },

    async resumeRun(runId: string) {
      await sendBridgeRequest('takomi:runtime:control', {
        runId,
        action: 'resume'
      }, transportConfig);
    },

    async injectGuidance(request: {
      runId: string;
      sessionId: string;
      workspaceId: string;
      instruction: string;
      context?: string;
    }) {
      await sendBridgeRequest('takomi:intervention:submit', {
        request: {
          id: `int-${Date.now()}`,
          action: 'guidance',
          target: { kind: 'current-run', sessionId: request.sessionId, runId: request.runId },
          requestedBy: 'web-user',
          requestedAt: new Date().toISOString(),
          payload: { instruction: request.instruction, context: request.context }
        }
      }, transportConfig);
    },

    async rerouteRun(request: { runId: string; sessionId: string; workspaceId: string; [key: string]: unknown }) {
      await sendBridgeRequest('takomi:intervention:submit', {
        request: {
          id: `int-${Date.now()}`,
          action: 'reroute',
          target: { kind: 'current-run', sessionId: request.sessionId, runId: request.runId },
          requestedBy: 'web-user',
          requestedAt: new Date().toISOString(),
          payload: request
        }
      }, transportConfig);
    },

    async replaceRun(request: { runId: string; sessionId: string; workspaceId: string; [key: string]: unknown }) {
      await sendBridgeRequest('takomi:intervention:submit', {
        request: {
          id: `int-${Date.now()}`,
          action: 'replace',
          target: { kind: 'current-run', sessionId: request.sessionId, runId: request.runId },
          requestedBy: 'web-user',
          requestedAt: new Date().toISOString(),
          payload: request
        }
      }, transportConfig);
    },

    async migrateRun(request: { runId: string; sessionId: string; workspaceId: string; destinationWorkspaceId: string; [key: string]: unknown }) {
      await sendBridgeRequest('takomi:intervention:submit', {
        request: {
          id: `int-${Date.now()}`,
          action: 'migrate',
          target: { kind: 'current-run', sessionId: request.sessionId, runId: request.runId },
          requestedBy: 'web-user',
          requestedAt: new Date().toISOString(),
          payload: request
        }
      }, transportConfig);
    },

    subscribe(listener: RuntimeEventListener): RuntimeSubscription {
      listeners.add(listener);
      return {
        close() {
          listeners.delete(listener);
        }
      };
    },

    async pushEvent(event: RuntimeEventEnvelope) {
      for (const listener of listeners) {
        listener(event);
      }
    },

    async closeSession(sessionId: string) {
      // No specific close endpoint yet; just stop listening
      eventStream.close();
    }
  };
}
