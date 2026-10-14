import { vi } from 'vitest';

/** Tracker Supabase rows by table name, as a feed test serves them. */
export type TrackerTableRows = Record<string, any[]>;

/** A fetch that answers each tracker table request with its rows (none for other tables). */
export const mockTrackerFetch = (rows: TrackerTableRows) =>
  vi.fn(async (url: string) => {
    const table = String(url).match(/rest\/v1\/(\w+)\?/)?.[1] ?? '';
    return { ok: true, json: async () => rows[table] ?? [] };
  });

/** The most rows one tracker request returns. */
const TRACKER_PAGE_SIZE = 1000;

/**
 * A fetch that serves each tracker table 1,000 rows at a time, as
 * PostgREST does. With no `order` parameter, each request sees the rows
 * in another order (Postgres keeps no row order without ORDER BY), so
 * pages overlap and skip rows. With `order=<column>.asc,...`, the rows
 * sort by those columns, and the pages fit together.
 */
export const mockPagedTrackerFetch = (rows: TrackerTableRows) => {
  const requests: Record<string, number> = {};
  return vi.fn(async (url: string) => {
    const parsed = new URL(String(url));
    const table = parsed.pathname.split('/').pop() ?? '';
    const offset = Number(parsed.searchParams.get('offset') ?? 0);
    const order = parsed.searchParams.get('order');
    const all = rows[table] ?? [];
    requests[table] = (requests[table] ?? 0) + 1;
    const columns = order?.split(',').map((term) => term.split('.')[0]) ?? [];
    const served =
      columns.length > 0
        ? [...all].sort((a, b) => {
            for (const column of columns) {
              if (a[column] !== b[column]) {
                return a[column] < b[column] ? -1 : 1;
              }
            }
            return 0;
          })
        : // Unordered: every other request to a table reads it back to front.
          requests[table] % 2 === 0
          ? [...all].reverse()
          : all;
    const page = served.slice(offset, offset + TRACKER_PAGE_SIZE);
    return {
      ok: true,
      headers: new Headers({
        'content-range': `${offset}-${offset + page.length - 1}/${all.length}`,
      }),
      json: async () => page,
    };
  });
};

/**
 * The bill-status table: 1,418 rows, more than one request returns. The
 * bill's own row is the last one.
 */
export const LARGE_STATUS_TABLE_ROWS: TrackerTableRows = {
  research: [{ id: 'ut-hb210', state: 'UT', type: 'bill', status: 'published', title: 'HB 210' }],
  processed_bills: Array.from({ length: 1418 }, (_, index) =>
    index === 1417
      ? { bill_id: index, state: 'UT', bill_number: 'HB210', status: 'Signed' }
      : { bill_id: index, state: 'UT', bill_number: `HB${index + 5000}`, status: 'Introduced' }
  ),
};

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
