import { vi } from 'vitest';

/** Tracker Supabase rows by table name, as a feed test serves them. */
export type TrackerTableRows = Record<string, any[]>;

/** A fetch that answers each tracker table request with its rows (none for other tables). */
export const mockTrackerFetch = (rows: TrackerTableRows) =>
  vi.fn(async (url: string) => {
    const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
    return { ok: true, json: async () => rows[table] ?? [] };
  });

/** Bills that read by the tracker's place names, titles and pages. */
export const TRACKER_NAMING_ROWS: TrackerTableRows = {
  research: [
    { id: 'us-hr1425', state: 'US', type: 'bill', title: 'HR 1425' },
    // An older federal row, filed under "all".
    { id: 'us-hr7024', state: 'all', type: 'bill', title: 'HR 7024' },
    { id: 'dc-b26', state: 'dc', type: 'bill', title: 'DC B26' },
    // No title: the tracker names it by the bill number its id carries.
    { id: 'ut-hb-106', state: 'UT', type: 'bill' },
  ],
};

const NET_COST_ONLY_BILL = { id: 'us-hr1425', state: 'US', type: 'bill', title: 'HR 1425' };

/** A stored run with a net cost and no state revenue change. */
export const NET_COST_ONLY_ROWS: TrackerTableRows = {
  research: [NET_COST_ONLY_BILL],
  reform_impacts: [
    { id: NET_COST_ONLY_BILL.id, computed: true, budgetary_impact: { netCost: -74_200_000 } },
  ],
};

/** The same run, validated when its net cost was another number. */
export const NET_COST_DRIFT_ROWS: TrackerTableRows = {
  ...NET_COST_ONLY_ROWS,
  validation_metadata: [
    {
      id: NET_COST_ONLY_BILL.id,
      pe_estimate: -70_000_000,
      fiscal_note_estimate: -71_000_000,
      within_range: true,
      validated_against: { pe_estimate: -70_000_000 },
    },
  ],
};

/** The most rows one tracker read returns, as the Supabase cap sets it. */
export const TRACKER_PAGE_LIMIT = 1000;

/** The tracker's bill-status table holds more rows than one read returns. */
export const STATUS_TABLE_ROWS = 1418;

/** The first column a PostgREST `order` names ("bill_id" in "bill_id.asc"). */
const orderColumn = (order: string) => order.split(',')[0].split('.')[0];

const byColumn = (column: string) => (a: any, b: any) =>
  a[column] < b[column] ? -1 : a[column] > b[column] ? 1 : 0;

/**
 * A fetch that serves each tracker table a page at a time, as PostgREST
 * does. A read that names an `order` gets its rows in that order. A read
 * with none has no fixed row order: as on the live tracker, every page
 * starts from the table's first rows again, so a later page repeats rows
 * already read and the rest never arrive.
 */
export const mockPagedTrackerFetch = (rows: TrackerTableRows) =>
  vi.fn(async (url: string) => {
    const { pathname, searchParams } = new URL(url);
    const all = rows[pathname.split('/').pop() ?? ''] ?? [];
    const order = searchParams.get('order');
    const offset = Number(searchParams.get('offset') ?? 0);
    const limit = Number(searchParams.get('limit') ?? all.length);
    const count = Math.max(0, Math.min(limit, all.length - offset));
    const page = order
      ? [...all].sort(byColumn(orderColumn(order))).slice(offset, offset + count)
      : all.slice(0, count);
    return {
      ok: true,
      headers: new Headers({
        'content-range': `${offset}-${offset + page.length - 1}/${all.length}`,
      }),
      json: async () => page,
    };
  });

/** WV SB 392, whose one status row is the bill-status table's last. */
export const LATE_STATUS_BILL = {
  id: 'wv-sb392',
  state: 'WV',
  type: 'bill',
  title: 'WV SB 392',
} as const;
export const LATE_STATUS = {
  status: 'Signed into Law',
  legiscanUrl: 'https://legiscan.com/WV/bill/SB392/2026',
} as const;

/** A full bill-status table with WV SB 392's row past the first page. */
export const LATE_STATUS_ROWS: TrackerTableRows = {
  research: [LATE_STATUS_BILL],
  processed_bills: Array.from({ length: STATUS_TABLE_ROWS }, (_, index) =>
    index === STATUS_TABLE_ROWS - 1
      ? {
          bill_id: 2_000_000 + index,
          state: 'WV',
          bill_number: 'SB392',
          status: LATE_STATUS.status,
          legiscan_url: LATE_STATUS.legiscanUrl,
        }
      : {
          bill_id: 2_000_000 + index,
          state: 'OK',
          bill_number: `HB${1000 + index}`,
          status: 'Introduced',
        }
  ),
};

/** Bills enough that every tracker table runs past one page. */
export const MANY_BILLS = TRACKER_PAGE_LIMIT + 1;
export const MANY_BILLS_STATUS = 'In Committee';

const MANY_BILL_NUMBERS = Array.from({ length: MANY_BILLS }, (_, index) => 1000 + index);

/** Every table past one page: each bill has its entry, run, check and status row. */
export const MANY_BILL_ROWS: TrackerTableRows = {
  research: MANY_BILL_NUMBERS.map((number) => ({
    id: `ok-hb${number}`,
    state: 'OK',
    type: 'bill',
    title: `OK HB ${number}`,
  })),
  reform_impacts: MANY_BILL_NUMBERS.map((number) => ({
    id: `ok-hb${number}`,
    computed: true,
    budgetary_impact: { stateRevenueImpact: -number * 1000 },
  })),
  validation_metadata: MANY_BILL_NUMBERS.map((number) => ({
    id: `ok-hb${number}`,
    pe_estimate: -number * 1000,
    fiscal_note_estimate: -number * 1000,
    within_range: true,
  })),
  processed_bills: MANY_BILL_NUMBERS.map((number) => ({
    bill_id: 3_000_000 + number,
    state: 'OK',
    bill_number: `HB ${number}`,
    status: MANY_BILLS_STATUS,
  })),
};

/** NY S 4487, filed twice in the status table under two spellings of its number. */
export const TWICE_FILED_BILL = {
  id: 'ny-s-4487',
  state: 'NY',
  type: 'bill',
  title: 'NY S 4487',
} as const;
/** The later of the two rows: LegiScan gives a later bill a higher id. */
export const TWICE_FILED_LATER = {
  bill_id: 1_987_654,
  state: 'NY',
  bill_number: 'S04487',
  status: 'In Committee',
  legiscan_url: 'https://legiscan.com/NY/bill/S04487/2025',
} as const;
export const TWICE_FILED_EARLIER = {
  bill_id: 1_765_432,
  state: 'NY',
  bill_number: 'S 4487',
  status: 'Introduced',
  legiscan_url: 'https://openstates.org/ny/bills/2025-2026/S4487/',
} as const;
