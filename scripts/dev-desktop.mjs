import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDesktopAppBootstrap, renderDesktopApp } from '../apps/desktop/src/index.ts';
import { readJson, renderAppPage, startStatusServer } from './dev-common.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const electronCommand = process.platform === 'win32'
  ? path.join(repoRoot, 'node_modules', '.bin', 'electron.cmd')
  : path.join(repoRoot, 'node_modules', '.bin', 'electron');
const tscCommand = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const workspace = await readJson('package.json');
const desktopApp = createDesktopAppBootstrap();
const renderedShell = renderToStaticMarkup(renderDesktopApp(desktopApp));

const server = await startStatusServer({
  name: 'takomi-desktop',
  port: 3001,
  title: 'Takomi Desktop',
  subtitle: 'Desktop shell is rendering the shared v6 workspace with the Electron main/preload split active.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:desktop' },
    { label: 'Target', value: 'Electron main / preload / renderer split with shared v6 shell' }
  ],
  routes: {
    '/': async () => ({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: renderAppPage({
        title: 'Takomi Desktop',
        description: 'Takomi v6 shared workspace shell running in the desktop shell.',
        body: renderedShell,
      }),
    }),
    '/bridge': async () => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        nativeBoundary: 'preload-only',
        capabilities: ['workspace', 'sessions', 'runtime', 'audit', 'agent-defaults']
      }, null, 2)
    })
  }
});

const tscExitCode = await runCommand(process.execPath, [tscCommand, '-p', path.join(repoRoot, 'apps', 'desktop', 'tsconfig.json')], {
  cwd: repoRoot,
  env: process.env,
});

if (tscExitCode !== 0) {
  await server.close();
  process.exit(tscExitCode ?? 1);
}

const electronProcess = spawn(electronCommand, [path.join(repoRoot, 'apps', 'desktop', 'dist', 'main.js')], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    TAKOMI_DESKTOP_RENDERER_URL: process.env['TAKOMI_DESKTOP_RENDERER_URL'] ?? 'http://127.0.0.1:3001',
    TAKOMI_OPEN_DEVTOOLS: process.env['TAKOMI_OPEN_DEVTOOLS'] ?? '0',
  },
});

const shutdown = async (exitCode = 0) => {
  if (!electronProcess.killed) {
    electronProcess.kill();
  }

  await server.close();
  process.exit(exitCode);
};

process.on('SIGINT', () => {
  void shutdown(0);
});

process.on('SIGTERM', () => {
  void shutdown(0);
});

electronProcess.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});

function runCommand(command, args, options) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit',
    });

    child.on('exit', (code) => {
      resolve(code ?? 0);
    });
  });
}
