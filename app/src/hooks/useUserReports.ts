import { useQueryNormalizer } from '@normy/react-query';
import { useQuery } from '@tanstack/react-query';
import { PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import {
  fromEconomySimulationResponse,
  fromHouseholdSimulationResponse,
  getEconomySimulation,
  getHouseholdSimulation,
} from '@/api/v2/simulations';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { householdKeys, policyKeys, reportKeys, simulationKeys } from '../libs/queryKeys';
import { useHouseholdAssociationsByUser } from './useUserHousehold';
import { usePolicyAssociationsByUser } from './useUserPolicy';
import { useReportAssociationById, useReportAssociationsByUser } from './useUserReportAssociations';
import { useSimulationAssociationsByUser } from './useUserSimulationAssociations';
import {
  combineLoadingStates,
  extractUniqueIds,
  useParallelQueries,
} from './utils/normalizedUtils';

/**
 * Enhanced result type that includes all relationships
 * Exported for use in other hooks that build on this data
 */
export interface EnhancedUserReport {
  // Core associations
  userReport: UserReport;
  report?: Report;

  // Related simulations (1 or 2 per report)
  simulations?: Simulation[];

  // Related entities from simulations
  policies?: Policy[];
  households?: Household[];
  geographies?: Geography[];

  // User associations for related entities
  userSimulations?: UserSimulation[];
  userPolicies?: UserPolicy[];
  userHouseholds?: UserHouseholdPopulation[];

  // Status
  isLoading: boolean;
  error: Error | null;
}

/**
 * Primary hook for fetching user reports with all related data
 * Leverages @normy/react-query for automatic normalization and caching
 *
 * Use this hook when you need:
 * - Full report context (simulations, policies, households)
 * - Detailed views or report pages
 * - Access to all nested entities
 *
 * For simple lists or counts, use useReportAssociationsByUser instead
 */
export const useUserReports = (userId: string) => {
  const country = useCurrentCountry();
  const queryNormalizer = useQueryNormalizer();

  // Step 1: Fetch all user associations in parallel
  const {
    data: reportAssociations,
    isLoading: repAssocLoading,
    error: repAssocError,
  } = useReportAssociationsByUser(userId);

  const {
    data: simulationAssociations,
    isLoading: simAssocLoading,
    error: simAssocError,
  } = useSimulationAssociationsByUser(userId);

  const {
    data: policyAssociations,
    isLoading: polAssocLoading,
    error: polAssocError,
  } = usePolicyAssociationsByUser(userId);

  const {
    data: householdAssociations,
    isLoading: housAssocLoading,
    error: housAssocError,
  } = useHouseholdAssociationsByUser(userId);

  // Step 2: Separate v2 reports (have outputType + simulationIds) from v1 reports
  const v2Associations =
    reportAssociations?.filter((a) => a.outputType && a.simulationIds?.length) ?? [];
  const v1Associations =
    reportAssociations?.filter((a) => !a.outputType || !a.simulationIds?.length) ?? [];

  // Construct Report objects from v2 UserReport metadata (no API call needed)
  const v2Reports: Report[] = v2Associations.map((a) => ({
    id: a.reportId,
    countryId: a.countryId,
    year: a.year || new Date().getFullYear().toString(),
    apiVersion: 'v2' as const,
    simulationIds: a.simulationIds!,
    status: 'pending' as const,
    outputType: a.outputType,
  }));

  // Step 3: Fetch v1 reports only (v2 reports are constructed above)
  const v1ReportIds = v1Associations.map((a) => a.reportId).filter(Boolean);

  const reportResults = useParallelQueries<Report>(v1ReportIds, {
    queryKey: reportKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchReportById(country, id);
      return ReportAdapter.fromMetadata(metadata);
    },
    enabled: v1ReportIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Step 4: Merge v1 fetched reports with v2 constructed reports
  const v1Reports = reportResults.queries.map((q) => q.data).filter((r): r is Report => !!r);
  const reports = [...v2Reports, ...v1Reports];

  // Collect all simulation IDs from all reports
  const simulationIds = reports
    .flatMap((r) => r.simulationIds)
    .filter((id, index, self) => self.indexOf(id) === index);

  // Build a lookup: simId → outputType from v2 associations for routing to the right endpoint
  const v2SimOutputType = new Map<string, 'household' | 'economy'>();
  v2Associations.forEach((a) => {
    a.simulationIds?.forEach((simId) => {
      if (a.outputType) v2SimOutputType.set(simId, a.outputType);
    });
  });

  // Step 5: Fetch simulations (v2 via typed endpoints, v1 via legacy)
  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      const simType = v2SimOutputType.get(id);
      if (simType === 'household') {
        const response = await getHouseholdSimulation(id);
        return fromHouseholdSimulationResponse(response);
      } else if (simType === 'economy') {
        const response = await getEconomySimulation(id);
        return fromEconomySimulationResponse(response);
      } else {
        const metadata = await fetchSimulationById(country, id);
        return SimulationAdapter.fromMetadata(metadata);
      }
    },
    enabled: simulationIds.length > 0,
    staleTime: Infinity,
    gcTime: 0,
  });

  // Step 6: Extract policy and household IDs from fetched simulations
  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  const policyIds = extractUniqueIds(simulations, 'policyId');

  // Separate household and geography IDs based on populationType
  const householdIds = simulations
    .filter((s) => s.populationType === 'household' && s.populationId)
    .map((s) => s.populationId as string)
    .filter((id, index, self) => self.indexOf(id) === index);

  // Step 7: Fetch policies
  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const response = await fetchPolicyById(id);
      return PolicyAdapter.fromV2Response(response);
    },
    enabled: policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Step 8: Fetch households using v2 API
  const householdResults = useParallelQueries<Household>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: (id) => fetchHouseholdByIdV2(id),
    enabled: householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Step 9: Combine loading states
  const { isLoading, error } = combineLoadingStates(
    { isLoading: repAssocLoading, error: repAssocError },
    { isLoading: simAssocLoading, error: simAssocError },
    { isLoading: polAssocLoading, error: polAssocError },
    { isLoading: housAssocLoading, error: housAssocError },
    { isLoading: reportResults.isLoading, error: reportResults.error },
    { isLoading: simulationResults.isLoading, error: simulationResults.error },
    { isLoading: policyResults.isLoading, error: policyResults.error },
    { isLoading: householdResults.isLoading, error: householdResults.error }
  );

  // Step 10: Build enhanced results with all relationships
  const enhancedReports: EnhancedUserReport[] =
    reportAssociations
      ?.filter((userRep) => userRep.reportId) // Filter out associations without reportId
      .map((userRep) => {
        // Get report from normalized cache or query results
        const cachedReport = queryNormalizer.getObjectById(userRep.reportId) as Report | undefined;
        const directReport = reports.find((r) => r.id === userRep.reportId);

        const report = cachedReport || directReport;

        // Get related simulations
        const reportSimulations =
          report?.simulationIds
            ?.map((simId) => {
              const fromNormy = queryNormalizer.getObjectById(simId) as Simulation | undefined;
              const fromQuery = simulations.find((s) => s.id === simId);
              return fromNormy || fromQuery;
            })
            .filter((s): s is Simulation => !!s) ?? [];

        // Get policies from simulations
        const reportPolicies = reportSimulations
          .map((sim) => sim.policyId)
          .filter((id): id is string => !!id)
          .map((policyId) => queryNormalizer.getObjectById(policyId) as Policy | undefined)
          .filter((p): p is Policy => !!p);

        // Get unique policy IDs for finding user associations
        const uniquePolicyIds = [
          ...new Set(reportSimulations.map((s) => s.policyId).filter(Boolean)),
        ];

        // Get households and geographies from simulations
        const reportHouseholds: Household[] = [];
        const reportGeographies: Geography[] = [];

        reportSimulations.forEach((sim) => {
          if (sim.populationId && sim.populationType) {
            if (sim.populationType === 'household') {
              const household = queryNormalizer.getObjectById(sim.populationId) as
                | Household
                | undefined;
              if (household) {
                reportHouseholds.push(household);
              }
            } else if (sim.populationType === 'geography') {
              // Create Geography object from the regionCode (populationId)
              reportGeographies.push({
                countryId: sim.countryId,
                regionCode: sim.populationId,
              } as Geography);
            }
          }
        });

        // Find user associations for related entities
        const reportUserSimulations =
          simulationAssociations?.filter((sa) =>
            report?.simulationIds?.includes(sa.simulationId)
          ) ?? [];

        const reportUserPolicies =
          policyAssociations?.filter((pa) => uniquePolicyIds.includes(pa.policyId)) ?? [];

        const reportUserHouseholds =
          householdAssociations?.filter((ha) =>
            reportHouseholds.some((h) => h.id === ha.householdId)
          ) ?? [];

        return {
          userReport: userRep,
          report,
          simulations: reportSimulations,
          policies: reportPolicies,
          households: reportHouseholds,
          geographies: reportGeographies,
          userSimulations: reportUserSimulations,
          userPolicies: reportUserPolicies,
          userHouseholds: reportUserHouseholds,
          isLoading: false,
          error: null,
        };
      }) ?? [];

  // Step 11: Helper functions for accessing specific data
  const getReportWithFullContext = (reportId: string) => {
    return enhancedReports.find((er) => er.userReport.reportId === reportId);
  };

  const getReportsBySimulation = (simulationId: string) => {
    return enhancedReports.filter((er) => er.report?.simulationIds?.includes(simulationId));
  };

  const getReportsByPolicy = (policyId: string) => {
    return enhancedReports.filter((er) => er.simulations?.some((s) => s.policyId === policyId));
  };

  const getReportsByHousehold = (householdId: string) => {
    return enhancedReports.filter((er) =>
      er.simulations?.some(
        (s) => s.populationType === 'household' && s.populationId === householdId
      )
    );
  };

  return {
    // Core data
    data: enhancedReports,
    isLoading,
    isError: !!error,
    error,

    // Raw associations (if needed)
    associations: {
      reports: reportAssociations,
      simulations: simulationAssociations,
      policies: policyAssociations,
      households: householdAssociations,
    },

    // Helper functions
    getReportWithFullContext,
    getReportsBySimulation,
    getReportsByPolicy,
    getReportsByHousehold,

    // Direct access to normalized cache
    getNormalizedReport: (id: string) => queryNormalizer.getObjectById(id) as Report | undefined,
    getNormalizedSimulation: (id: string) =>
      queryNormalizer.getObjectById(id) as Simulation | undefined,
    getNormalizedPolicy: (id: string) => queryNormalizer.getObjectById(id) as Policy | undefined,
    getNormalizedHousehold: (id: string) =>
      queryNormalizer.getObjectById(id) as Household | undefined,
  };
};

/**
 * Hook for accessing a single report with full context by user report ID
 * Leverages the normalized cache for efficient data access
 *
 * @param userReportId - The user report ID (e.g., 'sur-abc123')
 * @returns Complete report data including UserReport, base Report, and all related entities
 */
export const useUserReportById = (userReportId: string, options?: { enabled?: boolean }) => {
  const queryNormalizer = useQueryNormalizer();
  const country = useCurrentCountry();
  const isEnabled = options?.enabled !== false;

  // Step 1: Fetch UserReport by userReportId to get the base reportId
  const {
    data: userReport,
    isLoading: userReportLoading,
    error: userReportError,
  } = useReportAssociationById(userReportId, { enabled: isEnabled });

  // Extract base reportId and userId from UserReport
  const baseReportId = userReport?.reportId;
  const userId = userReport?.userId;

  // Determine if this is a v2 report (has outputType + simulationIds from useCreateReport)
  const isV2Report = !!(userReport?.outputType && userReport?.simulationIds?.length);
  const outputType = userReport?.outputType;

  // For v2: construct Report from UserReport metadata (no v1 fetch needed)
  const v2Report: Report | undefined =
    isV2Report && userReport
      ? {
          id: userReport.reportId,
          countryId: userReport.countryId,
          year: userReport.year || new Date().getFullYear().toString(),
          apiVersion: 'v2',
          simulationIds: userReport.simulationIds!,
          status: 'pending',
          outputType: userReport.outputType,
        }
      : undefined;

  // Try to get base report from normalized cache first
  const cachedReport = baseReportId
    ? (queryNormalizer.getObjectById(baseReportId) as Report | undefined)
    : undefined;

  // Step 2: Fetch base report via v1 (disabled for v2 reports)
  const {
    data: v1Report,
    isLoading: repLoading,
    error: repError,
  } = useQuery({
    queryKey: reportKeys.byId(baseReportId!),
    queryFn: async () => {
      const metadata = await fetchReportById(country, baseReportId!);
      return ReportAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && !!baseReportId && !isV2Report,
    staleTime: 5 * 60 * 1000,
  });

  const finalReport = v2Report || cachedReport || v1Report;

  // Step 3: Fetch simulations for the report
  // For v2, simulationIds come from UserReport; for v1 they come from fetched Report
  const simulationIds = finalReport?.simulationIds ?? [];

  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      if (isV2Report && outputType === 'household') {
        const response = await getHouseholdSimulation(id);
        return fromHouseholdSimulationResponse(response);
      } else if (isV2Report && outputType === 'economy') {
        const response = await getEconomySimulation(id);
        return fromEconomySimulationResponse(response);
      } else {
        const metadata = await fetchSimulationById(country, id);
        return SimulationAdapter.fromMetadata(metadata);
      }
    },
    enabled: isEnabled && simulationIds.length > 0,
    staleTime: Infinity,
    gcTime: 0,
  });

  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  // Step 4: Extract policy IDs from simulations and fetch policies
  const policyIds = extractUniqueIds(simulations, 'policyId');

  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const response = await fetchPolicyById(id);
      return PolicyAdapter.fromV2Response(response);
    },
    enabled: isEnabled && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  // Step 5: Get user associations (only if we have userId)
  const { data: simulationAssociations } = useSimulationAssociationsByUser(userId || '');

  const { data: policyAssociations } = usePolicyAssociationsByUser(userId || '');
  const { data: householdAssociations } = useHouseholdAssociationsByUser(userId || '');

  const userSimulations = simulationAssociations?.filter((sa) =>
    finalReport?.simulationIds?.includes(sa.simulationId)
  );

  const userPolicies = policyAssociations?.filter((pa) =>
    simulations.some((s) => s.policyId === pa.policyId)
  );

  // Step 6: Extract households from simulations and fetch them
  // Filter for household simulations, then extract unique population IDs
  const householdSimulations = simulations.filter((s) => s.populationType === 'household');
  const householdIds = extractUniqueIds(householdSimulations, 'populationId');

  const householdResults = useParallelQueries<Household>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: (id) => fetchHouseholdByIdV2(id),
    enabled: isEnabled && householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const households = householdResults.queries
    .map((q) => q.data)
    .filter((h): h is Household => !!h);

  const userHouseholds = householdAssociations?.filter((ha) =>
    households.some((h) => h.id === ha.householdId)
  );

  // Step 7: Get geography data from simulations
  const geographies: Geography[] = [];
  simulations.forEach((sim) => {
    if (sim.populationType === 'geography' && sim.populationId && sim.countryId) {
      const geography: Geography = {
        countryId: sim.countryId,
        regionCode: sim.populationId,
      };

      geographies.push(geography);
    }
  });

  return {
    userReport,
    report: finalReport,
    simulations,
    policies,
    households,
    geographies,
    userSimulations,
    userPolicies,
    userHouseholds,
    isLoading:
      userReportLoading ||
      repLoading ||
      simulationResults.isLoading ||
      policyResults.isLoading ||
      householdResults.isLoading,
    error:
      userReportError ||
      repError ||
      simulationResults.error ||
      policyResults.error ||
      householdResults.error,
  };
};
