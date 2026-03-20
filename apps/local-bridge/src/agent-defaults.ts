import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  TakomiAgentCapability,
  TakomiAgentDefaultsBundle,
  TakomiAgentDefaultSettings,
  TakomiAgentModeDefinition,
} from '@takomi/contracts';

const KNOWN_CAPABILITIES = new Set<TakomiAgentCapability>(['read', 'edit', 'browser', 'command', 'mcp']);

export function loadTakomiAgentDefaultsBundle(
  repoRoot = resolveTakomiRepoRoot()
): TakomiAgentDefaultsBundle {
  const agentsRoot = path.join(repoRoot, '.agent', 'Takomi-Agents');
  const modesPath = path.join(agentsRoot, 'custom_modes.yaml');
  const settingsPath = path.join(agentsRoot, 'kilo-code-settings.json');

  const modesYaml = fs.readFileSync(modesPath, 'utf8');
  const settingsJson = JSON.parse(fs.readFileSync(settingsPath, 'utf8')) as Record<string, unknown>;

  return {
    schemaVersion: 1,
    modes: parseModeDefinitions(modesYaml, modesPath),
    settings: parseSettings(settingsJson),
    sources: [
      { path: modesPath, kind: 'yaml', label: 'Takomi mode defaults' },
      { path: settingsPath, kind: 'json', label: 'Takomi global settings defaults' },
    ],
  };
}

function resolveTakomiRepoRoot(): string {
  const candidates = [process.cwd(), path.resolve(process.cwd(), '..'), path.resolve(process.cwd(), '../..')];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, '.agent', 'Takomi-Agents'))) {
      return candidate;
    }
  }

  return process.cwd();
}

function parseModeDefinitions(yamlText: string, sourcePath: string): TakomiAgentModeDefinition[] {
  const normalized = yamlText.replace(/\r\n/g, '\n');
  const matches = Array.from(normalized.matchAll(/^\s*-\s*slug:\s.*$/gm));
  const parsedModes: TakomiAgentModeDefinition[] = [];

  for (let index = 0; index < matches.length; index += 1) {
    const start = matches[index]?.index ?? 0;
    const end = matches[index + 1]?.index ?? normalized.length;
    const block = normalized.slice(start, end).trimEnd();
    const slug = readScalar(block, 'slug');
    const name = readScalar(block, 'name');
    const description = readScalar(block, 'description');

    if (!slug || !name || !description) {
      continue;
    }

    parsedModes.push({
      slug: slug as TakomiAgentModeDefinition['slug'],
      name,
      description,
      roleDefinition: readBlockText(block, 'roleDefinition') || 'Takomi mode definition loaded from bridge defaults.',
      whenToUse: readBlockText(block, 'whenToUse') || 'Use this mode when selected in the Takomi bridge configuration.',
      permissions: extractCapabilities(block).map((capability) => ({ capability })) as TakomiAgentModeDefinition['permissions'],
      customInstructions: readBlockText(block, 'customInstructions'),
      sourcePath,
      enabled: true,
    });
  }

  return parsedModes;
}

function extractCapabilities(block: string): TakomiAgentCapability[] {
  const matches = Array.from(block.matchAll(/^\s*-\s*(read|edit|browser|command|mcp)\s*$/gm));
  const capabilities = matches
    .map((match) => match[1] as TakomiAgentCapability)
    .filter((capability) => KNOWN_CAPABILITIES.has(capability));

  return capabilities.length > 0 ? capabilities : ['read'];
}

function readScalar(block: string, key: string): string {
  const match = block.match(new RegExp(`^\\s*(?:-\\s*)?${escapeRegex(key)}:\\s*(.+)$`, 'm'));
  const captured = match?.[1];
  return captured ? stripQuotes(captured.trim()) : '';
}

function readBlockText(block: string, key: string): string {
  const lines = block.split('\n');
  const fieldIndex = lines.findIndex((line) => new RegExp(`^\\s*${escapeRegex(key)}:\\s*`).test(line));

  if (fieldIndex === -1) {
    return '';
  }

  const fieldLine = lines[fieldIndex] ?? '';
  const inlineValue = fieldLine.replace(new RegExp(`^\\s*${escapeRegex(key)}:\\s*`), '').trim();

  if (inlineValue && !['|-', '|', '>-', '>'].includes(inlineValue)) {
    return stripQuotes(inlineValue);
  }

  const collected: string[] = [];

  for (let index = fieldIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (/^\s{2}[A-Za-z][A-Za-z0-9]+:/.test(line) || /^\s*-\s*slug:/.test(line)) {
      break;
    }
    collected.push(line.startsWith('      ') ? line.slice(6) : line.trimEnd());
  }

  return collected.join('\n').trim();
}

function parseSettings(raw: Record<string, unknown>): TakomiAgentDefaultSettings {
  const providerProfiles = asRecord(raw['providerProfiles']);
  const globalSettings = asRecord(raw['globalSettings']);

  return {
    activeModeSlug: asModeSlug(raw['mode']) ?? 'vibe-orchestrator',
    apiConfigName: asString(providerProfiles['currentApiConfigName']) ?? 'default',
    allowAutoApproval: globalSettings['autoApprovalEnabled'] === true,
    allowBrowser: globalSettings['alwaysAllowBrowser'] === true,
    allowReadOnly: globalSettings['alwaysAllowReadOnly'] === true,
    allowWrite: globalSettings['alwaysAllowWrite'] === true,
    allowMcp: globalSettings['alwaysAllowMcp'] === true,
    allowModeSwitch: globalSettings['alwaysAllowModeSwitch'] === true,
    allowSubtasks: globalSettings['alwaysAllowSubtasks'] === true,
    allowExecute: globalSettings['alwaysAllowExecute'] === true,
    browserToolEnabled: globalSettings['browserToolEnabled'] === true,
    requestDelaySeconds: asNumber(globalSettings['requestDelaySeconds']),
    followupAutoApproveTimeoutMs: asNumber(globalSettings['followupAutoApproveTimeoutMs']),
    showTaskTimeline: globalSettings['showTaskTimeline'] === true,
    showTimestamps: globalSettings['showTimestamps'] === true,
  };
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asModeSlug(value: unknown): TakomiAgentDefaultSettings['activeModeSlug'] | undefined {
  const slug = asString(value);
  return slug?.startsWith('vibe-') ? (slug as TakomiAgentDefaultSettings['activeModeSlug']) : undefined;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
