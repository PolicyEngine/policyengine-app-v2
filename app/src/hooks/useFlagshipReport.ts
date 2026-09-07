import { useQuery } from '@tanstack/react-query';
import { PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useUserReportById } from '@/hooks/useUserReports';
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
}

/**
 * Resolves a flagship report by either id form. The API form fetches the
 * report, its simulations, and their policies straight from the
 * PolicyEngine API, so a shared link opens with full provenance on any
 * device; the association form keeps old links working.
 */
export function useFlagshipReport(id: string): FlagshipReportData {
  const country = useCurrentCountry();
  const direct = isApiReportId(id);

  const legacy = useUserReportById(id, { enabled: !direct && !!id });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: reportKeys.byId(id),
    queryFn: async () => ReportAdapter.fromMetadata(await fetchReportById(country, id)),
    enabled: direct,
    staleTime: 5 * 60 * 1000,
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
      PolicyAdapter.fromMetadata(await fetchPolicyById(country, policyId)),
    enabled: direct && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });
  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  if (!direct) {
    return {
      report: legacy.report,
      simulations: legacy.simulations,
      policies: legacy.policies ?? [],
      isLoading: legacy.isLoading,
    };
  }
  return {
    report,
    simulations,
    policies,
    isLoading: reportLoading || simulationResults.isLoading || policyResults.isLoading,
  };
}
