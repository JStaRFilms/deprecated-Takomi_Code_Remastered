import { readJson, startStatusServer } from './dev-common.mjs';

const workspace = await readJson('package.json');

await startStatusServer({
  name: 'takomi-local-bridge',
  port: 4545,
  title: 'Takomi Local Bridge',
  subtitle: 'Local bridge stub for browser-local development.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm --filter @takomi/local-bridge dev' },
    { label: 'Role', value: 'Bundled local bridge for web-local runs' }
  ],
  routes: {
    '/bridge': async () => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        bridge: 'local',
        transport: 'http',
        mode: 'web-local'
      }, null, 2)
    })
  }
});

await new Promise(() => {});
