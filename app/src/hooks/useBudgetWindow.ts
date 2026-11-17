import { useQuery } from '@tanstack/react-query';
import {
  fetchBudgetWindow,
  type BudgetWindowParams,
  type BudgetWindowResponse,
} from '@/api/budgetWindow';
import { MAX_FAILED_POLLS } from '@/libs/calculations/polledRun';

/** How often a running window is checked on. */
const POLL_MS = 5000;

/** A window's latest answer, as the query cache holds it. */
export type PolledBudgetWindow = BudgetWindowResponse & {
  /** Failed checks in a row while computing, up to MAX_FAILED_POLLS. */
  failedPolls?: number;
};

export const budgetWindowQueryKey = (
  countryId: string,
  reformPolicyId: string | undefined,
  baselinePolicyId: string | undefined,
  params: BudgetWindowParams
) => [
  'flagship-budget-window',
  countryId,
  reformPolicyId,
  baselinePolicyId,
  params.region,
  params.startYear,
  params.windowSize,
];

/**
 * A budget-window run for one reform, started only when `enabled` — a
 * window runs a simulation for every year, so nothing starts it but the
 * reader. While it computes, the query checks on it every few seconds.
 * A computing window outlasts MAX_FAILED_POLLS failed checks in a row; a
 * first request that fails fails at once.
 */
export function useBudgetWindow(
  countryId: string,
  reformPolicyId: string | undefined,
  baselinePolicyId: string | undefined,
  params: BudgetWindowParams,
  { enabled }: { enabled: boolean }
) {
  return useQuery({
    queryKey: budgetWindowQueryKey(countryId, reformPolicyId, baselinePolicyId, params),
    queryFn: async ({ client, queryKey }): Promise<PolledBudgetWindow> => {
      const previous = client.getQueryData<PolledBudgetWindow>(queryKey);
      try {
        return await fetchBudgetWindow(countryId, reformPolicyId!, baselinePolicyId!, params);
      } catch (error) {
        // The years may still be scoring on the server (a failed check is
        // often a gateway's 502), so keep the last answer and check again.
        const failedPolls = (previous?.failedPolls ?? 0) + 1;
        if (previous?.status === 'computing' && failedPolls <= MAX_FAILED_POLLS) {
          return { ...previous, failedPolls };
        }
        throw error;
      }
    },
    enabled: enabled && !!reformPolicyId && !!baselinePolicyId,
    refetchInterval: (query) => (query.state.data?.status === 'computing' ? POLL_MS : false),
    // Keep checking while the tab is hidden.
    refetchIntervalInBackground: true,
    // A finished window doesn't change; the API caches it for 30 days.
    staleTime: Infinity,
    // Failed checks are counted above. React Query's own retries would wait
    // for a hidden tab to be shown, because it pauses retries while the page
    // is unfocused.
    retry: false,
  });
}
