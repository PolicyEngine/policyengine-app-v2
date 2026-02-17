import type { QueryClient } from '@tanstack/react-query';
import { calculateHouseholdV2Alpha } from '@/api/v2/householdCalculation';
import { fetchHouseholdByIdV2 } from '@/api/v2/households';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * Executes a single household simulation calculation
 *
 * Uses v2 alpha API directly:
 * 1. Fetches household by ID
 * 2. Runs calculation with policy (polls internally until complete)
 *
 * Progress is handled by HouseholdProgressCoordinator at the report level.
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

    try {
      // Fetch household then calculate using v2 alpha API
      // calculateHouseholdV2Alpha polls internally until complete
      const household = await fetchHouseholdByIdV2(params.populationId);
      const result = await calculateHouseholdV2Alpha(household, params.policyId);

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

      return result;
    } catch (error) {
      console.error('[HouseholdSimCalculator] API call failed:', error);

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

      throw error;
    }
  }
}
