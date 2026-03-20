import type { ShellTarget } from './constants.js';

export interface ShellCapabilities {
  readonly shell: ShellTarget;
  readonly browserCompatible: boolean;
  readonly nativeBridge: boolean;
  readonly filesystemAccess: boolean;
  readonly gitAccess: boolean;
  readonly worktreeSwitching: boolean;
  readonly secureStorage: boolean;
  readonly osDialogs: boolean;
  readonly localRuntimeHosting: boolean;
  readonly remoteRuntimeTransport: boolean;
  readonly websocketBridge: boolean;
}

export interface BrowserFallbackNote {
  readonly capability: string;
  readonly mode: 'remote' | 'unavailable';
  readonly message: string;
  readonly recommendedAction?: string;
}

export interface WorkspaceReference {
  readonly id: string;
  readonly name: string;
  readonly rootPath: string;
}

export interface GitState {
  readonly branchName: string;
  readonly dirty: boolean;
  readonly headSha?: string | undefined;
  readonly upstreamBranchName?: string | undefined;
  readonly aheadCount?: number | undefined;
  readonly behindCount?: number | undefined;
}

export interface WorktreeReference {
  readonly id: string;
  readonly workspaceId: string;
  readonly rootPath: string;
  readonly branchName: string;
  readonly headSha?: string | undefined;
  readonly dirty: boolean;
  readonly active: boolean;
  readonly explicit: boolean;
  readonly parentWorktreeId: string | null;
  readonly inheritedFromWorkspaceId: string | null;
  readonly createdAt?: string | undefined;
}

export interface WorkspaceDescriptor extends WorkspaceReference {
  readonly target: ShellTarget;
  readonly branchName?: string | null | undefined;
  readonly dirty?: boolean | undefined;
  readonly currentWorktreeId?: string | null | undefined;
  readonly git?: GitState | undefined;
  readonly capabilities?: ShellCapabilities | undefined;
  readonly worktrees?: readonly WorktreeReference[] | undefined;
  readonly createdAt?: string | undefined;
  readonly updatedAt?: string | undefined;
}

export interface ProjectDescriptor {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly description: string;
  readonly slug?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}
