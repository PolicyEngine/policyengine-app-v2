import { useQuery } from '@tanstack/react-query';
import {
  fetchBudgetWindow,
  type BudgetWindowParams,
  type BudgetWindowResponse,
} from '@/api/budgetWindow';
import { MAX_FAILED_POLLS } from '@/libs/calculations/polledRun';

/** How often a running window is checked on. */
const POLL_MS = 5000;

/** The error when a failed check gives no message of its own. */
const CHECK_FAILED_MESSAGE = 'The budget window could not be checked.';

/** A window's latest answer, as the query cache holds it. */
export type PolledBudgetWindow = BudgetWindowResponse & {
  /** Failed checks in a row while computing, up to MAX_FAILED_POLLS. */
  failedPolls?: number;
  /**
   * Set on the error kept after too many failed checks. It isn't the
   * server's answer, so the run may still be going there.
   */
  fromFailedChecks?: boolean;
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
 * A computing window outlasts MAX_FAILED_POLLS failed checks in a row; the
 * next failure becomes the window's answer, as an error, and the checks
 * stop until a view of the window opens again or is retried. A first
 * request that fails fails at once.
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
        if (previous?.status !== 'computing') {
          throw error;
        }
        // The years may still be scoring on the server (a failed check is
        // often a gateway's 502), so keep the last answer and check again.
        const failedPolls = (previous.failedPolls ?? 0) + 1;
        if (failedPolls <= MAX_FAILED_POLLS) {
          return { ...previous, failedPolls };
        }
        // Kept as the window's answer, so the checks stop and the views
        // show the error with their retry.
        return {
          status: 'error',
          result: null,
          error: error instanceof Error ? error.message : CHECK_FAILED_MESSAGE,
          fromFailedChecks: true,
        };
      }
    },
    enabled: enabled && !!reformPolicyId && !!baselinePolicyId,
    refetchInterval: (query) => (query.state.data?.status === 'computing' ? POLL_MS : false),
    // Keep checking while the tab is hidden.
    refetchIntervalInBackground: true,
    // A finished window doesn't change; the API caches it for 30 days.
    staleTime: Infinity,
    // Failed checks aren't the server's answer, so a view of the window that
    // opens on them checks again, as a report's own run starts again when the
    // report opens unless its record holds the result. The server's own
    // answer, an error included, is kept.
    refetchOnMount: (query) => (query.state.data?.fromFailedChecks ? 'always' : true),
    // Failed checks are counted above. React Query's own retries would wait
    // for a hidden tab to be shown, because it pauses retries while the page
    // is unfocused.
    retry: false,
  });
}
