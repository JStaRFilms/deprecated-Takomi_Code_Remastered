import { createLocalBridgeDescriptor } from './descriptor.js';

export function createBridgeStatus() {
  return {
    bridge: createLocalBridgeDescriptor(),
    ready: true as const
  };
}
