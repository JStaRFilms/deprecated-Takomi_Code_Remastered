import type {
  TakomiAgentModeDefinition,
  TakomiAgentDefaultSettings,
  TakomiAgentDefaultsBundle,
  TakomiAgentDefaultsSource,
  TakomiAgentModeSlug,
  TakomiAgentCapability
} from '@takomi/contracts';

import {
  TAKOMI_AGENT_MODE_SLUGS
} from '@takomi/contracts';

/**
 * Raw YAML custom_modes entry shape (from .agent/Takomi-Agents/custom_modes.yaml).
 * This is the format the app parses before mapping to contract types.
 */
export interface RawCustomModeEntry {
  readonly slug: string;
  readonly name: string;
  readonly iconName?: string;
  readonly description: string;
  readonly roleDefinition: string;
  readonly whenToUse: string;
  readonly groups: readonly (
    | string
    | readonly (string | { readonly fileRegex?: string; readonly description?: string })[]
  )[];
  readonly customInstructions: string;
  readonly source?: string;
}

export interface RawCustomModesFile {
  readonly customModes: readonly RawCustomModeEntry[];
}

/**
 * Maps raw YAML group entries to contract permissions.
 * Groups can be simple strings (e.g., 'read') or arrays with fileRegex overrides.
 */
function mapGroupsToPermissions(
  groups: readonly (
    | string
    | readonly (string | { readonly fileRegex?: string; readonly description?: string })[]
  )[]
): readonly { capability: TakomiAgentCapability; fileRegex?: string; description?: string }[] {
  const validCapabilities = new Set<string>(['read', 'edit', 'browser', 'command', 'mcp']);
  const permissions: { capability: TakomiAgentCapability; fileRegex?: string; description?: string }[] = [];

  for (const group of groups) {
    if (Array.isArray(group)) {
      const [capabilityEntry, metadataEntry] = group;
      if (typeof capabilityEntry === 'string' && validCapabilities.has(capabilityEntry)) {
        const perm: {
          capability: TakomiAgentCapability;
          fileRegex?: string;
          description?: string;
        } = {
          capability: capabilityEntry as TakomiAgentCapability
        };

        if (
          metadataEntry &&
          typeof metadataEntry === 'object' &&
          !Array.isArray(metadataEntry)
        ) {
          if (typeof metadataEntry.fileRegex === 'string') {
            perm.fileRegex = metadataEntry.fileRegex;
          }
          if (typeof metadataEntry.description === 'string') {
            perm.description = metadataEntry.description;
          }
        }

        permissions.push(perm);
      }
    } else if (typeof group === 'string' && validCapabilities.has(group)) {
      permissions.push({ capability: group as TakomiAgentCapability });
    }
  }

  return permissions;
}

/**
 * Converts a raw custom mode entry to a TakomiAgentModeDefinition.
 */
export function parseCustomModeEntry(
  entry: RawCustomModeEntry,
  sourcePath?: string
): TakomiAgentModeDefinition | null {
  if (!TAKOMI_AGENT_MODE_SLUGS.includes(entry.slug as TakomiAgentModeSlug)) {
    return null;
  }

  const permissions = mapGroupsToPermissions(entry.groups);

  const definition: TakomiAgentModeDefinition = {
    slug: entry.slug as TakomiAgentModeSlug,
    name: entry.name,
    description: entry.description,
    roleDefinition: entry.roleDefinition,
    whenToUse: entry.whenToUse,
    permissions,
    customInstructions: entry.customInstructions,
    enabled: true
  };

  if (sourcePath !== undefined) {
    return { ...definition, sourcePath };
  }

  return definition;
}

/**
 * Default settings when no explicit settings file is provided.
 */
export function createDefaultSettings(): TakomiAgentDefaultSettings {
  return {
    activeModeSlug: 'vibe-orchestrator',
    apiConfigName: 'default',
    allowAutoApproval: false,
    allowBrowser: true,
    allowReadOnly: true,
    allowWrite: true,
    allowMcp: true,
    allowModeSwitch: true,
    allowSubtasks: true,
    allowExecute: true,
    browserToolEnabled: true,
    requestDelaySeconds: 0,
    followupAutoApproveTimeoutMs: 0,
    showTaskTimeline: true,
    showTimestamps: true
  };
}

/**
 * Builds a TakomiAgentDefaultsBundle from parsed mode definitions.
 * The bundle is the canonical form the orchestration engine works with.
 */
export function buildDefaultsBundle(
  modes: readonly TakomiAgentModeDefinition[],
  settings: TakomiAgentDefaultSettings | undefined,
  sources: readonly TakomiAgentDefaultsSource[]
): TakomiAgentDefaultsBundle {
  return {
    schemaVersion: 1,
    modes: modes as TakomiAgentModeDefinition[],
    settings: settings ?? createDefaultSettings(),
    sources: sources as TakomiAgentDefaultsSource[]
  };
}

/**
 * Finds a mode definition by its slug from a bundle.
 */
export function findModeBySlug(
  bundle: TakomiAgentDefaultsBundle,
  slug: TakomiAgentModeSlug
): TakomiAgentModeDefinition | undefined {
  return bundle.modes.find(m => m.slug === slug);
}

/**
 * Gets all enabled mode slugs from a bundle.
 */
export function getEnabledModeSlugs(
  bundle: TakomiAgentDefaultsBundle
): readonly TakomiAgentModeSlug[] {
  return bundle.modes.filter(m => m.enabled).map(m => m.slug);
}

/**
 * Creates a source descriptor for tracking where definitions came from.
 */
export function createSourceDescriptor(
  path: string,
  kind: 'yaml' | 'json' | 'derived',
  label?: string
): TakomiAgentDefaultsSource {
  const source: TakomiAgentDefaultsSource = {
    path,
    kind
  };

  if (label !== undefined) {
    return { ...source, label };
  }

  return source;
}
