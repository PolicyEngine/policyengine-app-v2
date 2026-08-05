import { CountryId } from '@/libs/countries';

/**
 * The bill feed behind the Reforms surface.
 *
 * One interface, two sources: the state legislative tracker's Supabase
 * project (live, read-only via its public anon key) when the env vars
 * are set, and the in-repo sample bills otherwise. The UI never knows
 * which source it is on — this file is the seam that beat 2 of the
 * storage unification flips to the flagship project.
 */
export interface TrackedBillProvision {
  path: string;
  value: any;
  /** Used when the parameter is missing from loaded metadata. */
  fallbackBreadcrumb?: string;
}

export interface TrackedBill {
  id: string;
  countryId: CountryId;
  jurisdiction: string;
  title: string;
  status: string;
  summary: string;
  provisions: TrackedBillProvision[];
  /** Headline findings from the tracker's analysis, when available. */
  keyFindings?: string[];
  legiscanUrl?: string;
}

function trackerConfig(): { url: string; anonKey: string } | null {
  const url =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TRACKER_SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TRACKER_SUPABASE_URL);
  const anonKey =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' &&
      (import.meta as any).env?.VITE_TRACKER_SUPABASE_ANON_KEY);
  return url && anonKey ? { url, anonKey } : null;
}

async function trackerSelect(table: string, select: string): Promise<any[] | null> {
  const config = trackerConfig();
  if (!config) {
    return null;
  }
  const response = await fetch(`${config.url}/rest/v1/${table}?select=${select}`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Tracker feed ${table} failed: ${response.status}`);
  }
  return response.json();
}

/** Full state names for the tracker's two-letter state codes. */
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  IA: 'Iowa',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  MA: 'Massachusetts',
  MD: 'Maryland',
  ME: 'Maine',
  MI: 'Michigan',
  MN: 'Minnesota',
  MO: 'Missouri',
  MS: 'Mississippi',
  MT: 'Montana',
  NC: 'North Carolina',
  ND: 'North Dakota',
  NE: 'Nebraska',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NV: 'Nevada',
  NY: 'New York',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VA: 'Virginia',
  VT: 'Vermont',
  WA: 'Washington',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  WY: 'Wyoming',
};

/** Reform-params dict ({path: {"date.date": value}} or {path: value}) → provisions. */
export function provisionsFromReformParams(reformParams: unknown): TrackedBillProvision[] {
  if (!reformParams || typeof reformParams !== 'object') {
    return [];
  }
  return Object.entries(reformParams as Record<string, any>).map(([path, raw]) => {
    const value =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? Object.values(raw)[0] : raw;
    return { path, value };
  });
}

/**
 * Fetches analyzed bills from the tracker's Supabase project. Returns
 * null when the feed is not configured (callers fall back to samples).
 */
export async function fetchTrackerBills(): Promise<TrackedBill[] | null> {
  const [research, impacts, processed] = await Promise.all([
    trackerSelect('research', '*'),
    trackerSelect('reform_impacts', 'id,reform_params,computed'),
    trackerSelect('processed_bills', 'state,bill_number,status,legiscan_url'),
  ]);
  if (!research) {
    return null;
  }

  const impactsById = new Map((impacts ?? []).map((impact) => [impact.id, impact]));
  const processedByKey = new Map(
    (processed ?? []).map((bill) => [
      `${String(bill.state).toLowerCase()}-${String(bill.bill_number).toLowerCase().replace(/\s+/g, '')}`,
      bill,
    ])
  );

  return research.map((record): TrackedBill => {
    const impact = impactsById.get(record.id);
    const status = processedByKey.get(record.id)?.status;
    return {
      id: record.id,
      countryId: 'us',
      jurisdiction: STATE_NAMES[record.state] ?? record.state ?? 'Federal',
      title: record.title ?? record.id,
      status: status || 'Analyzed',
      summary: record.description ?? '',
      provisions: provisionsFromReformParams(impact?.reform_params),
      keyFindings: Array.isArray(record.key_findings) ? record.key_findings : undefined,
      legiscanUrl: processedByKey.get(record.id)?.legiscan_url ?? undefined,
    };
  });
}
