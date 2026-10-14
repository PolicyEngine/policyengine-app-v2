/**
 * Shared constants for calculation duration estimates
 *
 * These values are used across multiple systems:
 * 1. SocietyWideCalcStrategy - Server-side progress calculation
 * 2. useSyntheticProgress - Client-side synthetic progress animation
 * 3. Test fixtures - Ensuring consistent test expectations
 *
 * IMPORTANT: These are estimates used for progress display.
 * Actual calculation times may vary based on:
 * - Queue position
 * - Server load
 * - Calculation complexity
 * - Dataset size (Enhanced CPS vs standard)
 * - Region (a state run is much shorter than a nationwide run)
 *
 * The country estimates (getDurationForCountry) are the defaults. The region
 * estimates (getDurationForRegion) are opt-in, and come from successful
 * production runs between 6 and 13 October 2026, measured from submission
 * to completion. Most use the 90th percentile, so the bar rarely reaches its
 * cap before the result.
 */

import { normalizeRegionCode } from '@/models/region';

/**
 * Duration estimate for US society-wide calculations
 * Used for Enhanced CPS dataset calculations
 * Also the region estimate for US nationwide runs: observed mean 338 s,
 * 90th percentile 392 s; 6 minutes sits between them.
 */
export const US_SOCIETY_WIDE_DURATION_MS = 6 * 60 * 1000; // 6 minutes

/**
 * Duration estimate for UK society-wide calculations
 */
export const UK_SOCIETY_WIDE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

/**
 * Region estimate for US state society-wide calculations
 * Observed 90th percentile 187 s. Also used for US place (city) runs,
 * which have no observed samples yet.
 */
export const US_STATE_SOCIETY_WIDE_DURATION_MS = 190 * 1000;

/**
 * Region estimate for US congressional district society-wide calculations
 * Only one observed sample (200 s), so treat it as a rough value.
 */
export const US_DISTRICT_SOCIETY_WIDE_DURATION_MS = 200 * 1000;

/**
 * Region estimate for UK society-wide calculations
 * Observed nationwide 90th percentile 108 s. Also used for UK subnational
 * runs, which have no observed samples yet. Only getDurationForRegion uses
 * it; the country estimate stays UK_SOCIETY_WIDE_DURATION_MS.
 */
export const UK_REGION_SOCIETY_WIDE_DURATION_MS = 110 * 1000;

/**
 * Duration estimate for household calculations
 * These are synchronous API calls that block until complete
 */
export const HOUSEHOLD_DURATION_MS = 60 * 1000; // 1 minute

/**
 * Default duration for unknown calculation types
 * Falls back to US society-wide duration
 */
export const DEFAULT_SOCIETY_WIDE_DURATION_MS = US_SOCIETY_WIDE_DURATION_MS;

/**
 * Get duration estimate based on country ID
 * @param countryId - Country identifier ('us', 'uk', etc.)
 * @returns Duration in milliseconds
 */
export function getDurationForCountry(countryId: string): number {
  switch (countryId.toLowerCase()) {
    case 'us':
      return US_SOCIETY_WIDE_DURATION_MS;
    case 'uk':
      return UK_SOCIETY_WIDE_DURATION_MS;
    default:
      return DEFAULT_SOCIETY_WIDE_DURATION_MS;
  }
}

/**
 * Get the region estimate for a society-wide calculation
 * @param countryId - Country identifier ('us', 'uk', etc.)
 * @param region - Region as sent to the API, e.g. 'us', 'state/ca' or
 *   'congressional_district/CA-46' (legacy codes such as 'ca', 'us-ca' and
 *   'CA-46' also work); omitted or the country code for nationwide
 * @returns Duration in milliseconds
 */
export function getDurationForRegion(countryId: string, region?: string): number {
  const country = countryId.toLowerCase();
  if (country === 'uk') {
    return UK_REGION_SOCIETY_WIDE_DURATION_MS;
  }
  if (country === 'us' && region) {
    const regionType = normalizeRegionCode('us', region).split('/')[0].toLowerCase();
    if (regionType === 'state' || regionType === 'place') {
      return US_STATE_SOCIETY_WIDE_DURATION_MS;
    }
    if (regionType === 'congressional_district') {
      return US_DISTRICT_SOCIETY_WIDE_DURATION_MS;
    }
  }
  return getDurationForCountry(countryId);
}

/**
 * Get duration estimate based on calculation type
 * @param calcType - Type of calculation ('household' or 'societyWide')
 * @param countryId - Optional country identifier for society-wide calculations
 * @returns Duration in milliseconds
 */
export function getDurationForCalcType(
  calcType: 'household' | 'societyWide',
  countryId?: string
): number {
  if (calcType === 'household') {
    return HOUSEHOLD_DURATION_MS;
  }
  return countryId ? getDurationForCountry(countryId) : DEFAULT_SOCIETY_WIDE_DURATION_MS;
}
