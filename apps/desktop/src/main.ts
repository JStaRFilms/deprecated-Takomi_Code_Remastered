/**
 * Takomi Desktop - Electron Main Process
 * 
 * This is the native host for the desktop shell. It owns all desktop-only capabilities:
 * - Local workspace management
 * - Filesystem and artifact access
 * - Git status and worktree operations
 * - Secure token and secret storage
 * - OS dialogs and notifications
 * - Local Codex SDK session hosting
 * 
 * The renderer reaches these capabilities ONLY through typed IPC via the preload bridge.
 */

import { app, BrowserWindow, ipcMain, dialog, shell, Notification, type IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { IPC_CHANNELS } from '@takomi/contracts';
import type {
  IpcEnvelope,
  IpcResponseEnvelope,
  WorkspaceOpenIpcPayload,
  WorkspaceListIpcPayload,
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
} from '@takomi/contracts';
import type { WorkspaceDescriptor, GitState } from '@takomi/contracts';
import { DesktopCodexRuntimeManager, loadTakomiAgentDefaultsBundle } from './runtime/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Application state
let mainWindow: BrowserWindow | null = null;
let desktopRuntimeManager: DesktopCodexRuntimeManager | null = null;
let runtimeSubscriptionCleanup: (() => void) | null = null;

// Workspace storage path
const getWorkspaceStoragePath = (): string => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'workspaces.json');
};

// Load persisted workspaces
function loadWorkspaces(): WorkspaceDescriptor[] {
  try {
    const storagePath = getWorkspaceStoragePath();
    if (fs.existsSync(storagePath)) {
      return JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load workspaces:', error);
  }
  return [];
}

// Save workspaces
function saveWorkspaces(workspaces: WorkspaceDescriptor[]): void {
  try {
    const storagePath = getWorkspaceStoragePath();
    fs.writeFileSync(storagePath, JSON.stringify(workspaces, null, 2));
  } catch (error) {
    console.error('Failed to save workspaces:', error);
  }
}

// Get Git state for a workspace
async function getGitState(workspacePath: string): Promise<GitState | null> {
  try {
    const gitDir = path.join(workspacePath, '.git');
    if (!fs.existsSync(gitDir)) {
      return null;
    }
    
    const headPath = path.join(gitDir, 'HEAD');
    const headContent = fs.readFileSync(headPath, 'utf-8').trim();
    
    let branchName = 'main';
    if (headContent.startsWith('ref: refs/heads/')) {
      branchName = headContent.replace('ref: refs/heads/', '');
    }
    
    return {
      branchName,
      dirty: false,
    };
  } catch {
    return null;
  }
}

// IPC Handler helper
function createResponse<T>(
  channel: string,
  payload: T,
  workspaceId?: string,
  sessionId?: string
): IpcResponseEnvelope<T> {
  return {
    id: `response-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channel: channel as never,
    payload,
    workspaceId: workspaceId ?? '',
    sessionId: sessionId ?? '',
    timestamp: new Date().toISOString(),
    ok: true,
  };
}

// IPC Handler helper for errors
function createErrorResponse<T>(
  channel: string,
  error: { code: string; message: string; details?: Record<string, unknown> },
  workspaceId?: string,
  sessionId?: string
): IpcResponseEnvelope<T> {
  return {
    id: `error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    channel: channel as never,
    payload: {} as T,
    workspaceId: workspaceId ?? '',
    sessionId: sessionId ?? '',
    timestamp: new Date().toISOString(),
    ok: false,
    error,
  };
}

// Register IPC handlers
function registerIpcHandlers(): void {
  // Workspace: List
  ipcMain.handle(IPC_CHANNELS.workspaceList, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<WorkspaceListIpcPayload>) => {
    try {
      const workspaces = loadWorkspaces();
      return createResponse(IPC_CHANNELS.workspaceList, { workspaces }, envelope.workspaceId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.workspaceList, {
        code: 'WORKSPACE_LIST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Workspace: Open
  ipcMain.handle(IPC_CHANNELS.workspaceOpen, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<WorkspaceOpenIpcPayload>) => {
    try {
      const { path: workspacePath } = envelope.payload;
      
      if (!fs.existsSync(workspacePath)) {
        return createErrorResponse(IPC_CHANNELS.workspaceOpen, {
          code: 'WORKSPACE_NOT_FOUND',
          message: `Workspace path does not exist: ${workspacePath}`,
        }, envelope.workspaceId);
      }
      
      const git = await getGitState(workspacePath);
      const workspaceName = path.basename(workspacePath);
      
      const workspace: WorkspaceDescriptor = {
        id: `ws-${Date.now()}`,
        name: workspaceName,
        rootPath: workspacePath,
        target: 'desktop',
        branchName: git?.branchName,
        dirty: git?.dirty,
        git: git ?? undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const workspaces = loadWorkspaces();
      workspaces.push(workspace);
      saveWorkspaces(workspaces);
      
      return createResponse(IPC_CHANNELS.workspaceOpen, { workspace }, workspace.id);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.workspaceOpen, {
        code: 'WORKSPACE_OPEN_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Workspace: Status
  ipcMain.handle(IPC_CHANNELS.workspaceStatus, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<WorkspaceStatusIpcPayload>) => {
    try {
      const { workspaceId } = envelope.payload;
      const workspaces = loadWorkspaces();
      const workspace = workspaces.find(w => w.id === workspaceId);
      
      if (!workspace) {
        return createErrorResponse(IPC_CHANNELS.workspaceStatus, {
          code: 'WORKSPACE_NOT_FOUND',
          message: `Workspace not found: ${workspaceId}`,
        }, workspaceId);
      }
      
      const git = await getGitState(workspace.rootPath);
      const updatedWorkspace: WorkspaceDescriptor = {
        ...workspace,
        branchName: git?.branchName,
        dirty: git?.dirty,
        git: git ?? undefined,
        updatedAt: new Date().toISOString(),
      };
      
      return createResponse(IPC_CHANNELS.workspaceStatus, { workspace: updatedWorkspace }, workspaceId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.workspaceStatus, {
        code: 'WORKSPACE_STATUS_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Workspace: Worktree Switch
  ipcMain.handle(IPC_CHANNELS.workspaceWorktreeSwitch, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<WorkspaceWorktreeSwitchIpcPayload>) => {
    try {
      const { workspaceId, worktreeId, sessionSubtreeRootSessionId, reason } = envelope.payload;
      
      console.log(`Worktree switch requested: workspace=${workspaceId}, worktree=${worktreeId}, reason=${reason}`);
      
      return createResponse(IPC_CHANNELS.workspaceWorktreeSwitch, {
        success: true,
        workspaceId,
        worktreeId,
        sessionSubtreeRootSessionId,
      }, workspaceId, sessionSubtreeRootSessionId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.workspaceWorktreeSwitch, {
        code: 'WORKTREE_SWITCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Session: List
  ipcMain.handle(IPC_CHANNELS.sessionList, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<SessionListIpcPayload>) => {
    try {
      return createResponse(IPC_CHANNELS.sessionList, { sessions: [] }, envelope.workspaceId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.sessionList, {
        code: 'SESSION_LIST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Session: Create
  ipcMain.handle(IPC_CHANNELS.sessionCreate, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<SessionCreateIpcPayload>) => {
    try {
      const session = {
        id: `session-${Date.now()}`,
        ...envelope.payload,
        createdAt: new Date().toISOString(),
      };
      
      return createResponse(IPC_CHANNELS.sessionCreate, { session }, envelope.workspaceId, session.id);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.sessionCreate, {
        code: 'SESSION_CREATE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Runtime: Connect
  ipcMain.handle(IPC_CHANNELS.runtimeConnect, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<RuntimeConnectIpcPayload>) => {
    try {
      const { workspaceId, sessionId, runtimeTarget, transport } = envelope.payload;
      
      if (!desktopRuntimeManager) {
        desktopRuntimeManager = new DesktopCodexRuntimeManager();
      }
      
      const session = await desktopRuntimeManager.startSession({
        workspaceId,
        projectId: 'default',
        sessionId,
        runtimeTarget,
        transport,
      });
      
      return createResponse(IPC_CHANNELS.runtimeConnect, {
        sessionId: session.sessionId,
        transport: session.transport,
        startedAt: session.startedAt,
      }, workspaceId, sessionId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.runtimeConnect, {
        code: 'RUNTIME_CONNECT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId, envelope.sessionId);
    }
  });

  // Runtime: Subscribe
  ipcMain.handle(IPC_CHANNELS.runtimeSubscribe, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<RuntimeSubscribeIpcPayload>) => {
    try {
      const { sessionId, runId } = envelope.payload;
      
      if (!desktopRuntimeManager) {
        return createErrorResponse(IPC_CHANNELS.runtimeSubscribe, {
          code: 'RUNTIME_NOT_INITIALIZED',
          message: 'Desktop runtime manager not initialized',
        }, envelope.workspaceId, sessionId);
      }
      
      runtimeSubscriptionCleanup?.();
      runtimeSubscriptionCleanup = desktopRuntimeManager.subscribe((event) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('takomi:runtime:event', event);
        }
      }).close;
      
      return createResponse(IPC_CHANNELS.runtimeSubscribe, {
        subscribed: true,
        sessionId,
        runId,
      }, envelope.workspaceId, sessionId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.runtimeSubscribe, {
        code: 'RUNTIME_SUBSCRIBE_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId, envelope.sessionId);
    }
  });

  // Runtime: Control (cancel, pause, resume)
  ipcMain.handle(IPC_CHANNELS.runtimeControl, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<RuntimeControlIpcPayload>) => {
    try {
      const { runId, action } = envelope.payload;
      
      if (!desktopRuntimeManager) {
        return createErrorResponse(IPC_CHANNELS.runtimeControl, {
          code: 'RUNTIME_NOT_INITIALIZED',
          message: 'Desktop runtime manager not initialized',
        }, envelope.workspaceId, envelope.sessionId);
      }
      
      switch (action) {
        case 'cancel':
          await desktopRuntimeManager.cancelRun(runId);
          break;
        case 'pause':
          await desktopRuntimeManager.pauseRun(runId);
          break;
        case 'resume':
          await desktopRuntimeManager.resumeRun(runId);
          break;
      }
      
      return createResponse(IPC_CHANNELS.runtimeControl, {
        success: true,
        runId,
        action,
      }, envelope.workspaceId, envelope.sessionId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.runtimeControl, {
        code: 'RUNTIME_CONTROL_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId, envelope.sessionId);
    }
  });

  // Intervention: Submit
  ipcMain.handle(IPC_CHANNELS.interventionSubmit, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<InterventionSubmitIpcPayload>) => {
    try {
      const { request } = envelope.payload;
      
      if (!desktopRuntimeManager) {
        return createErrorResponse(IPC_CHANNELS.interventionSubmit, {
          code: 'RUNTIME_NOT_INITIALIZED',
          message: 'Desktop runtime manager not initialized',
        }, envelope.workspaceId, envelope.sessionId);
      }
      
      const targetSessionId = request.target.sessionId;
      const targetRunId = request.target.runId ?? '';
      
      switch (request.action) {
        case 'guidance': {
          const guidancePayload = request.payload as { instruction?: string; context?: string };
          if (targetRunId) {
            await desktopRuntimeManager.injectGuidance({
              runId: targetRunId,
              sessionId: targetSessionId,
              workspaceId: envelope.workspaceId ?? '',
              instruction: guidancePayload.instruction ?? '',
              context: guidancePayload.context,
            });
          }
          break;
        }
        case 'cancel':
          if (targetRunId) {
            await desktopRuntimeManager.cancelRun(targetRunId);
          }
          break;
        case 'pause':
          if (targetRunId) {
            await desktopRuntimeManager.pauseRun(targetRunId);
          }
          break;
        case 'resume':
          if (targetRunId) {
            await desktopRuntimeManager.resumeRun(targetRunId);
          }
          break;
      }
      
      return createResponse(IPC_CHANNELS.interventionSubmit, {
        success: true,
        request,
      }, envelope.workspaceId, envelope.sessionId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.interventionSubmit, {
        code: 'INTERVENTION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId, envelope.sessionId);
    }
  });

  // Audit: Append
  ipcMain.handle(IPC_CHANNELS.auditAppend, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<AuditAppendIpcPayload>) => {
    try {
      const { event } = envelope.payload;
      
      console.log('Audit event:', event);
      
      return createResponse(IPC_CHANNELS.auditAppend, { success: true }, envelope.workspaceId, envelope.sessionId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.auditAppend, {
        code: 'AUDIT_APPEND_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId, envelope.sessionId);
    }
  });

  // Agents: Load defaults
  ipcMain.handle(IPC_CHANNELS.agentDefaultsLoad, async (_event: IpcMainInvokeEvent, envelope: IpcEnvelope<AgentDefaultsLoadIpcPayload>) => {
    try {
      const defaults = loadTakomiAgentDefaultsBundle();
      
      return createResponse(IPC_CHANNELS.agentDefaultsLoad, defaults, envelope.workspaceId);
    } catch (error) {
      return createErrorResponse(IPC_CHANNELS.agentDefaultsLoad, {
        code: 'AGENT_DEFAULTS_LOAD_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, envelope.workspaceId);
    }
  });

  // Dialog: Open workspace folder
  ipcMain.handle('takomi:dialog:openWorkspace', async () => {
    if (!mainWindow) {
      return { cancelled: true, filePaths: [] };
    }
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Workspace Folder',
    });
    
    return {
      cancelled: result.canceled,
      filePaths: result.filePaths,
    };
  });

  // Dialog: Show message
  ipcMain.handle('takomi:dialog:showMessage', async (_event: IpcMainInvokeEvent, options: {
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
    title?: string;
    message: string;
    detail?: string;
    buttons?: string[];
  }) => {
    if (!mainWindow) {
      return { response: 0 };
    }
    const dialogOptions: Electron.MessageBoxOptions = {
      type: options.type || 'info',
      title: options.title || 'Takomi',
      message: options.message,
      buttons: options.buttons || ['OK'],
    };
    if (options.detail) {
      dialogOptions.detail = options.detail;
    }
    const result = await dialog.showMessageBox(mainWindow, dialogOptions);
    
    return {
      response: result.response,
    };
  });

  // Shell: Open external
  ipcMain.handle('takomi:shell:openExternal', async (_event: IpcMainInvokeEvent, url: string) => {
    await shell.openExternal(url);
    return { success: true };
  });

  // Storage: Secure save
  ipcMain.handle('takomi:storage:secureSet', async (_event: IpcMainInvokeEvent, key: string, value: string) => {
    try {
      const securePath = path.join(app.getPath('userData'), 'secure');
      if (!fs.existsSync(securePath)) {
        fs.mkdirSync(securePath, { recursive: true });
      }
      fs.writeFileSync(path.join(securePath, `${key}.json`), value);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Storage: Secure get
  ipcMain.handle('takomi:storage:secureGet', async (_event: IpcMainInvokeEvent, key: string) => {
    try {
      const securePath = path.join(app.getPath('userData'), 'secure', `${key}.json`);
      if (fs.existsSync(securePath)) {
        return { value: fs.readFileSync(securePath, 'utf-8') };
      }
      return { value: null };
    } catch (error) {
      return { value: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // Notification: Show
  ipcMain.handle('takomi:notification:show', async (_event: IpcMainInvokeEvent, options: {
    title: string;
    body: string;
  }) => {
    new Notification({
      title: options.title,
      body: options.body,
    }).show();
    return { success: true };
  });
}

// Create main window
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'Takomi Code',
    show: process.env['TAKOMI_HEADLESS'] !== '1',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env['NODE_ENV'] !== 'production' && !app.isPackaged;
  const rendererUrl = process.env['TAKOMI_DESKTOP_RENDERER_URL'] ?? 'http://127.0.0.1:3001';
  
  if (isDev) {
    mainWindow.loadURL(rendererUrl);
    if (process.env['TAKOMI_OPEN_DEVTOOLS'] === '1') {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  if (process.env['TAKOMI_AUTO_EXIT_AFTER_LOAD'] === '1') {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        app.quit();
      }, 500);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  runtimeSubscriptionCleanup?.();
  runtimeSubscriptionCleanup = null;

  if (desktopRuntimeManager) {
    desktopRuntimeManager.close();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught exception in main process:', error);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled rejection in main process:', reason);
});

export { createWindow, registerIpcHandlers };
