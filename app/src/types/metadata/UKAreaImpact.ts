/**
 * How disclosure control published an area's estimate. `approximate` means
 * few survey households support it: the estimate is kept, but its 90%
 * interval understates the uncertainty. Withheld areas are left out.
 */
export type UKAreaDisclosureTier = 'reported' | 'approximate';

/** One constituency's or local authority's income change, keyed by its name. */
export interface UKAreaImpact {
  average_household_income_change: number;
  relative_household_income_change: number;
  /** The ONS code (e.g. W07000081), when the API's list shape gave one. */
  code?: string;
  /** Present on disclosure-controlled results (local-area breakdowns). */
  disclosure_tier?: UKAreaDisclosureTier;
  /** Each change's 90% interval, when the result gives one. */
  average_household_income_change_lower?: number;
  average_household_income_change_upper?: number;
  relative_household_income_change_lower?: number;
  relative_household_income_change_upper?: number;
}
