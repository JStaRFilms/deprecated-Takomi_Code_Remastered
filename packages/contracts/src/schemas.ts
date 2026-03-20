import { z } from 'zod';

import {
  AUDIT_EVENT_KINDS,
  IPC_CHANNELS,
  INTERVENTION_ACTIONS,
  INTERVENTION_OUTCOMES,
  NORMALIZED_RUNTIME_EVENT_KINDS,
  RUNTIME_TARGETS,
  RUNTIME_TRANSPORTS,
  SESSION_KINDS,
  SESSION_STATUSES,
  SHELL_TARGETS,
  TAKOMI_AGENT_CAPABILITIES,
  TAKOMI_AGENT_MODE_SLUGS,
  TASK_GRAPH_STATES,
  TRANSCRIPT_PART_KINDS,
  TRANSCRIPT_PART_ROLES
} from './constants.js';
import type { IpcChannel } from './constants.js';

const unknownRecordSchema = z.record(z.unknown());
const ipcChannelValues = Object.values(IPC_CHANNELS) as [IpcChannel, ...IpcChannel[]];

export const ShellTargetSchema = z.enum(SHELL_TARGETS);
export const RuntimeTargetSchema = z.enum(RUNTIME_TARGETS);
export const RuntimeTransportSchema = z.enum(RUNTIME_TRANSPORTS);
export const SessionKindSchema = z.enum(SESSION_KINDS);
export const SessionStatusSchema = z.enum(SESSION_STATUSES);
export const TaskGraphStateSchema = z.enum(TASK_GRAPH_STATES);
export const TranscriptPartKindSchema = z.enum(TRANSCRIPT_PART_KINDS);
export const TranscriptPartRoleSchema = z.enum(TRANSCRIPT_PART_ROLES);
export const InterventionActionSchema = z.enum(INTERVENTION_ACTIONS);
export const InterventionOutcomeStatusSchema = z.enum(INTERVENTION_OUTCOMES);
export const NormalizedRuntimeEventKindSchema = z.enum(NORMALIZED_RUNTIME_EVENT_KINDS);
export const AuditEventKindSchema = z.enum(AUDIT_EVENT_KINDS);
export const TakomiAgentModeSlugSchema = z.enum(TAKOMI_AGENT_MODE_SLUGS);
export const TakomiAgentCapabilitySchema = z.enum(TAKOMI_AGENT_CAPABILITIES);
export const IpcChannelSchema = z.enum(ipcChannelValues);

export const ShellCapabilitiesSchema = z
  .object({
    shell: ShellTargetSchema,
    browserCompatible: z.boolean(),
    nativeBridge: z.boolean(),
    filesystemAccess: z.boolean(),
    gitAccess: z.boolean(),
    worktreeSwitching: z.boolean(),
    secureStorage: z.boolean(),
    osDialogs: z.boolean(),
    localRuntimeHosting: z.boolean(),
    remoteRuntimeTransport: z.boolean(),
    websocketBridge: z.boolean()
  })
  .strict();

export const BrowserFallbackNoteSchema = z
  .object({
    capability: z.string(),
    mode: z.enum(['remote', 'unavailable']),
    message: z.string(),
    recommendedAction: z.string().optional()
  })
  .strict();

export const WorkspaceReferenceSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    rootPath: z.string()
  })
  .strict();

export const GitStateSchema = z
  .object({
    branchName: z.string(),
    dirty: z.boolean(),
    headSha: z.string().optional(),
    upstreamBranchName: z.string().optional(),
    aheadCount: z.number().int().nonnegative().optional(),
    behindCount: z.number().int().nonnegative().optional()
  })
  .strict();

export const WorktreeReferenceSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    rootPath: z.string(),
    branchName: z.string(),
    headSha: z.string().optional(),
    dirty: z.boolean(),
    active: z.boolean(),
    explicit: z.boolean(),
    parentWorktreeId: z.string().nullable(),
    inheritedFromWorkspaceId: z.string().nullable(),
    createdAt: z.string().optional()
  })
  .strict();

export const WorkspaceDescriptorSchema = WorkspaceReferenceSchema.extend({
  target: ShellTargetSchema,
  branchName: z.string().nullable().optional(),
  dirty: z.boolean().optional(),
  currentWorktreeId: z.string().nullable().optional(),
  git: GitStateSchema.optional(),
  capabilities: ShellCapabilitiesSchema.optional(),
  worktrees: z.array(WorktreeReferenceSchema).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
}).strict();

export const ProjectDescriptorSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    name: z.string(),
    description: z.string(),
    slug: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
  })
  .strict();

export const SessionLineageSchema = z
  .object({
    rootSessionId: z.string(),
    parentSessionId: z.string().nullable(),
    ancestorSessionIds: z.array(z.string()),
    depth: z.number().int().nonnegative(),
    inheritsWorkspace: z.boolean(),
    inheritedWorktreeId: z.string().nullable()
  })
  .strict();

export const SessionDescriptorSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    parentSessionId: z.string().nullable(),
    kind: SessionKindSchema,
    name: z.string(),
    status: SessionStatusSchema,
    workspaceId: z.string(),
    worktreePath: z.string().nullable(),
    runtimeTarget: RuntimeTargetSchema.optional(),
    worktreeId: z.string().nullable().optional(),
    lineage: SessionLineageSchema.optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    closedAt: z.string().nullable().optional()
  })
  .strict();

const transcriptBase = {
  id: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  runId: z.string().optional(),
  taskId: z.string().optional()
};

export const TranscriptTextPartSchema = z
  .object({
    ...transcriptBase,
    kind: z.literal('text'),
    role: TranscriptPartRoleSchema,
    text: z.string()
  })
  .strict();

export const TranscriptToolCallPartSchema = z
  .object({
    ...transcriptBase,
    kind: z.literal('tool-call'),
    toolName: z.string(),
    input: unknownRecordSchema
  })
  .strict();

export const TranscriptToolResultPartSchema = z
  .object({
    ...transcriptBase,
    kind: z.literal('tool-result'),
    toolName: z.string(),
    output: z.unknown()
  })
  .strict();

export const TranscriptArtifactPartSchema = z
  .object({
    ...transcriptBase,
    kind: z.literal('artifact'),
    artifactId: z.string(),
    label: z.string().optional()
  })
  .strict();

export const TranscriptStatusPartSchema = z
  .object({
    ...transcriptBase,
    kind: z.literal('status'),
    status: z.string(),
    message: z.string().optional()
  })
  .strict();

export const TranscriptPartSchema = z.discriminatedUnion('kind', [
  TranscriptTextPartSchema,
  TranscriptToolCallPartSchema,
  TranscriptToolResultPartSchema,
  TranscriptArtifactPartSchema,
  TranscriptStatusPartSchema
]);

export const TranscriptSnapshotSchema = z
  .object({
    sessionId: z.string(),
    parts: z.array(TranscriptPartSchema),
    lastUpdatedAt: z.string()
  })
  .strict();

export const TaskGraphNodeSchema = z
  .object({
    id: z.string(),
    parentId: z.string().nullable(),
    title: z.string(),
    state: TaskGraphStateSchema,
    sessionId: z.string().optional(),
    taskId: z.string().optional(),
    kind: z.enum(['task', 'milestone', 'group', 'artifact', 'branch']).optional(),
    workspaceId: z.string().optional(),
    runId: z.string().optional(),
    artifactId: z.string().optional(),
    childSessionId: z.string().optional(),
    dependencies: z.array(z.string()).optional()
  })
  .strict();

export const TaskGraphEdgeSchema = z
  .object({
    from: z.string(),
    to: z.string(),
    kind: z.enum(['depends-on', 'blocks', 'follows']).optional()
  })
  .strict();

export const TaskGraphArtifactSchema = z
  .object({
    id: z.string(),
    taskId: z.string(),
    sessionId: z.string(),
    workspaceId: z.string(),
    kind: z.enum(['document', 'patch', 'log', 'bundle']),
    name: z.string(),
    uri: z.string(),
    createdAt: z.string().optional()
  })
  .strict();

export const OrchestrationSessionSchema = z
  .object({
    id: z.string(),
    workspaceId: z.string(),
    rootSessionId: z.string(),
    status: SessionStatusSchema,
    taskGraphRootNodeId: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
  })
  .strict();

export const OrchestrationGraphSchema = z
  .object({
    workspaceId: z.string(),
    rootSessionId: z.string(),
    nodes: z.array(TaskGraphNodeSchema),
    edges: z.array(TaskGraphEdgeSchema)
  })
  .strict();

export const InterventionTargetSchema = z
  .object({
    kind: z.enum(['current-run', 'child-run', 'session-subtree']),
    sessionId: z.string(),
    runId: z.string().optional(),
    childSessionId: z.string().optional(),
    rootSessionId: z.string().optional()
  })
  .strict();

export const GuidanceInterventionPayloadSchema = z
  .object({
    instruction: z.string(),
    context: z.string().optional()
  })
  .strict();

export const PauseResumeInterventionPayloadSchema = z
  .object({
    reason: z.string().optional()
  })
  .strict();

export const CancelInterventionPayloadSchema = z
  .object({
    reason: z.string().optional()
  })
  .strict();

export const RerouteInterventionPayloadSchema = z
  .object({
    destinationSessionId: z.string().optional(),
    destinationRunId: z.string().optional(),
    reason: z.string().optional()
  })
  .strict();

export const ReplaceInterventionPayloadSchema = z
  .object({
    replacementSessionId: z.string().optional(),
    replacementModeSlug: TakomiAgentModeSlugSchema.optional(),
    reason: z.string().optional()
  })
  .strict();

export const MigrateInterventionPayloadSchema = z
  .object({
    destinationWorkspaceId: z.string(),
    destinationWorktreeId: z.string().optional(),
    reason: z.string().optional()
  })
  .strict();

export const InterventionRequestSchema = z.discriminatedUnion('action', [
  z
    .object({
      id: z.string(),
      action: z.literal('guidance'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: GuidanceInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict(),
  z
    .object({
      id: z.string(),
      action: z.literal('pause'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: PauseResumeInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict(),
  z
    .object({
      id: z.string(),
      action: z.literal('resume'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: PauseResumeInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict(),
  z
    .object({
      id: z.string(),
      action: z.literal('cancel'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: CancelInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict(),
  z
    .object({
      id: z.string(),
      action: z.literal('reroute'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: RerouteInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict(),
  z
    .object({
      id: z.string(),
      action: z.literal('replace'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: ReplaceInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict(),
  z
    .object({
      id: z.string(),
      action: z.literal('migrate'),
      target: InterventionTargetSchema,
      requestedBy: z.string(),
      requestedAt: z.string(),
      payload: MigrateInterventionPayloadSchema,
      correlationId: z.string().optional()
    })
    .strict()
]);

export const InterventionOutcomeSchema = z
  .object({
    id: z.string(),
    requestId: z.string(),
    action: InterventionActionSchema,
    status: InterventionOutcomeStatusSchema,
    target: InterventionTargetSchema,
    resolvedAt: z.string(),
    supported: z.boolean(),
    applied: z.boolean(),
    detail: z.string().optional(),
    auditEventId: z.string().optional()
  })
  .strict();

export const RuntimeRunRequestSchema = z
  .object({
    workspaceId: z.string(),
    projectId: z.string(),
    sessionId: z.string(),
    taskId: z.string().optional(),
    parentRunId: z.string().nullable().optional(),
    runtimeTarget: RuntimeTargetSchema,
    transport: RuntimeTransportSchema,
    prompt: z.string().optional(),
    agentModeSlug: TakomiAgentModeSlugSchema.optional(),
    metadata: unknownRecordSchema.optional()
  })
  .strict();

export const RuntimeRunHandleSchema = z
  .object({
    runId: z.string(),
    workspaceId: z.string(),
    projectId: z.string(),
    sessionId: z.string(),
    runtimeTarget: RuntimeTargetSchema,
    transport: RuntimeTransportSchema,
    startedAt: z.string()
  })
  .strict();

export const RuntimeGuidanceRequestSchema = z
  .object({
    runId: z.string(),
    sessionId: z.string(),
    workspaceId: z.string(),
    instruction: z.string(),
    context: z.string().optional()
  })
  .strict();

export const RuntimeRerouteRequestSchema = z
  .object({
    runId: z.string(),
    sessionId: z.string(),
    workspaceId: z.string(),
    destinationSessionId: z.string().optional(),
    destinationRunId: z.string().optional(),
    reason: z.string().optional()
  })
  .strict();

export const RuntimeReplaceRequestSchema = z
  .object({
    runId: z.string(),
    sessionId: z.string(),
    workspaceId: z.string(),
    replacementSessionId: z.string().optional(),
    replacementModeSlug: z.string().optional(),
    reason: z.string().optional()
  })
  .strict();

export const RuntimeMigrateRequestSchema = z
  .object({
    runId: z.string(),
    sessionId: z.string(),
    workspaceId: z.string(),
    destinationWorkspaceId: z.string(),
    destinationWorktreeId: z.string().optional(),
    reason: z.string().optional()
  })
  .strict();

export const NormalizedRuntimeEventSchema = z
  .object({
    id: z.string(),
    runId: z.string(),
    sessionId: z.string(),
    workspaceId: z.string(),
    projectId: z.string().optional(),
    taskId: z.string().optional(),
    runtimeTarget: RuntimeTargetSchema,
    transport: RuntimeTransportSchema,
    kind: NormalizedRuntimeEventKindSchema,
    timestamp: z.string(),
    payload: unknownRecordSchema
  })
  .strict();

export const AuditActorSchema = z
  .object({
    id: z.string(),
    kind: z.enum(['human', 'agent', 'system']),
    displayName: z.string().optional(),
    modeSlug: TakomiAgentModeSlugSchema.optional()
  })
  .strict();

export const AuditEventEnvelopeSchema = z
  .object({
    id: z.string(),
    kind: AuditEventKindSchema,
    timestamp: z.string(),
    subjectId: z.string(),
    subjectType: z
      .enum([
        'workspace',
        'project',
        'session',
        'task',
        'run',
        'worktree',
        'runtime',
        'intervention',
        'billing',
        'bags'
      ])
      .optional(),
    workspaceId: z.string().optional(),
    projectId: z.string().optional(),
    sessionId: z.string().optional(),
    taskId: z.string().optional(),
    runId: z.string().optional(),
    actor: AuditActorSchema.optional(),
    correlationId: z.string().optional(),
    data: unknownRecordSchema
  })
  .strict();

export const TakomiAgentModePermissionSchema = z
  .object({
    capability: TakomiAgentCapabilitySchema,
    fileRegex: z.string().optional(),
    description: z.string().optional()
  })
  .strict();

export const TakomiAgentModeDefinitionSchema = z
  .object({
    slug: TakomiAgentModeSlugSchema,
    name: z.string(),
    description: z.string(),
    roleDefinition: z.string(),
    whenToUse: z.string(),
    permissions: z.array(TakomiAgentModePermissionSchema),
    customInstructions: z.string(),
    sourcePath: z.string().optional(),
    enabled: z.boolean()
  })
  .strict();

export const TakomiAgentDefaultSettingsSchema = z
  .object({
    activeModeSlug: TakomiAgentModeSlugSchema,
    apiConfigName: z.string(),
    allowAutoApproval: z.boolean(),
    allowBrowser: z.boolean(),
    allowReadOnly: z.boolean(),
    allowWrite: z.boolean(),
    allowMcp: z.boolean(),
    allowModeSwitch: z.boolean(),
    allowSubtasks: z.boolean(),
    allowExecute: z.boolean(),
    browserToolEnabled: z.boolean(),
    requestDelaySeconds: z.number().nonnegative(),
    followupAutoApproveTimeoutMs: z.number().int().nonnegative(),
    showTaskTimeline: z.boolean(),
    showTimestamps: z.boolean()
  })
  .strict();

export const TakomiAgentDefaultsSourceSchema = z
  .object({
    path: z.string(),
    kind: z.enum(['yaml', 'json', 'derived']),
    label: z.string().optional()
  })
  .strict();

export const TakomiAgentDefaultsBundleSchema = z
  .object({
    schemaVersion: z.literal(1),
    modes: z.array(TakomiAgentModeDefinitionSchema),
    settings: TakomiAgentDefaultSettingsSchema,
    sources: z.array(TakomiAgentDefaultsSourceSchema)
  })
  .strict();

export const IpcEnvelopeSchema = z
  .object({
    id: z.string(),
    channel: IpcChannelSchema,
    payload: z.unknown(),
    workspaceId: z.string().optional(),
    sessionId: z.string().optional(),
    requestId: z.string().optional(),
    timestamp: z.string().optional(),
    version: z.number().int().nonnegative().optional()
  })
  .strict();

export const IpcResponseEnvelopeSchema = IpcEnvelopeSchema.extend({
  ok: z.boolean(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: unknownRecordSchema.optional()
    })
    .strict()
    .optional()
});

export const WorkspaceListIpcPayloadSchema = z
  .object({
    rootPath: z.string().optional(),
    includeArchived: z.boolean().optional()
  })
  .strict();

export const WorkspaceOpenIpcPayloadSchema = z
  .object({
    path: z.string()
  })
  .strict();

export const WorkspaceStatusIpcPayloadSchema = z
  .object({
    workspaceId: z.string()
  })
  .strict();

export const WorkspaceWorktreeSwitchIpcPayloadSchema = z
  .object({
    workspaceId: z.string(),
    worktreeId: z.string(),
    sessionSubtreeRootSessionId: z.string().optional(),
    reason: z.string().optional()
  })
  .strict();

export const SessionListIpcPayloadSchema = z
  .object({
    workspaceId: z.string().optional(),
    projectId: z.string().optional()
  })
  .strict();

export const SessionCreateIpcPayloadSchema = RuntimeRunRequestSchema.extend({
  kind: SessionKindSchema,
  name: z.string(),
  worktreePath: z.string().nullable().optional()
});

export const RuntimeConnectIpcPayloadSchema = z
  .object({
    workspaceId: z.string(),
    sessionId: z.string(),
    runtimeTarget: RuntimeTargetSchema,
    transport: RuntimeTransportSchema
  })
  .strict();

export const RuntimeSubscribeIpcPayloadSchema = z
  .object({
    sessionId: z.string(),
    runId: z.string().optional()
  })
  .strict();

export const RuntimeControlIpcPayloadSchema = z
  .object({
    runId: z.string(),
    sessionId: z.string().optional(),
    action: z.enum(['cancel', 'pause', 'resume']),
    payload: unknownRecordSchema.optional()
  })
  .strict();

export const InterventionSubmitIpcPayloadSchema = z
  .object({
    request: InterventionRequestSchema
  })
  .strict();

export const AuditAppendIpcPayloadSchema = z
  .object({
    event: AuditEventEnvelopeSchema
  })
  .strict();

export const AgentDefaultsLoadIpcPayloadSchema = z
  .object({
    source: z.enum(['shipped', 'workspace', 'user']).optional()
  })
  .strict();

export const WorkspaceListIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.workspaceList),
  payload: WorkspaceListIpcPayloadSchema
});

export const WorkspaceOpenIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.workspaceOpen),
  payload: WorkspaceOpenIpcPayloadSchema
});

export const WorkspaceStatusIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.workspaceStatus),
  payload: WorkspaceStatusIpcPayloadSchema
});

export const WorkspaceWorktreeSwitchIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.workspaceWorktreeSwitch),
  payload: WorkspaceWorktreeSwitchIpcPayloadSchema
});

export const SessionListIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.sessionList),
  payload: SessionListIpcPayloadSchema
});

export const SessionCreateIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.sessionCreate),
  payload: SessionCreateIpcPayloadSchema
});

export const RuntimeConnectIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.runtimeConnect),
  payload: RuntimeConnectIpcPayloadSchema
});

export const RuntimeSubscribeIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.runtimeSubscribe),
  payload: RuntimeSubscribeIpcPayloadSchema
});

export const RuntimeControlIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.runtimeControl),
  payload: RuntimeControlIpcPayloadSchema
});

export const InterventionSubmitIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.interventionSubmit),
  payload: InterventionSubmitIpcPayloadSchema
});

export const AuditAppendIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.auditAppend),
  payload: AuditAppendIpcPayloadSchema
});

export const AgentDefaultsLoadIpcEnvelopeSchema = IpcEnvelopeSchema.extend({
  channel: z.literal(IPC_CHANNELS.agentDefaultsLoad),
  payload: AgentDefaultsLoadIpcPayloadSchema
});

export const LocalhostBridgeHttpRequestSchema = IpcEnvelopeSchema.extend({
  transport: z.literal('http'),
  method: z.literal('POST')
});

export const LocalhostBridgeWebSocketMessageSchema = IpcEnvelopeSchema.extend({
  transport: z.literal('websocket'),
  messageType: z.enum(['request', 'response', 'event']),
  ok: z.boolean().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: unknownRecordSchema.optional()
    })
    .strict()
    .optional()
});

export const WorkspaceOpenLocalhostBridgeHttpRequestSchema = LocalhostBridgeHttpRequestSchema.extend({
  channel: z.literal(IPC_CHANNELS.workspaceOpen),
  payload: WorkspaceOpenIpcPayloadSchema
});

export const SessionCreateLocalhostBridgeHttpRequestSchema = LocalhostBridgeHttpRequestSchema.extend({
  channel: z.literal(IPC_CHANNELS.sessionCreate),
  payload: SessionCreateIpcPayloadSchema
});

export const RuntimeConnectLocalhostBridgeHttpRequestSchema = LocalhostBridgeHttpRequestSchema.extend({
  channel: z.literal(IPC_CHANNELS.runtimeConnect),
  payload: RuntimeConnectIpcPayloadSchema
});

export const InterventionSubmitLocalhostBridgeHttpRequestSchema =
  LocalhostBridgeHttpRequestSchema.extend({
    channel: z.literal(IPC_CHANNELS.interventionSubmit),
    payload: InterventionSubmitIpcPayloadSchema
  });

export const AuditAppendLocalhostBridgeHttpRequestSchema = LocalhostBridgeHttpRequestSchema.extend({
  channel: z.literal(IPC_CHANNELS.auditAppend),
  payload: AuditAppendIpcPayloadSchema
});

export const AgentDefaultsLoadLocalhostBridgeHttpRequestSchema = LocalhostBridgeHttpRequestSchema.extend({
  channel: z.literal(IPC_CHANNELS.agentDefaultsLoad),
  payload: AgentDefaultsLoadIpcPayloadSchema
});

export const WorkspaceOpenLocalhostBridgeWebSocketMessageSchema =
  LocalhostBridgeWebSocketMessageSchema.extend({
    channel: z.literal(IPC_CHANNELS.workspaceOpen),
    payload: WorkspaceOpenIpcPayloadSchema
  });

export const SessionCreateLocalhostBridgeWebSocketMessageSchema =
  LocalhostBridgeWebSocketMessageSchema.extend({
    channel: z.literal(IPC_CHANNELS.sessionCreate),
    payload: SessionCreateIpcPayloadSchema
  });

export const RuntimeConnectLocalhostBridgeWebSocketMessageSchema =
  LocalhostBridgeWebSocketMessageSchema.extend({
    channel: z.literal(IPC_CHANNELS.runtimeConnect),
    payload: RuntimeConnectIpcPayloadSchema
  });

export const InterventionSubmitLocalhostBridgeWebSocketMessageSchema =
  LocalhostBridgeWebSocketMessageSchema.extend({
    channel: z.literal(IPC_CHANNELS.interventionSubmit),
    payload: InterventionSubmitIpcPayloadSchema
  });

export const AuditAppendLocalhostBridgeWebSocketMessageSchema =
  LocalhostBridgeWebSocketMessageSchema.extend({
    channel: z.literal(IPC_CHANNELS.auditAppend),
    payload: AuditAppendIpcPayloadSchema
  });

export const AgentDefaultsLoadLocalhostBridgeWebSocketMessageSchema =
  LocalhostBridgeWebSocketMessageSchema.extend({
    channel: z.literal(IPC_CHANNELS.agentDefaultsLoad),
    payload: AgentDefaultsLoadIpcPayloadSchema
  });
