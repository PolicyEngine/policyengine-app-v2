import { useQueryClient } from '@tanstack/react-query';
import { MOCK_USER_ID } from '@/constants';
import { useUserReportById } from './useUserReports';
import { EconomyCalculationParams } from '@/api/economy';

interface UseReportOutputParams {
  reportId: string;
  countryId: string;
}

interface UseReportOutputResult {
  status: 'pending' | 'complete' | 'error';
  data: any;
  isPending: boolean;
  error: any;
  report: any;
}

/**
 * Hook to get report calculation results.
 *
 * This hook follows a three-tier approach:
 * 1. Check TanStack Query cache for calculation results
 * 2. If not in cache, use the normalized report hook to get report data
 * 3. If report not found, return error
 *
 * The useUserReportById hook handles report fetching and the cache check
 * looks for any ongoing calculations.
 */
export function useReportOutput({ reportId, countryId }: UseReportOutputParams): UseReportOutputResult {
  const queryClient = useQueryClient();
  const userId = MOCK_USER_ID; // TODO: Get from auth context

  // Step 1: Check cache for calculation results first
  // Try to build cache keys from known patterns
  // For household calc: ['household_calculation', countryId, householdId, policyId]
  // For economy calc: ['economy', countryId, reformPolicyId, baselinePolicyId, economyParams]

  // We need simulations to build the cache key, so get them
  const { report, simulations, error: reportError } = useUserReportById(userId, reportId);

  if (simulations && simulations.length > 0) {
    const baselineSimulation = simulations[0];
    const reformSimulation = simulations[1];

    const isHouseholdCalc = baselineSimulation.populationType === 'household';
    const populationId = baselineSimulation.populationId;
    const baselinePolicyId = baselineSimulation.policyId;
    const reformPolicyId = reformSimulation?.policyId || baselinePolicyId;

    // Build economy params if needed
    // NOTE: All of this code is necessary because API v1 has no means of just
    // passing 2 simulations into a reform calculation. This should be fixed in API v2.
    let economyParams: EconomyCalculationParams = {};
    if (!isHouseholdCalc && populationId) {
      // Extract region from population_id for subnational geographies
      const parts = populationId.split('-');
      if (parts.length > 1 && parts[0] === countryId) {
        const region = parts.slice(1).join('-');
        if (region) {
          economyParams = { region };
        }
      }
    }

    // Build cache key to check for calculation results
    const cacheKey = isHouseholdCalc
      ? ['household_calculation', countryId, populationId, reformPolicyId || baselinePolicyId]
      : ['economy', countryId, reformPolicyId, baselinePolicyId, economyParams];

    // Check cache for calculation data
    const cachedData = queryClient.getQueryData(cacheKey);
    if (cachedData) {
      // We have calculation data in cache
      if (isHouseholdCalc) {
        // Household calculations are synchronous but may not have completed yet
        // They don't have a status field, so if data exists, it's complete
        return {
          status: 'complete',
          data: cachedData,
          isPending: false,
          error: null,
          report,
        };
      } else {
        // Economy calculations have status field
        const economyCalc = cachedData as any;
        if (economyCalc.status === 'completed') {
          return {
            status: 'complete',
            data: economyCalc.result,
            isPending: false,
            error: null,
            report,
          };
        } else if (economyCalc.status === 'pending') {
          return {
            status: 'pending',
            data: null,
            isPending: true,
            error: null,
            report,
          };
        } else if (economyCalc.status === 'error') {
          return {
            status: 'error',
            data: null,
            isPending: false,
            error: economyCalc.error || 'Calculation failed',
            report,
          };
        }
      }
    }
  }

  // Step 2: If not in cache, check the report itself
  if (!report) {
    // Step 3: Report not found, return error
    return {
      status: 'error',
      data: null,
      isPending: false,
      error: reportError || 'Report not found',
      report: null,
    };
  }

  // Return based on the report's status
  if (!report.status) {
    console.error(`Report ${reportId} has no status field`);
    return {
      status: 'error',
      data: null,
      isPending: false,
      error: 'Invalid report: missing status',
      report,
    };
  }

  // Parse output if it exists
  const outputData = report.output
    ? (typeof report.output === 'string' ? JSON.parse(report.output) : report.output)
    : null;

  switch (report.status) {
    case 'complete':
      return {
        status: 'complete',
        data: outputData,
        isPending: false,
        error: null,
        report,
      };
    case 'pending':
      return {
        status: 'pending',
        data: null,
        isPending: true,
        error: null,
        report,
      };
    case 'error':
      return {
        status: 'error',
        data: null,
        isPending: false,
        error: 'Report calculation failed',
        report,
      };
    default:
      console.error(`Unknown report status: ${report.status}`);
      return {
        status: 'error',
        data: null,
        isPending: false,
        error: `Unknown status: ${report.status}`,
        report,
      };
  }
}