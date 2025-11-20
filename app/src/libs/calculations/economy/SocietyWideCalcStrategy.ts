import { Query } from '@tanstack/react-query';
import {
  fetchSocietyWideCalculation,
  SocietyWideCalculationParams,
  SocietyWideCalculationResponse,
} from '@/api/societyWideCalculation';
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

    // Pass the region value AS-IS to the API (NO prefix stripping)
    // For UK: includes prefix like "constituency/Sheffield Central" or "country/england"
    // For US: just state code like "ca" or "ny"
    // For National: just country code like "uk" or "us"
    const apiRegion = params.region || params.countryId;

    console.log('[SocietyWideCalcStrategy.execute] API region parameter:', apiRegion);

    // Build API parameters - use year from params
    const apiParams: SocietyWideCalculationParams = {
      region: apiRegion,
      time_period: params.year,
    };

    console.log('[SocietyWideCalcStrategy.execute] Using year:', params.year);

    // Call society-wide calculation API
    const response = await fetchSocietyWideCalculation(
      params.countryId,
      params.policyIds.reform || params.policyIds.baseline,
      params.policyIds.baseline,
      apiParams
    );

    console.log('[SocietyWideCalcStrategy.execute] API response:', response.status);

    // Transform to unified status with provided metadata
    return this.transformResponseWithMetadata(response, metadata, params.countryId);
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
    metadata: CalcMetadata,
    countryId?: string
  ): CalcStatus {
    const response = apiResponse as SocietyWideCalculationResponse;

    // Map computing status from API to pending status in CalcStatus
    if (response.status === 'computing') {
      // Calculate synthetic progress based on elapsed time (mimicking household calculations)
      const elapsed = Date.now() - metadata.startedAt;
      const estimatedDuration = this.getEstimatedDuration(countryId);
      const progress = Math.min((elapsed / estimatedDuration) * 100, 95); // Cap at 95%

      console.log('[SocietyWideCalcStrategy] Progress calculation:', {
        countryId,
        elapsed,
        estimatedDuration,
        rawProgress: (elapsed / estimatedDuration) * 100,
        cappedProgress: progress,
        queuePosition: response.queue_position,
      });

      return {
        status: 'pending',
        progress,
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

  /**
   * Get estimated duration for society-wide calculations based on country
   * US: 5 minutes, UK: 3 minutes
   */
  private getEstimatedDuration(countryId?: string): number {
    if (countryId === 'us') {
      return 5 * 60 * 1000; // 5 minutes in milliseconds
    }
    if (countryId === 'uk') {
      return 3 * 60 * 1000; // 3 minutes in milliseconds
    }
    // Default fallback to 5 minutes
    return 5 * 60 * 1000;
  }
}
