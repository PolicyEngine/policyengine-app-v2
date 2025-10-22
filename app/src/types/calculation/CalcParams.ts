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
   */
  policyIds: {
    /**
     * Baseline policy ID
     */
    baseline: string;
    /**
     * Reform policy ID (optional - if omitted, only baseline is calculated)
     */
    reform?: string;
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
   * Calculation ID for tracking
   * Used to correlate calculation with report/simulation
   */
  calcId: string;
}
