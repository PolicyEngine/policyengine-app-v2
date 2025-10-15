import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { CalculationMeta } from '@/api/reportCalculations';
import { HouseholdData } from '@/types/ingredients/Household';
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
      promise: Promise<HouseholdData>;
      startTime: number;
      estimatedDuration: number;
      completed: boolean;
      result?: HouseholdData;
      error?: Error;
    }
  >();

  /**
   * Execute a SINGLE household calculation
   * @param trackingKey - Unique key for tracking this calculation
   * @param simulationId - The simulation ID
   * @param policyId - The policy ID to use for calculation
   * @param meta - The calculation metadata
   * @param onSimulationComplete - Optional callback when this simulation completes
   */
  private async executeSingleSimulation(
    trackingKey: string,
    simulationId: string,
    policyId: string,
    meta: CalculationMeta,
    onSimulationComplete?: (
      simulationId: string,
      result: HouseholdData,
      policyId: string
    ) => Promise<void>
  ): Promise<CalculationStatusResponse> {
    const active = this.activeCalculations.get(trackingKey);

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

    console.log(
      '[HouseholdCalculationHandler.executeSingleSimulation] Starting new calculation for:',
      trackingKey
    );

    // Start new calculation
    const promise = fetchHouseholdCalculation(meta.countryId, meta.populationId, policyId);

    const tracking = {
      promise,
      startTime: Date.now(),
      estimatedDuration: 60000, // 60 seconds average
      completed: false,
      result: undefined as HouseholdData | undefined,
      error: undefined as Error | undefined,
    };

    this.activeCalculations.set(trackingKey, tracking);

    // Handle completion and notify via callback
    promise
      .then(async (result) => {
        console.log(
          '[HouseholdCalculationHandler] Calculation completed successfully for:',
          trackingKey
        );
        tracking.completed = true;
        tracking.result = result;

        // Call simulation completion callback
        console.log(
          '[DEBUG] onSimulationComplete defined?',
          !!onSimulationComplete,
          'for simId:',
          simulationId
        );
        if (onSimulationComplete) {
          try {
            console.log('[DEBUG] Calling onSimulationComplete for simId:', simulationId);
            await onSimulationComplete(simulationId, result, policyId);
            console.log('[DEBUG] onSimulationComplete completed for simId:', simulationId);
          } catch (error) {
            console.error('[HouseholdCalculationHandler] Simulation callback failed:', error);
          }
        } else {
          console.warn('[DEBUG] onSimulationComplete is undefined for simId:', simulationId);
        }

        // Clean up after a delay
        setTimeout(() => {
          this.activeCalculations.delete(trackingKey);
        }, 5000);
      })
      .catch(async (error) => {
        console.log('[HouseholdCalculationHandler] Calculation failed for:', trackingKey, error);
        tracking.completed = true;
        tracking.error = error;

        // Clean up after a delay
        setTimeout(() => {
          this.activeCalculations.delete(trackingKey);
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
   * Execute household calculation(s) for a report
   * Loops through all simulations and calls executeSingleSimulation for each
   * @param reportId - The report ID
   * @param meta - The calculation metadata
   * @param callbacks - Optional callbacks for completion events
   */
  async execute(
    reportId: string,
    meta: CalculationMeta,
    callbacks?: {
      onComplete?: (reportId: string, status: 'ok' | 'error', result?: any) => Promise<void>;
      onSimulationComplete?: (
        simulationId: string,
        result: HouseholdData,
        policyId: string
      ) => Promise<void>;
    }
  ): Promise<CalculationStatusResponse> {
    // Check if any simulations are already running or completed
    const simulationKeys = meta.simulationIds.map((id) => `${reportId}-sim-${id}`);
    const activeSimulations = simulationKeys
      .map((key) => this.activeCalculations.get(key))
      .filter(Boolean);

    // If we have active simulations, check their status
    if (activeSimulations.length > 0) {
      const allCompleted = activeSimulations.every((sim) => sim?.completed);
      const anyError = activeSimulations.some((sim) => sim?.error);

      if (allCompleted) {
        if (anyError) {
          const error = activeSimulations.find((sim) => sim?.error)?.error;
          return {
            status: 'error',
            error: error?.message || 'Calculation failed',
          };
        }
        // All completed successfully
        return {
          status: 'ok',
          result: null,
        };
      }

      // Still computing - return aggregated progress
      const totalProgress = activeSimulations.reduce((sum, sim) => {
        if (!sim || sim.completed) {
          return sum + 100;
        }
        const elapsed = Date.now() - sim.startTime;
        return sum + Math.min((elapsed / sim.estimatedDuration) * 100, 95);
      }, 0);
      const avgProgress = totalProgress / meta.simulationIds.length;

      return {
        status: 'computing',
        progress: avgProgress,
        message: this.getProgressMessage(avgProgress),
        estimatedTimeRemaining: Math.max(
          ...activeSimulations.map((sim) =>
            sim && !sim.completed
              ? Math.max(0, sim.estimatedDuration - (Date.now() - sim.startTime))
              : 0
          )
        ),
      };
    }

    // No active simulations - start new ones
    console.log('[HouseholdCalculationHandler.execute] Starting calculations for:', reportId);

    // Track when we initiate report-level completion callback
    let reportCompletionCalled = false;

    // Start all simulations
    for (let index = 0; index < meta.simulationIds.length; index++) {
      const simulationId = meta.simulationIds[index];
      const policyId = index === 0 ? meta.policyIds.baseline : meta.policyIds.reform;

      if (!policyId) {
        continue;
      }

      const singleSimMeta: CalculationMeta = {
        ...meta,
        policyIds: { baseline: policyId, reform: undefined },
        simulationIds: [simulationId],
      };

      // Wrap the simulation callback to detect when all are done
      const wrappedCallback = callbacks?.onSimulationComplete
        ? async (simId: string, result: any, polId: string) => {
            console.log('[DEBUG] wrappedCallback invoked for simId:', simId);
            await callbacks.onSimulationComplete!(simId, result, polId);
            console.log('[DEBUG] callbacks.onSimulationComplete completed for simId:', simId);

            // Check if all simulations are now complete
            const allSims = simulationKeys
              .map((key) => this.activeCalculations.get(key))
              .filter(Boolean);
            const allDone = allSims.every((sim) => sim?.completed);
            console.log('[DEBUG] allDone check:', allDone, 'for reportId:', reportId);

            if (allDone && !reportCompletionCalled && callbacks?.onComplete) {
              reportCompletionCalled = true;
              const anyErrors = allSims.some((sim) => sim?.error);
              console.log('[DEBUG] Calling callbacks.onComplete for reportId:', reportId);
              await callbacks.onComplete(reportId, anyErrors ? 'error' : 'ok', null);
              console.log('[DEBUG] callbacks.onComplete finished for reportId:', reportId);
            }
          }
        : undefined;

      console.log(
        '[DEBUG] wrappedCallback created, defined?',
        !!wrappedCallback,
        'for simulationId:',
        simulationId
      );
      await this.executeSingleSimulation(
        `${reportId}-sim-${simulationId}`,
        simulationId,
        policyId,
        singleSimMeta,
        wrappedCallback
      );
    }

    // Return initial computing status
    return {
      status: 'computing',
      progress: 0,
      message: 'Initializing calculation...',
      estimatedTimeRemaining: 60000,
    };
  }

  /**
   * Get current status of a calculation without side effects
   * Aggregates status across all simulations for the given report
   */
  getStatus(reportId: string): CalculationStatusResponse | null {
    // Find all simulations for this report
    const prefix = `${reportId}-sim-`;
    const simulations = Array.from(this.activeCalculations.entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([, value]) => value);

    if (simulations.length === 0) {
      return null;
    }

    // Check completion status
    const allCompleted = simulations.every((sim) => sim.completed);
    const anyError = simulations.some((sim) => sim.error);

    if (allCompleted) {
      if (anyError) {
        const error = simulations.find((sim) => sim.error)?.error;
        return {
          status: 'error',
          error: error?.message || 'Calculation failed',
        };
      }
      // All completed successfully - return null result for report level
      return {
        status: 'ok',
        result: null,
      };
    }

    // Still computing - return aggregated progress
    const totalProgress = simulations.reduce((sum, sim) => {
      if (sim.completed) {
        return sum + 100;
      }
      const elapsed = Date.now() - sim.startTime;
      return sum + Math.min((elapsed / sim.estimatedDuration) * 100, 95);
    }, 0);
    const avgProgress = totalProgress / simulations.length;

    return {
      status: 'computing',
      progress: avgProgress,
      message: this.getProgressMessage(avgProgress),
      estimatedTimeRemaining: Math.max(
        ...simulations.map((sim) =>
          !sim.completed ? Math.max(0, sim.estimatedDuration - (Date.now() - sim.startTime)) : 0
        )
      ),
    };
  }

  /**
   * Check if a calculation is active for a given reportId
   * Returns true if ANY simulation for this report is active
   */
  isActive(reportId: string): boolean {
    const prefix = `${reportId}-sim-`;
    for (const key of this.activeCalculations.keys()) {
      if (key.startsWith(prefix)) {
        return true;
      }
    }
    return false;
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
