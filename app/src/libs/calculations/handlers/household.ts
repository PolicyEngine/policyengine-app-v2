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
    progressInterval?: NodeJS.Timeout; // Track the interval for cleanup
  }>();

  async fetch(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    // Since we're using cache updates for progress, fetch should only be called once
    // by the query, then progress is updated via cache. This method should just
    // return the current state from the pending calculation if it exists.

    // Check if we have a pending calculation with matching metadata
    for (const [, pending] of this.pendingCalculations) {
      // Check if this pending calculation matches the requested metadata
      if (this.metadataMatches(pending.meta, meta)) {
        console.log('[HouseholdCalculationHandler.fetch] Found matching pending calculation for metadata');

        // Found a matching calculation, return its current status
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

        // Still running, return current synthetic progress
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

    console.log('[HouseholdCalculationHandler.fetch] No pending calculation found for metadata');

    // No pending calculation found - this shouldn't happen if startCalculation was called
    // Return a starting state
    return {
      status: 'computing',
      progress: 0,
      message: 'Initializing calculation...',
      estimatedTimeRemaining: 60000 // Equivalent to one minute
    };
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
    // Check if calculation is already in progress for this reportId
    if (this.pendingCalculations.has(reportId)) {
      console.log('[HouseholdCalculationHandler.startCalculation] Calculation already in progress for:', reportId);
      return; // Don't start a duplicate calculation
    }

    console.log('[HouseholdCalculationHandler.startCalculation] Starting new calculation for:', reportId);

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
      estimatedDuration: 60000, // 60 seconds average
      completed: false,
      result: undefined as Household | undefined,
      error: undefined as Error | undefined,
      progressInterval: undefined as NodeJS.Timeout | undefined
    };

    // Store by reportId, matching the cache key pattern
    this.pendingCalculations.set(reportId, pending);

    // Start synthetic progress updates via cache
    const progressInterval = setInterval(() => {
      const currentPending = this.pendingCalculations.get(reportId);
      if (!currentPending || currentPending.completed) {
        // Stop updates if completed or removed
        clearInterval(progressInterval);
        return;
      }

      // Calculate synthetic progress
      const elapsed = Date.now() - currentPending.startTime;
      const progress = Math.min((elapsed / currentPending.estimatedDuration) * 100, 95);

      // Update the cache directly with synthetic progress
      this.queryClient.setQueryData(
        this.getCacheKey(reportId),
        {
          status: 'computing',
          progress,
          message: this.getProgressMessage(progress),
          estimatedTimeRemaining: Math.max(0, currentPending.estimatedDuration - elapsed)
        } as CalculationStatusResponse
      );
    }, 500); // Update every 500ms

    // Store the interval reference for cleanup
    pending.progressInterval = progressInterval;

    // Handle completion
    promise
      .then(result => {
        console.log('[HouseholdCalculationHandler.startCalculation] Calculation completed successfully for:', reportId);
        pending.completed = true;
        pending.result = result;

        // Clear the progress interval
        if (pending.progressInterval) {
          clearInterval(pending.progressInterval);
        }

        // Update cache with final result
        this.queryClient.setQueryData(
          this.getCacheKey(reportId),
          { status: 'ok', result } as CalculationStatusResponse
        );
      })
      .catch(error => {
        console.log('[HouseholdCalculationHandler.startCalculation] Calculation failed for:', reportId, error);
        pending.completed = true;
        pending.error = error;

        // Clear the progress interval
        if (pending.progressInterval) {
          clearInterval(pending.progressInterval);
        }

        this.queryClient.setQueryData(
          this.getCacheKey(reportId),
          { status: 'error', error: error.message } as CalculationStatusResponse
        );
      })
      .finally(() => {
        // Clean up after a delay
        setTimeout(() => {
          const pendingToClean = this.pendingCalculations.get(reportId);
          if (pendingToClean?.progressInterval) {
            clearInterval(pendingToClean.progressInterval);
          }
          this.pendingCalculations.delete(reportId);
        }, 5000);
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