import { readJson, startStatusServer } from './dev-common.mjs';

const workspace = await readJson('package.json');

const web = await startStatusServer({
  name: 'takomi-web-local',
  port: 3002,
  title: 'Takomi Web Local',
  subtitle: 'Web shell paired with the local bridge scaffold.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:web-local' },
    { label: 'Bridge', value: 'Bundled local bridge on :4545' }
  ]
});

const bridge = await startStatusServer({
  name: 'takomi-local-bridge',
  port: 4545,
  title: 'Takomi Local Bridge',
  subtitle: 'Running alongside the web shell for local-first development.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:web-local' },
    { label: 'Role', value: 'Web-local runtime bridge' }
  ]
});

process.on('SIGINT', async () => {
  await bridge.close();
  await web.close();
  process.exit(0);
});

await new Promise(() => {});
