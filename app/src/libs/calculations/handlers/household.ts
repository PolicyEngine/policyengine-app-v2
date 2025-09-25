import { CalculationHandler } from './base';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '../status';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { Household } from '@/types/ingredients/Household';

export class HouseholdCalculationHandler extends CalculationHandler {
  // Store by reportId, just like economy calculations are cached
  private pendingCalculations = new Map<string, {
    promise: Promise<Household>;
    meta: CalculationMeta; // Store metadata for the calculation
    startTime: number;
    estimatedDuration: number;
    completed: boolean;
    result?: Household;
    error?: Error;
  }>();

  async fetch(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    // Check if we have a pending calculation with matching metadata
    // This is needed because fetch() doesn't get the reportId
    for (const [, pending] of this.pendingCalculations) {
      // Check if this pending calculation matches the requested metadata
      if (this.metadataMatches(pending.meta, meta)) {
        // Found a matching calculation, return its status
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

        // Still running, return synthetic progress
        const elapsed = Date.now() - pending.startTime;
        const progress = Math.min((elapsed / pending.estimatedDuration) * 100, 95);

        return {
          status: 'computing',
          progress,
          message: this.getProgressMessage(progress),
          estimatedTimeRemaining: Math.max(0, pending.estimatedDuration - elapsed)
        };
      }
    }

    // No pending calculation found, trigger a new one
    // This mirrors economy calculations which always fetch from the API
    const promise = fetchHouseholdCalculation(
      meta.countryId,
      meta.populationId,
      meta.policyIds.reform || meta.policyIds.baseline
    );

    // Return the promise result directly (no progress tracking without reportId)
    return promise.then(
      result => ({ status: 'ok' as const, result }),
      error => ({ status: 'error' as const, error: error.message })
    );
  }

  private metadataMatches(meta1: CalculationMeta, meta2: CalculationMeta): boolean {
    const policy1 = meta1.policyIds.reform || meta1.policyIds.baseline;
    const policy2 = meta2.policyIds.reform || meta2.policyIds.baseline;

    return meta1.countryId === meta2.countryId &&
           meta1.populationId === meta2.populationId &&
           policy1 === policy2;
  }

  getStatus(reportId: string): CalculationStatusResponse | null {
    // Look up by reportId, just like cache keys work
    const pending = this.pendingCalculations.get(reportId);

    if (!pending) {
      return null;
    }

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

  async startCalculation(reportId: string, meta: CalculationMeta): Promise<void> {
    // Use CalculationMeta to configure the fetch, just like economy calculations
    const promise = fetchHouseholdCalculation(
      meta.countryId,
      meta.populationId,
      meta.policyIds.reform || meta.policyIds.baseline
    );

    const pending = {
      promise,
      meta, // Store the metadata
      startTime: Date.now(),
      estimatedDuration: 25000, // 25 seconds average
      completed: false,
      result: undefined as Household | undefined,
      error: undefined as Error | undefined
    };

    // Store by reportId, matching the cache key pattern
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