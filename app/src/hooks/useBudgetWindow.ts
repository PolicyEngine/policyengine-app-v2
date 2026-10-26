import { useQuery } from '@tanstack/react-query';
import { fetchBudgetWindow, type BudgetWindowParams } from '@/api/budgetWindow';

/** How often a running window is checked on. */
const POLL_MS = 5000;

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
    queryFn: () => fetchBudgetWindow(countryId, reformPolicyId!, baselinePolicyId!, params),
    enabled: enabled && !!reformPolicyId && !!baselinePolicyId,
    refetchInterval: (query) => (query.state.data?.status === 'computing' ? POLL_MS : false),
    // A finished window doesn't change; the API caches it for 30 days.
    staleTime: Infinity,
    retry: 2,
  });
}
