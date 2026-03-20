import type {
  BillingStore,
  BillingState,
  CheckoutSession,
  EntitlementRecord,
} from '@takomi/contracts';

export interface InMemoryBillingStore extends BillingStore {}

export function createInMemoryBillingStore(
  initialPlans: BillingState['plans'] = []
): InMemoryBillingStore {
  const checkouts = new Map<string, CheckoutSession>();
  const entitlements = new Map<string, EntitlementRecord>();
  const plansByWorkspace = new Map<string, BillingState['plans']>();

  return {
    async getState(workspaceId: string): Promise<BillingState | undefined> {
      const activeCheckout = checkouts.get(workspaceId);
      const entitlement = entitlements.get(workspaceId);
      const plans = plansByWorkspace.get(workspaceId) ?? initialPlans;
      return {
        workspaceId,
        plans,
        ...(entitlement !== undefined ? { entitlement } : {}),
        ...(activeCheckout !== undefined ? { activeCheckout } : {}),
      };
    },

    async saveCheckout(session: CheckoutSession): Promise<void> {
      checkouts.set(session.workspaceId, structuredClone(session));
    },

    async saveEntitlement(record: EntitlementRecord): Promise<void> {
      entitlements.set(record.workspaceId, structuredClone(record));
    },
  };
}
