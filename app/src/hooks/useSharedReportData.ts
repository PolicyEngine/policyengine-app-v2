/**
 * Hook for fetching report data from a shared URL
 *
 * Uses the shared useFetchReportIngredients utility to fetch base ingredients
 * from the user associations encoded in ReportIngredientsInput.
 *
 * Returns the same shape as useUserReportById for component compatibility.
 */

import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import {
  expandUserAssociations,
  ReportIngredientsInput,
  useFetchReportIngredients,
} from './utils/useFetchReportIngredients';

interface UseSharedReportDataOptions {
  enabled?: boolean;
}

/**
 * Result type matching useUserReportById for component compatibility
 */
interface UseSharedReportDataResult {
  // User associations (from shareData)
  userReport: UserReport | undefined;
  userSimulations: UserSimulation[];
  userPolicies: UserPolicy[];
  userHouseholds: UserHouseholdPopulation[];
  userGeographies: UserGeographyPopulation[];

  // Base ingredients (fetched from API)
  report: ReturnType<typeof useFetchReportIngredients>['report'];
  simulations: ReturnType<typeof useFetchReportIngredients>['simulations'];
  policies: ReturnType<typeof useFetchReportIngredients>['policies'];
  households: ReturnType<typeof useFetchReportIngredients>['households'];
  geographies: ReturnType<typeof useFetchReportIngredients>['geographies'];

  // Status
  isLoading: boolean;
  error: Error | null;
}

/**
 * Fetch report data using ReportIngredientsInput from URL
 *
 * ReportIngredientsInput contains user associations which have the IDs needed to fetch
 * base ingredients from the API. This hook:
 * 1. Uses useFetchReportIngredients to fetch base ingredients
 * 2. Returns both user associations and base ingredients
 */
export function useSharedReportData(
  shareData: ReportIngredientsInput | null,
  options?: UseSharedReportDataOptions
): UseSharedReportDataResult {
  const isEnabled = options?.enabled !== false && shareData !== null;

  // Fetch base ingredients using the shared utility
  const { report, simulations, policies, households, geographies, isLoading, error } =
    useFetchReportIngredients(shareData, { enabled: isEnabled });

  // Expand minimal user associations to full types
  const expandedAssociations = shareData ? expandUserAssociations(shareData, 'shared') : null;

  return {
    // User associations from shareData
    userReport: expandedAssociations?.userReport,
    userSimulations: expandedAssociations?.userSimulations ?? [],
    userPolicies: expandedAssociations?.userPolicies ?? [],
    userHouseholds: expandedAssociations?.userHouseholds ?? [],
    userGeographies: expandedAssociations?.userGeographies ?? [],

    // Base ingredients from API
    report,
    simulations,
    policies,
    households,
    geographies,

    // Status
    isLoading,
    error,
  };
}
