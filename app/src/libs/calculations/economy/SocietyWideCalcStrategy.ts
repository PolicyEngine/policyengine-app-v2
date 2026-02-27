import { Query } from '@tanstack/react-query';
import { getDatasetIdForRegion } from '@/api/societyWideCalculation';
import {
  createEconomyAnalysis,
  EconomicImpactRequest,
  getEconomyAnalysis,
  ReportStatus,
} from '@/api/v2/economyAnalysis';
import { getDurationForCountry } from '@/constants/calculationDurations';
import { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { CalcExecutionStrategy, RefetchConfig } from '../strategies/types';

/**
 * Strategy for executing society-wide calculations using v2 API
 *
 * Uses async job pattern:
 * 1. First execute() call: POST /analysis/economic-impact -> returns report_id
 * 2. Subsequent execute() calls: GET /analysis/economic-impact/{report_id} -> poll status
 *
 * Integrates with CalcOrchestrator's polling infrastructure for real-time progress.
 */
export class SocietyWideCalcStrategy implements CalcExecutionStrategy {
  /**
   * Maximum consecutive poll errors before failing the calculation
   */
  private static readonly MAX_CONSECUTIVE_ERRORS = 3;

  /**
   * Registry mapping calcId -> report_id for tracking active analyses
   */
  private jobRegistry = new Map<string, string>();

  /**
   * Tracks consecutive poll errors per calcId
   */
  private errorCounts = new Map<string, number>();

  /**
   * Execute a society-wide calculation
   *
   * On first call: Creates an economy analysis job and returns pending status
   * On subsequent calls: Polls job status and returns current state
   */
  async execute(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    const calcId = metadata.calcId;
    const reportId = this.jobRegistry.get(calcId);

    if (!reportId) {
      return this.createJob(params, metadata);
    }

    return this.checkJobStatus(reportId, params, metadata);
  }

  /**
   * Create a new economy analysis job
   */
  private async createJob(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    try {
      const region = params.region || params.countryId;
      const datasetId = await getDatasetIdForRegion(params.countryId, region);

      const request: EconomicImpactRequest = {
        tax_benefit_model_name: `policyengine_${params.countryId}`,
        region,
        policy_id: params.policyIds.reform ?? params.policyIds.baseline ?? null,
        dataset_id: datasetId,
      };

      const response = await createEconomyAnalysis(request);

      // Store report_id for polling
      this.jobRegistry.set(calcId, response.report_id);

      return {
        status: 'pending',
        progress: 0,
        message: 'Starting economy analysis...',
        metadata,
      };
    } catch (error) {
      this.jobRegistry.delete(calcId);
      console.error('[SocietyWideCalcStrategy.createJob] Failed to create job:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create economy analysis job';
      return {
        status: 'error',
        error: {
          code: 'ECONOMY_ANALYSIS_FAILED',
          message: errorMessage,
          retryable: true,
        },
        metadata,
      };
    }
  }

  /**
   * Check the status of an existing economy analysis job
   */
  private async checkJobStatus(
    reportId: string,
    params: CalcParams,
    metadata: CalcMetadata
  ): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    try {
      const response = await getEconomyAnalysis(reportId);

      // Reset error count on successful poll
      this.errorCounts.delete(calcId);

      if (response.status === 'completed') {
        this.cleanupCalc(calcId);

        return {
          status: 'complete',
          result: response,
          metadata,
        };
      }

      if (response.status === 'failed') {
        this.cleanupCalc(calcId);

        return {
          status: 'error',
          error: {
            code: 'ECONOMY_ANALYSIS_FAILED',
            message: response.error_message || 'Economy analysis failed',
            retryable: true,
          },
          metadata,
        };
      }

      // Still running (pending or running)
      const elapsed = Date.now() - metadata.startedAt;
      const estimatedDuration = getDurationForCountry(params.countryId);
      const progress = Math.min((elapsed / estimatedDuration) * 100, 95);

      return {
        status: 'pending',
        progress,
        message: this.getStatusMessage(response.status),
        metadata,
      };
    } catch (error) {
      const errorCount = (this.errorCounts.get(calcId) || 0) + 1;
      this.errorCounts.set(calcId, errorCount);

      console.error(
        `[SocietyWideCalcStrategy.checkJobStatus] Poll error (${errorCount}/${SocietyWideCalcStrategy.MAX_CONSECUTIVE_ERRORS}):`,
        error
      );

      if (errorCount >= SocietyWideCalcStrategy.MAX_CONSECUTIVE_ERRORS) {
        this.cleanupCalc(calcId);

        const errorMessage =
          error instanceof Error ? error.message : 'Failed to check analysis status';
        return {
          status: 'error',
          error: {
            code: 'POLL_FAILED',
            message: `Analysis status check failed after ${errorCount} attempts: ${errorMessage}`,
            retryable: true,
          },
          metadata,
        };
      }

      // Under threshold — return pending to retry on next poll
      const elapsed = Date.now() - metadata.startedAt;
      const estimatedDuration = getDurationForCountry(params.countryId);
      const progress = Math.min((elapsed / estimatedDuration) * 100, 95);

      return {
        status: 'pending',
        progress,
        message: 'Retrying status check...',
        metadata,
      };
    }
  }

  /**
   * Clean up all tracking state for a calculation
   */
  private cleanupCalc(calcId: string): void {
    this.jobRegistry.delete(calcId);
    this.errorCounts.delete(calcId);
  }

  /**
   * Get human-readable message for v2 API job status
   */
  private getStatusMessage(status: ReportStatus): string {
    switch (status) {
      case 'pending':
        return 'Waiting in queue...';
      case 'running':
        return 'Running economy analysis...';
      default:
        return 'Processing...';
    }
  }

  /**
   * Get refetch configuration for economy calculations
   * Polls every 1 second while pending, stops when complete/error
   */
  getRefetchConfig(): RefetchConfig {
    return {
      refetchInterval: (query: Query) => {
        const data = query.state.data as CalcStatus | undefined;
        return data?.status === 'pending' ? 1000 : false;
      },
      staleTime: Infinity,
    };
  }

  /**
   * Transform API response to unified CalcStatus
   * Kept for interface compatibility
   */
  transformResponse(apiResponse: unknown): CalcStatus {
    return {
      status: 'complete',
      result: apiResponse as any,
      metadata: {
        calcId: '',
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
  }

  /**
   * Clean up a calculation from the job registry
   * Called when orchestrator cancels/cleans up a calculation
   */
  cleanupJob(calcId: string): void {
    this.cleanupCalc(calcId);
  }

  /**
   * Check if a calculation has an active job
   */
  hasActiveJob(calcId: string): boolean {
    return this.jobRegistry.has(calcId);
  }
}
