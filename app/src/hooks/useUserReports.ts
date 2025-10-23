import { useQueryNormalizer } from '@normy/react-query';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { HouseholdAdapter, PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { RootState } from '@/store';
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

  // Get geography data from metadata
  const geographyOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);

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

  console.log('reportAssociations', reportAssociations);
  console.log('simulationAssociations', simulationAssociations);
  console.log('policyAssociations', policyAssociations);
  console.log('householdAssociations', householdAssociations);

  // Step 2: Extract report IDs for fetching
  const reportIds = reportAssociations?.map((a) => a.reportId).filter(Boolean) ?? [];

  console.log('reportIds', reportIds);

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

  console.log('reportResults', reportResults);

  // Step 4: Extract simulation IDs from fetched reports
  const reports = reportResults.queries.map((q) => q.data).filter((r): r is Report => !!r);

  console.log('reports', reports);

  // Collect all simulation IDs from reports (each report has 1 or 2 simulations)
  const simulationIds = reports
    .flatMap((r) => r.simulationIds)
    .filter((id, index, self) => self.indexOf(id) === index);

  console.log('simulationIds', simulationIds);

  // Step 5: Fetch simulations
  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      console.log('[useUserReports] 🔄 FETCHING simulation from API:', id);
      const metadata = await fetchSimulationById(country, id);
      const transformed = SimulationAdapter.fromMetadata(metadata);

      console.log('[useUserReports] ✅ FETCHED simulation:', {
        id,
        status: transformed.status,
        hasOutput: !!transformed.output,
      });

      return transformed;
    },
    enabled: simulationIds.length > 0,
    // staleTime: Infinity - Never auto-refetch, rely on invalidateQueries() for targeted refetching
    // When orchestrator calls invalidateQueries({ queryKey: simulationKeys.byId(simId) }),
    // that specific simulation will be marked stale and refetch on next mount
    // All other simulations remain fresh and use cached data (fast navigation)
    staleTime: Infinity,
    // gcTime: 0 - Delete from cache immediately when no components are using this data
    // Prevents memory bloat from accumulating unused simulation data
    // When navigating away from Reports page, unused simulations are garbage collected
    gcTime: 0,
  });

  console.log('simulationResults', simulationResults);
  console.log(
    '[useUserReports] simulationResults AFTER QUERY:',
    simulationResults.queries.map((q) => ({
      id: q.data?.id,
      status: q.data?.status,
      hasOutput: !!q.data?.output,
      isSuccess: q.isSuccess,
      isFetching: q.isFetching,
    }))
  );

  // Step 6: Extract policy and household IDs from fetched simulations
  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  console.log('simulations', simulations);

  const policyIds = extractUniqueIds(simulations, 'policyId');

  // Separate household and geography IDs based on populationType
  const householdIds = simulations
    .filter((s) => s.populationType === 'household' && s.populationId)
    .map((s) => s.populationId as string)
    .filter((id, index, self) => self.indexOf(id) === index);

  console.log('policyIds', policyIds);
  console.log('householdIds', householdIds);

  // Step 7: Fetch policies
  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  console.log('policyResults', policyResults);

  // Step 8: Fetch households
  const householdResults = useParallelQueries<Household>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdAdapter.fromMetadata(metadata);
    },
    enabled: householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  console.log('householdResults', householdResults);

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

  console.log('isLoading', isLoading);
  console.log('error', error);

  // Step 10: Build enhanced results with all relationships
  const enhancedReports: EnhancedUserReport[] =
    reportAssociations
      ?.filter((userRep) => userRep.reportId) // Filter out associations without reportId
      .map((userRep) => {
        // Get report from normalized cache or query results
        const cachedReport = queryNormalizer.getObjectById(userRep.reportId) as Report | undefined;
        const directReport = reports.find((r) => r.id === userRep.reportId);

        console.log(`Report ${userRep.reportId}:`);
        console.log('  From Normy cache:', cachedReport);
        console.log('  From direct query:', directReport);
        console.log('  Cache has status?', cachedReport?.status);
        console.log('  Direct has status?', directReport?.status);
        console.log('  All cache fields:', cachedReport ? Object.keys(cachedReport) : 'N/A');
        console.log('  All direct fields:', directReport ? Object.keys(directReport) : 'N/A');

        const report = cachedReport || directReport;

        // Get related simulations
        const reportSimulations =
          report?.simulationIds
            ?.map((simId) => {
              const fromNormy = queryNormalizer.getObjectById(simId) as Simulation | undefined;
              const fromQuery = simulations.find((s) => s.id === simId);

              console.log(`[useUserReports] SIMULATION ${simId} COMPARISON:`, {
                'From Normy Cache': {
                  exists: !!fromNormy,
                  status: fromNormy?.status,
                  hasOutput: !!fromNormy?.output,
                },
                'From React Query': {
                  exists: !!fromQuery,
                  status: fromQuery?.status,
                  hasOutput: !!fromQuery?.output,
                },
                'Which will be used': fromNormy ? 'NORMY (stale?)' : 'QUERY (fresh)',
              });

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
              // Create Geography object from the ID
              const regionData = geographyOptions?.find((r) => r.name === sim.populationId);
              if (regionData) {
                reportGeographies.push({
                  id: `${sim.countryId}-${sim.populationId}`,
                  countryId: sim.countryId,
                  scope: 'subnational' as const,
                  geographyId: sim.populationId,
                  name: regionData.label || regionData.name,
                } as Geography);
              }
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
export const useUserReportById = (userReportId: string) => {
  const queryNormalizer = useQueryNormalizer();
  const country = useCurrentCountry();

  // Step 1: Fetch UserReport by userReportId to get the base reportId
  const {
    data: userReport,
    isLoading: userReportLoading,
    error: userReportError,
  } = useReportAssociationById(userReportId);

  // Extract base reportId and userId from UserReport
  const baseReportId = userReport?.reportId;
  const userId = userReport?.userId;

  // Try to get base report from normalized cache first
  const cachedReport = baseReportId
    ? (queryNormalizer.getObjectById(baseReportId) as Report | undefined)
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
    enabled: !!baseReportId, // Removed && !cachedReport to allow invalidation
    staleTime: 5 * 60 * 1000,
  });

  console.log('[useUserReportById] REPORT CACHE COMPARISON:', {
    reportId: baseReportId,
    'From Normy': {
      exists: !!cachedReport,
      status: cachedReport?.status,
      simulationIds: cachedReport?.simulationIds,
    },
    'From React Query': {
      exists: !!report,
      status: report?.status,
      simulationIds: report?.simulationIds,
    },
    'Which will be used': cachedReport ? 'NORMY' : 'REACT QUERY',
  });

  const finalReport = cachedReport || report;

  // Step 3: Fetch simulations for the report
  const simulationIds = finalReport?.simulationIds ?? [];

  const simulationResults = useParallelQueries<Simulation>(simulationIds, {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      console.log('[useUserReportById] 🔄 FETCHING simulation from API:', id);
      const metadata = await fetchSimulationById(country, id);
      const transformed = SimulationAdapter.fromMetadata(metadata);

      console.log('[useUserReportById] ✅ FETCHED simulation:', {
        id,
        status: transformed.status,
        hasOutput: !!transformed.output,
      });

      return transformed;
    },
    enabled: simulationIds.length > 0,
    // staleTime: Infinity - Never auto-refetch, rely on invalidateQueries() for targeted refetching
    // When orchestrator calls invalidateQueries({ queryKey: simulationKeys.byId(simId) }),
    // that specific simulation will be marked stale and refetch on next mount
    // All other simulations remain fresh and use cached data (fast navigation)
    staleTime: Infinity,
    // gcTime: 0 - Delete from cache immediately when no components are using this data
    // Prevents memory bloat from accumulating unused simulation data
    // When navigating away from report output, unused simulations are garbage collected
    gcTime: 0,
  });

  console.log(
    '[useUserReportById] simulationResults AFTER QUERY:',
    simulationResults.queries.map((q) => ({
      id: q.data?.id,
      status: q.data?.status,
      hasOutput: !!q.data?.output,
      isSuccess: q.isSuccess,
      isFetching: q.isFetching,
    }))
  );

  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  console.log(
    '[useUserReportById] SIMULATIONS FROM REACT QUERY:',
    simulations.map((s) => ({
      id: s.id,
      status: s.status,
      hasOutput: !!s.output,
    }))
  );

  // Step 4: Extract policy IDs from simulations and fetch policies
  const policyIds = extractUniqueIds(simulations, 'policyId');

  const policyResults = useParallelQueries<Policy>(policyIds, {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  // Step 5: Get user associations (only if we have userId)
  const { data: simulationAssociations } = useSimulationAssociationsByUser(userId || '');

  console.log('[useUserReportById] simulationAssociations', simulationAssociations);

  const { data: policyAssociations } = usePolicyAssociationsByUser(userId || '');
  const { data: householdAssociations } = useHouseholdAssociationsByUser(userId || '');

  console.log('[useUserReportById] finalReport', finalReport);

  console.log(
    '[useUserReportById] type of each member of finalReport.simulationIds',
    finalReport?.simulationIds?.map((id) => typeof id)
  );
  console.log(
    '[useUserReportById] type of simulationAssociations.simulationId',
    simulationAssociations?.map((sa) => ({ id: sa.simulationId, type: typeof sa.simulationId }))
  );

  const userSimulations = simulationAssociations?.filter((sa) =>
    finalReport?.simulationIds?.includes(sa.simulationId)
  );

  console.log('[useUserReportById] userSimulations after filter', userSimulations);

  const userPolicies = policyAssociations?.filter((pa) =>
    simulations.some((s) => s.policyId === pa.policyId)
  );

  // Step 6: Extract households from simulations and fetch them
  // Filter for household simulations, then extract unique population IDs
  const householdSimulations = simulations.filter((s) => s.populationType === 'household');
  const householdIds = extractUniqueIds(householdSimulations, 'populationId');

  const householdResults = useParallelQueries<Household>(householdIds, {
    queryKey: householdKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdAdapter.fromMetadata(metadata);
    },
    enabled: householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const households = householdResults.queries.map((q) => q.data).filter((h): h is Household => !!h);

  const userHouseholds = householdAssociations?.filter((ha) =>
    households.some((h) => h.id === ha.householdId)
  );

  return {
    userReport,
    report: finalReport,
    simulations,
    policies,
    households,
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
