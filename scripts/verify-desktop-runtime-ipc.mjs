import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { renderToStaticMarkup } from 'react-dom/server';
import { startStatusServer, renderAppPage, getRepoRoot } from './dev-common.mjs';

const repoRoot = getRepoRoot();
const electronCommand = process.platform === 'win32'
  ? path.join(repoRoot, 'node_modules', '.bin', 'electron.cmd')
  : path.join(repoRoot, 'node_modules', '.bin', 'electron');
const desktopEntry = path.join(repoRoot, 'apps', 'desktop', 'dist', 'main.js');

await compileWorkspace();

const desktopModule = await import('../apps/desktop/dist/index.js');
const runtimeModule = await import('../apps/desktop/dist/runtime/index.js');

await verifyDesktopRuntimeManager(runtimeModule.createDesktopCodexRuntimeManager);
await verifyAgentDefaultsLoading(runtimeModule.loadTakomiAgentDefaultsBundle);
await verifyElectronBoot(desktopModule.createDesktopAppBootstrap, desktopModule.renderDesktopApp);

console.log('Desktop runtime and IPC verification passed.');

async function compileWorkspace() {
  const code = await runCommand(process.execPath, [path.join(repoRoot, 'scripts', 'typecheck.mjs')], {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });

  assert.equal(code, 0, 'Expected workspace build-mode typecheck to succeed');
}

async function verifyDesktopRuntimeManager(createDesktopCodexRuntimeManager) {
  const manager = createDesktopCodexRuntimeManager();
  const receivedKinds = [];

  const subscription = manager.subscribe((event) => {
    receivedKinds.push(event.kind);
  });

  const session = await manager.startSession({
    workspaceId: 'ws-verify',
    projectId: 'proj-verify',
    sessionId: 'session-verify',
    runtimeTarget: 'desktop-local',
    transport: 'local',
  });

  const run = await manager.startRun({
    workspaceId: session.workspaceId,
    projectId: session.projectId,
    sessionId: session.sessionId,
    runtimeTarget: session.runtimeTarget,
    transport: session.transport,
    prompt: 'Verify runtime lifecycle',
  });

  await manager.pauseRun(run.runId);
  await manager.resumeRun(run.runId);
  await manager.cancelRun(run.runId);

  subscription.close();
  manager.close();

  assert.ok(receivedKinds.includes('run.starting'), 'Expected run.starting event');
  assert.ok(receivedKinds.includes('run.paused'), 'Expected run.paused event');
  assert.ok(receivedKinds.includes('run.resumed'), 'Expected run.resumed event');
  assert.ok(receivedKinds.includes('run.cancelled'), 'Expected run.cancelled event');
}

async function verifyAgentDefaultsLoading(loadTakomiAgentDefaultsBundle) {
  const bundle = loadTakomiAgentDefaultsBundle(repoRoot);

  assert.ok(bundle.modes.length > 0, 'Expected Takomi mode defaults to load');
  assert.ok(bundle.sources.length >= 2, 'Expected defaults bundle to record source files');
  assert.ok(bundle.settings.activeModeSlug.startsWith('vibe-'), 'Expected an active Takomi mode slug');
}

async function verifyElectronBoot(createDesktopAppBootstrap, renderDesktopApp) {
  const desktopApp = createDesktopAppBootstrap();
  const renderedShell = renderToStaticMarkup(renderDesktopApp(desktopApp));
  const server = await startStatusServer({
    name: 'takomi-desktop-verify',
    port: 3001,
    title: 'Takomi Desktop Verify',
    subtitle: 'Verification renderer surface for Electron desktop boot.',
    details: [{ label: 'Mode', value: 'headless verification' }],
    routes: {
      '/': async () => ({
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
        body: renderAppPage({
          title: 'Takomi Desktop Verify',
          description: 'Headless verification page for the desktop shell.',
          body: renderedShell,
        }),
      }),
    },
  });

  try {
    const code = await runCommand(electronCommand, [desktopEntry], {
      cwd: repoRoot,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        TAKOMI_DESKTOP_RENDERER_URL: 'http://127.0.0.1:3001',
        TAKOMI_HEADLESS: '1',
        TAKOMI_AUTO_EXIT_AFTER_LOAD: '1',
        TAKOMI_OPEN_DEVTOOLS: '0',
      },
      stdio: 'inherit',
    });

    assert.equal(code, 0, 'Expected Electron to boot and exit cleanly');
  } finally {
    await server.close();
  }
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.on('error', reject);
    child.on('exit', (code) => {
      resolve(code ?? 0);
    });
  });
}
