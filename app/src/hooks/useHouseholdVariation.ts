import { useQuery } from '@tanstack/react-query';
import { fetchHouseholdById } from '@/api/household';
import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import type { Household } from '@/types/ingredients/Household';

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
    // Use IDs in cache key for stability (objects cause unnecessary cache misses)
    queryKey: ['household-variation', householdId, policyId, year, countryId],
    queryFn: async () => {
      // Step 1: Fetch household input structure from API
      const householdMetadata = await fetchHouseholdById(countryId, householdId);
      const householdInput = householdMetadata.household_json;

      // Validate household has people
      if (!householdInput?.people || Object.keys(householdInput.people).length === 0) {
        throw new Error('Household has no people defined');
      }

      // Step 2: Get current earnings for max calculation
      // Assumes first person is "you" - adjust if household structure differs
      const firstPerson = Object.values(householdInput.people)[0];
      const currentEarnings = (firstPerson?.employment_income?.[year] as number) || 0;

      // Step 3: Build axes configuration
      // Set employment_income to null for first person to vary it
      const firstPersonKey = Object.keys(householdInput.people)[0];
      const existingEmploymentIncome =
        householdInput.people[firstPersonKey].employment_income || {};
      const householdDataWithVariation = {
        ...householdInput,
        people: {
          ...householdInput.people,
          [firstPersonKey]: {
            ...householdInput.people[firstPersonKey],
            employment_income: {
              ...existingEmploymentIncome,
              [year]: null, // Null = vary this for the specific year only
            },
          },
        },
      };

      // Step 4: Add axes to household data (already in API snake_case format)
      const householdWithAxes = {
        ...householdDataWithVariation,
        axes: [
          [
            {
              name: 'employment_income',
              period: year,
              min: 0,
              max: Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings),
              count: 401,
            },
          ],
        ],
      };

      // Step 5: Call calculate-full
      const requestUrl = `${BASE_URL}/${countryId}/calculate-full`;
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household: householdWithAxes,
          policy: policyData,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Try to parse error response if it's JSON
        let errorDetail = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorDetail = errorJson.message || errorJson.error || errorText;
        } catch {
          // Not JSON, use text as-is
        }

        throw new Error(
          `Variation calculation failed: ${response.status} ${response.statusText}. ${errorDetail}`
        );
      }

      const data = await response.json();

      // Wrap the result in a Household object for compatibility with getValueFromHousehold
      // The API returns raw HouseholdData, but our utility functions expect a Household wrapper
      const result: Household = {
        id: householdId,
        countryId: countryId as (typeof countryIds)[number],
        householdData: data.result,
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
