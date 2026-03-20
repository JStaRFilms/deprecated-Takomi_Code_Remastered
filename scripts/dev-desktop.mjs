import { readJson, startStatusServer } from './dev-common.mjs';

const workspace = await readJson('package.json');

await startStatusServer({
  name: 'takomi-desktop',
  port: 3001,
  title: 'Takomi Desktop Scaffold',
  subtitle: 'Electron shell wiring is stubbed here until native runtime work lands.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:desktop' },
    { label: 'Target', value: 'Electron main / preload / renderer split' }
  ],
  routes: {
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
