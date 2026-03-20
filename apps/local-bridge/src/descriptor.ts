import type { BrowserFallbackNote } from '@takomi/contracts';

export interface LocalBridgeDescriptor {
  readonly mode: 'web-local';
  readonly fallback: BrowserFallbackNote;
}

export function createLocalBridgeDescriptor(): LocalBridgeDescriptor {
  return {
    mode: 'web-local',
    fallback: {
      capability: 'native filesystem bridge',
      mode: 'remote',
      message: 'Use the bundled local bridge in desktop or a remote service path in browser-only contexts.'
    }
  };
}
