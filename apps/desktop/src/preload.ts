import { IPC_CHANNELS, type IpcEnvelope } from '@takomi/contracts';

export interface DesktopBridgeApi {
  readonly channels: typeof IPC_CHANNELS;
  openWorkspace(path: string): Promise<IpcEnvelope<{ path: string }>>;
}

export function createDesktopBridgeApi(): DesktopBridgeApi {
  return {
    channels: IPC_CHANNELS,
    async openWorkspace(path: string) {
      return {
        id: `workspace-${path}`,
        channel: IPC_CHANNELS.workspaceOpen,
        payload: { path }
      };
    }
  };
}
