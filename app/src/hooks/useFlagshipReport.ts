import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { isNotFoundError, retryUnlessNotFound } from '@/libs/flagship/loadError';
import { combinedMissingParameters } from '@/libs/flagship/missingParameters';
import { fetchV1Policy, readV1Policy } from '@/libs/flagship/policyChecks';
import { GC_TIME_5_MIN } from '@/libs/queryConfig';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';
import {
  policyKeys,
  reportKeys,
  simulationKeys,
  V1_POLICY_GC_TIME,
  v1PolicyKey,
} from '../libs/queryKeys';
import { extractUniqueIds, useParallelQueries } from './utils/queryUtils';

/**
 * Whether an ID is a v1 report's number. With accounts, a flagship report
 * URL carries the saved report's ID instead (see reportLink); without
 * them, it carries the v1 report's number. Links from the legacy
 * calculator carried its browser association ID ("sur-…"); v3 does not
 * read that storage, so they no longer open.
 */
export function isApiReportId(id: string): boolean {
  return /^\d+$/.test(id);
}

export interface FlagshipReportData {
  report: Report | undefined;
  simulations: Simulation[];
  policies: Policy[];
  isLoading: boolean;
  /**
   * Why the report or one of its simulations failed to load; null while
   * neither has. A policy that fails only costs the provision detail, so
   * it does not count: the run goes on without it. Nor does a refetch
   * that fails after the data is in.
   */
  error: Error | null;
  /** The report id resolves to no report (a bad or deleted link). */
  notFound: boolean;
  /**
   * The policies that failed to load, with nothing to show. A missing
   * baseline policy leaves what the report compares with unknown.
   */
  failedPolicyIds: string[];
  /**
   * Every policy has been read for the parameters it sets that the model
   * no longer has, or could not be read (nothing is then known to be
   * missing). Until then nothing may start the report's calculation.
   */
  policiesChecked: boolean;
  /**
   * The parameters the report's policies set that the current model no
   * longer has, as the API reports them. While there are any, nothing may
   * run the report.
   */
  missingParameters: string[];
  /** Asks again for whatever failed; settles when the answers are in. */
  retry: () => Promise<unknown>;
}

/**
 * Resolves a flagship report by its API report id: the report, its
 * simulations, and their policies come straight from the PolicyEngine
 * API, so the report opens on any device. Any other id resolves to
 * nothing.
 */
export function useFlagshipReport(id: string): FlagshipReportData {
  const country = useCurrentCountry();
  const queryClient = useQueryClient();
  const { parameters: parameterMetadata, isReady: isParameterMetadataReady } =
    useParameterMetadata(country);
  const direct = isApiReportId(id);

  const {
    data: report,
    isLoading: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: reportKeys.byId(id),
    queryFn: async () => ReportAdapter.fromMetadata(await fetchReportById(country, id)),
    enabled: direct,
    staleTime: 5 * 60 * 1000,
    // A missing report stays missing: say so at once rather than retrying.
    retry: retryUnlessNotFound,
  });

  const simulationIds = direct ? (report?.simulationIds ?? []) : [];
  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (simulationId) =>
      SimulationAdapter.fromMetadata(await fetchSimulationById(country, simulationId)),
    enabled: direct && simulationIds.length > 0,
    staleTime: Infinity,
    gcTime: GC_TIME_5_MIN,
  });
  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  const policyIds = extractUniqueIds(simulations, 'policyId');
  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    // The same request as the check below: each policy is asked for once.
    queryFn: async (policyId) =>
      PolicyAdapter.fromMetadata(
        await readV1Policy(queryClient, country, policyId),
        parameterMetadata
      ),
    enabled: direct && isParameterMetadataReady && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });
  // Whether each policy sets parameters the model no longer has: read at
  // once, not after the parameter metadata, because the report's run
  // waits for it.
  // A policy that cannot be read is not retried here: the check settles at
  // once with nothing known to be missing, as before the check existed.
  const policyContentResults = useParallelQueries<PolicyMetadata>(policyIds, {
    queryKey: (policyId) => v1PolicyKey(country, policyId),
    queryFn: (policyId) => fetchV1Policy(country, policyId),
    enabled: direct && policyIds.length > 0,
    staleTime: Infinity,
    gcTime: V1_POLICY_GC_TIME,
    retry: false,
  });
  // Every simulation is in (or failed) and every policy it names was read.
  const policiesChecked =
    simulationIds.length > 0 &&
    simulationResults.queries.every((query) => !query.isPending) &&
    policyContentResults.queries.every((query) => !query.isPending);
  const missingParameters = combinedMissingParameters(
    policyContentResults.queries.map((query) => query.data)
  );
  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);
  const failedPolicyIds = policyIds.filter((_, index) => {
    const query = policyResults.queries[index];
    return !!query?.error && !query.data;
  });

  if (!direct) {
    return {
      report: undefined,
      simulations: [],
      policies: [],
      isLoading: false,
      // The page says an id that is not an API report id cannot open.
      error: null,
      notFound: false,
      failedPolicyIds: [],
      policiesChecked: false,
      missingParameters: [],
      retry: async () => undefined,
    };
  }
  // A failed background refetch keeps the data it had (TanStack keeps
  // `data` and sets `error`): that is not a failed load, and the run the
  // report shows goes on. Only a query with nothing to show counts.
  const unloadedReportError = report ? null : (reportError as Error | null);
  const error =
    unloadedReportError ??
    simulationResults.queries.find((query) => query.error && !query.data)?.error ??
    null;
  return {
    report,
    simulations,
    policies,
    isLoading: reportLoading || simulationResults.isLoading || policyResults.isLoading,
    error,
    notFound: !!unloadedReportError && isNotFoundError(unloadedReportError),
    failedPolicyIds,
    policiesChecked,
    missingParameters,
    retry: () =>
      Promise.all([
        reportError ? refetchReport() : null,
        ...[...simulationResults.queries, ...policyResults.queries]
          .filter((query) => query.error)
          .map((query) => query.refetch()),
      ]),
  };
}
