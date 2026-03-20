import { renderToStaticMarkup } from 'react-dom/server';
import { createWebAppBootstrap, renderWebApp } from '../apps/web/src/index.ts';
import { readJson, renderAppPage, startStatusServer } from './dev-common.mjs';

const workspace = await readJson('package.json');
const webApp = createWebAppBootstrap();
const renderedShell = renderToStaticMarkup(renderWebApp(webApp));

await startStatusServer({
  name: 'takomi-web',
  port: 3000,
  title: 'Takomi Web',
  subtitle: 'Browser shell is rendering the shared v6 workspace with mock Takomi session data.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:web' },
    { label: 'Target', value: 'Browser-compatible shared v6 shell' }
  ],
  routes: {
    '/': async () => ({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: renderAppPage({
        title: 'Takomi Web',
        description: 'Takomi v6 shared workspace shell running in the browser scaffold.',
        body: renderedShell,
      }),
    }),
    '/manifest': async () => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        app: 'web',
        shell: 'v6-shared-workspace',
        packages: ['contracts', 'orchestration', 'runtime-codex', 'persistence', 'ui']
      }, null, 2)
    })
  }
});

await new Promise(() => {});
