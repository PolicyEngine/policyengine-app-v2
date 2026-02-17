/**
 * useHouseholdVariation - Hook for fetching household variation data
 *
 * Fetches household variation data across an earnings range using the
 * calculate-full endpoint with axes parameter to get 401-point arrays.
 *
 * Uses the v2 Alpha API directly.
 */

import { useQuery } from '@tanstack/react-query';
import { modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { fetchHouseholdVariation } from '@/api/householdVariation';
import { v1ResponseToHousehold } from '@/api/legacyConversion';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import { householdVariationKeys } from '@/libs/queryKeys';
import type { Household } from '@/types/ingredients/Household';
import { buildHouseholdVariationAxes } from '@/utils/householdVariationAxes';

interface UseHouseholdVariationParams {
  householdId: string;
  policyId: string;
  policyData: any;
  year: number;
  countryId: string;
  enabled?: boolean;
}

/**
 * Hook for fetching household variation data across earnings range
 * Uses calculate-full endpoint with axes parameter to get 401-point arrays
 *
 * IMPORTANT: This endpoint is expensive and can crash the API server if overused.
 *
 * V2 IMPROVEMENTS:
 * - TanStack Query caching: shares cache between Earnings Variation <-> MTR
 * - Stable cache keys: uses IDs not full objects
 * - Aggressive staleTime: 30 min minimum before considering refetch
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
    queryKey: householdVariationKeys.byParams(householdId, policyId, String(year), countryId),
    queryFn: async () => {
      // Step 1: Fetch household from API using v2 alpha
      const household = await fetchHouseholdByIdV2(householdId);

      // Step 2: Build axes configuration for variation
      const householdWithAxes = buildHouseholdVariationAxes(household);

      // Step 3: Call calculate-full API
      const resultData = await fetchHouseholdVariation(countryId, householdWithAxes, policyData);

      // Step 4: Convert result back to v2 format (API returns legacy format)
      const result = v1ResponseToHousehold(resultData, countryId as 'us' | 'uk', year);
      result.id = householdId;

      return result;
    },
    enabled,
    staleTime: 30 * 60 * 1000, // 30 min - data stays fresh
    gcTime: 35 * 60 * 1000, // 35 min - keep in memory longer than staleTime
    // CONCERN: calculate-full is expensive - use longer cache + prevent refetch on window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Only retry once to avoid clobbering API
  });
}

/**
 * Hook for fetching household variation with an inline household (not stored)
 */
export function useHouseholdVariationInline({
  household,
  policyData,
  enabled = true,
}: {
  household: Household;
  policyData: any;
  enabled?: boolean;
}) {
  const countryId = modelNameToCountryId(household.tax_benefit_model_name);
  const cacheKey = JSON.stringify({
    people: household.people.length,
    year: household.year,
    model: household.tax_benefit_model_name,
  });

  return useQuery({
    queryKey: ['householdVariationInline', cacheKey, policyData],
    queryFn: async () => {
      const householdWithAxes = buildHouseholdVariationAxes(household);
      const resultData = await fetchHouseholdVariation(countryId, householdWithAxes, policyData);
      return v1ResponseToHousehold(resultData, countryId as 'us' | 'uk', household.year);
    },
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 35 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}
