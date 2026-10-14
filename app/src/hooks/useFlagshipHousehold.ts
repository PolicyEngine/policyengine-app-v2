import { useQuery } from '@tanstack/react-query';
import { runFlagshipHousehold, type FlagshipHouseholdInput } from '@/libs/flagship/householdRun';

export const flagshipHouseholdQueryKey = (
  year: string,
  baselinePolicyId: string,
  reformPolicyId: string,
  input: FlagshipHouseholdInput | null
) => ['flagship-household', 'us', year, baselinePolicyId, reformPolicyId, input];

/**
 * A household run for a report, started only once the reader asks — a
 * household takes up to a minute or two under each policy. The same
 * household under the same policies is not run twice on a page.
 */
export function useFlagshipHousehold({
  year,
  baselinePolicyId,
  reformPolicyId,
  input,
}: {
  year: string;
  baselinePolicyId: string;
  reformPolicyId: string;
  /** The household asked for; nothing runs while null. */
  input: FlagshipHouseholdInput | null;
}) {
  return useQuery({
    queryKey: flagshipHouseholdQueryKey(year, baselinePolicyId, reformPolicyId, input),
    queryFn: () => runFlagshipHousehold({ year, input: input!, baselinePolicyId, reformPolicyId }),
    enabled: !!input,
    // A calculated household does not change; a failure waits for "Try again".
    staleTime: Infinity,
    retry: false,
  });
}
