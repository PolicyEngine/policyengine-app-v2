/**
 * Versioned regions module
 *
 * Provides access to geographic regions that vary by simulation year.
 * Use resolveRegions() to get the correct regions for a given country and year.
 */

export { resolveRegions, getAvailableVersions } from './resolver';
export type { ResolvedRegions, RegionVersionMeta, VersionedRegionSet } from './types';

// Re-export versioned data for direct access if needed
export { US_CONGRESSIONAL_DISTRICTS } from './us/congressionalDistricts';
export { UK_CONSTITUENCIES } from './uk/constituencies';
export { UK_LOCAL_AUTHORITIES } from './uk/localAuthorities';
