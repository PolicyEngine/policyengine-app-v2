import { useQuery } from '@tanstack/react-query';
import { fetchHouseholdById } from '@/api/household';
import { fetchHouseholdVariation } from '@/api/householdVariation';
import { countryIds } from '@/libs/countries';
import { householdVariationKeys } from '@/libs/queryKeys';
import type { Household } from '@/types/ingredients/Household';
import { buildHouseholdVariationAxes } from '@/utils/householdVariationAxes';

interface UseHouseholdVariationParams {
  householdId: string;
  policyId: string;
  policyData: any;
  year: string;
  countryId: string;
  enabled?: boolean;
}

/**
 * Hook for fetching household variation data across earnings range
 * Uses calculate-full endpoint with axes parameter to get 401-point arrays
 *
 * IMPORTANT: This endpoint is expensive and can crash the API server if overused.
 *
 * V1 PROBLEMS (what caused API crashes):
 * - No caching: every page visit = new API calls
 * - Triggered on URL param changes: navigate away/back = 4 more calls (2x baseline + 2x reform)
 * - No rate limiting or deduplication
 *
 * V2 IMPROVEMENTS:
 * - TanStack Query caching: shares cache between Earnings Variation ↔ MTR
 * - Stable cache keys: uses IDs not full objects
 * - Aggressive staleTime: 5min minimum before considering refetch
 * - Disabled automatic refetches: manual control only
 * - Single retry on failure
 */
export function useHouseholdVariation({
  householdId,
  policyId,
  policyData,
  year,
  countryId,
  enabled = true,
}: UseHouseholdVariationParams) {
  return useQuery({
    queryKey: householdVariationKeys.byParams(householdId, policyId, year, countryId),
    queryFn: async () => {
      // Step 1: Fetch household input structure from API
      const householdMetadata = await fetchHouseholdById(countryId, householdId);
      const householdInput = householdMetadata.household_json;

      // Step 2: Build axes configuration
      const householdWithAxes = buildHouseholdVariationAxes(householdInput, year, countryId);

      // Step 3: Call calculate-full API
      const resultData = await fetchHouseholdVariation(countryId, householdWithAxes, policyData);

      // Step 4: Wrap the result in a Household object for compatibility with getValueFromHousehold
      // The API returns raw HouseholdData, but our utility functions expect a Household wrapper
      const result: Household = {
        id: householdId,
        countryId: countryId as (typeof countryIds)[number],
        householdData: resultData,
      };
      return result;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min (match backend Redis)
    gcTime: 10 * 60 * 1000, // Keep in cache 10 min
    // B) CONCERN: calculate-full is expensive - use longer cache + prevent refetch on window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Only retry once to avoid clobbering API
  });
}
