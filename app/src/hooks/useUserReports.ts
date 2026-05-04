import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegions } from '@/hooks/useRegions';
import { GC_TIME_5_MIN } from '@/libs/queryConfig';
import { buildCanonicalGeography } from '@/models/geography';
import { Household as HouseholdModel } from '@/models/Household';
import { Geography } from '@/types/ingredients/Geography';
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
import { combineLoadingStates, extractUniqueIds, useParallelQueries } from './utils/queryUtils';

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
  households?: HouseholdModel[];
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
  const queryClient = useQueryClient();
  const { data: regions } = useRegions(country);

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

  // Step 2: Extract report IDs for fetching
  const reportIds = reportAssociations?.map((a) => a.reportId).filter(Boolean) ?? [];

  // Step 3: Fetch reports using parallel queries utility
  const reportResults = useParallelQueries<Report>(reportIds, {
    queryKey: reportKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchReportById(country, id);
      return ReportAdapter.fromMetadata(metadata);
    },
    enabled: !!reportAssociations && reportAssociations.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Step 4: Extract simulation IDs from fetched reports
  const reports = reportResults.queries.map((q) => q.data).filter((r): r is Report => !!r);

  // Collect all simulation IDs from reports (each report has 1 or 2 simulations)
  const simulationIds = reports
    .flatMap((r) => r.simulationIds)
    .filter((id, index, self) => self.indexOf(id) === index);

  // Step 5: Fetch simulations
  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchSimulationById(country, id);
      const transformed = SimulationAdapter.fromMetadata(metadata);
      return transformed;
    },
    enabled: simulationIds.length > 0,
    // staleTime: Infinity - Never auto-refetch, rely on invalidateQueries() for targeted refetching
    // When orchestrator calls invalidateQueries({ queryKey: simulationKeys.byId(simId) }),
    // that specific simulation will be marked stale and refetch on next mount
    // All other simulations remain fresh and use cached data (fast navigation)
    staleTime: Infinity,
    gcTime: GC_TIME_5_MIN,
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
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });

  // Step 8: Fetch households
  const householdResults = useParallelQueries<HouseholdModel>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdModel.fromV1Metadata(metadata);
    },
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
        // Get report from query results
        const report = reports.find((r) => r.id === userRep.reportId);

        // Get related simulations from query results
        const reportSimulations =
          report?.simulationIds
            ?.map((simId) => simulations.find((s) => s.id === simId))
            .filter((s): s is Simulation => !!s) ?? [];

        // Get policies from query results
        const reportPolicies = reportSimulations
          .map((sim) => sim.policyId)
          .filter((id): id is string => !!id)
          .map((policyId) => policyResults.queries.find((q) => q.data?.id === policyId)?.data)
          .filter((p): p is Policy => !!p);

        // Get unique policy IDs for finding user associations
        const uniquePolicyIds = [
          ...new Set(reportSimulations.map((s) => s.policyId).filter(Boolean)),
        ];

        // Get households and geographies from simulations
        const reportHouseholds: HouseholdModel[] = [];
        const reportGeographies: Geography[] = [];

        reportSimulations.forEach((sim) => {
          if (sim.populationId && sim.populationType && sim.countryId) {
            if (sim.populationType === 'household') {
              const household = householdResults.queries.find(
                (q) => q.data?.id === sim.populationId
              )?.data;
              if (household) {
                reportHouseholds.push(household);
              }
            } else if (sim.populationType === 'geography') {
              reportGeographies.push(
                buildCanonicalGeography({
                  countryId: sim.countryId,
                  scope: sim.populationId === sim.countryId ? 'national' : 'subnational',
                  geographyId: sim.populationId,
                  regions,
                })
              );
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

    // Direct cache access via React Query
    getNormalizedReport: (id: string) => queryClient.getQueryData<Report>(reportKeys.byId(id)),
    getNormalizedSimulation: (id: string) =>
      queryClient.getQueryData<Simulation>(simulationKeys.byId(id)),
    getNormalizedPolicy: (id: string) => queryClient.getQueryData<Policy>(policyKeys.byId(id)),
    getNormalizedHousehold: (id: string) =>
      queryClient.getQueryData<HouseholdModel>(householdKeys.byId(id)),
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
  const queryClient = useQueryClient();
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

  // Try to get base report from React Query cache first
  const cachedReport = baseReportId
    ? queryClient.getQueryData<Report>(reportKeys.byId(baseReportId))
    : undefined;

  // Step 2: Fetch base report (query always enabled to allow invalidation)
  const {
    data: report,
    isLoading: repLoading,
    error: repError,
  } = useQuery({
    queryKey: reportKeys.byId(baseReportId!),
    queryFn: async () => {
      const metadata = await fetchReportById(country, baseReportId!);
      return ReportAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && !!baseReportId, // Removed && !cachedReport to allow invalidation
    staleTime: 5 * 60 * 1000,
  });

  const finalReport = cachedReport || report;

  // Step 3: Fetch simulations for the report
  const simulationIds = finalReport?.simulationIds ?? [];

  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchSimulationById(country, id);
      const transformed = SimulationAdapter.fromMetadata(metadata);
      return transformed;
    },
    enabled: isEnabled && simulationIds.length > 0,
    // staleTime: Infinity - Never auto-refetch, rely on invalidateQueries() for targeted refetching
    // When orchestrator calls invalidateQueries({ queryKey: simulationKeys.byId(simId) }),
    // that specific simulation will be marked stale and refetch on next mount
    // All other simulations remain fresh and use cached data (fast navigation)
    staleTime: Infinity,
    gcTime: GC_TIME_5_MIN,
  });

  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  // Step 4: Extract policy IDs from simulations and fetch policies
  const policyIds = extractUniqueIds(simulations, 'policyId');

  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
    structuralSharing: false,
  });

  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  // Step 5: Get user associations (only if we have userId)
  const { data: simulationAssociations } = useSimulationAssociationsByUser(userId || '');

  const { data: policyAssociations } = usePolicyAssociationsByUser(userId || '');
  const { data: householdAssociations } = useHouseholdAssociationsByUser(userId || '');
  const { data: regions } = useRegions(country);

  const matchedUserSimulations = simulationAssociations?.filter((sa) =>
    finalReport?.simulationIds?.includes(sa.simulationId)
  );

  // Fallback: if no localStorage associations exist but we have simulations,
  // synthesize UserSimulation objects so sharing works for reports created
  // before UserSimulation associations were stored during report creation.
  const userSimulations =
    matchedUserSimulations && matchedUserSimulations.length > 0
      ? matchedUserSimulations
      : simulations.length > 0 && userId
        ? simulations.map((sim) => ({
            userId,
            simulationId: sim.id ?? '',
            countryId: sim.countryId as 'us' | 'uk',
            label: sim.label ?? undefined,
            isCreated: true,
          }))
        : matchedUserSimulations;

  const userPolicies = policyAssociations?.filter((pa) =>
    simulations.some((s) => s.policyId === pa.policyId)
  );

  // Step 6: Extract households from simulations and fetch them
  // Filter for household simulations, then extract unique population IDs
  const householdSimulations = simulations.filter((s) => s.populationType === 'household');
  const householdIds = extractUniqueIds(householdSimulations, 'populationId');

  const householdResults = useParallelQueries<HouseholdModel>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdModel.fromV1Metadata(metadata);
    },
    enabled: isEnabled && householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const households = householdResults.queries
    .map((q) => q.data)
    .filter((h): h is HouseholdModel => !!h);

  const userHouseholds = householdAssociations?.filter((ha) =>
    households.some((h) => h.id === ha.householdId)
  );

  const geographies: Geography[] = [];
  simulations.forEach((sim) => {
    if (sim.populationType === 'geography' && sim.populationId && sim.countryId) {
      geographies.push(
        buildCanonicalGeography({
          countryId: sim.countryId,
          scope: sim.populationId === sim.countryId ? 'national' : 'subnational',
          geographyId: sim.populationId,
          regions,
        })
      );
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
