import { useQuery } from '@tanstack/react-query';
import { BASE_URL } from '@/constants';
import type { HouseholdData } from '@/types/ingredients/Household';

interface UseHouseholdVariationParams {
  householdInput: HouseholdData;
  policyData: any;
  year: string;
  countryId: string;
  enabled?: boolean;
}

/**
 * Hook for fetching household variation data across earnings range
 * Uses calculate-full endpoint with axes parameter to get 401-point arrays
 *
 * Shared between Earnings Variation and Marginal Tax Rates pages
 * TanStack Query provides caching - no re-fetch when navigating between pages
 */
export function useHouseholdVariation({
  householdInput,
  policyData,
  year,
  countryId,
  enabled = true,
}: UseHouseholdVariationParams) {
  return useQuery({
    queryKey: ['household-variation', householdInput, policyData, year, countryId],
    queryFn: async () => {
      // Step 1: Get current earnings for max calculation
      // Assumes first person is "you" - adjust if household structure differs
      const firstPerson = Object.values(householdInput.people)[0];
      const currentEarnings = (firstPerson?.employment_income?.[year] as number) || 0;

      // Step 2: Build axes configuration
      // Set employment_income to null for first person to vary it
      const firstPersonKey = Object.keys(householdInput.people)[0];
      const householdData = {
        ...householdInput,
        people: {
          ...householdInput.people,
          [firstPersonKey]: {
            ...householdInput.people[firstPersonKey],
            employment_income: { [year]: null }, // Null = vary this
          },
        },
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

      // Step 3: Call calculate-full
      const response = await fetch(`${BASE_URL}/${countryId}/calculate-full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household: householdData,
          policy: policyData,
        }),
      });

      if (!response.ok) {
        throw new Error('Variation calculation failed');
      }

      const data = await response.json();
      return data.result; // Returns HouseholdData with array values
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min (match backend Redis)
    gcTime: 10 * 60 * 1000, // Keep in cache 10 min
  });
}
