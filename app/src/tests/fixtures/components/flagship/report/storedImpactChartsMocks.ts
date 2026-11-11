import type { TrackedBill } from '@/api/billFeed';

type StoredBill = Pick<TrackedBill, 'state' | 'impacts' | 'impactData'>;

/** A stored run with a net cost and no state revenue change. */
const NET_COST_ONLY_IMPACT: TrackedBill['impactData'] = {
  budgetary: { netCost: -74_200_000 },
};

/** A state bill whose stored run has a net cost only (the feed reads it as the revenue change). */
export const NET_COST_ONLY_BILL: StoredBill = {
  state: 'KS',
  impacts: { revenue: -74_200_000 },
  impactData: NET_COST_ONLY_IMPACT,
};

/** A state bill that raises its state's revenue. */
export const STATE_REVENUE_GAIN_BILL: StoredBill = {
  state: 'UT',
  impacts: { revenue: 11_482_293 },
  impactData: { budgetary: { stateRevenueImpact: 11_482_293, netCost: 11_482_293 } },
};

/** A state bill that costs its state revenue. */
export const STATE_REVENUE_LOSS_BILL: StoredBill = {
  state: 'NY',
  impacts: { revenue: -282_165_820 },
  impactData: { budgetary: { stateRevenueImpact: -282_165_820 } },
};

/** A federal bill: the tracker files it with no state. */
export const FEDERAL_REVENUE_LOSS_BILL: StoredBill = {
  impacts: { revenue: -225_500_000_000 },
  impactData: { budgetary: { stateRevenueImpact: -225_500_000_000 } },
};
