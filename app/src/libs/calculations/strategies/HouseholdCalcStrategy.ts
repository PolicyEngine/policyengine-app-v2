import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { CalcParams, CalcStatus } from '@/types/calculation';
import { ProgressTracker } from '../ProgressTracker';
import { CalcExecutionStrategy, RefetchConfig } from './types';

/**
 * Strategy for executing household calculations
 * Uses synthetic progress tracking for long-running operations
 */
export class HouseholdCalcStrategy implements CalcExecutionStrategy {
  private progressTracker: ProgressTracker;

  constructor(progressTracker?: ProgressTracker) {
    this.progressTracker = progressTracker || new ProgressTracker();
  }

  /**
   * Execute a household calculation
   * Returns immediately with computing status, tracks progress synthetically
   */
  async execute(params: CalcParams): Promise<CalcStatus> {
    console.log('[HouseholdCalcStrategy.execute] Starting with params:', params);

    // Use calcId from params if available (will be set by orchestrator)
    const calcId = (params as any).calcId || 'temp-household-calc';

    // Check if already active
    if (this.progressTracker.isActive(calcId)) {
      console.log('[HouseholdCalcStrategy.execute] Calculation already active, returning progress');
      const progress = this.progressTracker.getProgress(calcId);

      if (progress) {
        return {
          status: 'computing',
          progress: progress.progress,
          message: progress.message,
          estimatedTimeRemaining: progress.estimatedTimeRemaining,
          metadata: {
            calcId,
            calcType: 'household',
            targetType: 'report',
            startedAt: Date.now(),
          },
        };
      }
    }

    // Start new calculation
    console.log('[HouseholdCalcStrategy.execute] Starting new calculation');

    const policyId = params.policyIds.reform || params.policyIds.baseline;
    const promise = fetchHouseholdCalculation(
      params.countryId,
      params.populationId,
      policyId
    );

    // Register with progress tracker
    this.progressTracker.register(calcId, promise, 60000); // 60 second estimate

    // Return initial computing status
    return {
      status: 'computing',
      progress: 0,
      message: 'Initializing calculation...',
      estimatedTimeRemaining: 60000,
      metadata: {
        calcId,
        calcType: 'household',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
  }

  /**
   * Get refetch configuration for household calculations
   * Refetches every 500ms to update synthetic progress
   */
  getRefetchConfig(): RefetchConfig {
    return {
      refetchInterval: 500, // Update progress every 500ms
      staleTime: Infinity,
    };
  }

  /**
   * Transform household API response to unified CalcStatus
   * Note: Household calculations return data directly, not a status object
   */
  transformResponse(apiResponse: unknown): CalcStatus {
    // Household API returns HouseholdData directly on success
    // This method is used when we need to wrap a completed result
    return {
      status: 'complete',
      result: apiResponse as any, // HouseholdData type
      metadata: {
        calcId: '',
        calcType: 'household',
        targetType: 'report',
        startedAt: Date.now(),
      },
    };
  }

  /**
   * Get the progress tracker instance
   * Useful for testing and external progress monitoring
   */
  getProgressTracker(): ProgressTracker {
    return this.progressTracker;
  }
}
