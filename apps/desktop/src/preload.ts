/**
 * Takomi Desktop - Preload Bridge
 * 
 * This is the ONLY allowed native entrypoint for the renderer.
 * It exposes typed IPC methods through contextBridge.
 * The renderer has no direct Node.js or Electron API access.
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@takomi/contracts';
import type {
  TakomiAgentDefaultsBundle,
  IpcEnvelope,
  IpcResponseEnvelope,
  WorkspaceListIpcPayload,
  WorkspaceOpenIpcPayload,
  WorkspaceStatusIpcPayload,
  WorkspaceWorktreeSwitchIpcPayload,
  SessionListIpcPayload,
  SessionCreateIpcPayload,
  RuntimeConnectIpcPayload,
  RuntimeSubscribeIpcPayload,
  RuntimeControlIpcPayload,
  InterventionSubmitIpcPayload,
  AuditAppendIpcPayload,
  AgentDefaultsLoadIpcPayload,
  WorkspaceDescriptor,
  SessionDescriptor,
  NormalizedRuntimeEvent,
} from '@takomi/contracts';

// Type for IPC invoke responses
type IpcInvokeResult<T> = Promise<IpcResponseEnvelope<T>>;

// Create typed IPC invoke wrapper
function createIpcInvoker<TPayload, TResponse>(
  channel: string
): (envelope: IpcEnvelope<TPayload>) => IpcInvokeResult<TResponse> {
  return (envelope: IpcEnvelope<TPayload>): IpcInvokeResult<TResponse> => {
    return ipcRenderer.invoke(channel, envelope) as IpcInvokeResult<TResponse>;
  };
}

// Desktop Bridge API
export interface DesktopBridgeApi {
  // Channel constants
  readonly channels: typeof IPC_CHANNELS;
  
  // Workspace operations
  workspace: {
    list: (rootPath?: string) => IpcInvokeResult<{ workspaces: WorkspaceDescriptor[] }>;
    open: (path: string, workspaceId?: string) => IpcInvokeResult<{ workspace: WorkspaceDescriptor }>;
    status: (workspaceId: string) => IpcInvokeResult<{ workspace: WorkspaceDescriptor }>;
    worktreeSwitch: (
      workspaceId: string,
      worktreeId: string,
      sessionSubtreeRootSessionId?: string,
      reason?: string
    ) => IpcInvokeResult<{ success: boolean; workspaceId: string; worktreeId: string }>;
  };
  
  // Session operations
  session: {
    list: (workspaceId?: string, projectId?: string) => IpcInvokeResult<{ sessions: SessionDescriptor[] }>;
    create: (payload: SessionCreateIpcPayload, workspaceId?: string) => IpcInvokeResult<{ session: SessionDescriptor }>;
  };
  
  // Runtime operations
  runtime: {
    connect: (
      workspaceId: string,
      sessionId: string,
      runtimeTarget: 'desktop-local' | 'remote',
      transport: 'local' | 'remote' | 'browser-safe'
    ) => IpcInvokeResult<{ sessionId: string; transport: string; startedAt: string }>;
    subscribe: (sessionId: string, runId?: string) => IpcInvokeResult<{ subscribed: boolean; sessionId: string }>;
    control: (
      runId: string,
      action: 'cancel' | 'pause' | 'resume',
      sessionId?: string
    ) => IpcInvokeResult<{ success: boolean; runId: string; action: string }>;
  };
  
  // Intervention operations
  intervention: {
    submit: (request: InterventionSubmitIpcPayload['request'], workspaceId?: string, sessionId?: string) => 
      IpcInvokeResult<{ success: boolean; request: InterventionSubmitIpcPayload['request'] }>;
  };
  
  // Audit operations
  audit: {
    append: (event: AuditAppendIpcPayload['event'], workspaceId?: string, sessionId?: string) => 
      IpcInvokeResult<{ success: boolean }>;
  };
  
  // Agent operations
  agent: {
    loadDefaults: (source?: 'shipped' | 'workspace' | 'user') => IpcInvokeResult<TakomiAgentDefaultsBundle>;
  };
  
  // Dialog operations
  dialog: {
    openWorkspace: () => Promise<{ cancelled: boolean; filePaths: string[] }>;
    showMessage: (options: {
      type?: 'none' | 'info' | 'error' | 'question' | 'warning';
      title?: string;
      message: string;
      detail?: string;
      buttons?: string[];
    }) => Promise<{ response: number }>;
  };
  
  // Shell operations
  shell: {
    openExternal: (url: string) => Promise<{ success: boolean }>;
  };
  
  // Secure storage operations
  storage: {
    secureSet: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
    secureGet: (key: string) => Promise<{ value: string | null; error?: string }>;
  };
  
  // Notification operations
  notification: {
    show: (title: string, body: string) => Promise<{ success: boolean }>;
  };
  
  // Event listeners
  on: {
    runtimeEvent: (callback: (event: NormalizedRuntimeEvent) => void) => () => void;
  };
}

// Create the desktop bridge API
function createDesktopBridgeApi(): DesktopBridgeApi {
  // Workspace operations
  const workspaceList = createIpcInvoker<WorkspaceListIpcPayload, { workspaces: WorkspaceDescriptor[] }>(
    IPC_CHANNELS.workspaceList
  );
  const workspaceOpen = createIpcInvoker<WorkspaceOpenIpcPayload, { workspace: WorkspaceDescriptor }>(
    IPC_CHANNELS.workspaceOpen
  );
  const workspaceStatus = createIpcInvoker<WorkspaceStatusIpcPayload, { workspace: WorkspaceDescriptor }>(
    IPC_CHANNELS.workspaceStatus
  );
  const workspaceWorktreeSwitch = createIpcInvoker<WorkspaceWorktreeSwitchIpcPayload, { success: boolean; workspaceId: string; worktreeId: string }>(
    IPC_CHANNELS.workspaceWorktreeSwitch
  );
  
  // Session operations
  const sessionList = createIpcInvoker<SessionListIpcPayload, { sessions: SessionDescriptor[] }>(
    IPC_CHANNELS.sessionList
  );
  const sessionCreate = createIpcInvoker<SessionCreateIpcPayload, { session: SessionDescriptor }>(
    IPC_CHANNELS.sessionCreate
  );
  
  // Runtime operations
  const runtimeConnect = createIpcInvoker<RuntimeConnectIpcPayload, { sessionId: string; transport: string; startedAt: string }>(
    IPC_CHANNELS.runtimeConnect
  );
  const runtimeSubscribe = createIpcInvoker<RuntimeSubscribeIpcPayload, { subscribed: boolean; sessionId: string }>(
    IPC_CHANNELS.runtimeSubscribe
  );
  const runtimeControl = createIpcInvoker<RuntimeControlIpcPayload, { success: boolean; runId: string; action: string }>(
    IPC_CHANNELS.runtimeControl
  );
  
  // Intervention operations
  const interventionSubmit = createIpcInvoker<InterventionSubmitIpcPayload, { success: boolean; request: InterventionSubmitIpcPayload['request'] }>(
    IPC_CHANNELS.interventionSubmit
  );
  
  // Audit operations
  const auditAppend = createIpcInvoker<AuditAppendIpcPayload, { success: boolean }>(
    IPC_CHANNELS.auditAppend
  );
  
  // Agent operations
  const agentDefaultsLoad = createIpcInvoker<AgentDefaultsLoadIpcPayload, TakomiAgentDefaultsBundle>(
    IPC_CHANNELS.agentDefaultsLoad
  );

  return {
    channels: IPC_CHANNELS,
    
    workspace: {
      list: (rootPath?: string) => {
        const payload: WorkspaceListIpcPayload = rootPath ? { rootPath } : {};
        return workspaceList({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.workspaceList,
          payload,
          workspaceId: '',
        });
      },
      open: (path: string, workspaceId?: string) => {
        return workspaceOpen({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.workspaceOpen,
          payload: { path },
          workspaceId: workspaceId ?? '',
        });
      },
      status: (workspaceId: string) => {
        return workspaceStatus({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.workspaceStatus,
          payload: { workspaceId },
          workspaceId,
        });
      },
      worktreeSwitch: (workspaceId: string, worktreeId: string, sessionSubtreeRootSessionId?: string, reason?: string) => {
        const payload: WorkspaceWorktreeSwitchIpcPayload = {
          workspaceId,
          worktreeId,
          ...(sessionSubtreeRootSessionId ? { sessionSubtreeRootSessionId } : {}),
          ...(reason ? { reason } : {}),
        };
        return workspaceWorktreeSwitch({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.workspaceWorktreeSwitch,
          payload,
          workspaceId,
        });
      },
    },
    
    session: {
      list: (workspaceId?: string, projectId?: string) => {
        const payload: SessionListIpcPayload = workspaceId || projectId 
          ? { ...(workspaceId ? { workspaceId } : {}), ...(projectId ? { projectId } : {}) }
          : {};
        return sessionList({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.sessionList,
          payload,
          workspaceId: workspaceId ?? '',
        });
      },
      create: (payload: SessionCreateIpcPayload, workspaceId?: string) => {
        return sessionCreate({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.sessionCreate,
          payload,
          workspaceId: workspaceId ?? '',
        });
      },
    },
    
    runtime: {
      connect: (workspaceId: string, sessionId: string, runtimeTarget: 'desktop-local' | 'remote', transport: 'local' | 'remote' | 'browser-safe') => {
        return runtimeConnect({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.runtimeConnect,
          payload: { workspaceId, sessionId, runtimeTarget, transport },
          workspaceId,
          sessionId,
        });
      },
      subscribe: (sessionId: string, runId?: string) => {
        const payload: RuntimeSubscribeIpcPayload = { sessionId, ...(runId ? { runId } : {}) };
        return runtimeSubscribe({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.runtimeSubscribe,
          payload,
          sessionId,
        });
      },
      control: (runId: string, action: 'cancel' | 'pause' | 'resume', sessionId?: string) => {
        const payload: RuntimeControlIpcPayload = { runId, action };
        return runtimeControl({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.runtimeControl,
          payload,
          workspaceId: '',
          sessionId: sessionId ?? '',
        });
      },
    },
    
    intervention: {
      submit: (request: InterventionSubmitIpcPayload['request'], workspaceId?: string, sessionId?: string) => {
        return interventionSubmit({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.interventionSubmit,
          payload: { request },
          workspaceId: workspaceId ?? '',
          sessionId: sessionId ?? '',
        });
      },
    },
    
    audit: {
      append: (event: AuditAppendIpcPayload['event'], workspaceId?: string, sessionId?: string) => {
        return auditAppend({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.auditAppend,
          payload: { event },
          workspaceId: workspaceId ?? '',
          sessionId: sessionId ?? '',
        });
      },
    },
    
    agent: {
      loadDefaults: (source?: 'shipped' | 'workspace' | 'user') => {
        const payload: AgentDefaultsLoadIpcPayload = source ? { source } : {};
        return agentDefaultsLoad({
          id: `env-${Date.now()}`,
          channel: IPC_CHANNELS.agentDefaultsLoad,
          payload,
        });
      },
    },
    
    dialog: {
      openWorkspace: () => {
        return ipcRenderer.invoke('takomi:dialog:openWorkspace') as Promise<{ cancelled: boolean; filePaths: string[] }>;
      },
      showMessage: (options: {
        type?: 'none' | 'info' | 'error' | 'question' | 'warning';
        title?: string;
        message: string;
        detail?: string;
        buttons?: string[];
      }) => {
        return ipcRenderer.invoke('takomi:dialog:showMessage', options) as Promise<{ response: number }>;
      },
    },
    
    shell: {
      openExternal: (url: string) => {
        return ipcRenderer.invoke('takomi:shell:openExternal', url) as Promise<{ success: boolean }>;
      },
    },
    
    storage: {
      secureSet: (key: string, value: string) => {
        return ipcRenderer.invoke('takomi:storage:secureSet', key, value) as Promise<{ success: boolean; error?: string }>;
      },
      secureGet: (key: string) => {
        return ipcRenderer.invoke('takomi:storage:secureGet', key) as Promise<{ value: string | null; error?: string }>;
      },
    },
    
    notification: {
      show: (title: string, body: string) => {
        return ipcRenderer.invoke('takomi:notification:show', { title, body }) as Promise<{ success: boolean }>;
      },
    },
    
    on: {
      runtimeEvent: (callback: (event: NormalizedRuntimeEvent) => void) => {
        const handler = (_event: Electron.IpcRendererEvent, data: NormalizedRuntimeEvent) => {
          callback(data);
        };
        ipcRenderer.on('takomi:runtime:event', handler);
        return () => {
          ipcRenderer.removeListener('takomi:runtime:event', handler);
        };
      },
    },
  };
}

// Expose the API to the renderer
const desktopBridge = createDesktopBridgeApi();
contextBridge.exposeInMainWorld('takomi', desktopBridge);

// Type declaration for the renderer
declare global {
  interface Window {
    takomi: DesktopBridgeApi;
  }
}
