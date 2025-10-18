import { Query } from '@tanstack/react-query';
import { EconomyCalculationParams, EconomyCalculationResponse, fetchEconomyCalculation } from '@/api/economy';
import { CURRENT_YEAR } from '@/constants';
import { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { CalcExecutionStrategy, RefetchConfig } from './types';

/**
 * Strategy for executing economy-wide calculations
 * Uses server-side polling with checkpointed state
 */
export class EconomyCalcStrategy implements CalcExecutionStrategy {
  /**
   * Execute an economy calculation
   * Makes direct API call - server manages state and queuing
   */
  async execute(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    console.log('[EconomyCalcStrategy.execute] Starting with params:', params);
    console.log('[EconomyCalcStrategy.execute] metadata:', metadata);

    // Build API parameters
    const apiParams: EconomyCalculationParams = {
      region: params.region || params.countryId,
      time_period: CURRENT_YEAR,
    };

    // Call economy calculation API
    const response = await fetchEconomyCalculation(
      params.countryId,
      params.policyIds.reform || params.policyIds.baseline,
      params.policyIds.baseline,
      apiParams
    );

    console.log('[EconomyCalcStrategy.execute] API response:', response.status);

    // Transform to unified status with provided metadata
    return this.transformResponseWithMetadata(response, metadata);
  }

  /**
   * Get refetch configuration for economy calculations
   * Polls every 1 second while computing, stops when complete/error
   */
  getRefetchConfig(): RefetchConfig {
    return {
      refetchInterval: (query: Query) => {
        const data = query.state.data as CalcStatus | undefined;

        // Continue polling only if status is computing
        return data?.status === 'computing' ? 1000 : false;
      },
      staleTime: Infinity, // Results don't go stale
    };
  }

  /**
   * Transform economy API response with provided metadata
   */
  transformResponseWithMetadata(apiResponse: unknown, metadata: CalcMetadata): CalcStatus {
    const response = apiResponse as EconomyCalculationResponse;

    // Map computing status
    if (response.status === 'computing') {
      return {
        status: 'computing',
        queuePosition: response.queue_position,
        estimatedTimeRemaining: response.average_time ? response.average_time * 1000 : undefined,
        message: this.getComputingMessage(response.queue_position),
        metadata,
      };
    }

    // Map complete status
    if (response.status === 'ok' && response.result) {
      return {
        status: 'complete',
        result: response.result,
        metadata,
      };
    }

    // Map error status
    return {
      status: 'error',
      error: {
        code: 'ECONOMY_CALC_ERROR',
        message: response.error || 'Economy calculation failed',
        retryable: true,
      },
      metadata,
    };
  }

  /**
   * Transform economy API response to unified CalcStatus (legacy - uses default metadata)
   */
  transformResponse(apiResponse: unknown): CalcStatus {
    const metadata: CalcMetadata = {
      calcId: '',
      calcType: 'economy' as const,
      targetType: 'report' as const,
      startedAt: Date.now(),
    };
    return this.transformResponseWithMetadata(apiResponse, metadata);
  }

  /**
   * Get human-readable message for computing state
   */
  private getComputingMessage(queuePosition?: number): string {
    if (queuePosition !== undefined && queuePosition > 0) {
      return `In queue (position ${queuePosition})...`;
    }
    return 'Running economy-wide calculation...';
  }
}
