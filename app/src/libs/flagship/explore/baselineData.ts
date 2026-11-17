/**
 * The current-law baseline that the Explore page shows: one static file
 * per country and year (`/data/baseline/us/2026.json`), with a value for
 * each metric in the nation, each state and each congressional district.
 * A precompute job writes the file on each model or data release; the
 * page starts no simulation. See `app/public/data/baseline/README.md`.
 */

/** The metrics the file holds. Rates are fractions (0.129 is 12.9%). */
export type BaselineMetricKey =
  | 'poverty'
  | 'child_poverty'
  | 'deep_poverty'
  | 'median_household_net_income'
  | 'gini';

/** An official figure to read beside the model's, such as Census's SPM rate. */
export interface BaselineBenchmark {
  value: number;
  /** The year or years it covers, e.g. "2022-2024 3-year average". */
  period: string;
  source: string;
  url: string;
}

export interface BaselineRegion {
  /** "United States", "Ohio", "OH-09". */
  label: string;
  metrics: Partial<Record<BaselineMetricKey, number>>;
  benchmarks?: Partial<Record<BaselineMetricKey, BaselineBenchmark>>;
}

/** What produced the numbers, so the page can say so. */
export interface BaselineReceipt {
  bundle: string;
  model: string;
  datasets: Record<string, string>;
  /** ISO date of the run; null in the placeholder file. */
  computed_at: string | null;
}

export interface BaselineFile {
  schema_version: 1;
  country: string;
  year: number;
  /** True while the file holds made-up numbers, before the first real run. */
  placeholder: boolean;
  receipt: BaselineReceipt;
  /** Keyed by the API's region names: "us", "state/oh", "congressional_district/OH-09". */
  regions: Record<string, BaselineRegion>;
}

/** The year the page shows until the file lists more than one. */
export const EXPLORE_YEAR = 2026;

export const NATION_REGION = 'us';

export type RegionLevel = 'nation' | 'state' | 'district';

export function baselineDataUrl(countryId: string, year: number): string {
  return `/data/baseline/${countryId}/${year}.json`;
}

/** Whether a parsed file has the shape this page reads. */
export function isBaselineFile(value: unknown): value is BaselineFile {
  const file = value as BaselineFile | null;
  return (
    !!file &&
    file.schema_version === 1 &&
    typeof file.year === 'number' &&
    typeof file.regions === 'object' &&
    !!file.regions?.[NATION_REGION]
  );
}

export async function fetchBaselineFile(countryId: string, year: number): Promise<BaselineFile> {
  const response = await fetch(baselineDataUrl(countryId, year));
  if (!response.ok) {
    throw new Error(`The current-law figures could not be loaded (${response.status}).`);
  }
  const file: unknown = await response.json();
  if (!isBaselineFile(file)) {
    throw new Error('The current-law figures are not in the expected format.');
  }
  return file;
}

export function regionLevel(region: string): RegionLevel {
  if (region.startsWith('state/')) {
    return 'state';
  }
  if (region.startsWith('congressional_district/')) {
    return 'district';
  }
  return 'nation';
}

/** "state/oh" from "OH" (a map shape's id). */
export function stateRegion(stateCode: string): string {
  return `state/${stateCode.toLowerCase()}`;
}

/** "congressional_district/OH-09" from "OH-09" (a map shape's id). */
export function districtRegion(districtId: string): string {
  return `congressional_district/${districtId}`;
}

/** The two-letter code a state or district region belongs to: "OH". */
export function stateCodeOf(region: string): string | null {
  const level = regionLevel(region);
  if (level === 'state') {
    return region.slice('state/'.length).toUpperCase();
  }
  if (level === 'district') {
    return region.slice('congressional_district/'.length, 'congressional_district/'.length + 2);
  }
  return null;
}

/** "OH-09" from "congressional_district/OH-09". */
export function districtIdOf(region: string): string | null {
  return regionLevel(region) === 'district' ? region.slice('congressional_district/'.length) : null;
}

/** The regions of one level; for districts, optionally only one state's. */
export function regionsAt(
  file: BaselineFile,
  level: Exclude<RegionLevel, 'nation'>,
  stateCode?: string | null
): string[] {
  return Object.keys(file.regions).filter(
    (region) => regionLevel(region) === level && (!stateCode || stateCodeOf(region) === stateCode)
  );
}

/** A region's name for a sentence: "Ohio", "OH-09", "the United States". */
export function regionName(file: BaselineFile, region: string): string {
  if (regionLevel(region) === 'nation') {
    return 'the United States';
  }
  return file.regions[region]?.label ?? region;
}
