import { Query } from '@tanstack/react-query';
import {
  calculationResultToHousehold,
  createHouseholdCalculationJobV2,
  getHouseholdCalculationJobStatusV2,
} from '@/api/v2/householdCalculation';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import { HOUSEHOLD_DURATION_MS } from '@/constants/calculationDurations';
import { CalcMetadata, CalcParams, CalcStatus } from '@/types/calculation';
import { TaxBenefitModelName } from '@/types/ingredients/Household';
import { householdToCalculatePayload } from '@/types/payloads';
import { CalcExecutionStrategy, RefetchConfig } from './types';

/**
 * Strategy for executing household calculations using v2 alpha API
 *
 * Uses async job pattern similar to society-wide calculations:
 * 1. First execute() call: Fetch household → Create job → Return pending
 * 2. Subsequent execute() calls: Check job status → Return pending/complete/error
 *
 * This integrates with CalcOrchestrator's polling infrastructure to provide
 * real-time progress updates during calculation.
 */
export class HouseholdCalcStrategy implements CalcExecutionStrategy {
  /**
   * Maximum consecutive poll errors before failing the calculation
   * Allows resilience to transient network issues while preventing infinite polling
   */
  private static readonly MAX_CONSECUTIVE_ERRORS = 3;

  /**
   * Registry mapping calcId → jobId for tracking active calculations
   * Enables polling without storing job_id in query cache
   */
  private jobRegistry = new Map<string, string>();

  /**
   * Tracks consecutive poll errors per calcId
   * Reset on successful poll, incremented on error
   */
  private errorCounts = new Map<string, number>();

  /**
   * Execute a household calculation
   *
   * On first call: Creates a calculation job and returns pending status
   * On subsequent calls: Polls job status and returns current state
   */
  async execute(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    // Check if we already have a job for this calculation
    const jobId = this.jobRegistry.get(calcId);

    if (!jobId) {
      // First call - create the job
      return this.createJob(params, metadata);
    }

    // Subsequent call - check job status
    return this.checkJobStatus(jobId, params, metadata);
  }

  /**
   * Create a new calculation job
   */
  private async createJob(params: CalcParams, metadata: CalcMetadata): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    try {
      // Fetch the household definition
      const household = await fetchHouseholdByIdV2(params.populationId);
      const policyId = params.policyIds.reform || params.policyIds.baseline;

      // Create calculation payload and job
      const payload = householdToCalculatePayload(household, policyId);
      const job = await createHouseholdCalculationJobV2(payload);

      // Store job ID for polling
      this.jobRegistry.set(calcId, job.job_id);

      // Return pending status
      return {
        status: 'pending',
        progress: 0,
        message: 'Starting household calculation...',
        metadata,
      };
    } catch (error) {
      // Clean up on error
      this.jobRegistry.delete(calcId);
      console.error('[HouseholdCalcStrategy.createJob] Failed to create job:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to create calculation job';
      return {
        status: 'error',
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: errorMessage,
          retryable: true,
        },
        metadata,
      };
    }
  }

  /**
   * Check the status of an existing calculation job
   */
  private async checkJobStatus(
    jobId: string,
    params: CalcParams,
    metadata: CalcMetadata
  ): Promise<CalcStatus> {
    const calcId = metadata.calcId;

    try {
      const jobStatus = await getHouseholdCalculationJobStatusV2(jobId);

      // Reset error count on successful poll
      this.errorCounts.delete(calcId);

      if (jobStatus.status === 'COMPLETED') {
        // Clean up all tracking state
        this.cleanupCalc(calcId);

        // Convert result to Household format
        const modelName = this.countryIdToModelName(params.countryId);
        const year = parseInt(params.year, 10);
        const result = calculationResultToHousehold(jobStatus.result!, {
          tax_benefit_model_name: modelName,
          year,
          people: [], // Will be replaced by result
        });

        return {
          status: 'complete',
          result,
          metadata,
        };
      }

      if (jobStatus.status === 'FAILED') {
        this.cleanupCalc(calcId);

        return {
          status: 'error',
          error: {
            code: 'HOUSEHOLD_CALC_FAILED',
            message: jobStatus.error_message || 'Calculation failed',
            retryable: true,
          },
          metadata,
        };
      }

      // Still running (PENDING or RUNNING)
      const elapsed = Date.now() - metadata.startedAt;
      const progress = Math.min((elapsed / HOUSEHOLD_DURATION_MS) * 100, 95);
      const message = this.getStatusMessage(jobStatus.status);

      return {
        status: 'pending',
        progress,
        message,
        metadata,
      };
    } catch (error) {
      // Track consecutive errors
      const errorCount = (this.errorCounts.get(calcId) || 0) + 1;
      this.errorCounts.set(calcId, errorCount);

      console.error(
        `[HouseholdCalcStrategy.checkJobStatus] Poll error (${errorCount}/${HouseholdCalcStrategy.MAX_CONSECUTIVE_ERRORS}):`,
        error
      );

      // After too many consecutive errors, fail the calculation
      if (errorCount >= HouseholdCalcStrategy.MAX_CONSECUTIVE_ERRORS) {
        this.cleanupCalc(calcId);

        const errorMessage = error instanceof Error ? error.message : 'Failed to check calculation status';
        return {
          status: 'error',
          error: {
            code: 'POLL_FAILED',
            message: `Calculation status check failed after ${errorCount} attempts: ${errorMessage}`,
            retryable: true,
          },
          metadata,
        };
      }

      // Still under threshold - return pending to retry on next poll
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
   * Get human-readable message for job status
   */
  private getStatusMessage(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Waiting in queue...';
      case 'RUNNING':
        return 'Running household calculation...';
      default:
        return 'Processing...';
    }
  }

  /**
   * Convert country ID to tax benefit model name
   */
  private countryIdToModelName(countryId: string): TaxBenefitModelName {
    return `policyengine_${countryId}` as TaxBenefitModelName;
  }

  /**
   * Get refetch configuration for household calculations
   *
   * Polls every 1 second while pending, stops when complete/error
   * Matches the society-wide calculation polling pattern
   */
  getRefetchConfig(): RefetchConfig {
    return {
      refetchInterval: (query: Query) => {
        const data = query.state.data as CalcStatus | undefined;
        // Continue polling only if status is pending
        return data?.status === 'pending' ? 1000 : false;
      },
      staleTime: Infinity, // Results don't go stale
    };
  }

  /**
   * Transform household API response to unified CalcStatus
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
