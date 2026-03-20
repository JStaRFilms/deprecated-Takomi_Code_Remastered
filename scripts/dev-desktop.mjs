import { renderToStaticMarkup } from 'react-dom/server';
import { createDesktopAppBootstrap, renderDesktopApp } from '../apps/desktop/src/index.ts';
import { readJson, renderAppPage, startStatusServer } from './dev-common.mjs';

const workspace = await readJson('package.json');
const desktopApp = createDesktopAppBootstrap();
const renderedShell = renderToStaticMarkup(renderDesktopApp(desktopApp));

await startStatusServer({
  name: 'takomi-desktop',
  port: 3001,
  title: 'Takomi Desktop',
  subtitle: 'Desktop shell is rendering the shared v6 workspace while native runtime wiring is still mocked.',
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
        description: 'Takomi v6 shared workspace shell running in the desktop scaffold.',
        body: renderedShell,
      }),
    }),
    '/bridge': async () => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        nativeBoundary: 'preload-only',
        capabilities: ['workspace', 'sessions', 'runtime', 'audit']
      }, null, 2)
    })
  }
});

await new Promise(() => {});
