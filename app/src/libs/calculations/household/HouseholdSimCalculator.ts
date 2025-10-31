import type { QueryClient } from '@tanstack/react-query';
import { fetchHouseholdCalculation } from '@/api/householdCalculation';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Executes a single household simulation calculation
 *
 * SIMPLIFIED: No progress tracking logic
 * Progress is handled by HouseholdProgressCoordinator at the report level
 *
 * This class only:
 * - Makes the blocking API call
 * - Updates CalcStatus with pending/complete/error states
 * - Returns the result
 *
 * USAGE:
 * Created by HouseholdReportOrchestrator for each simulation in a report.
 * Runs independently in parallel via Promise.all()
 */
export class HouseholdSimCalculator {
  private queryClient: QueryClient;
  private simulationId: string;
  private reportId: string;

  constructor(queryClient: QueryClient, simulationId: string, reportId: string) {
    this.queryClient = queryClient;
    this.simulationId = simulationId;
    this.reportId = reportId;
  }

  /**
   * Execute the calculation
   * Progress tracking is handled by HouseholdProgressCoordinator
   */
  async execute(params: {
    countryId: string;
    populationId: string;
    policyId: string;
  }): Promise<any> {
    const calcKey = calculationKeys.bySimulationId(this.simulationId);
    const timestamp = Date.now();

    console.log(
      `[HouseholdSimCalculator][${timestamp}] Starting calculation for simulation ${this.simulationId}`
    );

    // Set initial pending status (no progress field - coordinator handles it)
    const initialStatus: CalcStatus = {
      status: 'pending',
      message: 'Starting calculation...',
      metadata: {
        calcId: this.simulationId,
        calcType: 'household',
        targetType: 'simulation',
        startedAt: Date.now(),
        reportId: this.reportId,
      },
    };

    this.queryClient.setQueryData(calcKey, initialStatus);
    console.log(`[HouseholdSimCalculator][${timestamp}] Set pending status in cache`);

    try {
      console.log(`[HouseholdSimCalculator][${timestamp}] Calling fetchHouseholdCalculation API`);

      // Execute the LONG-RUNNING API call (30-50s)
      // This blocks but that's OK - runs in background Promise
      const result = await fetchHouseholdCalculation(
        params.countryId,
        params.populationId,
        params.policyId
      );

      console.log(`[HouseholdSimCalculator][${timestamp}] API call completed successfully`);

      // Set final complete status
      const completeStatus: CalcStatus = {
        status: 'complete',
        result,
        message: 'Complete',
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

      const errorStatus: CalcStatus = {
        status: 'error',
        message: 'Calculation failed',
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
}
