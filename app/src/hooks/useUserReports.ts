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
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { householdKeys, policyKeys, reportKeys, simulationKeys } from '../libs/queryKeys';
import { useGeographicAssociationsByUser } from './useUserGeographic';
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
  userGeographies?: UserGeographyPopulation[];

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
    // gcTime: 0 - Delete from cache immediately when no components are using this data
    // Prevents memory bloat from accumulating unused simulation data
    // When navigating away from Reports page, unused simulations are garbage collected
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
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

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
    // gcTime: 0 - Delete from cache immediately when no components are using this data
    // Prevents memory bloat from accumulating unused simulation data
    // When navigating away from report output, unused simulations are garbage collected
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
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  // Step 5: Get user associations (only if we have userId)
  const { data: simulationAssociations } = useSimulationAssociationsByUser(userId || '');

  const { data: policyAssociations } = usePolicyAssociationsByUser(userId || '');
  const { data: householdAssociations } = useHouseholdAssociationsByUser(userId || '');
  const { data: geographyAssociations } = useGeographicAssociationsByUser(userId || '');

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
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const households = householdResults.queries.map((q) => q.data).filter((h): h is Household => !!h);

  const userHouseholds = householdAssociations?.filter((ha) =>
    households.some((h) => h.id === ha.householdId)
  );

  // Step 7: Get geography data from simulations
  const geographyOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);

  const geographies: Geography[] = [];
  simulations.forEach((sim) => {
    if (sim.populationType === 'geography' && sim.populationId && sim.countryId) {
      // Use the simulation's populationId as-is for the Geography id
      // The populationId is already in the correct format from createGeographyFromScope
      const isNational = sim.populationId === sim.countryId;

      let name: string;
      if (isNational) {
        name = sim.countryId.toUpperCase();
      } else {
        // For subnational, extract the base geography ID and look up in metadata
        // e.g., "us-fl" -> "fl", "uk-scotland" -> "scotland"
        const parts = sim.populationId.split('-');
        const baseGeographyId = parts.length > 1 ? parts.slice(1).join('-') : sim.populationId;

        // Try to find the label in metadata
        const regionData = geographyOptions?.find((r) => r.name === baseGeographyId);
        name = regionData?.label || sim.populationId;
      }

      const geography: Geography = {
        id: sim.populationId,
        countryId: sim.countryId,
        scope: isNational ? 'national' : 'subnational',
        geographyId: sim.populationId,
        name,
      };

      geographies.push(geography);
    }
  });

  // Step 8: Filter geography associations for geographies used in this report
  const userGeographies = geographyAssociations?.filter((ga) =>
    geographies.some((g) => g.id === ga.geographyId)
  );

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
    userGeographies,
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
