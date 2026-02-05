/**
 * Shared utility for fetching base report ingredients from user associations
 *
 * This hook contains the common logic for fetching Report, Simulations, Policies,
 * Households, and Geographies. It's used by both:
 * - useUserReportById (for owned reports from localStorage)
 * - useSharedReportData (for shared reports from URL-encoded data)
 *
 * The key insight is that user associations contain the IDs needed to fetch
 * base ingredients from the API. This utility takes user associations as input
 * and returns the fully-hydrated base ingredients.
 */

import { PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useRegionsList } from '@/hooks/useStaticMetadata';
import { householdKeys, policyKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Policy } from '@/types/ingredients/Policy';
import { Report } from '@/types/ingredients/Report';
import { Simulation } from '@/types/ingredients/Simulation';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { combineLoadingStates, extractUniqueIds, useParallelQueries } from './normalizedUtils';

// Type for geography options from redux store
type GeographyOption = { name: string; label: string };

/**
 * Construct Geography objects from geography-type simulations
 *
 * Builds simplified Geography objects using regionCode from simulation's populationId.
 * Display names are looked up from region metadata at render time via useRegions().
 *
 * @param simulations - Array of simulations to extract geographies from
 * @param _geographyOptions - Deprecated: lookup now happens at display time
 * @returns Array of Geography objects
 */
export function buildGeographiesFromSimulations(
  simulations: Simulation[],
  _geographyOptions: GeographyOption[] | undefined
): Geography[] {
  const geographies: Geography[] = [];

  simulations.forEach((sim) => {
    if (sim.populationType === 'geography' && sim.populationId && sim.countryId) {
      // Create simplified Geography object with regionCode from simulation's populationId
      geographies.push({
        countryId: sim.countryId,
        regionCode: sim.populationId,
      });
    }
  });

  return geographies;
}

/**
 * Shareable user association types - excludes fields that don't make sense for sharing
 * Uses Omit<> to automatically include all other fields from the base types
 *
 * Note: ShareableUserReport makes `id` optional since shared reports can use
 * `reportId` as a fallback (see getShareDataUserReportId in shareUtils.ts)
 */
export type ShareableUserReport = Omit<UserReport, 'userId' | 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};
export type ShareableUserSimulation = Omit<UserSimulation, 'userId' | 'createdAt' | 'updatedAt'>;
export type ShareableUserPolicy = Omit<UserPolicy, 'userId' | 'createdAt' | 'updatedAt'>;
export type ShareableUserHousehold = Omit<
  UserHouseholdPopulation,
  'userId' | 'createdAt' | 'updatedAt'
>;

/**
 * Input for useFetchReportIngredients
 * Contains the user associations (either from localStorage or decoded from URL)
 */
export interface ReportIngredientsInput {
  userReport: ShareableUserReport;
  userSimulations: ShareableUserSimulation[];
  userPolicies: ShareableUserPolicy[];
  userHouseholds: ShareableUserHousehold[];
}

/**
 * Result from useFetchReportIngredients
 * Contains fetched base ingredients
 */
export interface ReportIngredientsResult {
  report: Report | undefined;
  simulations: Simulation[];
  policies: Policy[];
  households: Household[];
  geographies: Geography[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Expand shareable user associations to full types
 * Adds userId field for shared view
 */
export function expandUserAssociations(
  input: ReportIngredientsInput,
  userId: string = 'shared'
): {
  userReport: UserReport;
  userSimulations: UserSimulation[];
  userPolicies: UserPolicy[];
  userHouseholds: UserHouseholdPopulation[];
} {
  return {
    userReport: {
      ...input.userReport,
      id: input.userReport.id ?? input.userReport.reportId, // Fallback to reportId if id not set
      userId,
    },
    userSimulations: input.userSimulations.map((s) => ({
      ...s,
      userId,
    })),
    userPolicies: input.userPolicies.map((p) => ({
      ...p,
      userId,
    })),
    userHouseholds: input.userHouseholds.map((h) => ({
      ...h,
      userId,
    })),
  };
}

/**
 * Hook for fetching base report ingredients from user associations
 *
 * Takes user associations as input (which contain the IDs) and fetches
 * the corresponding base ingredients from the API.
 *
 * @param input - User associations containing IDs for fetching
 * @param options - Query options (enabled flag)
 * @returns Fetched base ingredients with loading/error states
 */
export function useFetchReportIngredients(
  input: ReportIngredientsInput | null,
  options?: { enabled?: boolean }
): ReportIngredientsResult {
  const isEnabled = options?.enabled !== false && input !== null;
  const currentCountry = useCurrentCountry();
  // Use country from input if available (for shared reports), otherwise use current country
  const country = input?.userReport.countryId ?? currentCountry;

  // Get geography metadata for building Geography objects from static metadata
  const geographyOptions = useRegionsList(country);

  // Step 1: Fetch the base Report using reportId from userReport
  const reportId = input?.userReport.reportId;

  const reportResults = useParallelQueries<Report>(reportId ? [reportId] : [], {
    queryKey: reportKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchReportById(country, id);
      return ReportAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && !!reportId,
    staleTime: 5 * 60 * 1000,
  });

  const report = reportResults.queries[0]?.data;

  // Step 2: Fetch Simulations using simulationIds from the Report
  // Note: We use report.simulationIds (from the fetched report) rather than
  // userSimulations because the report is the source of truth for which
  // simulations belong to it
  const simulationIds = report?.simulationIds ?? [];

  const simulationResults = useParallelQueries<Simulation>(isEnabled ? simulationIds : [], {
    queryKey: simulationKeys.byId,
    queryFn: async (id) => {
      const metadata = await fetchSimulationById(country, id);
      return SimulationAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && simulationIds.length > 0,
    staleTime: Infinity,
    gcTime: 0,
  });

  const simulations = simulationResults.queries
    .map((q) => q.data)
    .filter((s): s is Simulation => !!s);

  // Step 3: Fetch Policies using policyIds from Simulations
  const policyIds = extractUniqueIds(simulations, 'policyId');

  const policyResults = useParallelQueries<Policy>(isEnabled ? policyIds : [], {
    queryKey: policyKeys.byId,
    queryFn: async (id) => {
      const response = await fetchPolicyById(id);
      return PolicyAdapter.fromV2Response(response);
    },
    enabled: isEnabled && policyIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const policies = policyResults.queries.map((q) => q.data).filter((p): p is Policy => !!p);

  // Step 4: Fetch Households for household-type simulations
  const householdSimulations = simulations.filter((s) => s.populationType === 'household');
  const householdIds = extractUniqueIds(householdSimulations, 'populationId');

  const householdResults = useParallelQueries<Household>(isEnabled ? householdIds : [], {
    queryKey: householdKeys.byId,
    queryFn: (id) => fetchHouseholdByIdV2(id),
    enabled: isEnabled && householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const households = householdResults.queries.map((q) => q.data).filter((h): h is Household => !!h);

  // Step 5: Construct Geography objects from geography-type simulations
  const geographies = buildGeographiesFromSimulations(simulations, geographyOptions);

  // Combine loading states
  const { isLoading, error } = combineLoadingStates(
    { isLoading: reportResults.isLoading, error: reportResults.error },
    { isLoading: simulationResults.isLoading, error: simulationResults.error },
    { isLoading: policyResults.isLoading, error: policyResults.error },
    { isLoading: householdResults.isLoading, error: householdResults.error }
  );

  return {
    report,
    simulations,
    policies,
    households,
    geographies,
    isLoading,
    error,
  };
}
