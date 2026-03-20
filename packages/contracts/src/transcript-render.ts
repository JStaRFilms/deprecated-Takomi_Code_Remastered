export type RenderBlockKind =
  | 'user-message'
  | 'assistant-message'
  | 'status-message'
  | 'command'
  | 'file-change'
  | 'plan'
  | 'intervention-card'
  | 'completion-state'
  | 'artifact-summary'
  | 'system-message';

export interface BaseRenderBlock {
  readonly id: string;
  readonly kind: RenderBlockKind;
  readonly timestamp: string;
  readonly sessionId: string;
  readonly runId?: string | undefined;
}

export interface UserMessageBlock extends BaseRenderBlock {
  readonly kind: 'user-message';
  readonly role: 'user';
  readonly text: string;
}

export type AssistantMessageStatus = 'in-progress' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface AssistantMessageBlock extends BaseRenderBlock {
  readonly kind: 'assistant-message';
  readonly role: 'assistant';
  readonly text: string;
  readonly status: AssistantMessageStatus;
  readonly streaming?: boolean | undefined;
  readonly dense?: boolean | undefined;
}

export interface StatusMessageBlock extends BaseRenderBlock {
  readonly kind: 'status-message';
  readonly status: string;
  readonly text: string;
}

export type CommandBlockStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled';

export interface CommandBlock extends BaseRenderBlock {
  readonly kind: 'command';
  readonly command: string;
  readonly status: CommandBlockStatus;
  readonly logs?: string | undefined;
  readonly exitCode?: number | undefined;
  readonly timeElapsed?: string | undefined;
}

export interface FileChangeEntry {
  readonly path: string;
  readonly label: string;
}

export type FileChangeBlockStatus = 'in-progress' | 'completed' | 'failed';

export interface FileChangeBlock extends BaseRenderBlock {
  readonly kind: 'file-change';
  readonly count: number;
  readonly status: FileChangeBlockStatus;
  readonly files: readonly FileChangeEntry[];
}

export type PlanStepStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

export interface PlanStep {
  readonly label: string;
  readonly status: PlanStepStatus;
}

export interface PlanBlock extends BaseRenderBlock {
  readonly kind: 'plan';
  readonly title: string;
  readonly steps: readonly PlanStep[];
}

export type InterventionCardStatus = 'pending' | 'requested' | 'applied' | 'unsupported' | 'failed';

export interface InterventionCardBlock extends BaseRenderBlock {
  readonly kind: 'intervention-card';
  readonly action: string;
  readonly text: string;
  readonly status: InterventionCardStatus;
}

export type CompletionStateStatus = 'completed' | 'failed' | 'cancelled';

export interface CompletionStateBlock extends BaseRenderBlock {
  readonly kind: 'completion-state';
  readonly status: CompletionStateStatus;
  readonly summary: string;
}

export interface ArtifactSummaryBlock extends BaseRenderBlock {
  readonly kind: 'artifact-summary';
  readonly artifactId: string;
  readonly label: string;
}

export interface SystemMessageBlock extends BaseRenderBlock {
  readonly kind: 'system-message';
  readonly role: 'system';
  readonly text: string;
}

export type TranscriptRenderBlock =
  | UserMessageBlock
  | AssistantMessageBlock
  | StatusMessageBlock
  | CommandBlock
  | FileChangeBlock
  | PlanBlock
  | InterventionCardBlock
  | CompletionStateBlock
  | ArtifactSummaryBlock
  | SystemMessageBlock;

export interface TranscriptWindow {
  readonly startIndex: number;
  readonly endIndex: number;
  readonly totalBlocks: number;
}

export interface TranscriptState {
  readonly sessionId: string;
  readonly blocks: readonly TranscriptRenderBlock[];
  readonly lastUpdatedAt: string;
  readonly window: TranscriptWindow;
}
