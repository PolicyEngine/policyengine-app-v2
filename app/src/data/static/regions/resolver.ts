/**
 * Region resolver - returns the correct regions for a country and simulation year
 */

import { MetadataRegionEntry } from '@/types/metadata';
import { US_REGIONS, UK_REGIONS } from '../staticRegions';
import { US_CONGRESSIONAL_DISTRICTS } from './us/congressionalDistricts';
import { UK_CONSTITUENCIES } from './uk/constituencies';
import { UK_LOCAL_AUTHORITIES } from './uk/localAuthorities';
import { ResolvedRegions } from './types';

/**
 * Resolve all regions for a country and simulation year
 *
 * This function returns the correct set of regions based on:
 * - Country (us/uk)
 * - Simulation year (determines which version of dynamic regions to use)
 *
 * Static regions (states, countries) are always included.
 * Dynamic regions (congressional districts, constituencies, local authorities)
 * are resolved based on the simulation year.
 */
export function resolveRegions(
  countryId: string,
  year: number
): ResolvedRegions {
  switch (countryId) {
    case 'us': {
      const districtVersion =
        US_CONGRESSIONAL_DISTRICTS.getVersionForYear(year);
      const districts =
        US_CONGRESSIONAL_DISTRICTS.versions[districtVersion].data;

      return {
        regions: [...US_REGIONS, ...districts],
        versions: { congressionalDistricts: districtVersion },
      };
    }

    case 'uk': {
      const constituencyVersion = UK_CONSTITUENCIES.getVersionForYear(year);
      const constituencies = UK_CONSTITUENCIES.versions[constituencyVersion].data;

      const laVersion = UK_LOCAL_AUTHORITIES.getVersionForYear(year);
      const localAuthorities = UK_LOCAL_AUTHORITIES.versions[laVersion].data;

      return {
        regions: [...UK_REGIONS, ...constituencies, ...localAuthorities],
        versions: {
          constituencies: constituencyVersion,
          localAuthorities: laVersion,
        },
      };
    }

    default:
      return { regions: [], versions: {} };
  }
}

/**
 * Get available region versions for a country
 */
export function getAvailableVersions(countryId: string): {
  congressionalDistricts?: string[];
  constituencies?: string[];
  localAuthorities?: string[];
} {
  switch (countryId) {
    case 'us':
      return {
        congressionalDistricts: Object.keys(US_CONGRESSIONAL_DISTRICTS.versions),
      };
    case 'uk':
      return {
        constituencies: Object.keys(UK_CONSTITUENCIES.versions),
        localAuthorities: Object.keys(UK_LOCAL_AUTHORITIES.versions),
      };
    default:
      return {};
  }
}
