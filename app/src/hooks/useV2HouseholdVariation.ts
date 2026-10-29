import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { calculateV2Household, fetchV2Household } from '@/api/v2HouseholdCalculations';
import type { CountryId } from '@/libs/countries';
import { plainV2HouseholdError, v2PolicyIdFor } from '@/libs/flagship/v2HouseholdRun';
import { v2StoredHouseholdKeys } from '@/libs/queryKeys';
import { householdDataFromV2Calculation } from '@/models/household/v2DocumentCodec';
import type { RootState } from '@/store';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import type { SPMProvenance, SPMSelection } from '@/types/spm';
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

/**
 * One policy's calculation of a stored household across earnings, on the
 * Public API's v2 routes: the household's head's employment income varies
 * along one axis, and every variable the household lacks is calculated,
 * as v1's `/calculate-full` variation does. The earnings variation and the
 * marginal tax rates read the same calculation, so it is kept as long as
 * v1's variation is, and never fetched again on its own. The household
 * comes back in its v1 names, as the variation pages read it.
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
    queryKey: [
      'v2-household-variation',
      countryId,
      householdId,
      policyId,
      currentLawId,
      year,
      personName ?? '',
    ],
    queryFn: async ({ signal }): Promise<HouseholdCalculationOutput> => {
      try {
        const stored = await queryClient.fetchQuery({
          queryKey: v2StoredHouseholdKeys.byId(countryId, householdId),
          queryFn: () => fetchV2Household(countryId, householdId),
          staleTime: Infinity,
        });
        const output = await calculateV2Household(
          {
            countryId,
            householdId,
            policyId: v2PolicyIdFor(policyId, currentLawId),
            axes: v2EarningsVariationAxes(stored.household_data, year, countryId, personName),
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
            output.household
          ),
          ...(output.spm_config ? { spmConfig: output.spm_config as unknown as SPMSelection } : {}),
          ...(output.spm_provenance
            ? { spmProvenance: output.spm_provenance as unknown as SPMProvenance }
            : {}),
        };
      } catch (error) {
        throw plainV2HouseholdError(error);
      }
    },
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 35 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
