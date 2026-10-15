import { useQuery } from '@tanstack/react-query';
import { PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useParameterMetadata } from '@/hooks/useParameterMetadata';
import { useUserReportById } from '@/hooks/useUserReports';
import { isNotFoundError, retryUnlessNotFound } from '@/libs/flagship/loadError';
import { GC_TIME_5_MIN } from '@/libs/queryConfig';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { policyKeys, reportKeys, simulationKeys } from '../libs/queryKeys';
import { extractUniqueIds, useParallelQueries } from './utils/queryUtils';

/**
 * A flagship report URL carries the API report id, which anyone can
 * resolve. Links minted before that carry the local association id
 * ("sur-…"), which only the browser that ran the report can resolve.
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
  /** Asks again for whatever failed; settles when the answers are in. */
  retry: () => Promise<unknown>;
}

/**
 * Resolves a flagship report by either id form. The API form fetches the
 * report, its simulations, and their policies straight from the
 * PolicyEngine API, so a shared link opens with full provenance on any
 * device; the association form keeps old links working.
 */
export function useFlagshipReport(id: string): FlagshipReportData {
  const country = useCurrentCountry();
  const { parameters: parameterMetadata, isReady: isParameterMetadataReady } =
    useParameterMetadata(country);
  const direct = isApiReportId(id);

  const legacy = useUserReportById(id, { enabled: !direct && !!id });

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
    queryFn: async (policyId) =>
      PolicyAdapter.fromMetadata(await fetchPolicyById(country, policyId), parameterMetadata),
    enabled: direct && isParameterMetadataReady && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });
  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);
  const failedPolicyIds = policyIds.filter((_, index) => {
    const query = policyResults.queries[index];
    return !!query?.error && !query.data;
  });

  if (!direct) {
    return {
      report: legacy.report,
      simulations: legacy.simulations,
      policies: legacy.policies ?? [],
      isLoading: legacy.isLoading,
      // A legacy link that resolves to nothing reads as unresolvable.
      error: null,
      notFound: false,
      failedPolicyIds: [],
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
    retry: () =>
      Promise.all([
        reportError ? refetchReport() : null,
        ...[...simulationResults.queries, ...policyResults.queries]
          .filter((query) => query.error)
          .map((query) => query.refetch()),
      ]),
  };
}
