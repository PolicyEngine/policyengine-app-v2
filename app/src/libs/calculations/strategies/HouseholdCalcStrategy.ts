import { Query } from '@tanstack/react-query';
import {
  createHouseholdAnalysis,
  getHouseholdAnalysis,
  HouseholdImpactRequest,
  HouseholdReportStatus,
} from '@/api/v2/householdAnalysis';
import { HOUSEHOLD_DURATION_MS } from '@/constants/calculationDurations';
import { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { CalcExecutionStrategy, RefetchConfig } from './types';

/**
 * Strategy for executing household calculations using v2 analysis API
 *
 * Uses async job pattern:
 * 1. First execute() call: POST /analysis/household-impact -> returns report_id
 * 2. Subsequent execute() calls: GET /analysis/household-impact/{report_id} -> poll status
 *
 * The analysis endpoint runs both baseline and reform simulations server-side
 * and returns the full comparison (baseline_result, reform_result, impact).
 */
export class HouseholdCalcStrategy implements CalcExecutionStrategy {
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
   * Execute a household calculation
   *
   * On first call: Creates a household analysis job and returns pending status
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
   * Create a new household analysis job
   */
  private async createJob(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    try {
      const request: HouseholdImpactRequest = {
        household_id: params.populationId,
        policy_id: params.policyIds.reform ?? params.policyIds.baseline ?? null,
      };

      const response = await createHouseholdAnalysis(request);

      // Store report_id for polling
      this.jobRegistry.set(calcId, response.report_id);

      return {
        status: 'pending',
        progress: 0,
        message: 'Starting household analysis...',
        metadata,
      };
    } catch (error) {
      this.jobRegistry.delete(calcId);
      console.error('[HouseholdCalcStrategy.createJob] Failed to create job:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create household analysis job';
      return {
        status: 'error',
        error: {
          code: 'HOUSEHOLD_ANALYSIS_FAILED',
          message: errorMessage,
          retryable: true,
        },
        metadata,
      };
    }
  }

  /**
   * Check the status of an existing household analysis job
   */
  private async checkJobStatus(
    reportId: string,
    _params: CalcParams,
    metadata: CalcMetadata
  ): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    try {
      const response = await getHouseholdAnalysis(reportId);

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
            code: 'HOUSEHOLD_ANALYSIS_FAILED',
            message: response.error_message || 'Household analysis failed',
            retryable: true,
          },
          metadata,
        };
      }

      // Still running (pending or running)
      const elapsed = Date.now() - metadata.startedAt;
      const progress = Math.min((elapsed / HOUSEHOLD_DURATION_MS) * 100, 95);

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
        `[HouseholdCalcStrategy.checkJobStatus] Poll error (${errorCount}/${HouseholdCalcStrategy.MAX_CONSECUTIVE_ERRORS}):`,
        error
      );

      if (errorCount >= HouseholdCalcStrategy.MAX_CONSECUTIVE_ERRORS) {
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
      const progress = Math.min((elapsed / HOUSEHOLD_DURATION_MS) * 100, 95);

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
  private getStatusMessage(status: HouseholdReportStatus): string {
    switch (status) {
      case 'pending':
        return 'Waiting in queue...';
      case 'running':
        return 'Running household analysis...';
      default:
        return 'Processing...';
    }
  }

  /**
   * Get refetch configuration for household calculations
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
        calcType: 'household',
        targetType: 'simulation',
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
