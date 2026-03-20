import type {
  RuntimeSettingsState,
  RuntimeSettingsStore,
} from '@takomi/contracts';

export interface WorkspaceRuntimePreference {
  readonly workspaceId: string;
  readonly selectedTarget: RuntimeSettingsState['selectedTarget'];
  readonly autoVerificationEnabled: boolean;
}

export interface InMemoryRuntimeSettingsStore extends RuntimeSettingsStore {}

export function createInMemoryRuntimeSettingsStore(): InMemoryRuntimeSettingsStore {
  const states = new Map<string, RuntimeSettingsState>();

  return {
    async getState(workspaceId: string): Promise<RuntimeSettingsState | undefined> {
      return states.get(workspaceId);
    },

    async saveState(state: RuntimeSettingsState): Promise<void> {
      states.set(state.workspaceId, structuredClone(state));
    },
  };
}
