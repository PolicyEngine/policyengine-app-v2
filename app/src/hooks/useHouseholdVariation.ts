import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { fetchHouseholdById } from '@/api/household';
import { fetchHouseholdVariationWithProvenance } from '@/api/householdVariation';
import { countryIds } from '@/libs/countries';
import { householdVariationKeys } from '@/libs/queryKeys';
import { Household } from '@/models/Household';
import type { RootState } from '@/store';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import { buildHouseholdVariationAxes } from '@/utils/householdVariationAxes';
import { getModelMetadataError, getSPMSelectionError } from '@/utils/spmSelection';

interface UseHouseholdVariationParams {
  householdId: string;
  policyId: string;
  policyData: any;
  year: string;
  countryId: string;
  personName?: string | null;
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
  personName,
  enabled = true,
}: UseHouseholdVariationParams) {
  const metadata = useSelector((state: RootState) => state.metadata);
  const currentContext = useRef({ metadata, countryId });
  currentContext.current = { metadata, countryId };
  const metadataError = getModelMetadataError(countryId, metadata);
  const query = useQuery({
    queryKey: householdVariationKeys.byParams(
      householdId,
      policyId,
      year,
      countryId,
      personName ?? ''
    ),
    queryFn: async ({ signal }) => {
      const checkCurrentMetadata = () => {
        const context = currentContext.current;
        const readinessError =
          signal.aborted || context.countryId !== countryId
            ? 'The country changed. Wait for its model information before calculating.'
            : getModelMetadataError(countryId, context.metadata);
        if (readinessError) {
          throw Object.assign(new Error(readinessError), { retryable: false });
        }
        return context.metadata;
      };
      checkCurrentMetadata();

      // Step 1: Fetch API metadata and hydrate the native household model.
      const householdMetadata = await fetchHouseholdById(countryId, householdId);
      const household = Household.fromV1Metadata(householdMetadata);
      const selectionError = getSPMSelectionError(household, year, checkCurrentMetadata());
      if (selectionError) {
        throw Object.assign(new Error(selectionError), { retryable: false });
      }

      // Step 2: Build axes configuration
      const householdWithAxes = buildHouseholdVariationAxes(household, year, personName);

      // Step 3: Call calculate-full API
      const calculation = await fetchHouseholdVariationWithProvenance(
        household.countryId,
        householdWithAxes,
        policyData,
        household.spm
      );

      // Step 4: Wrap raw calculation data with the metadata report utilities need.
      const result: HouseholdCalculationOutput = {
        id: householdId,
        countryId: countryId as (typeof countryIds)[number],
        householdData: calculation.result,
        spmConfig: calculation.spm_config,
        spmProvenance: calculation.spm_provenance,
      };
      return result;
    },
    enabled: enabled && !metadataError,
    staleTime: 30 * 60 * 1000, // 30 min - data stays fresh
    gcTime: 35 * 60 * 1000, // 35 min - keep in memory longer than staleTime
    // CONCERN: calculate-full is expensive - use longer cache + prevent refetch on window focus
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Corrective input errors require editing, not another request with identical inputs.
    retry: (failureCount, error) =>
      !('retryable' in error && error.retryable === false) && failureCount < 1,
  });
  return {
    ...query,
    isLoading: query.isLoading && !metadataError,
    error: enabled && metadataError ? new Error(metadataError) : query.error,
  };
}
