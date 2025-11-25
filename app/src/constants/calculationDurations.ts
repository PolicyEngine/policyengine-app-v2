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
 */

/**
 * Duration estimate for US society-wide calculations
 * Used for Enhanced CPS dataset calculations
 */
export const US_SOCIETY_WIDE_DURATION_MS = 6 * 60 * 1000; // 6 minutes

/**
 * Duration estimate for UK society-wide calculations
 */
export const UK_SOCIETY_WIDE_DURATION_MS = 3 * 60 * 1000; // 3 minutes

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
