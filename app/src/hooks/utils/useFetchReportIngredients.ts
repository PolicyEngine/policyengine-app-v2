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

import { useSelector } from 'react-redux';
import { HouseholdAdapter, PolicyAdapter, ReportAdapter, SimulationAdapter } from '@/adapters';
import { fetchHouseholdById } from '@/api/household';
import { fetchPolicyById } from '@/api/policy';
import { fetchReportById } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { householdKeys, policyKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
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
import { combineLoadingStates, extractUniqueIds, useParallelQueries } from './normalizedUtils';

/**
 * Minimal user association data needed for fetching
 * These are the fields we encode in ShareData
 */
export interface MinimalUserReport {
  id?: string;
  reportId: string;
  countryId: string;
  label?: string | null;
}

export interface MinimalUserSimulation {
  simulationId: string;
  countryId: string;
  label?: string | null;
}

export interface MinimalUserPolicy {
  policyId: string;
  countryId: string;
  label?: string | null;
}

export interface MinimalUserHousehold {
  householdId: string;
  countryId: string;
  label?: string | null;
}

export interface MinimalUserGeography {
  geographyId: string;
  countryId: string;
  scope: 'national' | 'subnational';
  label?: string | null;
}

/**
 * Input for useFetchReportIngredients
 * Contains the user associations (either from localStorage or decoded from URL)
 */
export interface ReportIngredientsInput {
  userReport: MinimalUserReport;
  userSimulations: MinimalUserSimulation[];
  userPolicies: MinimalUserPolicy[];
  userHouseholds: MinimalUserHousehold[];
  userGeographies: MinimalUserGeography[];
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
 * Expand minimal user associations to full types
 * Adds required fields with placeholder values for shared view
 */
export function expandUserAssociations(
  input: ReportIngredientsInput,
  userId: string = 'shared'
): {
  userReport: UserReport;
  userSimulations: UserSimulation[];
  userPolicies: UserPolicy[];
  userHouseholds: UserHouseholdPopulation[];
  userGeographies: UserGeographyPopulation[];
} {
  return {
    userReport: {
      id: input.userReport.id ?? input.userReport.reportId, // Fallback to reportId if id not set
      userId,
      reportId: input.userReport.reportId,
      countryId: input.userReport.countryId as UserReport['countryId'],
      label: input.userReport.label ?? undefined,
    },
    userSimulations: input.userSimulations.map((s) => ({
      userId,
      simulationId: s.simulationId,
      countryId: s.countryId as UserSimulation['countryId'],
      label: s.label ?? undefined,
    })),
    userPolicies: input.userPolicies.map((p) => ({
      userId,
      policyId: p.policyId,
      countryId: p.countryId as UserPolicy['countryId'],
      label: p.label ?? undefined,
    })),
    userHouseholds: input.userHouseholds.map((h) => ({
      type: 'household' as const,
      userId,
      householdId: h.householdId,
      countryId: h.countryId as UserHouseholdPopulation['countryId'],
      label: h.label ?? undefined,
    })),
    userGeographies: input.userGeographies.map((g) => ({
      type: 'geography' as const,
      userId,
      geographyId: g.geographyId,
      countryId: g.countryId as UserGeographyPopulation['countryId'],
      scope: g.scope,
      label: g.label ?? undefined,
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
  const country = useCurrentCountry();

  // Get geography metadata for building Geography objects
  const geographyOptions = useSelector((state: RootState) => state.metadata.economyOptions.region);

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
      const metadata = await fetchPolicyById(country, id);
      return PolicyAdapter.fromMetadata(metadata);
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
    queryFn: async (id) => {
      const metadata = await fetchHouseholdById(country, id);
      return HouseholdAdapter.fromMetadata(metadata);
    },
    enabled: isEnabled && householdIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const households = householdResults.queries.map((q) => q.data).filter((h): h is Household => !!h);

  // Step 5: Construct Geography objects from geography-type simulations
  const geographies: Geography[] = [];
  simulations.forEach((sim) => {
    if (sim.populationType === 'geography' && sim.populationId && sim.countryId) {
      const isNational = sim.populationId === sim.countryId;

      let name: string;
      if (isNational) {
        name = sim.countryId.toUpperCase();
      } else {
        // For subnational, extract the base geography ID and look up in metadata
        const parts = sim.populationId.split('-');
        const baseGeographyId = parts.length > 1 ? parts.slice(1).join('-') : sim.populationId;
        const regionData = geographyOptions?.find((r) => r.name === baseGeographyId);
        name = regionData?.label || sim.populationId;
      }

      geographies.push({
        id: sim.populationId,
        countryId: sim.countryId,
        scope: isNational ? 'national' : 'subnational',
        geographyId: sim.populationId,
        name,
      });
    }
  });

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
