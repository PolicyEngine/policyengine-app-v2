import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { CalculationMeta } from '@/api/reportCalculations';
import { Household } from '@/types/ingredients/Household';
import { CalculationStatusResponse } from '../status';

/**
 * HouseholdCalculationHandler manages household calculation execution
 * without touching cache or database. Pure execution and status tracking.
 */
export class HouseholdCalculationHandler {
  // Track active calculations by reportId
  private activeCalculations = new Map<
    string,
    {
      promise: Promise<Household>;
      startTime: number;
      estimatedDuration: number;
      completed: boolean;
      result?: Household;
      error?: Error;
    }
  >();

  /**
   * Execute a household calculation or return existing status
   * Pure execution - no cache or database updates
   * @param reportId - The report ID
   * @param meta - The calculation metadata
   * @param onComplete - Optional callback when calculation completes
   */
  async execute(
    reportId: string,
    meta: CalculationMeta,
    onComplete?: (reportId: string, status: 'ok' | 'error', result?: any) => Promise<void>
  ): Promise<CalculationStatusResponse> {
    const active = this.activeCalculations.get(reportId);

    if (active) {
      // Return current status without creating new calculation
      if (active.completed) {
        if (active.error) {
          return {
            status: 'error',
            error: active.error.message,
          };
        }
        return {
          status: 'ok',
          result: active.result,
        };
      }

      // Calculate synthetic progress
      const elapsed = Date.now() - active.startTime;
      const progress = Math.min((elapsed / active.estimatedDuration) * 100, 95);

      return {
        status: 'computing',
        progress,
        message: this.getProgressMessage(progress),
        estimatedTimeRemaining: Math.max(0, active.estimatedDuration - elapsed),
      };
    }

    console.log('[HouseholdCalculationHandler.execute] Starting new calculation for:', reportId);

    // Start new calculation
    const promise = fetchHouseholdCalculation(
      meta.countryId,
      meta.populationId,
      meta.policyIds.reform || meta.policyIds.baseline
    );

    const tracking = {
      promise,
      startTime: Date.now(),
      estimatedDuration: 60000, // 60 seconds average
      completed: false,
      result: undefined as Household | undefined,
      error: undefined as Error | undefined,
    };

    this.activeCalculations.set(reportId, tracking);

    // Handle completion and notify via callback
    promise
      .then(async (result) => {
        console.log('[HouseholdCalculationHandler] Calculation completed successfully for:', reportId);
        tracking.completed = true;
        tracking.result = result;

        // Notify completion via callback
        if (onComplete) {
          try {
            await onComplete(reportId, 'ok', result);
          } catch (error) {
            console.error('[HouseholdCalculationHandler] Completion callback failed:', error);
          }
        }

        // Clean up after a delay
        setTimeout(() => {
          this.activeCalculations.delete(reportId);
        }, 5000);
      })
      .catch(async (error) => {
        console.log('[HouseholdCalculationHandler] Calculation failed for:', reportId, error);
        tracking.completed = true;
        tracking.error = error;

        // Notify error via callback
        if (onComplete) {
          try {
            await onComplete(reportId, 'error', undefined);
          } catch (callbackError) {
            console.error('[HouseholdCalculationHandler] Completion callback failed:', callbackError);
          }
        }

        // Clean up after a delay
        setTimeout(() => {
          this.activeCalculations.delete(reportId);
        }, 5000);
      });

    // Return initial status
    return {
      status: 'computing',
      progress: 0,
      message: 'Initializing calculation...',
      estimatedTimeRemaining: 60000,
    };
  }

  /**
   * Get current status of a calculation without side effects
   */
  getStatus(reportId: string): CalculationStatusResponse | null {
    const active = this.activeCalculations.get(reportId);

    if (!active) {
      return null;
    }

    if (active.completed) {
      if (active.error) {
        return {
          status: 'error',
          error: active.error.message,
        };
      }
      return {
        status: 'ok',
        result: active.result,
      };
    }

    // Return synthetic progress
    const elapsed = Date.now() - active.startTime;
    const progress = Math.min((elapsed / active.estimatedDuration) * 100, 95);

    return {
      status: 'computing',
      progress,
      message: this.getProgressMessage(progress),
      estimatedTimeRemaining: Math.max(0, active.estimatedDuration - elapsed),
    };
  }

  /**
   * Check if a calculation is active for a given reportId
   */
  isActive(reportId: string): boolean {
    return this.activeCalculations.has(reportId);
  }

  private getProgressMessage(progress: number): string {
    if (progress < 10) {
      return 'Initializing calculation...';
    }
    if (progress < 30) {
      return 'Loading household data...';
    }
    if (progress < 60) {
      return 'Running policy simulation...';
    }
    if (progress < 80) {
      return 'Calculating impacts...';
    }
    return 'Finalizing results...';
  }
}
