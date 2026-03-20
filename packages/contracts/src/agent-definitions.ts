import type { TakomiAgentCapability, TakomiAgentModeSlug } from './constants.js';

export interface TakomiAgentModePermission {
  readonly capability: TakomiAgentCapability;
  readonly fileRegex?: string;
  readonly description?: string;
}

export interface TakomiAgentModeDefinition {
  readonly slug: TakomiAgentModeSlug;
  readonly name: string;
  readonly description: string;
  readonly roleDefinition: string;
  readonly whenToUse: string;
  readonly permissions: readonly TakomiAgentModePermission[];
  readonly customInstructions: string;
  readonly sourcePath?: string;
  readonly enabled: boolean;
}

export interface TakomiAgentDefaultSettings {
  readonly activeModeSlug: TakomiAgentModeSlug;
  readonly apiConfigName: string;
  readonly allowAutoApproval: boolean;
  readonly allowBrowser: boolean;
  readonly allowReadOnly: boolean;
  readonly allowWrite: boolean;
  readonly allowMcp: boolean;
  readonly allowModeSwitch: boolean;
  readonly allowSubtasks: boolean;
  readonly allowExecute: boolean;
  readonly browserToolEnabled: boolean;
  readonly requestDelaySeconds: number;
  readonly followupAutoApproveTimeoutMs: number;
  readonly showTaskTimeline: boolean;
  readonly showTimestamps: boolean;
}

export interface TakomiAgentDefaultsSource {
  readonly path: string;
  readonly kind: 'yaml' | 'json' | 'derived';
  readonly label?: string;
}

export interface TakomiAgentDefaultsBundle {
  readonly schemaVersion: 1;
  readonly modes: readonly TakomiAgentModeDefinition[];
  readonly settings: TakomiAgentDefaultSettings;
  readonly sources: readonly TakomiAgentDefaultsSource[];
}
