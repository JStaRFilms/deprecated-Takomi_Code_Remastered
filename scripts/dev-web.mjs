import { readJson, startStatusServer } from './dev-common.mjs';

const workspace = await readJson('package.json');

await startStatusServer({
  name: 'takomi-web',
  port: 3000,
  title: 'Takomi Web Scaffold',
  subtitle: 'Browser shell wiring is live. Shared packages are mapped and ready for feature work.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:web' },
    { label: 'Target', value: 'Browser-compatible renderer' }
  ],
  routes: {
    '/manifest': async () => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        app: 'web',
        packages: ['contracts', 'orchestration', 'runtime-codex', 'persistence', 'ui']
      }, null, 2)
    })
  }
});

await new Promise(() => {});
