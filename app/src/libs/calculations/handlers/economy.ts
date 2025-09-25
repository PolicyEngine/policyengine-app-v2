import { EconomyCalculationParams, fetchEconomyCalculation } from '@/api/economy';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '../status';
import { CalculationHandler } from './base';

export class EconomyCalculationHandler extends CalculationHandler {
  async fetch(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    const params: EconomyCalculationParams = {
      region: meta.region || meta.countryId,
      time_period: '2024', // TODO: Make dynamic
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

  getStatus(_reportId: string): CalculationStatusResponse | null {
    // Economy calculations are server-driven, no client-side status
    return null;
  }

  async startCalculation(_reportId: string, _meta: CalculationMeta): Promise<void> {
    // Economy calculations start automatically on fetch
    // No special initialization needed
  }
}
