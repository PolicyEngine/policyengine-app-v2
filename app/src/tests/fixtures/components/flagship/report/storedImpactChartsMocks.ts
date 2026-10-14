import type { TrackedBill } from '@/api/billFeed';

/** A stored run with a net cost and no state revenue change. */
export const NET_COST_ONLY_IMPACT: TrackedBill['impactData'] = {
  budgetary: { netCost: -74_200_000 },
};
