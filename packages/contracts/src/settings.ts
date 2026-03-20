import type { AuditEventEnvelope } from './audit.js';
import type { RuntimeTarget, RuntimeTransport } from './constants.js';
import type { TakomiAgentDefaultsBundle } from './agent-definitions.js';

export const SETTINGS_TABS = ['runtime', 'billing', 'verification', 'agents'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export interface RuntimeTargetOption {
  readonly id: RuntimeTarget;
  readonly label: string;
  readonly description: string;
  readonly transport: RuntimeTransport;
  readonly available: boolean;
  readonly disabledReason?: string;
}

export interface ShellCapabilityDescriptor {
  readonly key: string;
  readonly label: string;
  readonly available: boolean;
  readonly mode: 'full' | 'read-only' | 'unavailable';
  readonly detail?: string;
}

export interface RuntimeAvailability {
  readonly target: RuntimeTarget;
  readonly transport: RuntimeTransport;
  readonly connected: boolean;
  readonly shellLabel: string;
  readonly capabilities: readonly ShellCapabilityDescriptor[];
}

export interface RuntimeSettingsState {
  readonly workspaceId: string;
  readonly selectedTarget: RuntimeTarget;
  readonly autoVerificationEnabled: boolean;
  readonly options: readonly RuntimeTargetOption[];
  readonly availability: RuntimeAvailability;
}

export interface RuntimeSettingsService {
  getState(workspaceId: string): Promise<RuntimeSettingsState>;
  setTarget(workspaceId: string, target: RuntimeTarget): Promise<RuntimeSettingsState>;
  toggleAutoVerification(workspaceId: string, enabled: boolean): Promise<RuntimeSettingsState>;
}

export interface AgentDefaultsState {
  readonly workspaceId: string;
  readonly bundle: TakomiAgentDefaultsBundle;
  readonly configurability: {
    readonly shippedDefaultsPath: string;
    readonly workspaceOverridesEnabled: boolean;
    readonly userOverridesEnabled: boolean;
  };
}

export function createRuntimeTargetChangedAuditEvent(
  workspaceId: string,
  selectedTarget: RuntimeTarget
): AuditEventEnvelope<'settings.runtime_target_changed'> {
  return {
    id: `audit-settings-runtime-target-${workspaceId}-${selectedTarget}`,
    kind: 'settings.runtime_target_changed',
    timestamp: new Date().toISOString(),
    subjectId: workspaceId,
    subjectType: 'workspace',
    workspaceId,
    data: {
      selectedTarget,
    },
  };
}

export function createAutoVerificationToggledAuditEvent(
  workspaceId: string,
  enabled: boolean
): AuditEventEnvelope<'settings.auto_verification_toggled'> {
  return {
    id: `audit-settings-auto-verification-${workspaceId}-${enabled ? 'on' : 'off'}`,
    kind: 'settings.auto_verification_toggled',
    timestamp: new Date().toISOString(),
    subjectId: workspaceId,
    subjectType: 'workspace',
    workspaceId,
    data: {
      enabled,
    },
  };
}

export function createAgentDefaultsViewedAuditEvent(
  state: AgentDefaultsState
): AuditEventEnvelope<'settings.agent_defaults_viewed'> {
  return {
    id: `audit-settings-agent-defaults-viewed-${state.workspaceId}`,
    kind: 'settings.agent_defaults_viewed',
    timestamp: new Date().toISOString(),
    subjectId: state.workspaceId,
    subjectType: 'workspace',
    workspaceId: state.workspaceId,
    data: {
      sourceCount: state.bundle.sources.length,
      modeCount: state.bundle.modes.length,
      workspaceOverridesEnabled: state.configurability.workspaceOverridesEnabled,
      userOverridesEnabled: state.configurability.userOverridesEnabled,
    },
  };
}
