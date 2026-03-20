export const SHELL_TARGETS = ['desktop', 'web'] as const;
export type ShellTarget = (typeof SHELL_TARGETS)[number];

export const RUNTIME_TARGETS = ['desktop-local', 'remote'] as const;
export type RuntimeTarget = (typeof RUNTIME_TARGETS)[number];

export const RUNTIME_TRANSPORTS = ['local', 'remote', 'browser-safe'] as const;
export type RuntimeTransport = (typeof RUNTIME_TRANSPORTS)[number];

export const SESSION_KINDS = ['project', 'chat', 'task', 'recovery'] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];

export const SESSION_STATUSES = ['idle', 'running', 'paused', 'completed', 'failed', 'cancelled'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const TASK_GRAPH_STATES = [
  'idle',
  'queued',
  'running',
  'paused',
  'blocked',
  'completed',
  'failed',
  'cancelled'
] as const;
export type TaskGraphState = (typeof TASK_GRAPH_STATES)[number];

export const TRANSCRIPT_PART_KINDS = ['text', 'tool-call', 'tool-result', 'artifact', 'status', 'system'] as const;
export type TranscriptPartKind = (typeof TRANSCRIPT_PART_KINDS)[number];

export const TRANSCRIPT_PART_ROLES = ['user', 'assistant', 'system', 'tool'] as const;
export type TranscriptPartRole = (typeof TRANSCRIPT_PART_ROLES)[number];

export const INTERVENTION_ACTIONS = [
  'guidance',
  'pause',
  'resume',
  'cancel',
  'reroute',
  'replace',
  'migrate'
] as const;
export type InterventionAction = (typeof INTERVENTION_ACTIONS)[number];

export const INTERVENTION_OUTCOMES = ['requested', 'applied', 'unsupported', 'failed'] as const;
export type InterventionOutcomeStatus = (typeof INTERVENTION_OUTCOMES)[number];

export const NORMALIZED_RUNTIME_EVENT_KINDS = [
  'run.starting',
  'run.streaming',
  'run.command.started',
  'run.command.completed',
  'run.file_changes.updated',
  'run.pause_requested',
  'run.paused',
  'run.resumed',
  'run.completed',
  'run.failed',
  'run.cancelled'
] as const;
export type NormalizedRuntimeEventKind = (typeof NORMALIZED_RUNTIME_EVENT_KINDS)[number];

export const WORKSPACE_AUDIT_EVENT_KINDS = [
  'workspace.worktree_created',
  'workspace.worktree_switched',
  'workspace.git_state_refreshed'
] as const;
export type WorkspaceAuditEventKind = (typeof WORKSPACE_AUDIT_EVENT_KINDS)[number];

export const INTERVENTION_AUDIT_EVENT_KINDS = [
  'intervention.requested',
  'intervention.applied',
  'intervention.unsupported',
  'intervention.failed'
] as const;
export type InterventionAuditEventKind = (typeof INTERVENTION_AUDIT_EVENT_KINDS)[number];

export const BILLING_AUDIT_EVENT_KINDS = [
  'billing.checkout_started',
  'billing.entitlement_activated',
  'billing.checkout_failed'
] as const;
export type BillingAuditEventKind = (typeof BILLING_AUDIT_EVENT_KINDS)[number];

export const BAGS_AUDIT_EVENT_KINDS = [
  'bags.token_linked',
  'bags.verification_checked',
  'bags.verification_failed'
] as const;
export type BagsAuditEventKind = (typeof BAGS_AUDIT_EVENT_KINDS)[number];

export const AUDIT_EVENT_KINDS = [
  ...NORMALIZED_RUNTIME_EVENT_KINDS,
  ...WORKSPACE_AUDIT_EVENT_KINDS,
  ...INTERVENTION_AUDIT_EVENT_KINDS,
  ...BILLING_AUDIT_EVENT_KINDS,
  ...BAGS_AUDIT_EVENT_KINDS
] as const;
export type AuditEventKind = (typeof AUDIT_EVENT_KINDS)[number];

export const TAKOMI_AGENT_MODE_SLUGS = [
  'vibe-visionary',
  'vibe-orchestrator',
  'vibe-code',
  'vibe-architect',
  'vibe-review',
  'vibe-ask',
  'vibe-debug'
] as const;
export type TakomiAgentModeSlug = (typeof TAKOMI_AGENT_MODE_SLUGS)[number];

export const TAKOMI_AGENT_CAPABILITIES = ['read', 'edit', 'browser', 'command', 'mcp'] as const;
export type TakomiAgentCapability = (typeof TAKOMI_AGENT_CAPABILITIES)[number];

export const IPC_CHANNELS = {
  workspaceList: 'takomi:workspace:list',
  workspaceOpen: 'takomi:workspace:open',
  workspaceStatus: 'takomi:workspace:status',
  workspaceWorktreeSwitch: 'takomi:workspace:worktree:switch',
  sessionList: 'takomi:session:list',
  sessionCreate: 'takomi:session:create',
  runtimeConnect: 'takomi:runtime:connect',
  runtimeSubscribe: 'takomi:runtime:subscribe',
  runtimeControl: 'takomi:runtime:control',
  interventionSubmit: 'takomi:intervention:submit',
  auditAppend: 'takomi:audit:append',
  agentDefaultsLoad: 'takomi:agents:defaults:load'
} as const;
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
