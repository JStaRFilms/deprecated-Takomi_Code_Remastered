import { readJson } from './dev-common.mjs';

const workspace = await readJson('package.json');
const bridgePort = Number(process.env['TAKOMI_BRIDGE_PORT'] ?? '4545');
const bridgeHost = process.env['TAKOMI_BRIDGE_HOST'] ?? '127.0.0.1';

// Start the actual local bridge server
const { launchBridge } = await import('../apps/local-bridge/src/index.ts');

const bridgeResult = await launchBridge({
  port: bridgePort,
  host: bridgeHost
});

console.log(`[takomi-local-bridge] Workspace: ${workspace.name}`);
console.log(`[takomi-local-bridge] Command: pnpm --filter @takomi/local-bridge dev`);
console.log(`[takomi-local-bridge] Role: Bundled local bridge for web-local runs`);
console.log(`[takomi-local-bridge] HTTP: http://${bridgeHost}:${bridgePort}/bridge`);
console.log(`[takomi-local-bridge] WS:   ws://${bridgeHost}:${bridgePort}/ws`);

process.on('SIGINT', async () => {
  console.log('\n[takomi-local-bridge] Shutting down...');
  await bridgeResult.stop();
  process.exit(0);
});

await new Promise(() => {});
