/**
 * Takomi Desktop - Git Service
 *
 * Provides real Git inspection and worktree management through child_process.
 * This service is ONLY available in the Electron main process.
 * All results flow to the renderer through typed IPC.
 *
 * Worktree naming convention:
 *   .takomi/worktrees/<project-slug>-<task-slug>-agent-<n>
 *
 * Bootstrap behavior after worktree creation:
 *   1. Copy env files per allowlist
 *   2. Optionally run pnpm install
 *   3. Persist and report bootstrap status
 */

import { execFile } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type {
  GitState,
  WorktreeReference,
  WorktreeBootstrapStatus,
  WorktreeNamingConfig
} from '@takomi/contracts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function runGit(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, timeout: 30_000, maxBuffer: 1024 * 512 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function runCommand(cwd: string, cmd: string, args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const isWindows = process.platform === 'win32';
  const executable = isWindows ? 'cmd.exe' : cmd;
  const commandArgs = isWindows ? ['/d', '/s', '/c', cmd, ...args] : args;
  return new Promise((resolve) => {
    execFile(executable, commandArgs, { cwd, timeout: 120_000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout?.toString() ?? '',
        stderr: stderr?.toString() ?? '',
        exitCode: error ? (error as NodeJS.ErrnoException & { code?: number }).code ?? 1 : 0,
      });
    });
  });
}

/** Slugify a string for use in folder names */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
}

// ---------------------------------------------------------------------------
// Worktree root directory
// ---------------------------------------------------------------------------

/**
 * Returns the dedicated worktree root folder: <workspacePath>/.takomi/worktrees/
 */
export function getWorktreeRootDir(workspacePath: string): string {
  return path.join(workspacePath, '.takomi', 'worktrees');
}

/**
 * Ensures the worktree root directory exists.
 */
function ensureWorktreeRootDir(workspacePath: string): string {
  const dir = getWorktreeRootDir(workspacePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Generates a human-readable worktree folder name from naming config.
 * Shape: <project-slug>-<task-slug>-agent-<n>
 */
export function generateWorktreeFolderName(config: WorktreeNamingConfig): string {
  const projectSlug = slugify(config.projectSlug);
  const taskSlug = slugify(config.taskSlug);
  return `${projectSlug}-${taskSlug}-agent-${config.agentIndex}`;
}

/**
 * Resolves the full path for a worktree given naming config.
 */
export function resolveWorktreePath(workspacePath: string, config: WorktreeNamingConfig): string {
  const rootDir = getWorktreeRootDir(workspacePath);
  const folderName = generateWorktreeFolderName(config);
  return path.join(rootDir, folderName);
}

// ---------------------------------------------------------------------------
// Git State
// ---------------------------------------------------------------------------

/**
 * Reads the full Git state for a workspace root.
 * Falls back to reading .git/HEAD directly if git binary is unavailable.
 */
export async function getGitState(workspacePath: string): Promise<GitState | null> {
  try {
    const gitDir = path.join(workspacePath, '.git');
    if (!fs.existsSync(gitDir)) {
      return null;
    }

    // Branch name
    let branchName = 'main';
    try {
      branchName = await runGit(workspacePath, ['rev-parse', '--abbrev-ref', 'HEAD']);
      if (branchName === 'HEAD') {
        branchName = await runGit(workspacePath, ['rev-parse', '--short', 'HEAD']);
      }
    } catch {
      try {
        const headContent = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf-8').trim();
        if (headContent.startsWith('ref: refs/heads/')) {
          branchName = headContent.replace('ref: refs/heads/', '');
        }
      } catch {
        // keep default
      }
    }

    // HEAD SHA
    let headSha: string | undefined;
    try {
      headSha = await runGit(workspacePath, ['rev-parse', 'HEAD']);
    } catch {
      // detached or no commits yet
    }

    // Dirty state
    let dirty = false;
    try {
      const statusOutput = await runGit(workspacePath, ['status', '--porcelain']);
      dirty = statusOutput.length > 0;
    } catch {
      // cannot determine dirty state
    }

    // Upstream tracking
    let upstreamBranchName: string | undefined;
    let aheadCount: number | undefined;
    let behindCount: number | undefined;
    try {
      upstreamBranchName = await runGit(workspacePath, ['rev-parse', '--abbrev-ref', '@{upstream}']);
      const revList = await runGit(workspacePath, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']);
      const parts = revList.split(/\s+/);
      if (parts.length === 2) {
        aheadCount = parseInt(parts[0]!, 10) || 0;
        behindCount = parseInt(parts[1]!, 10) || 0;
      }
    } catch {
      // no upstream configured
    }

    return {
      branchName,
      dirty,
      headSha,
      upstreamBranchName,
      aheadCount,
      behindCount,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Worktree Listing
// ---------------------------------------------------------------------------

/**
 * Lists all git worktrees for a workspace.
 */
export async function listWorktrees(
  workspacePath: string,
  workspaceId: string
): Promise<WorktreeReference[]> {
  try {
    const output = await runGit(workspacePath, ['worktree', 'list', '--porcelain']);
    const worktrees: WorktreeReference[] = [];
    let currentEntry: Record<string, string> = {};

    for (const line of output.split('\n')) {
      if (!line.trim()) {
        if (currentEntry['worktree']) {
          worktrees.push(buildWorktreeReference(workspacePath, workspaceId, currentEntry));
        }
        currentEntry = {};
        continue;
      }
      const spaceIdx = line.indexOf(' ');
      if (spaceIdx > 0) {
        const key = line.substring(0, spaceIdx);
        const value = line.substring(spaceIdx + 1);
        currentEntry[key] = value;
      }
    }
    // Flush last entry
    if (currentEntry['worktree']) {
      worktrees.push(buildWorktreeReference(workspacePath, workspaceId, currentEntry));
    }

    // Enrich with dirty state for each worktree
    for (let i = 0; i < worktrees.length; i++) {
      const wt = worktrees[i]!;
      const dirty = await getWorktreeDirtyState(wt.rootPath);
      worktrees[i] = { ...wt, dirty };
    }

    return worktrees;
  } catch {
    return [];
  }
}

function buildWorktreeReference(
  workspacePath: string,
  workspaceId: string,
  entry: Record<string, string>
): WorktreeReference {
  const normalizedWorkspacePath = path.normalize(workspacePath);
  const rootPath = path.normalize(entry['worktree'] ?? workspacePath);
  const isMain = rootPath === normalizedWorkspacePath;
  const branchName = entry['branch']?.replace('refs/heads/', '') ?? 'main';
  const headSha = entry['HEAD'];

  // Derive a human-readable label from the folder name for non-main worktrees
  let label: string | undefined;
  if (!isMain) {
    const folderName = path.basename(rootPath);
    label = folderName;
  }

  return {
    id: isMain ? 'main' : `wt-${path.basename(rootPath)}`,
    workspaceId,
    rootPath,
    branchName,
    headSha,
    dirty: false,
    active: isMain,
    explicit: !isMain,
    parentWorktreeId: isMain ? null : 'main',
    inheritedFromWorkspaceId: null,
    label,
  };
}

// ---------------------------------------------------------------------------
// Worktree Creation with Bootstrap
// ---------------------------------------------------------------------------

/** Default env files that are safe to carry over (allowlist) */
const DEFAULT_ENV_CARRYOVER_ALLOWLIST = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.development.local',
];

/** Files that must NEVER be copied (denylist) */
const ENV_CARRYOVER_DENYLIST = [
  '.env.production',
  '.env.production.local',
  '.env.staging',
];

export interface CreateWorktreeOptions {
  readonly workspaceId: string;
  readonly branchName: string;
  readonly namingConfig: WorktreeNamingConfig;
  readonly runBootstrap?: boolean;
  readonly envCarryoverAllowlist?: readonly string[];
  readonly installDependencies?: boolean;
}

export interface CreateWorktreeResult {
  readonly success: boolean;
  readonly worktreePath: string;
  readonly label: string;
  readonly bootstrapStatus?: WorktreeBootstrapStatus;
  readonly error?: string;
}

/**
 * Creates a new git worktree with human-readable naming and optional bootstrap.
 *
 * Path: <workspace>/.takomi/worktrees/<project-slug>-<task-slug>-agent-<n>
 */
export async function createWorktree(
  workspacePath: string,
  options: CreateWorktreeOptions
): Promise<CreateWorktreeResult> {
  const folderName = generateWorktreeFolderName(options.namingConfig);
  const label = folderName;

  try {
    const rootDir = ensureWorktreeRootDir(workspacePath);
    const worktreeDir = path.join(rootDir, folderName);
    const resolvedDir = path.resolve(worktreeDir);

    // Safety: ensure worktree is within the .takomi/worktrees directory
    const resolvedRoot = path.resolve(rootDir);
    if (!resolvedDir.startsWith(resolvedRoot)) {
      return { success: false, worktreePath: '', label, error: 'Worktree path escapes workspace boundary' };
    }

    // Safety: prevent overwriting existing worktree
    if (fs.existsSync(resolvedDir)) {
      return { success: false, worktreePath: '', label, error: `Worktree folder already exists: ${folderName}` };
    }

    // Check if branch exists
    let branchExists = false;
    try {
      await runGit(workspacePath, ['rev-parse', '--verify', options.branchName]);
      branchExists = true;
    } catch {
      // branch doesn't exist, will create with -b
    }

    if (branchExists) {
      await runGit(workspacePath, ['worktree', 'add', resolvedDir, options.branchName]);
    } else {
      await runGit(workspacePath, ['worktree', 'add', '-b', options.branchName, resolvedDir]);
    }

    // Run bootstrap if requested
    let bootstrapStatus: WorktreeBootstrapStatus | undefined;
    if (options.runBootstrap) {
      bootstrapStatus = await runWorktreeBootstrap(
        workspacePath,
        resolvedDir,
        options.envCarryoverAllowlist ?? DEFAULT_ENV_CARRYOVER_ALLOWLIST,
        options.installDependencies ?? false
      );
    }

    return {
      success: true,
      worktreePath: resolvedDir,
      label,
      ...(bootstrapStatus !== undefined ? { bootstrapStatus } : {}),
    };
  } catch (error) {
    return {
      success: false,
      worktreePath: '',
      label,
      error: error instanceof Error ? error.message : 'Unknown error creating worktree',
    };
  }
}

// ---------------------------------------------------------------------------
// Worktree Bootstrap
// ---------------------------------------------------------------------------

/**
 * Runs first-run bootstrapping for a newly created worktree:
 * 1. Copies env files per allowlist (with denylist safety)
 * 2. Optionally runs pnpm install
 * 3. Returns bootstrap status for persistence and UI
 */
async function runWorktreeBootstrap(
  sourceWorkspacePath: string,
  targetWorktreePath: string,
  envAllowlist: readonly string[],
  installDependencies: boolean
): Promise<WorktreeBootstrapStatus> {
  const startedAt = new Date().toISOString();
  const envFilesCopied: string[] = [];
  const envFilesBlocked: string[] = [];
  let dependencyInstallRan = false;
  let dependencyInstallExitCode: number | undefined;
  let error: string | undefined;

  try {
    // Step 1: Copy env files per allowlist
    for (const fileName of envAllowlist) {
      // Safety: check denylist
      if (ENV_CARRYOVER_DENYLIST.includes(fileName)) {
        envFilesBlocked.push(fileName);
        continue;
      }

      const sourcePath = path.join(sourceWorkspacePath, fileName);
      const targetPath = path.join(targetWorktreePath, fileName);

      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          envFilesCopied.push(fileName);
        } catch {
          envFilesBlocked.push(fileName);
        }
      }
    }

    // Step 2: Optionally run pnpm install
    if (installDependencies) {
      // Check if project uses pnpm
      const pnpmLockPath = path.join(sourceWorkspacePath, 'pnpm-lock.yaml');
      const npmLockPath = path.join(sourceWorkspacePath, 'package-lock.json');

      if (fs.existsSync(pnpmLockPath)) {
        const result = await runCommand(targetWorktreePath, 'pnpm', ['install', '--frozen-lockfile']);
        dependencyInstallRan = true;
        dependencyInstallExitCode = result.exitCode;
        if (result.exitCode !== 0) {
          error = `pnpm install exited with code ${result.exitCode}`;
        }
      } else if (fs.existsSync(npmLockPath)) {
        const result = await runCommand(targetWorktreePath, 'npm', ['ci']);
        dependencyInstallRan = true;
        dependencyInstallExitCode = result.exitCode;
        if (result.exitCode !== 0) {
          error = `npm ci exited with code ${result.exitCode}`;
        }
      }
      // If no lockfile, skip dependency install silently
    }
  } catch (bootstrapError) {
    error = bootstrapError instanceof Error ? bootstrapError.message : 'Unknown bootstrap error';
  }

  const completedAt = new Date().toISOString();

  return {
    state: error ? 'failed' : 'completed',
    envFilesCopied,
    envFilesBlocked,
    dependencyInstallRan,
    dependencyInstallExitCode,
    error,
    startedAt,
    completedAt,
  };
}

// ---------------------------------------------------------------------------
// Validation and Cleanup
// ---------------------------------------------------------------------------

/**
 * Validates that a worktree path is reachable and is a valid git worktree.
 */
export async function validateWorktree(worktreePath: string): Promise<boolean> {
  try {
    const gitFile = path.join(worktreePath, '.git');
    if (!fs.existsSync(gitFile)) {
      return false;
    }
    const content = fs.readFileSync(gitFile, 'utf-8').trim();
    return content.startsWith('gitdir:');
  } catch {
    return false;
  }
}

/**
 * Removes a git worktree (safely).
 * Does NOT delete uncommitted work — requires clean state.
 */
export async function removeWorktree(
  workspacePath: string,
  worktreePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const statusOutput = await runGit(worktreePath, ['status', '--porcelain']);
    if (statusOutput.trim().length > 0) {
      return {
        success: false,
        error: 'Worktree has uncommitted changes. Commit or stash before removing.',
      };
    }

    await runGit(workspacePath, ['worktree', 'remove', worktreePath]);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error removing worktree',
    };
  }
}

/**
 * Gets the dirty status of a specific worktree path.
 */
export async function getWorktreeDirtyState(worktreePath: string): Promise<boolean> {
  try {
    const statusOutput = await runGit(worktreePath, ['status', '--porcelain']);
    return statusOutput.trim().length > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Exported constants for UI/persistence
// ---------------------------------------------------------------------------

export { DEFAULT_ENV_CARRYOVER_ALLOWLIST, ENV_CARRYOVER_DENYLIST };
