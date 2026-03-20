import { renderToStaticMarkup } from 'react-dom/server';
import { createWebAppBootstrap, renderWebApp } from '../apps/web/src/index.ts';
import { launchBridge } from '../apps/local-bridge/src/index.ts';
import { readJson, renderAppPage, startStatusServer } from './dev-common.mjs';
import {
  SettingsView,
  getTheme,
  mockAgentDefaultsState,
  mockBagsState,
  mockBillingState,
  mockRuntimeSettingsState,
} from '../packages/ui/src/index.ts';

const workspace = await readJson('package.json');
const webPort = Number(process.env['TAKOMI_WEB_LOCAL_PORT'] ?? '3002');
const bridgePort = Number(process.env['TAKOMI_BRIDGE_PORT'] ?? '4545');
const bridgeHost = process.env['TAKOMI_BRIDGE_HOST'] ?? '127.0.0.1';

const bridgeResult = await launchBridge({
  port: bridgePort,
  host: bridgeHost
});

const capabilities = bridgeResult.server.getCapabilityReport();
const webApp = createWebAppBootstrap({
  transport: {
    mode: 'local-bridge',
    bridgeAvailable: true,
    capabilities
  }
});
const renderedShell = renderToStaticMarkup(renderWebApp(webApp));
const renderedSettings = renderToStaticMarkup(
  SettingsView({
    theme: getTheme('dark'),
    runtime: {
      ...mockRuntimeSettingsState,
      selectedTarget: 'remote',
      availability: {
        ...mockRuntimeSettingsState.availability,
        target: 'remote',
        transport: 'browser-safe',
        shellLabel: 'Web-local shell',
      },
    },
    billing: mockBillingState,
    bags: mockBagsState,
    agentDefaults: mockAgentDefaultsState,
  })
);

const web = await startStatusServer({
  name: 'takomi-web-local',
  port: webPort,
  title: 'Takomi Web Local',
  subtitle: 'Web shell paired with the local bridge.',
  details: [
    { label: 'Workspace', value: workspace.name },
    { label: 'Command', value: 'pnpm dev:web-local' },
    { label: 'Bridge', value: `http://${bridgeHost}:${bridgePort}/bridge` },
    { label: 'Bridge WS', value: `ws://${bridgeHost}:${bridgePort}/ws` }
  ],
  routes: {
    '/': async () => ({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: renderAppPage({
        title: 'Takomi Web Local',
        description: 'Takomi v6 shared workspace shell running in web-local mode through the localhost bridge.',
        body: renderedShell,
      }),
    }),
    '/transport/status': async () => ({
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        bridge: 'local',
        transport: 'http+websocket',
        mode: 'web-local',
        bridgeUrl: `http://${bridgeHost}:${bridgePort}`,
        wsUrl: `ws://${bridgeHost}:${bridgePort}/ws`,
        capabilities
      }, null, 2)
    }),
    '/settings': async () => ({
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
      body: renderAppPage({
        title: 'Takomi Web Local Settings',
        description: 'Takomi shared runtime settings, billing, verification, and agent defaults surface.',
        body: renderedSettings,
      }),
    })
  }
});

console.log('[dev:web-local] Bridge and web servers started.');
console.log(`[dev:web-local] Web:    http://127.0.0.1:${webPort}`);
console.log(`[dev:web-local] Bridge: http://${bridgeHost}:${bridgePort}/bridge`);
console.log(`[dev:web-local] Bridge WS: ws://${bridgeHost}:${bridgePort}/ws`);

process.on('SIGINT', async () => {
  console.log('\n[dev:web-local] Shutting down...');
  await bridgeResult.stop();
  await web.close();
  process.exit(0);
});

await new Promise(() => {});
