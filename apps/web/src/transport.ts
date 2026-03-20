import type {
  BridgeCapabilityReport,
  BridgeHttpResponse,
  IpcChannel
} from '@takomi/contracts';
import {
  detectBridgeCapabilities,
  sendBridgeRequest,
  createBridgeEventStream
} from '@takomi/runtime-codex';

// --- Web transport state ---

export type TransportMode = 'browser-only' | 'local-bridge';

export interface TransportState {
  readonly mode: TransportMode;
  readonly bridgeAvailable: boolean;
  readonly capabilities: BridgeCapabilityReport | null;
  readonly httpBase: string;
  readonly wsUrl: string;
}

let currentState: TransportState = {
  mode: 'browser-only',
  bridgeAvailable: false,
  capabilities: null,
  httpBase: 'http://127.0.0.1:4545/bridge',
  wsUrl: 'ws://127.0.0.1:4545/ws'
};

const stateListeners = new Set<(state: TransportState) => void>();

function updateState(partial: Partial<TransportState>): void {
  currentState = { ...currentState, ...partial };
  for (const listener of stateListeners) {
    listener(currentState);
  }
}

// --- Capability detection ---

export async function probeLocalBridge(): Promise<TransportState> {
  const capabilities = await detectBridgeCapabilities({
    httpBase: currentState.httpBase,
    wsUrl: currentState.wsUrl
  });

  if (capabilities) {
    updateState({
      mode: 'local-bridge',
      bridgeAvailable: true,
      capabilities
    });
  } else {
    updateState({
      mode: 'browser-only',
      bridgeAvailable: false,
      capabilities: null
    });
  }

  return currentState;
}

// --- State subscription ---

export function onTransportStateChange(
  listener: (state: TransportState) => void
): { unsubscribe: () => void } {
  stateListeners.add(listener);
  return {
    unsubscribe() {
      stateListeners.delete(listener);
    }
  };
}

export function getTransportState(): TransportState {
  return currentState;
}

// --- Bridge-aware operations ---

export async function bridgeRequest(
  channel: IpcChannel,
  payload: Record<string, unknown>
): Promise<BridgeHttpResponse> {
  return sendBridgeRequest(channel, payload, {
    httpBase: currentState.httpBase,
    wsUrl: currentState.wsUrl
  });
}

// --- Workspace operations ---

export async function listWorkspaces(): Promise<unknown> {
  const response = await bridgeRequest('takomi:workspace:list', {});
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to list workspaces');
  }
  return response.payload;
}

export async function openWorkspace(path: string): Promise<unknown> {
  const response = await bridgeRequest('takomi:workspace:open', { path });
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to open workspace');
  }
  return response.payload;
}

export async function getWorkspaceStatus(workspaceId: string): Promise<unknown> {
  const response = await bridgeRequest('takomi:workspace:status', { workspaceId });
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to get workspace status');
  }
  return response.payload;
}

// --- Session operations ---

export async function listSessions(workspaceId?: string): Promise<unknown> {
  const response = await bridgeRequest('takomi:session:list', workspaceId ? { workspaceId } : {});
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to list sessions');
  }
  return response.payload;
}

export async function createSession(params: {
  name: string;
  kind: string;
  workspaceId?: string;
  projectId?: string;
}): Promise<unknown> {
  const response = await bridgeRequest('takomi:session:create', {
    name: params.name,
    kind: params.kind,
    workspaceId: params.workspaceId ?? 'ws-local-01',
    projectId: params.projectId ?? 'proj-01'
  });
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to create session');
  }
  return response.payload;
}

// --- Runtime operations ---

export async function connectRuntime(params: {
  sessionId: string;
  workspaceId?: string;
  runtimeTarget?: string;
  transport?: string;
}): Promise<unknown> {
  const response = await bridgeRequest('takomi:runtime:connect', {
    sessionId: params.sessionId,
    workspaceId: params.workspaceId ?? 'ws-local-01',
    runtimeTarget: params.runtimeTarget ?? 'remote',
    transport: params.transport ?? 'browser-safe'
  });
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to connect runtime');
  }
  return response.payload;
}

export async function subscribeRuntime(sessionId: string, runId?: string): Promise<unknown> {
  const payload: Record<string, unknown> = { sessionId };
  if (runId) payload['runId'] = runId;
  const response = await bridgeRequest('takomi:runtime:subscribe', payload);
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to subscribe to runtime');
  }
  return response.payload;
}

export async function controlRuntime(params: {
  runId: string;
  action: 'cancel' | 'pause' | 'resume';
  sessionId?: string;
}): Promise<unknown> {
  const payload: Record<string, unknown> = { runId: params.runId, action: params.action };
  if (params.sessionId) payload['sessionId'] = params.sessionId;
  const response = await bridgeRequest('takomi:runtime:control', payload);
  if (!response.ok) {
    throw new Error(response.error?.message ?? `Failed to ${params.action} run`);
  }
  return response.payload;
}

// --- Agent defaults ---

export async function loadAgentDefaults(): Promise<unknown> {
  const response = await bridgeRequest('takomi:agents:defaults:load', {});
  if (!response.ok) {
    throw new Error(response.error?.message ?? 'Failed to load agent defaults');
  }
  return response.payload;
}

// --- Git & Worktree operations (capability-aware) ---

/**
 * Creates a new worktree. Requires desktop git access.
 * In browser-only mode, this will fail with a clear capability error.
 */
export async function createWorktree(params: {
  workspaceId: string;
  branchName: string;
  taskSlug: string;
  label: string;
  runBootstrap?: boolean;
  envCarryoverAllowlist?: string[];
  installDependencies?: boolean;
}): Promise<unknown> {
  const payload: Record<string, unknown> = {
    workspaceId: params.workspaceId,
    branchName: params.branchName,
    taskSlug: params.taskSlug,
    label: params.label,
  };
  if (params.runBootstrap !== undefined) payload['runBootstrap'] = params.runBootstrap;
  if (params.envCarryoverAllowlist) payload['envCarryoverAllowlist'] = params.envCarryoverAllowlist;
  if (params.installDependencies !== undefined) payload['installDependencies'] = params.installDependencies;

  const response = await bridgeRequest('takomi:workspace:worktree:create', payload);
  if (!response.ok) {
    const err = response.error;
    if (err?.code === 'CAPABILITY_UNAVAILABLE') {
      throw new CapabilityUnavailableError(
        'worktreeCreation',
        err.message,
        err.details?.['recommendedAction'] as string | undefined
      );
    }
    throw new Error(err?.message ?? 'Failed to create worktree');
  }
  return response.payload;
}

/**
 * Switches the active worktree for a session subtree.
 * Requires desktop git access.
 */
export async function switchWorktree(params: {
  workspaceId: string;
  worktreeId: string;
  sessionSubtreeRootSessionId?: string;
  reason?: string;
}): Promise<unknown> {
  const payload: Record<string, unknown> = {
    workspaceId: params.workspaceId,
    worktreeId: params.worktreeId,
  };
  if (params.sessionSubtreeRootSessionId) payload['sessionSubtreeRootSessionId'] = params.sessionSubtreeRootSessionId;
  if (params.reason) payload['reason'] = params.reason;

  const response = await bridgeRequest('takomi:workspace:worktree:switch', payload);
  if (!response.ok) {
    const err = response.error;
    if (err?.code === 'CAPABILITY_UNAVAILABLE') {
      throw new CapabilityUnavailableError(
        'worktreeSwitching',
        err.message,
        err.details?.['recommendedAction'] as string | undefined
      );
    }
    throw new Error(err?.message ?? 'Failed to switch worktree');
  }
  return response.payload;
}

/**
 * Refreshes git state for a workspace.
 * Requires desktop git access.
 */
export async function refreshGitState(workspaceId: string): Promise<unknown> {
  const response = await bridgeRequest('takomi:workspace:git:refresh', { workspaceId });
  if (!response.ok) {
    const err = response.error;
    if (err?.code === 'CAPABILITY_UNAVAILABLE') {
      throw new CapabilityUnavailableError(
        'gitRefresh',
        err.message,
        err.details?.['recommendedAction'] as string | undefined
      );
    }
    throw new Error(err?.message ?? 'Failed to refresh git state');
  }
  return response.payload;
}

/**
 * Error thrown when a browser operation requires a desktop capability.
 */
export class CapabilityUnavailableError extends Error {
  readonly capability: string;
  readonly recommendedAction?: string;

  constructor(capability: string, message: string, recommendedAction?: string) {
    super(message);
    this.name = 'CapabilityUnavailableError';
    this.capability = capability;
    if (recommendedAction !== undefined) {
      this.recommendedAction = recommendedAction;
    }
  }
}

// --- Event stream ---

export { createBridgeEventStream } from '@takomi/runtime-codex';
