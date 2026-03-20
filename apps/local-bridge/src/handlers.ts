import type {
  BridgeHttpRequest,
  BridgeHttpResponse,
  BridgeError,
  BridgeWsMessage,
  BridgeWsChannel,
  NormalizedRuntimeEvent
} from '@takomi/contracts';
import { IPC_CHANNELS } from '@takomi/contracts';
import { loadTakomiAgentDefaultsBundle } from './agent-defaults.js';
import type { WebSocketManager } from './ws-manager.js';

type ChannelHandler = (
  payload: Record<string, unknown>,
  requestId: string | undefined
) => Promise<BridgeHttpResponse>;

export interface ChannelRouter {
  route(request: BridgeHttpRequest): Promise<BridgeHttpResponse>;
}

export function createChannelRouter(wsManager: WebSocketManager): ChannelRouter {
  const handlers = new Map<string, ChannelHandler>();

  handlers.set(IPC_CHANNELS.workspaceList, async (_payload, requestId) => {
    return okResponse(IPC_CHANNELS.workspaceList, {
      workspaces: [
        {
          id: 'ws-local-01',
          name: 'Local Workspace',
          rootPath: process.cwd(),
          target: 'web',
          branchName: 'main',
          dirty: false,
          capabilities: {
            shell: 'web',
            browserCompatible: true,
            nativeBridge: true,
            filesystemAccess: false,
            gitAccess: false,
            worktreeSwitching: false,
            secureStorage: false,
            osDialogs: false,
            localRuntimeHosting: false,
            remoteRuntimeTransport: true,
            websocketBridge: true
          }
        }
      ]
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.workspaceOpen, async (payload, requestId) => {
    const rootPath = payload['path'] as string | undefined;
    if (!rootPath) {
      return errorResponse(IPC_CHANNELS.workspaceOpen, {
        code: 'MISSING_PATH',
        message: 'workspace open requires a path field'
      }, requestId);
    }

    return okResponse(IPC_CHANNELS.workspaceOpen, {
      workspace: {
        id: 'ws-local-01',
        name: 'Local Workspace',
        rootPath,
        target: 'web'
      }
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.workspaceStatus, async (payload, requestId) => {
    const workspaceId = payload['workspaceId'] as string | undefined;
    if (!workspaceId) {
      return errorResponse(IPC_CHANNELS.workspaceStatus, {
        code: 'MISSING_WORKSPACE_ID',
        message: 'workspace status requires a workspaceId'
      }, requestId);
    }

    return okResponse(IPC_CHANNELS.workspaceStatus, {
      workspace: {
        id: workspaceId,
        name: 'Local Workspace',
        rootPath: process.cwd(),
        target: 'web',
        branchName: 'main',
        dirty: false
      }
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.workspaceWorktreeSwitch, async (payload, requestId) => {
    const workspaceId = payload['workspaceId'] as string | undefined;
    const worktreeId = payload['worktreeId'] as string | undefined;
    if (!workspaceId || !worktreeId) {
      return errorResponse(IPC_CHANNELS.workspaceWorktreeSwitch, {
        code: 'MISSING_FIELDS',
        message: 'worktree switch requires workspaceId and worktreeId'
      }, requestId);
    }

    // Capability-aware: worktree switching is not available via browser bridge
    return errorResponse(IPC_CHANNELS.workspaceWorktreeSwitch, {
      code: 'CAPABILITY_UNAVAILABLE',
      message: 'Git worktree switching requires the desktop app. The browser build does not have access to local git operations.',
      details: {
        capability: 'worktreeSwitching',
        mode: 'unavailable',
        recommendedAction: 'Use the Electron desktop app to switch worktrees.',
      }
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.workspaceWorktreeCreate, async (payload, requestId) => {
    const workspaceId = payload['workspaceId'] as string | undefined;
    const branchName = payload['branchName'] as string | undefined;
    if (!workspaceId || !branchName) {
      return errorResponse(IPC_CHANNELS.workspaceWorktreeCreate, {
        code: 'MISSING_FIELDS',
        message: 'worktree create requires workspaceId and branchName'
      }, requestId);
    }

    // Capability-aware: worktree creation is not available via browser bridge
    return errorResponse(IPC_CHANNELS.workspaceWorktreeCreate, {
      code: 'CAPABILITY_UNAVAILABLE',
      message: 'Git worktree creation requires the desktop app. The browser build does not have access to local git operations.',
      details: {
        capability: 'gitAccess',
        mode: 'unavailable',
        recommendedAction: 'Use the Electron desktop app to create worktrees.',
      }
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.workspaceGitRefresh, async (payload, requestId) => {
    const workspaceId = payload['workspaceId'] as string | undefined;
    if (!workspaceId) {
      return errorResponse(IPC_CHANNELS.workspaceGitRefresh, {
        code: 'MISSING_WORKSPACE_ID',
        message: 'git refresh requires a workspaceId'
      }, requestId);
    }

    // Capability-aware: git refresh is not available via browser bridge
    return errorResponse(IPC_CHANNELS.workspaceGitRefresh, {
      code: 'CAPABILITY_UNAVAILABLE',
      message: 'Git state refresh requires the desktop app. The browser build does not have access to local git operations.',
      details: {
        capability: 'gitAccess',
        mode: 'unavailable',
        recommendedAction: 'Use the Electron desktop app to refresh git state.',
      }
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.sessionList, async (payload, requestId) => {
    const workspaceId = payload['workspaceId'] as string | undefined;
    return okResponse(IPC_CHANNELS.sessionList, {
      sessions: [
        {
          id: 'sess-01',
          projectId: 'proj-01',
          parentSessionId: null,
          kind: 'project',
          name: 'Main Session',
          status: 'idle',
          workspaceId: workspaceId ?? 'ws-local-01',
          worktreePath: null
        }
      ]
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.sessionCreate, async (payload, requestId) => {
    const name = payload['name'] as string | undefined;
    if (!name) {
      return errorResponse(IPC_CHANNELS.sessionCreate, {
        code: 'MISSING_NAME',
        message: 'session create requires a name'
      }, requestId);
    }

    return okResponse(IPC_CHANNELS.sessionCreate, {
      session: {
        id: `sess-${Date.now()}`,
        projectId: payload['projectId'] ?? 'proj-01',
        parentSessionId: payload['parentSessionId'] ?? null,
        kind: payload['kind'] ?? 'chat',
        name,
        status: 'idle',
        workspaceId: payload['workspaceId'] ?? 'ws-local-01',
        worktreePath: payload['worktreePath'] ?? null
      }
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.runtimeConnect, async (payload, requestId) => {
    const workspaceId = payload['workspaceId'] as string | undefined;
    const sessionId = payload['sessionId'] as string | undefined;
    if (!workspaceId || !sessionId) {
      return errorResponse(IPC_CHANNELS.runtimeConnect, {
        code: 'MISSING_FIELDS',
        message: 'runtime connect requires workspaceId and sessionId'
      }, requestId);
    }

    return okResponse(IPC_CHANNELS.runtimeConnect, {
      sessionId,
      transport: payload['transport'] ?? 'browser-safe',
      startedAt: new Date().toISOString()
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.runtimeSubscribe, async (payload, requestId) => {
    const sessionId = payload['sessionId'] as string | undefined;
    if (!sessionId) {
      return errorResponse(IPC_CHANNELS.runtimeSubscribe, {
        code: 'MISSING_SESSION_ID',
        message: 'runtime subscribe requires sessionId'
      }, requestId);
    }

    const event: NormalizedRuntimeEvent = {
      id: `evt-${Date.now()}`,
      runId: (payload['runId'] as string) ?? `run-${Date.now()}`,
      sessionId,
      workspaceId: 'ws-local-01',
      runtimeTarget: 'remote',
      transport: 'browser-safe',
      kind: 'run.starting',
      timestamp: new Date().toISOString(),
      payload: { message: 'Run initiated via local bridge' }
    };

    const wsChannel: BridgeWsChannel = 'runtime-events';
    const wsMessage: BridgeWsMessage = {
      type: 'event',
      channel: wsChannel,
      payload: event,
      sessionId,
      runId: event.runId,
      timestamp: event.timestamp
    };

    wsManager.broadcast(wsMessage);

    return okResponse(IPC_CHANNELS.runtimeSubscribe, {
      subscribed: true,
      sessionId,
      runId: event.runId
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.runtimeControl, async (payload, requestId) => {
    const runId = payload['runId'] as string | undefined;
    const action = payload['action'] as string | undefined;
    if (!runId || !action) {
      return errorResponse(IPC_CHANNELS.runtimeControl, {
        code: 'MISSING_FIELDS',
        message: 'runtime control requires runId and action'
      }, requestId);
    }

    const validActions = ['cancel', 'pause', 'resume'];
    if (!validActions.includes(action)) {
      return errorResponse(IPC_CHANNELS.runtimeControl, {
        code: 'INVALID_ACTION',
        message: `action must be one of: ${validActions.join(', ')}`
      }, requestId);
    }

    const kindMap: Record<string, NormalizedRuntimeEvent['kind']> = {
      cancel: 'run.cancelled',
      pause: 'run.paused',
      resume: 'run.resumed'
    };

    const event: NormalizedRuntimeEvent = {
      id: `evt-${Date.now()}`,
      runId,
      sessionId: (payload['sessionId'] as string) ?? 'unknown',
      workspaceId: 'ws-local-01',
      runtimeTarget: 'remote',
      transport: 'browser-safe',
      kind: kindMap[action]!,
      timestamp: new Date().toISOString(),
      payload: { action }
    };

    wsManager.broadcast({
      type: 'event',
      channel: 'runtime-events',
      payload: event,
      sessionId: event.sessionId,
      runId,
      timestamp: event.timestamp
    });

    return okResponse(IPC_CHANNELS.runtimeControl, {
      success: true,
      runId,
      action
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.interventionSubmit, async (payload, requestId) => {
    const request = payload['request'] as Record<string, unknown> | undefined;
    if (!request) {
      return errorResponse(IPC_CHANNELS.interventionSubmit, {
        code: 'MISSING_REQUEST',
        message: 'intervention submit requires a request field'
      }, requestId);
    }

    const action = request['action'] as string | undefined;
    if (!action) {
      return errorResponse(IPC_CHANNELS.interventionSubmit, {
        code: 'MISSING_ACTION',
        message: 'intervention request must include an action'
      }, requestId);
    }

    return okResponse(IPC_CHANNELS.interventionSubmit, {
      success: true,
      request
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.auditAppend, async (payload, requestId) => {
    const event = payload['event'] as Record<string, unknown> | undefined;
    if (!event) {
      return errorResponse(IPC_CHANNELS.auditAppend, {
        code: 'MISSING_EVENT',
        message: 'audit append requires an event field'
      }, requestId);
    }

    wsManager.broadcast({
      type: 'event',
      channel: 'audit-events',
      payload: event,
      sessionId: event['sessionId'] as string | undefined,
      timestamp: new Date().toISOString()
    });

    return okResponse(IPC_CHANNELS.auditAppend, {
      success: true
    }, requestId);
  });

  handlers.set(IPC_CHANNELS.agentDefaultsLoad, async (_payload, requestId) => {
    return okResponse(IPC_CHANNELS.agentDefaultsLoad, loadTakomiAgentDefaultsBundle(), requestId);
  });

  async function route(request: BridgeHttpRequest): Promise<BridgeHttpResponse> {
    const handler = handlers.get(request.channel);
    if (!handler) {
      return errorResponse(request.channel, {
        code: 'UNKNOWN_CHANNEL',
        message: `No handler for channel: ${request.channel}`
      }, request.requestId);
    }

    return handler(request.payload ?? {}, request.requestId);
  }

  return { route };
}

function okResponse(
  channel: string,
  payload: unknown,
  requestId: string | undefined
): BridgeHttpResponse {
  const response: BridgeHttpResponse = {
    ok: true,
    channel: channel as BridgeHttpResponse['channel'],
    payload,
    timestamp: new Date().toISOString()
  };

  return requestId !== undefined ? { ...response, requestId } : response;
}

function errorResponse(
  channel: string,
  error: BridgeError,
  requestId: string | undefined
): BridgeHttpResponse {
  const response: BridgeHttpResponse = {
    ok: false,
    channel: channel as BridgeHttpResponse['channel'],
    payload: null,
    error,
    timestamp: new Date().toISOString()
  };

  return requestId !== undefined ? { ...response, requestId } : response;
}
