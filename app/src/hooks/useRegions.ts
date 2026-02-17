/**
 * Hook for accessing regions from the V2 API
 *
 * Regions are fetched from the API based on country. This replaces the
 * previous static data approach with dynamic API-driven region data.
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { RegionsAdapter } from '@/adapters';
import { fetchRegions, V2RegionMetadata } from '@/api/v2';
import { regionKeys } from '@/libs/queryKeys';
import { MetadataRegionEntry } from '@/types/metadata';

/**
 * Result type for useRegions hook
 */
export interface RegionsResult {
  regions: MetadataRegionEntry[];
  isLoading: boolean;
  error: Error | null;
  /**
   * Raw V2 API region data for when you need filter_field, filter_value, etc.
   */
  rawRegions: V2RegionMetadata[];
}

/**
 * Get regions for a country from the V2 API
 *
 * This hook fetches and returns all regions for a country.
 * Regions include states, cities, congressional districts, constituencies, etc.
 *
 * @param countryId - Country to fetch regions for (e.g., 'us', 'uk')
 *
 * @example
 * ```tsx
 * function PopulationScopeView() {
 *   const countryId = useCurrentCountry();
 *   const { regions, isLoading, error } = useRegions(countryId);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   // Filter for specific region types
 *   const states = regions.filter(r => r.type === 'state');
 *   const districts = regions.filter(r => r.type === 'congressional_district');
 *
 *   return <RegionSelector regions={regions} />;
 * }
 * ```
 */
export function useRegions(countryId: string): RegionsResult {
  const query: UseQueryResult<V2RegionMetadata[], Error> = useQuery({
    queryKey: regionKeys.byCountry(countryId),
    queryFn: () => fetchRegions(countryId),
    enabled: !!countryId,
    staleTime: 5 * 60 * 1000, // 5 minutes - regions don't change often
  });

  return {
    regions: query.data ? RegionsAdapter.regionsFromV2(query.data) : [],
    isLoading: query.isLoading,
    error: query.error,
    rawRegions: query.data ?? [],
  };
}

/**
 * Get just the regions array for a country
 *
 * Convenience wrapper when you don't need loading/error state.
 */
export function useRegionsList(countryId: string): MetadataRegionEntry[] {
  const { regions } = useRegions(countryId);
  return regions;
}

/**
 * Get a specific region by code
 *
 * @param countryId - Country ID (e.g., 'us', 'uk')
 * @param regionCode - Region code (e.g., 'state/ca', 'us')
 */
export function useRegionByCode(
  countryId: string,
  regionCode: string | undefined
): V2RegionMetadata | undefined {
  const { rawRegions } = useRegions(countryId);

  if (!regionCode) {
    return undefined;
  }

  return rawRegions.find((r) => r.code === regionCode);
}
