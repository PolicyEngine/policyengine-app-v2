import { STATE_NAMES, type TrackedBill } from '@/api/billFeed';
import { billStage, type BillStage } from './billStage';

/** Federal bills carry no state; every bill with a state is a state bill. */
export type BillLevel = 'federal' | 'state';

/** The bill feed's filters: level, one state within it, and stage. */
export interface BillFilters {
  level: 'all' | BillLevel;
  /** A lowercase state code, or 'all'. Read only at the state level. */
  state: string;
  stage: 'all' | BillStage;
}

export const NO_BILL_FILTERS: BillFilters = { level: 'all', state: 'all', stage: 'all' };

type FilterableBill = Pick<TrackedBill, 'state' | 'status'>;

export const billLevel = (bill: Pick<TrackedBill, 'state'>): BillLevel =>
  bill.state ? 'state' : 'federal';

/** Where a bill is from, as its card names it: the state, or "Federal". */
export const billPlace = (bill: Pick<TrackedBill, 'state' | 'jurisdiction'>): string =>
  bill.state ? (STATE_NAMES[bill.state] ?? bill.jurisdiction) : 'Federal';

function inPlace(bill: FilterableBill, filters: BillFilters): boolean {
  if (filters.level === 'all') {
    return true;
  }
  if (billLevel(bill) !== filters.level) {
    return false;
  }
  return (
    filters.level !== 'state' ||
    filters.state === 'all' ||
    bill.state?.toLowerCase() === filters.state
  );
}

/** A bill with no tracked stage passes only when every stage does. */
const atStage = (bill: FilterableBill, filters: BillFilters): boolean =>
  filters.stage === 'all' || billStage(bill.status) === filters.stage;

/** The bills that pass every filter, in their order. */
export function filterBills<T extends FilterableBill>(bills: T[], filters: BillFilters): T[] {
  return bills.filter((bill) => inPlace(bill, filters) && atStage(bill, filters));
}

/**
 * How many state bills each state holds at the chosen stage, keyed by
 * lowercase code, with every state's total under 'all' — the counts the
 * state picker shows beside each state. Each of `stateCodes` counts from
 * 0, so a listed state with no bill at the stage reads 0, not blank.
 */
export function stateBillCounts(
  bills: FilterableBill[],
  filters: BillFilters,
  stateCodes: string[] = []
) {
  const counts: Record<string, number> = { all: 0 };
  for (const code of stateCodes) {
    counts[code.toLowerCase()] = 0;
  }
  for (const bill of bills) {
    const code = bill.state?.toLowerCase();
    if (code && atStage(bill, filters)) {
      counts.all += 1;
      counts[code] = (counts[code] ?? 0) + 1;
    }
  }
  return counts;
}
