/**
 * Impact data for a single US congressional district
 *
 * @example
 * ```typescript
 * const district: USCongressionalDistrictBreakdownItem = {
 *   district: 'CA-52',
 *   average_household_income_change: 612.88,
 *   relative_household_income_change: 0.041
 * };
 * ```
 */
export interface USCongressionalDistrictBreakdownItem {
  /** District identifier in format "ST-NN" (e.g., "AL-01", "CA-52", "WY-01") */
  district: string;

  /** Average household income change in USD */
  average_household_income_change: number;

  /** Relative household income change as a decimal (e.g., 0.041 = 4.1%) */
  relative_household_income_change: number;
}

/**
 * Complete congressional district-level breakdown for US economy-wide reports
 *
 * Contains impact data for all 436 congressional districts (435 voting + DC).
 * This is returned as part of US society-wide report output.
 *
 * @example
 * ```typescript
 * const breakdown: USCongressionalDistrictBreakdown = {
 *   districts: [
 *     { district: 'AL-01', average_household_income_change: 312.45, relative_household_income_change: 0.0187 },
 *     { district: 'AL-02', average_household_income_change: -45.30, relative_household_income_change: -0.0028 },
 *     // ... 436 total
 *   ]
 * };
 * ```
 */
export interface USCongressionalDistrictBreakdown {
  /** Array of impact data for all congressional districts */
  districts: USCongressionalDistrictBreakdownItem[];
}
