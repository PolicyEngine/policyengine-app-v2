/**
 * Utility functions for congressional district data processing
 */

/** Prefix used for state region codes in the API */
const STATE_REGION_PREFIX = 'state/';

/**
 * Which congressional districts a report's region has: every state's, for
 * the whole country (no region, or `us`); one state's, for `state/*`; or
 * none, for a district, a place or anything else.
 */
export type CongressionalDistrictScope = 'nationwide' | 'state';

export function congressionalDistrictScope(
  region: string | null | undefined
): CongressionalDistrictScope | null {
  if (!region || region.toLowerCase() === 'us') {
    return 'nationwide';
  }
  return isStateLevelRegion(region) ? 'state' : null;
}

/**
 * Check if a region string represents a state-level report.
 * State regions have the format 'state/ca', 'state/dc', etc.
 *
 * @param region - The region string to check
 * @returns True if this is a state-level region
 */
export function isStateLevelRegion(region: string | undefined): boolean {
  if (!region) {
    return false;
  }
  return region.toLowerCase().startsWith(STATE_REGION_PREFIX);
}

/**
 * Extract the state code from a region string.
 * Strips the 'state/' prefix if present.
 *
 * @param region - The region string (e.g., 'state/ca' or 'ca')
 * @returns The state code (e.g., 'ca'), or null if region is falsy
 *
 * @example
 * extractStateCode('state/ca') // returns 'ca'
 * extractStateCode('state/dc') // returns 'dc'
 * extractStateCode('ca') // returns 'ca'
 * extractStateCode(undefined) // returns null
 */
export function extractStateCode(region: string | undefined): string | null {
  if (!region) {
    return null;
  }
  const regionLower = region.toLowerCase();
  return regionLower.startsWith(STATE_REGION_PREFIX)
    ? regionLower.slice(STATE_REGION_PREFIX.length)
    : regionLower;
}
