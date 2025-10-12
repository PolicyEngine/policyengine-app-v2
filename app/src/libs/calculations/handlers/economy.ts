import { EconomyCalculationParams, fetchEconomyCalculation } from '@/api/economy';
import { CalculationMeta } from '@/api/reportCalculations';
import { CURRENT_YEAR } from '@/constants';
import { CalculationStatusResponse } from '../status';

/**
 * EconomyCalculationHandler manages economy calculation execution
 * without touching cache or database. Pure execution only.
 */
export class EconomyCalculationHandler {
  // No client-side tracking needed for economy calculations
  // The API handles all state management server-side

  /**
   * Execute an economy calculation - direct API call
   * Pure execution - no cache or database updates
   */
  async execute(reportId: string, meta: CalculationMeta): Promise<CalculationStatusResponse> {
    console.log('[EconomyCalculationHandler.execute] Fetching for report:', reportId);

    const params: EconomyCalculationParams = {
      region: meta.region || meta.countryId,
      time_period: CURRENT_YEAR, // TODO: Make dynamic
    };

    const response = await fetchEconomyCalculation(
      meta.countryId,
      meta.policyIds.reform || meta.policyIds.baseline,
      meta.policyIds.baseline,
      params
    );

    // Map API response to unified format
    return {
      status:
        response.status === 'computing' ? 'computing' : response.status === 'ok' ? 'ok' : 'error',
      queuePosition: response.queue_position,
      averageTime: response.average_time,
      result: response.result,
      error: response.error,
    };
  }

  /**
   * Get current status - always null for economy
   * Economy calculations are server-driven, no client-side tracking
   */
  getStatus(_reportId: string): CalculationStatusResponse | null {
    return null;
  }

  /**
   * Check if a calculation is active - always false for economy
   * Economy calculations don't track client-side
   */
  isActive(_reportId: string): boolean {
    return false;
  }
}
