import { createLocalBridgeDescriptor } from './index';

export function createBridgeStatus() {
  return {
    bridge: createLocalBridgeDescriptor(),
    ready: true as const
  };
}
