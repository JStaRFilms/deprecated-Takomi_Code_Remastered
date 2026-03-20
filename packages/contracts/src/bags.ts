import type { AuditEventEnvelope } from './audit.js';

export interface BagsLinkageRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly tokenLabel: string;
  readonly tokenMasked: string;
  readonly linkedAt: string;
  readonly lastVerifiedAt?: string;
}

export interface BagsReadinessCheck {
  readonly key: 'token-linked' | 'runtime-configured' | 'entitlement-active' | 'agent-defaults-loaded';
  readonly label: string;
  readonly ok: boolean;
  readonly detail?: string;
}

export interface BagsReadinessResult {
  readonly id: string;
  readonly workspaceId: string;
  readonly ready: boolean;
  readonly checkedAt: string;
  readonly checks: readonly BagsReadinessCheck[];
  readonly summary: string;
}

export interface BagsState {
  readonly workspaceId: string;
  readonly linkage?: BagsLinkageRecord;
  readonly latestReadiness?: BagsReadinessResult;
}

export interface BagsService {
  getState(workspaceId: string): Promise<BagsState>;
  linkToken(workspaceId: string, token: string, tokenLabel: string): Promise<BagsLinkageRecord>;
  unlinkToken(workspaceId: string): Promise<void>;
  checkReadiness(workspaceId: string): Promise<BagsReadinessResult>;
}

export function createBagsAuditEvent(
  kind: 'bags.token_linked' | 'bags.token_unlinked' | 'bags.verification_checked' | 'bags.verification_failed',
  workspaceId: string,
  subjectId: string,
  data: Record<string, unknown>
): AuditEventEnvelope<typeof kind> {
  return {
    id: `audit-${kind}-${subjectId}`,
    kind,
    timestamp: new Date().toISOString(),
    subjectId,
    subjectType: 'bags',
    workspaceId,
    data,
  };
}
