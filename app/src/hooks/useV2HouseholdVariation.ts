import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { calculateV2Household } from '@/api/v2HouseholdCalculations';
import { fetchV2Household } from '@/api/v2Households';
import type { CountryId } from '@/libs/countries';
import {
  plainV2HouseholdError,
  spmOfV2Calculation,
  v2PolicyIdFor,
} from '@/libs/flagship/v2HouseholdRun';
import { v2HouseholdVariationKeys, v2StoredHouseholdKeys } from '@/libs/queryKeys';
import { householdDataFromV2Calculation } from '@/models/household/v2DocumentCodec';
import type { RootState } from '@/store';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import { v2EarningsVariationAxes } from '@/utils/householdVariationAxes';

export interface V2HouseholdVariationArgs {
  countryId: string;
  year: string;
  /** The stored v2 household the run calculated. */
  householdId: string;
  /** The policy as v3 holds it: current law, or a v2 policy. */
  policyId: string;
  /** The person whose earnings vary: the household's head. */
  personName: string | null;
  enabled: boolean;
}

/** How long a variation stays fresh, and in memory: as long as v1's variation does. */
const VARIATION_STALE_TIME = 30 * 60 * 1000;
const VARIATION_GC_TIME = 35 * 60 * 1000;

/**
 * One policy's calculation of a stored household across earnings, on API
 * v1's `/v2/` routes: the household's head's employment income varies
 * along one axis, and every variable the household lacks is calculated,
 * as v1's `/calculate-full` variation does. The earnings variation and the
 * marginal tax rates, and the Household tab's background variation, read
 * the same calculation, so it is kept as long as v1's variation is, and
 * never fetched again on its own. The stored household comes from the
 * query cache, where the run puts it, else from `GET /v2/households/{id}`,
 * and stays cached as long as the variation. The
 * household comes back in its v1 names, as the variation pages read it.
 */
export function useV2HouseholdVariation({
  countryId,
  year,
  householdId,
  policyId,
  personName,
  enabled,
}: V2HouseholdVariationArgs) {
  const queryClient = useQueryClient();
  const currentLawId = useSelector((state: RootState) => state.metadata.currentLawId);
  return useQuery({
    queryKey: v2HouseholdVariationKeys.byParams(
      countryId,
      householdId,
      policyId,
      currentLawId,
      year,
      personName
    ),
    queryFn: async ({ signal }): Promise<HouseholdCalculationOutput> => {
      try {
        const stored = await queryClient.fetchQuery({
          queryKey: v2StoredHouseholdKeys.byId(countryId, householdId),
          queryFn: () => fetchV2Household(countryId, householdId),
          staleTime: Infinity,
          // Kept as long as the variation that reads it.
          gcTime: VARIATION_GC_TIME,
        });
        const calculation = await calculateV2Household(
          {
            countryId,
            householdId,
            policyId: v2PolicyIdFor(policyId, currentLawId),
            axes: v2EarningsVariationAxes(stored.household_data, year, personName),
            addMissingVariables: true,
          },
          { signal }
        );
        return {
          id: householdId,
          countryId: countryId as CountryId,
          householdData: householdDataFromV2Calculation(
            countryId,
            stored.household_data,
            calculation.result.household
          ),
          ...spmOfV2Calculation(calculation.result),
        };
      } catch (error) {
        throw plainV2HouseholdError(error);
      }
    },
    enabled,
    staleTime: VARIATION_STALE_TIME,
    gcTime: VARIATION_GC_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
