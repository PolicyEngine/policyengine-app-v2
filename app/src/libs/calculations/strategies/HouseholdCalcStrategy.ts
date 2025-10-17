import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { CalcParams, CalcStatus } from '@/types/calculation';
import { CalcExecutionStrategy, RefetchConfig } from './types';

/**
 * Strategy for executing household calculations
 *
 * WHY NO POLLING:
 * Unlike economy calculations which have server-side queuing, household calculations
 * execute synchronously and return the final result immediately. There's no need to
 * poll for progress - we simply await the API call and return the complete result.
 *
 * This prevents unnecessary API hammering (previously polling every 500ms) and
 * simplifies the flow: execute() → await API → return complete result → cache forever.
 */
export class HouseholdCalcStrategy implements CalcExecutionStrategy {
  /**
   * Execute a household calculation
   * Calls API once, awaits result, returns complete status
   *
   * WHY AWAIT: Household API returns results synchronously (no queuing).
   * We await the full calculation and return the final result immediately.
   */
  async execute(params: CalcParams): Promise<CalcStatus> {
    console.log('[HouseholdCalcStrategy.execute] Starting calculation with params:', params);

    const calcId = params.calcId;
    const policyId = params.policyIds.reform || params.policyIds.baseline;

    try {
      // Call API once and await the full result
      const result = await fetchHouseholdCalculation(
        params.countryId,
        params.populationId,
        policyId
      );

      console.log('[HouseholdCalcStrategy.execute] Calculation completed successfully');

      // Return complete status with result
      return {
        status: 'complete',
        result,
        metadata: {
          calcId,
          calcType: 'household',
          targetType: 'simulation', // Household calcs are simulation-level
          startedAt: Date.now(),
        },
      };
    } catch (error) {
      console.error('[HouseholdCalcStrategy.execute] Calculation failed:', error);

      // Return error status with proper CalcError
      const errorMessage = error instanceof Error ? error.message : 'Household calculation failed';
      return {
        status: 'error',
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: errorMessage,
          retryable: true, // Household calculations can be retried
        },
        metadata: {
          calcId,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: Date.now(),
        },
      };
    }
  }

  /**
   * Get refetch configuration for household calculations
   *
   * WHY NO REFETCHING:
   * Since execute() returns the complete result immediately, there's no need
   * to refetch. We cache the result forever and never refetch unless explicitly
   * invalidated by the user (e.g., "Run Again" button).
   */
  getRefetchConfig(): RefetchConfig {
    return {
      refetchInterval: false, // Never refetch - result is final
      staleTime: Infinity,     // Cache forever
    };
  }

  /**
   * Transform household API response to unified CalcStatus
   * Note: This is now handled directly in execute(), but kept for compatibility
   */
  transformResponse(apiResponse: unknown): CalcStatus {
    return {
      status: 'complete',
      result: apiResponse as any,
      metadata: {
        calcId: '',
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
      },
    };
  }
}
