import type { QueryClient } from '@tanstack/react-query';
import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Executes a single household simulation calculation
 * Provides simulated front-end progress updates during long-running API call
 *
 * WHY THIS EXISTS:
 * Household calculations are synchronous 30-45s blocking API calls.
 * We can't actually poll for progress (no server-side queue).
 * Instead, we simulate smooth progress on the front-end to show users something is happening.
 *
 * USAGE:
 * Created by HouseholdReportOrchestrator for each simulation in a report.
 * Runs independently in the background.
 */
export class HouseholdSimCalculator {
  private queryClient: QueryClient;
  private simulationId: string;
  private reportId: string;
  private progressTimer: NodeJS.Timeout | null = null;

  constructor(queryClient: QueryClient, simulationId: string, reportId: string) {
    this.queryClient = queryClient;
    this.simulationId = simulationId;
    this.reportId = reportId;
  }

  /**
   * Execute the calculation with simulated front-end progress
   */
  async execute(params: {
    countryId: string;
    populationId: string;
    policyId: string;
  }): Promise<any> {
    const calcKey = calculationKeys.bySimulationId(this.simulationId);
    const timestamp = Date.now();

    console.log(`[HouseholdSimCalculator][${timestamp}] Starting calculation for simulation ${this.simulationId}`);

    // Set initial computing status
    const initialStatus: CalcStatus = {
      status: 'computing',
      message: 'Starting household calculation...',
      progress: 0,
      metadata: {
        calcId: this.simulationId,
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
        reportId: this.reportId,
      },
    };

    this.queryClient.setQueryData(calcKey, initialStatus);
    console.log(`[HouseholdSimCalculator][${timestamp}] Set computing status in cache`);

    // Start simulated progress updates
    this.startProgressSimulation(calcKey);

    try {
      console.log(`[HouseholdSimCalculator][${timestamp}] Calling fetchHouseholdCalculation API`);

      // Execute the LONG-RUNNING API call (30-45s)
      // This blocks but that's OK - runs in background Promise
      const result = await fetchHouseholdCalculation(
        params.countryId,
        params.populationId,
        params.policyId
      );

      console.log(`[HouseholdSimCalculator][${timestamp}] API call completed successfully`);

      // Stop progress simulation
      this.stopProgressSimulation();

      // Set final complete status
      const completeStatus: CalcStatus = {
        status: 'complete',
        result,
        progress: 100,
        metadata: {
          calcId: this.simulationId,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: initialStatus.metadata.startedAt,
          reportId: this.reportId,
        },
      };

      this.queryClient.setQueryData(calcKey, completeStatus);
      console.log(`[HouseholdSimCalculator][${timestamp}] Set complete status in cache`);

      return result;
    } catch (error) {
      console.error(`[HouseholdSimCalculator][${timestamp}] API call failed:`, error);

      this.stopProgressSimulation();

      const errorStatus: CalcStatus = {
        status: 'error',
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
        metadata: {
          calcId: this.simulationId,
          calcType: 'household',
          targetType: 'simulation',
          startedAt: initialStatus.metadata.startedAt,
          reportId: this.reportId,
        },
      };

      this.queryClient.setQueryData(calcKey, errorStatus);
      console.log(`[HouseholdSimCalculator][${timestamp}] Set error status in cache`);

      throw error;
    }
  }

  /**
   * Simulate progress on the front-end during API call
   * Creates smooth, believable progress bar
   */
  private startProgressSimulation(calcKey: readonly string[]): void {
    const startTime = Date.now();
    const estimatedDuration = 37500; // 37.5s average (30-45s range)

    this.progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Asymptotic progress: fast at start, slower near end
      // Never reaches 100% (that happens when API actually completes)
      const rawProgress = (elapsed / estimatedDuration) * 100;
      const progress = Math.min(95, rawProgress * (1 - rawProgress / 200));

      const currentStatus = this.queryClient.getQueryData<CalcStatus>(calcKey);

      if (currentStatus?.status === 'computing') {
        this.queryClient.setQueryData(calcKey, {
          ...currentStatus,
          progress,
          message: this.getProgressMessage(progress),
        });
      }
    }, 100); // Update every 100ms for smooth animation
  }

  /**
   * Stop progress simulation
   */
  private stopProgressSimulation(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  /**
   * Get human-friendly message for current progress
   */
  private getProgressMessage(progress: number): string {
    if (progress < 20) return 'Initializing calculation...';
    if (progress < 50) return 'Running household simulation...';
    if (progress < 80) return 'Computing policy impacts...';
    return 'Finalizing results...';
  }
}
