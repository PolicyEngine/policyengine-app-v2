import { useQuery } from '@tanstack/react-query';
import { runFlagshipHouseholdPayload } from '@/libs/flagship/householdRun';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';

/**
 * A household built in full (the household builder's model), run for a
 * report once the reader asks. Keyed by what is sent, so the same
 * household is not run twice on a page.
 */
export function useFlagshipHouseholdPayload({
  year,
  baselinePolicyId,
  reformPolicyId,
  payload,
}: {
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household asked for; nothing runs while null. */
  payload: V1HouseholdCreateEnvelope | null;
}) {
  return useQuery({
    queryKey: ['flagship-household-full', 'us', year, baselinePolicyId, reformPolicyId, payload],
    queryFn: () =>
      runFlagshipHouseholdPayload({ year, payload: payload!, baselinePolicyId, reformPolicyId }),
    enabled: !!payload,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
