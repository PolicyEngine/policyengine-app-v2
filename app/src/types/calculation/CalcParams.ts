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
   * Estimate a society-wide run's duration from its region (optional, v3)
   * When true, the strategy uses getDurationForRegion and returns
   * estimatedDurationMs on pending statuses. Off by default: the country
   * estimate applies and no estimatedDurationMs is set.
   */
  estimateByRegion?: boolean;

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
