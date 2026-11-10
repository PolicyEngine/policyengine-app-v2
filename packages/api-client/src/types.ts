/** The countries the dashboard API serves. */
export type Country = "us" | "uk";

/** A household in PolicyEngine's situation format. */
export type Household = Record<string, unknown>;

/**
 * Parameter changes, keyed by parameter path, each mapping a period such as
 * "2026-01-01.2100-12-31" to a value.
 */
export type PolicyParameters = Record<string, unknown>;

export interface HouseholdCalculationRequest {
  readonly country: Country;
  readonly household: Household;
  /** Parameter changes to apply; current law when omitted. */
  readonly policy?: PolicyParameters;
}

export interface PolicyCreationRequest {
  readonly country: Country;
  readonly parameters: PolicyParameters;
}

export interface EconomyComparisonRequest {
  readonly country: Country;
  /** The reform's policy ID, from createPolicy(). */
  readonly policy: number;
  /** The baseline's policy ID; current law's ID for the country. */
  readonly baseline: number;
  /** "us", "uk", or a sub-national region such as "state/ca". */
  readonly region: string;
  readonly year: number | string;
}

/** Every answer from the dashboard API, except policy creation's. */
export interface DashboardApiAnswer<Result = unknown> {
  readonly status: "ok" | "error" | "computing";
  readonly message: string | null;
  readonly result: Result | null;
  /** Further fields, such as an economy comparison's progress. */
  readonly [field: string]: unknown;
}

export interface RequestOptions {
  readonly signal?: AbortSignal;
}

export interface EconomyComparisonPollOptions extends RequestOptions {
  /** How long to wait between reads while the comparison is computing. */
  readonly intervalMilliseconds?: number;
  /** How long to keep polling before giving up. */
  readonly timeoutMilliseconds?: number;
  /** Called with each "computing" answer, for progress displays. */
  readonly onProgress?: (answer: DashboardApiAnswer) => void;
}
