/**
 * Hook for fetching report data from a shared URL
 *
 * Uses the shared useFetchReportIngredients utility to fetch base ingredients
 * from the user associations encoded in ShareData.
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
import { ShareData } from '@/utils/shareUtils';
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
  // User associations (from ShareData)
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
 * Fetch report data using ShareData from URL
 *
 * ShareData contains user associations which have the IDs needed to fetch
 * base ingredients from the API. This hook:
 * 1. Converts ShareData to ReportIngredientsInput
 * 2. Uses useFetchReportIngredients to fetch base ingredients
 * 3. Returns both user associations and base ingredients
 */
export function useSharedReportData(
  shareData: ShareData | null,
  options?: UseSharedReportDataOptions
): UseSharedReportDataResult {
  const isEnabled = options?.enabled !== false && shareData !== null;

  // Convert ShareData to the input format for useFetchReportIngredients
  const ingredientsInput: ReportIngredientsInput | null = shareData
    ? {
        userReport: shareData.userReport,
        userSimulations: shareData.userSimulations,
        userPolicies: shareData.userPolicies,
        userHouseholds: shareData.userHouseholds,
        userGeographies: shareData.userGeographies,
      }
    : null;

  // Fetch base ingredients using the shared utility
  const { report, simulations, policies, households, geographies, isLoading, error } =
    useFetchReportIngredients(ingredientsInput, { enabled: isEnabled });

  // Expand minimal user associations to full types
  const expandedAssociations = shareData ? expandUserAssociations(shareData, 'shared') : null;

  return {
    // User associations from ShareData
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
