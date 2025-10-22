import { Query } from '@tanstack/react-query';
import {
  SocietyWideCalculationParams,
  SocietyWideCalculationResponse,
  fetchSocietyWideCalculation,
} from '@/api/societyWideCalculation';
import { CURRENT_YEAR } from '@/constants';
import { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { CalcExecutionStrategy, RefetchConfig } from '../strategies/types';

/**
 * Strategy for executing society-wide calculations
 * Uses server-side polling with checkpointed state
 */
export class SocietyWideCalcStrategy implements CalcExecutionStrategy {
  /**
   * Execute a society-wide calculation
   * Makes direct API call - server manages state and queuing
   */
  async execute(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    console.log('[SocietyWideCalcStrategy.execute] Starting with params:', params);
    console.log('[SocietyWideCalcStrategy.execute] metadata:', metadata);

    // Build API parameters
    const apiParams: SocietyWideCalculationParams = {
      region: params.region || params.countryId,
      time_period: CURRENT_YEAR,
    };

    // Call society-wide calculation API
    const response = await fetchSocietyWideCalculation(
      params.countryId,
      params.policyIds.reform || params.policyIds.baseline,
      params.policyIds.baseline,
      apiParams
    );

    console.log('[SocietyWideCalcStrategy.execute] API response:', response.status);

    // Transform to unified status with provided metadata
    return this.transformResponseWithMetadata(response, metadata);
  }

  /**
   * Get refetch configuration for society-wide calculations
   * Polls every 1 second while computing, stops when complete/error
   */
  getRefetchConfig(): RefetchConfig {
    return {
      refetchInterval: (query: Query) => {
        const data = query.state.data as CalcStatus | undefined;

        // Continue polling only if status is computing
        return data?.status === 'pending' ? 1000 : false;
      },
      staleTime: Infinity, // Results don't go stale
    };
  }

  /**
   * Transform society-wide API response with provided metadata
   */
  transformResponseWithMetadata(
    apiResponse: unknown,
    metadata: CalcMetadata
  ): CalcStatus {
    const response = apiResponse as SocietyWideCalculationResponse;

    // Map computing status from API to pending status in CalcStatus
    if (response.status === 'computing') {
      return {
        status: 'pending',
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
        code: 'SOCIETY_WIDE_CALC_ERROR',
        message: response.error || 'Society-wide calculation failed',
        retryable: true,
      },
      metadata,
    };
  }

  /**
   * Transform society-wide API response to unified CalcStatus (legacy - uses default metadata)
   */
  transformResponse(apiResponse: unknown): CalcStatus {
    const metadata: CalcMetadata = {
      calcId: '',
      calcType: 'societyWide' as const,
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
    return 'Running society-wide calculation...';
  }
}
