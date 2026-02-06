import { countryIds } from '@/libs/countries';

/**
 * Parameters needed to execute a calculation
 * Combines all information required to make API calls
 */
export interface CalcParams {
  /**
   * The country for this calculation
   */
  countryId: (typeof countryIds)[number];

  /**
   * The type of calculation to perform
   */
  calcType: 'societyWide' | 'household';

  /**
   * Policy IDs for the calculation
   *
   * In V2 API:
   * - null → current law (baseline)
   * - UUID string → reform policy
   */
  policyIds: {
    /**
     * Baseline policy ID (null = current law in V2 API)
     */
    baseline: string | null;
    /**
     * Reform policy ID (optional - if omitted, only baseline is calculated)
     */
    reform?: string | null;
  };

  /**
   * Population ID (household ID or geography ID)
   */
  populationId: string;

  /**
   * Region for society-wide calculations (optional)
   * Used for subnational society-wide calculations
   */
  region?: string;

  /**
   * Year for the calculation (e.g., '2025')
   * Used to specify which year's policy rules to apply
   */
  year: string;

  /**
   * Calculation ID for tracking
   * Used to correlate calculation with report/simulation
   */
  calcId: string;
}
