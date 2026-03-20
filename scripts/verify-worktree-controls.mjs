import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

import {
  createWorktree,
  generateWorktreeFolderName,
  getGitState,
  listWorktrees,
  validateWorktree,
} from '../apps/desktop/src/git-service.ts';
import { createChannelRouter } from '../apps/local-bridge/src/handlers.ts';
import {
  SessionLineageRegistry,
  WorktreeManager,
} from '../packages/orchestration/src/index.ts';
import { IPC_CHANNELS } from '../packages/contracts/src/index.ts';

function run(command, args, cwd) {
  const isWindows = process.platform === 'win32';
  const executable = isWindows ? 'cmd.exe' : command;
  const commandArgs = isWindows ? ['/d', '/s', '/c', command, ...args] : args;
  return new Promise((resolve, reject) => {
    execFile(executable, commandArgs, { cwd, timeout: 120_000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout.toString().trim());
    });
  });
}

async function setupTempRepo() {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'takomi-worktree-'));
  await run('git', ['init', '-b', 'main'], tempRoot);
  await run('git', ['config', 'user.email', 'takomi@example.com'], tempRoot);
  await run('git', ['config', 'user.name', 'Takomi Test'], tempRoot);

  await fs.writeFile(path.join(tempRoot, 'package.json'), JSON.stringify({
    name: 'takomi-worktree-test',
    version: '1.0.0'
  }, null, 2));
  await fs.writeFile(path.join(tempRoot, '.env'), 'BASE_URL=http://localhost\n');
  await fs.writeFile(path.join(tempRoot, '.env.local'), 'FEATURE_FLAG=true\n');
  await fs.writeFile(path.join(tempRoot, '.env.production'), 'SECRET=blocked\n');
  await run('npm', ['install', '--package-lock-only', '--ignore-scripts'], tempRoot);
  await run('git', ['add', '.'], tempRoot);
  await run('git', ['commit', '-m', 'Initial commit'], tempRoot);

  return tempRoot;
}

async function testDesktopGitService() {
  const repo = await setupTempRepo();
  try {
    const gitState = await getGitState(repo);
    assert.ok(gitState, 'Git state should resolve for initialized repo');
    assert.equal(gitState?.branchName, 'main', 'Git state should detect current branch');
    assert.equal(gitState?.dirty, false, 'Fresh repo should be clean');

    const folderName = generateWorktreeFolderName({
      projectSlug: 'Takomi Code',
      taskSlug: 'Refactor Auth',
      agentIndex: 1,
    });
    assert.equal(
      folderName,
      'takomi-code-refactor-auth-agent-1',
      'Readable worktree folder naming should match project-task-agent template'
    );

    const created = await createWorktree(repo, {
      workspaceId: 'ws-test',
      branchName: 'feat/refactor-auth',
      namingConfig: {
        projectSlug: 'Takomi Code',
        taskSlug: 'Refactor Auth',
        agentIndex: 1,
      },
      runBootstrap: true,
      envCarryoverAllowlist: ['.env', '.env.production'],
      installDependencies: true,
    });

    assert.equal(created.success, true, 'Desktop git service should create worktree');
    assert.match(
      created.worktreePath,
      /[\\/]\.takomi[\\/]worktrees[\\/]takomi-code-refactor-auth-agent-1$/,
      'Worktree path should live under .takomi/worktrees with readable folder name'
    );
    assert.equal(created.label, 'takomi-code-refactor-auth-agent-1', 'Worktree label should match folder name');
    assert.ok(created.bootstrapStatus, 'Bootstrap status should be returned after creation');
    assert.deepEqual(created.bootstrapStatus?.envFilesCopied, ['.env'], 'Allowlisted env file should be copied');
    assert.deepEqual(created.bootstrapStatus?.envFilesBlocked, ['.env.production'], 'Denied env file should be blocked');
    assert.equal(created.bootstrapStatus?.dependencyInstallRan, true, 'Dependency bootstrap should run when enabled');
    assert.equal(created.bootstrapStatus?.dependencyInstallExitCode, 0, 'Dependency bootstrap should succeed in controlled repo');

    const copiedEnv = await fs.readFile(path.join(created.worktreePath, '.env'), 'utf8');
    assert.match(copiedEnv, /BASE_URL=http:\/\/localhost/, 'Copied env file should exist in worktree');
    const blockedEnv = await fs.readFile(path.join(created.worktreePath, '.env.production'), 'utf8');
    assert.match(
      blockedEnv,
      /SECRET=blocked/,
      'Tracked env files may still exist via git checkout, but bootstrap must report them as blocked'
    );

    assert.equal(await validateWorktree(created.worktreePath), true, 'Created worktree should validate as a git worktree');

    const listedWorktrees = await listWorktrees(repo, 'ws-test');
    const createdReference = listedWorktrees.find((worktree) => worktree.rootPath === created.worktreePath);
    assert.ok(createdReference, 'Created worktree should appear in git worktree listing');
    assert.equal(createdReference?.label, 'takomi-code-refactor-auth-agent-1', 'Listed worktree should expose readable label');
  } finally {
    await fs.rm(repo, { recursive: true, force: true });
  }
}

function testSubtreeScoping() {
  const registry = new SessionLineageRegistry();
  const root = {
    id: 'sess-root',
    projectId: 'proj-1',
    parentSessionId: null,
    kind: 'project',
    name: 'Root',
    status: 'idle',
    workspaceId: 'ws-1',
    worktreePath: null,
    worktreeId: 'main',
    lineage: {
      rootSessionId: 'sess-root',
      parentSessionId: null,
      ancestorSessionIds: [],
      depth: 0,
      inheritsWorkspace: true,
      inheritedWorktreeId: 'main',
    },
  };
  const inheritingChild = {
    ...root,
    id: 'sess-child-1',
    parentSessionId: 'sess-root',
    kind: 'task',
    name: 'Child 1',
    lineage: {
      rootSessionId: 'sess-root',
      parentSessionId: 'sess-root',
      ancestorSessionIds: ['sess-root'],
      depth: 1,
      inheritsWorkspace: true,
      inheritedWorktreeId: 'main',
    },
  };
  const explicitChild = {
    ...root,
    id: 'sess-child-2',
    parentSessionId: 'sess-root',
    kind: 'task',
    name: 'Child 2',
    worktreeId: 'explicit-wt',
    lineage: {
      rootSessionId: 'sess-root',
      parentSessionId: 'sess-root',
      ancestorSessionIds: ['sess-root'],
      depth: 1,
      inheritsWorkspace: true,
      inheritedWorktreeId: 'explicit-wt',
    },
  };

  registry.register(root);
  registry.register(inheritingChild);
  registry.register(explicitChild);

  const manager = new WorktreeManager(registry);
  const switchResult = manager.applyWorktreeSwitch({
    workspaceId: 'ws-1',
    newWorktreeId: 'wt-agent-1',
    newWorktreePath: 'C:/repo/.takomi/worktrees/takomi-code-task-agent-1',
    sessionSubtreeRootSessionId: 'sess-root',
    reason: 'delegated task',
  });

  assert.deepEqual(
    switchResult.scope.affectedSessionIds.sort(),
    ['sess-child-1', 'sess-root'],
    'Only subtree sessions still inheriting prior worktree should be affected'
  );
  assert.deepEqual(
    switchResult.scope.skippedSessionIds,
    ['sess-child-2'],
    'Explicitly reassigned descendants should be skipped'
  );
}

async function testBrowserCapabilityFallback() {
  const router = createChannelRouter({
    broadcast() {},
  });

  const createResponse = await router.route({
    channel: IPC_CHANNELS.workspaceWorktreeCreate,
    payload: {
      workspaceId: 'ws-local-01',
      branchName: 'feat/test',
      taskSlug: 'test-task',
      label: 'test-task-agent-1',
    },
    requestId: 'req-create-worktree',
  });

  assert.equal(createResponse.ok, false, 'Browser bridge should not pretend local worktree creation works');
  assert.equal(createResponse.error?.code, 'CAPABILITY_UNAVAILABLE', 'Browser bridge should return explicit capability error');
}

await testDesktopGitService();
testSubtreeScoping();
await testBrowserCapabilityFallback();
console.log('Worktree controls verification passed.');
