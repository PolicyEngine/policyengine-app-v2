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

/** Shares of households by outcome, as fractions of 1. */
export interface WinnerShares {
  gainMore5Pct?: number;
  gainLess5Pct?: number;
  noChange?: number;
  loseLess5Pct?: number;
  loseMore5Pct?: number;
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
  /** The bill's source page (congress.gov / state legislature), when known. */
  sourceUrl?: string;
  /** Bill sponsor, e.g. "Rep. Mackenzie, Ryan [R-PA-7]". */
  author?: string;
  /** Analysis date (ISO), for newest-first ordering. */
  date?: string;
  /** Model and data versions behind the stored analysis. */
  provenance?: {
    modelVersion?: string;
    dataset?: string;
    datasetVersion?: string;
    computedAt?: string;
  };
  /** Headline impact numbers from the tracker's stored microsim run. */
  impacts?: {
    /** Change in state revenue (negative = revenue loss). */
    revenue?: number;
    /** Poverty rate change in percent (negative = poverty falls). */
    povertyPercentChange?: number;
  };
  /** Full stored impact records, when the tracker has computed them. */
  impactData?: {
    budgetary?: { stateRevenueImpact?: number; netCost?: number; households?: number };
    poverty?: {
      baselineRate?: number;
      reformRate?: number;
      change?: number;
      percentChange?: number;
    };
    childPoverty?: {
      baselineRate?: number;
      reformRate?: number;
      change?: number;
      percentChange?: number;
    };
    winnersLosers?: WinnerShares & {
      /** Outcome shares within each income decile (1–10). */
      byDecile?: Record<string, WinnerShares>;
    };
    decile?: { relative?: Record<string, number>; average?: Record<string, number> };
  };
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

/** Headline numbers from a reform_impacts row, when present and numeric. */
function extractImpacts(impact: any): TrackedBill['impacts'] {
  const revenue = impact?.budgetary_impact?.stateRevenueImpact;
  const poverty = impact?.poverty_impact?.percentChange;
  const result: NonNullable<TrackedBill['impacts']> = {};
  if (typeof revenue === 'number' && Number.isFinite(revenue) && revenue !== 0) {
    result.revenue = revenue;
  }
  if (typeof poverty === 'number' && Number.isFinite(poverty) && poverty !== 0) {
    result.povertyPercentChange = poverty;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/** The full stored impact records, when the tracker computed this bill. */
function extractImpactData(impact: any): TrackedBill['impactData'] {
  if (!impact?.computed) {
    return undefined;
  }
  const data: NonNullable<TrackedBill['impactData']> = {};
  if (impact.budgetary_impact) {
    data.budgetary = impact.budgetary_impact;
  }
  if (impact.poverty_impact) {
    data.poverty = impact.poverty_impact;
  }
  if (impact.child_poverty_impact) {
    data.childPoverty = impact.child_poverty_impact;
  }
  if (impact.winners_losers) {
    // The tracker stores the all-households shares under intraDecile.all;
    // flatten them so consumers can read the documented flat fields.
    const wl = impact.winners_losers;
    const all = wl.intraDecile?.all ?? {};
    data.winnersLosers = {
      gainMore5Pct: wl.gainMore5Pct ?? all.gainMore5Pct,
      gainLess5Pct: wl.gainLess5Pct ?? all.gainLess5Pct,
      noChange: wl.noChange ?? all.noChange,
      loseLess5Pct: wl.loseLess5Pct ?? all.loseLess5Pct,
      loseMore5Pct: wl.loseMore5Pct ?? all.loseMore5Pct,
      byDecile: wl.intraDecile?.deciles ?? undefined,
    };
  }
  if (impact.decile_impact) {
    data.decile = impact.decile_impact;
  }
  return Object.keys(data).length > 0 ? data : undefined;
}

/**
 * Fetches analyzed bills from the tracker's Supabase project. Returns
 * null when the feed is not configured (callers fall back to samples).
 */
export async function fetchTrackerBills(): Promise<TrackedBill[] | null> {
  const [research, impacts, processed] = await Promise.all([
    trackerSelect('research', '*'),
    trackerSelect(
      'reform_impacts',
      'id,reform_params,computed,budgetary_impact,poverty_impact,child_poverty_impact,winners_losers,decile_impact,policyengine_us_version,dataset_name,dataset_version,computed_at'
    ),
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
      sourceUrl: record.url ?? undefined,
      author: record.author ?? undefined,
      date: record.date ?? undefined,
      provenance: impact
        ? {
            modelVersion: impact.policyengine_us_version ?? undefined,
            dataset: impact.dataset_name ?? undefined,
            datasetVersion: impact.dataset_version ?? undefined,
            computedAt: impact.computed_at ?? undefined,
          }
        : undefined,
      impacts: extractImpacts(impact),
      impactData: extractImpactData(impact),
    };
  });
}
