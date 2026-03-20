import type { BridgeServerConfig } from '@takomi/contracts';
import { DEFAULT_BRIDGE_CONFIG } from '@takomi/contracts';
import { createBridgeServer } from './bridge-server.js';
import type { BridgeServer } from './bridge-server.js';

export type { BridgeServer } from './bridge-server.js';
export { createBridgeServer } from './bridge-server.js';
export { createLocalBridgeDescriptor, type LocalBridgeDescriptor } from './descriptor.js';
export { createBridgeStatus } from './bridge.js';
export { loadTakomiAgentDefaultsBundle } from './agent-defaults.js';

export interface BridgeLaunchResult {
  readonly server: BridgeServer;
  readonly config: BridgeServerConfig;
  readonly stop: () => Promise<void>;
}

export async function launchBridge(
  overrides?: Partial<BridgeServerConfig>
): Promise<BridgeLaunchResult> {
  const config: BridgeServerConfig = {
    ...DEFAULT_BRIDGE_CONFIG,
    ...overrides
  };

  const server = createBridgeServer(config);
  await server.start();

  return {
    server,
    config,
    stop: async () => {
      await server.stop();
    }
  };
}
