import { Query } from '@tanstack/react-query';
import {
  fetchSocietyWideCalculation,
  SocietyWideCalculationParams,
  SocietyWideCalculationResponse,
} from '@/api/societyWideCalculation';
import { getDurationForCountry, getDurationForRegion } from '@/constants/calculationDurations';
import { CalcMetadata, CalcParams, CalcStatus, RunStage } from '@/types/calculation';
import { CalcExecutionStrategy, RefetchConfig } from '../strategies/types';

/** How a caller wants the run's duration estimated. */
export interface DurationEstimateOptions {
  /** Estimate from the region (v3). Off by default: the country estimate applies. */
  estimateByRegion?: boolean;
  /** The region as sent to the API, e.g. 'state/ca'; read only with estimateByRegion. */
  region?: string;
}

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
    try {
      // Pass the region value AS-IS to the API (NO prefix stripping)
      // For UK: includes prefix like "constituency/Sheffield Central" or "country/england"
      // For US: includes prefix like "state/ca" for state-level reports
      // For National: just country code like "uk" or "us"
      const apiRegion = params.region || params.countryId;

      // Build API parameters - use year from params
      const apiParams: SocietyWideCalculationParams = {
        region: apiRegion,
        time_period: params.year,
      };

      // Call society-wide calculation API
      const response = await fetchSocietyWideCalculation(
        params.countryId,
        params.policyIds.reform || params.policyIds.baseline,
        params.policyIds.baseline,
        apiParams
      );

      // Transform to unified status with provided metadata
      return this.transformResponseWithMetadata(response, metadata, params.countryId, {
        estimateByRegion: params.estimateByRegion,
        region: apiRegion,
      });
    } catch (error) {
      console.error('[SocietyWideCalcStrategy.execute] Calculation failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Society-wide calculation failed';
      return {
        status: 'error',
        error: {
          code: 'SOCIETY_WIDE_CALC_FAILED',
          message: errorMessage,
          retryable: true,
        },
        metadata,
      };
    }
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
   * @param estimate - Opt-in (v3): with estimateByRegion, progress follows the
   *   region estimate and pending statuses carry estimatedDurationMs. Without
   *   it, the country estimate applies and no estimatedDurationMs is set.
   */
  transformResponseWithMetadata(
    apiResponse: unknown,
    metadata: CalcMetadata,
    countryId?: string,
    estimate: DurationEstimateOptions = {}
  ): CalcStatus {
    const response = apiResponse as SocietyWideCalculationResponse;

    // Map computing status from API to pending status in CalcStatus
    if (response.status === 'computing') {
      // Calculate synthetic progress based on elapsed time (mimicking household calculations)
      const elapsed = Date.now() - metadata.startedAt;
      const estimatedDuration = this.getEstimatedDuration(countryId, estimate);
      const progress = Math.min((elapsed / estimatedDuration) * 100, 95); // Cap at 95%

      const runStage = estimate.estimateByRegion ? this.getRunStage(response) : undefined;

      return {
        status: 'pending',
        progress,
        ...(estimate.estimateByRegion && { estimatedDurationMs: estimatedDuration }),
        ...(runStage && { runStage }),
        queuePosition: response.queue_position,
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
   * The API's stage fields, when it reports any
   */
  private getRunStage(response: SocietyWideCalculationResponse): RunStage | undefined {
    const runStage: RunStage = {};
    if (typeof response.stage === 'string') {
      runStage.stage = response.stage;
    }
    if (typeof response.progress === 'number' && typeof response.progress_max === 'number') {
      runStage.floor = response.progress;
      runStage.max = Math.max(response.progress, response.progress_max);
    }
    if (response.segments) {
      runStage.segments = response.segments;
    }
    return Object.keys(runStage).length > 0 ? runStage : undefined;
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
   * Get estimated duration for society-wide calculations based on country,
   * or on country and region when the caller opts in
   * Uses shared constants from calculationDurations
   */
  private getEstimatedDuration(countryId?: string, estimate: DurationEstimateOptions = {}): number {
    return estimate.estimateByRegion
      ? getDurationForRegion(countryId || 'us', estimate.region)
      : getDurationForCountry(countryId || 'us');
  }
}
