import { CalculationHandler } from './base';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '../status';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { Household } from '@/types/ingredients/Household';

export class HouseholdCalculationHandler extends CalculationHandler {
  private pendingCalculations = new Map<string, {
    promise: Promise<Household>;
    startTime: number;
    estimatedDuration: number;
    completed: boolean;
    result?: Household;
    error?: Error;
  }>();

  async fetch(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    // Check if we have a pending calculation
    const pending = this.pendingCalculations.get(meta.populationId);

    if (pending) {
      if (pending.completed) {
        if (pending.error) {
          return {
            status: 'error',
            error: pending.error.message
          };
        }
        return {
          status: 'ok',
          result: pending.result
        };
      }

      // Return synthetic progress
      const elapsed = Date.now() - pending.startTime;
      const progress = Math.min((elapsed / pending.estimatedDuration) * 100, 95);

      return {
        status: 'computing',
        progress,
        message: this.getProgressMessage(progress),
        estimatedTimeRemaining: Math.max(0, pending.estimatedDuration - elapsed)
      };
    }

    // If no pending calculation, it hasn't been started
    throw new Error('Household calculation not started');
  }

  getStatus(reportId: string): CalculationStatusResponse | null {
    // Find pending calculation by report ID
    for (const [_, pending] of this.pendingCalculations) {
      // Match by some identifier
      if (pending.completed) {
        if (pending.error) {
          return {
            status: 'error',
            error: pending.error.message
          };
        }
        return {
          status: 'ok',
          result: pending.result
        };
      }

      const elapsed = Date.now() - pending.startTime;
      const progress = Math.min((elapsed / pending.estimatedDuration) * 100, 95);

      return {
        status: 'computing',
        progress,
        message: this.getProgressMessage(progress),
        estimatedTimeRemaining: Math.max(0, pending.estimatedDuration - elapsed)
      };
    }

    return null;
  }

  async startCalculation(reportId: string, meta: CalculationMeta): Promise<void> {
    const promise = fetchHouseholdCalculation(
      meta.countryId,
      meta.populationId,
      meta.policyIds.reform || meta.policyIds.baseline
    );

    const pending = {
      promise,
      startTime: Date.now(),
      estimatedDuration: 25000, // 25 seconds average
      completed: false,
      result: undefined as Household | undefined,
      error: undefined as Error | undefined
    };

    this.pendingCalculations.set(reportId, pending);

    // Handle completion
    promise
      .then(result => {
        pending.completed = true;
        pending.result = result;
        // Update cache with final result
        this.queryClient.setQueryData(
          this.getCacheKey(reportId),
          { status: 'ok', result } as CalculationStatusResponse
        );
      })
      .catch(error => {
        pending.completed = true;
        pending.error = error;
        this.queryClient.setQueryData(
          this.getCacheKey(reportId),
          { status: 'error', error: error.message } as CalculationStatusResponse
        );
      })
      .finally(() => {
        // Clean up after a delay
        setTimeout(() => this.pendingCalculations.delete(reportId), 5000);
      });
  }

  private getProgressMessage(progress: number): string {
    if (progress < 10) return 'Initializing calculation...';
    if (progress < 30) return 'Loading household data...';
    if (progress < 60) return 'Running policy simulation...';
    if (progress < 80) return 'Calculating impacts...';
    return 'Finalizing results...';
  }
}