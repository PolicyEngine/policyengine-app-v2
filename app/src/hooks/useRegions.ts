/**
 * Hook for accessing regions based on country and simulation year
 *
 * Regions are derived data, not stored state. This hook computes the correct
 * set of regions based on the country and simulation year, supporting multiple
 * versions of dynamic regions (congressional districts, constituencies, etc.)
 */

import { useMemo } from 'react';
import { ResolvedRegions, resolveRegions } from '@/data/static/regions';

/**
 * Get regions for a country and simulation year
 *
 * This hook returns the appropriate set of regions based on:
 * - countryId: 'us' or 'uk'
 * - year: The simulation year (determines which version of dynamic regions to use)
 *
 * The returned regions include both static regions (states, countries) and
 * dynamic regions (congressional districts, constituencies, local authorities)
 * resolved to the correct version for the given year.
 *
 * @example
 * ```tsx
 * function PopulationScopeView() {
 *   const countryId = useCurrentCountry();
 *   const simulationYear = useSelector(selectSimulationYear);
 *
 *   const { regions, versions } = useRegions(countryId, simulationYear);
 *
 *   // Filter for specific region types
 *   const constituencies = getUKConstituencies(regions);
 *   const districts = getUSCongressionalDistricts(regions);
 *
 *   return <RegionSelector regions={regions} />;
 * }
 * ```
 */
export function useRegions(countryId: string, year: number): ResolvedRegions {
  return useMemo(() => resolveRegions(countryId, year), [countryId, year]);
}

/**
 * Get just the regions array for a country and year
 *
 * Convenience wrapper when you don't need version information.
 */
export function useRegionsList(countryId: string, year: number): ResolvedRegions['regions'] {
  const { regions } = useRegions(countryId, year);
  return regions;
}
