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
