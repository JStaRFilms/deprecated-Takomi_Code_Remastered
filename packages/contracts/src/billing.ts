import type { AuditEventEnvelope } from './audit.js';

export const BILLING_PLAN_IDS = ['starter', 'pro', 'team'] as const;
export type BillingPlanId = (typeof BILLING_PLAN_IDS)[number];

export const ENTITLEMENT_STATUSES = ['inactive', 'pending', 'active'] as const;
export type EntitlementStatus = (typeof ENTITLEMENT_STATUSES)[number];

export const CHECKOUT_STATUSES = ['pending', 'ready', 'completed', 'failed'] as const;
export type CheckoutStatus = (typeof CHECKOUT_STATUSES)[number];

export interface BillingPlanDefinition {
  readonly id: BillingPlanId;
  readonly label: string;
  readonly monthlyPriceLabel: string;
  readonly description: string;
}

export interface CheckoutSession {
  readonly id: string;
  readonly workspaceId: string;
  readonly provider: 'paystack';
  readonly planId: BillingPlanId;
  readonly status: CheckoutStatus;
  readonly reference: string;
  readonly checkoutUrl?: string;
  readonly startedAt: string;
  readonly completedAt?: string;
  readonly failureReason?: string;
}

export interface EntitlementRecord {
  readonly id: string;
  readonly workspaceId: string;
  readonly provider: 'paystack';
  readonly planId: BillingPlanId;
  readonly status: EntitlementStatus;
  readonly activatedAt?: string;
  readonly expiresAt?: string;
  readonly renewedAt?: string;
}

export interface BillingState {
  readonly workspaceId: string;
  readonly plans: readonly BillingPlanDefinition[];
  readonly entitlement?: EntitlementRecord;
  readonly activeCheckout?: CheckoutSession;
}

export interface BillingService {
  getState(workspaceId: string): Promise<BillingState>;
  startCheckout(workspaceId: string, planId: BillingPlanId): Promise<CheckoutSession>;
  activateEntitlement(record: EntitlementRecord): Promise<void>;
}

export function createCheckoutStartedAuditEvent(
  checkout: CheckoutSession
): AuditEventEnvelope<'billing.checkout_started'> {
  return {
    id: `audit-billing-checkout-started-${checkout.id}`,
    kind: 'billing.checkout_started',
    timestamp: checkout.startedAt,
    subjectId: checkout.id,
    subjectType: 'billing',
    workspaceId: checkout.workspaceId,
    data: {
      provider: checkout.provider,
      planId: checkout.planId,
      reference: checkout.reference,
      status: checkout.status,
      checkoutUrl: checkout.checkoutUrl,
    },
  };
}

export function createEntitlementActivatedAuditEvent(
  entitlement: EntitlementRecord
): AuditEventEnvelope<'billing.entitlement_activated'> {
  return {
    id: `audit-billing-entitlement-activated-${entitlement.id}`,
    kind: 'billing.entitlement_activated',
    timestamp: entitlement.activatedAt ?? new Date().toISOString(),
    subjectId: entitlement.id,
    subjectType: 'billing',
    workspaceId: entitlement.workspaceId,
    data: {
      provider: entitlement.provider,
      planId: entitlement.planId,
      status: entitlement.status,
      expiresAt: entitlement.expiresAt,
      renewedAt: entitlement.renewedAt,
    },
  };
}
