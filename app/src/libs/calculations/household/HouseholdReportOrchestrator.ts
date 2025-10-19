import type { QueryClient } from '@tanstack/react-query';
import { HouseholdSimCalculator } from './HouseholdSimCalculator';
import { buildHouseholdReportOutput } from './householdReportUtils';
import { simulationKeys, reportKeys } from '@/libs/queryKeys';
import { updateSimulationOutput } from '@/api/simulation';
import { markReportCompleted } from '@/api/report';
import type { HouseholdReportConfig, SimulationConfig } from '@/types/calculation/household';
import type { Report } from '@/types/ingredients/Report';
import type { HouseholdData } from '@/types/ingredients/Household';

/**
 * Simplified orchestrator for household report calculations
 *
 * SIMPLIFIED ARCHITECTURE:
 * - No report-level progress tracking (use simulation CalcStatus instead)
 * - No report completion checking (handled reactively in UI)
 * - Just starts N blocking simulation calculations and persists results
 *
 * Each simulation:
 * 1. Makes ONE blocking API call (30-45s)
 * 2. Persists result to simulation.output
 * 3. Updates CalcStatus cache
 *
 * UI layer watches simulation statuses and marks report complete when all done.
 */
export class HouseholdReportOrchestrator {
  private static instance: HouseholdReportOrchestrator | null = null;

  private queryClient: QueryClient;
  private activeCalculations: Set<string>; // Track which simulations are running
  private simulationResults: Map<string, Map<string, HouseholdData>>; // reportId -> (simId -> result)

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.activeCalculations = new Set();
    this.simulationResults = new Map();
  }

  /**
   * Get singleton instance
   */
  static getInstance(queryClient: QueryClient): HouseholdReportOrchestrator {
    if (!HouseholdReportOrchestrator.instance) {
      HouseholdReportOrchestrator.instance = new HouseholdReportOrchestrator(queryClient);
    }
    return HouseholdReportOrchestrator.instance;
  }

  /**
   * Start calculations for a household report
   * Launches N independent simulation calculations in parallel
   * Each calculation blocks until complete (NO POLLING)
   */
  async startReport(config: HouseholdReportConfig): Promise<void> {
    const { reportId, simulationConfigs, countryId } = config;
    const timestamp = Date.now();

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Starting report ${reportId}`);
    console.log(`[HouseholdReportOrchestrator][${timestamp}] ${simulationConfigs.length} simulations to calculate`);

    // Initialize results map for this report
    this.simulationResults.set(reportId, new Map());

    // Start each simulation in parallel
    const promises = simulationConfigs.map((simConfig) =>
      this.startSimulation(reportId, simConfig, countryId)
    );

    // Don't await - let them run in background
    // Mark report complete when all simulations finish
    Promise.all(promises)
      .then(() => {
        console.log(`[HouseholdReportOrchestrator][${timestamp}] All simulations completed for report ${reportId}`);

        // Mark report complete now that all simulations are done
        return this.markReportComplete(config.report, countryId, reportId);
      })
      .catch((error) => {
        console.error(`[HouseholdReportOrchestrator][${timestamp}] Error in parallel execution:`, error);

        // Mark report as error
        return this.markReportError(config.report, countryId, reportId);
      });

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Calculations started in background`);
  }

  /**
   * Start individual simulation calculation
   * Makes ONE blocking API call, then persists result
   */
  private async startSimulation(
    reportId: string,
    simConfig: SimulationConfig,
    countryId: string
  ): Promise<void> {
    const { simulationId, populationId, policyId } = simConfig;
    const timestamp = Date.now();

    // Check if already running
    if (this.activeCalculations.has(simulationId)) {
      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} already calculating, skipping`);
      return;
    }

    this.activeCalculations.add(simulationId);

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Starting simulation ${simulationId}`);

    // Create calculator for this simulation
    const calculator = new HouseholdSimCalculator(this.queryClient, simulationId, reportId);

    try {
      // Execute the long-running calculation
      // This makes ONE blocking API call and waits for response (30-45s)
      // NO POLLING HAPPENS HERE
      const result = await calculator.execute({
        countryId,
        populationId,
        policyId,
      });

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} calculation completed`);

      // Store result for report output aggregation
      const reportResults = this.simulationResults.get(reportId);
      if (reportResults) {
        reportResults.set(simulationId, result as HouseholdData);
      }

      // Persist result to simulation.output
      await this.persistSimulation(countryId, simulationId, result);

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} persisted to database`);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} failed:`, error);
      // Error is already reflected in CalcStatus by HouseholdSimCalculator
      // UI layer will see the error status
      throw error; // Re-throw to trigger Promise.all catch
    } finally {
      this.activeCalculations.delete(simulationId);
    }
  }

  /**
   * Persist simulation result to database
   */
  private async persistSimulation(
    countryId: string,
    simulationId: string,
    result: any
  ): Promise<void> {
    const timestamp = Date.now();

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Persisting simulation ${simulationId}`);

    try {
      await updateSimulationOutput(countryId as any, simulationId, result);

      // Invalidate simulation cache to refetch with new output
      this.queryClient.invalidateQueries({
        queryKey: simulationKeys.byId(simulationId),
      });

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} persisted successfully`);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Failed to persist simulation ${simulationId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a simulation is currently calculating
   */
  isCalculating(simulationId: string): boolean {
    return this.activeCalculations.has(simulationId);
  }

  /**
   * Mark report as complete (all simulations succeeded)
   */
  private async markReportComplete(report: Report, countryId: string, reportId: string): Promise<void> {
    const timestamp = Date.now();
    console.log(`[HouseholdReportOrchestrator][${timestamp}] Marking report ${report.id} complete`);

    // Get collected simulation results
    const reportResults = this.simulationResults.get(reportId);
    console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulations: `, reportResults);
    if (!reportResults || reportResults.size === 0) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] No simulation results found for report ${reportId}`);
      return;
    }

    // Build aggregated output: object mapping sim IDs (alphabetically sorted) to their outputs
    const householdReportOutput = buildHouseholdReportOutput(reportResults);

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Built report output with ${reportResults.size} simulations`);

    const completedReport: Report = {
      ...report,
      status: 'complete',
      outputType: 'household',
      output: householdReportOutput,
    };

    try {
      await markReportCompleted(countryId as any, report.id!, completedReport);

      // Invalidate report cache to refetch with new status
      this.queryClient.invalidateQueries({
        queryKey: reportKeys.byId(report.id!),
      });

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Report ${report.id} marked complete`);

      // Clean up stored results
      this.simulationResults.delete(reportId);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Failed to mark report complete:`, error);
    }
  }

  /**
   * Mark report as error (some simulation failed)
   */
  private async markReportError(report: Report, countryId: string, reportId: string): Promise<void> {
    const timestamp = Date.now();
    console.log(`[HouseholdReportOrchestrator][${timestamp}] Marking report ${report.id} error`);

    const errorReport: Report = {
      ...report,
      status: 'error',
      outputType: 'household',
    };

    try {
      await markReportCompleted(countryId as any, report.id!, errorReport);

      this.queryClient.invalidateQueries({
        queryKey: reportKeys.byId(report.id!),
      });

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Report ${report.id} marked error`);

      // Clean up stored results
      this.simulationResults.delete(reportId);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Failed to mark report error:`, error);
    }
  }
}
