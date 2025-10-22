import type { QueryClient } from '@tanstack/react-query';
import { HouseholdSimCalculator } from './HouseholdSimCalculator';
import { HouseholdProgressCoordinator } from './HouseholdProgressCoordinator';
import { buildHouseholdReportOutput } from './householdReportUtils';
import { simulationKeys, reportKeys } from '@/libs/queryKeys';
import { updateSimulationOutput, markSimulationError } from '@/api/simulation';
import { markReportCompleted } from '@/api/report';
import { fetchSimulationById } from '@/api/simulation';
import type { HouseholdReportConfig, SimulationConfig } from '@/types/calculation/household';
import type { Report } from '@/types/ingredients/Report';
import type { HouseholdData } from '@/types/ingredients/Household';
import { cacheMonitor } from '@/utils/cacheMonitor';

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
  private progressCoordinators: Map<string, { coordinator: HouseholdProgressCoordinator; timer: NodeJS.Timeout }>; // reportId -> coordinator

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.activeCalculations = new Set();
    this.simulationResults = new Map();
    this.progressCoordinators = new Map();
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

    // Create progress coordinator for this report
    const simulationIds = simulationConfigs.map(sc => sc.simulationId);
    const progressCoordinator = new HouseholdProgressCoordinator(
      this.queryClient,
      reportId,
      simulationIds
    );

    // Start progress timer
    const progressTimer = progressCoordinator.startProgressTimer();
    this.progressCoordinators.set(reportId, { coordinator: progressCoordinator, timer: progressTimer });

    // Start each simulation in parallel
    const promises = simulationConfigs.map((simConfig) =>
      this.startSimulation(reportId, simConfig, countryId, progressCoordinator)
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
    countryId: string,
    progressCoordinator: HouseholdProgressCoordinator
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

    // Notify progress coordinator that this simulation is starting
    progressCoordinator.startSimulation(simulationId);

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

      // Notify progress coordinator that this simulation completed
      progressCoordinator.completeSimulation(simulationId);

      // Persist result to simulation.output
      await this.persistSimulation(countryId, simulationId, result);

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} persisted to database`);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} failed:`, error);

      // Notify progress coordinator that this simulation failed
      progressCoordinator.failSimulation(simulationId);

      // Mark simulation as error in database (persistent status)
      try {
        await markSimulationError(countryId as any, simulationId);

        // Log invalidation for cache monitoring
        cacheMonitor.logInvalidation(simulationKeys.byId(simulationId), {
          reason: 'Simulation failed',
          simulationId,
        });

        // Invalidate to trigger refetch with error status
        this.queryClient.invalidateQueries({
          queryKey: simulationKeys.byId(simulationId),
        });

        console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} marked as error`);
      } catch (patchError) {
        console.error(`[HouseholdReportOrchestrator][${timestamp}] Failed to mark simulation as error:`, patchError);
      }

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
      // DIAGNOSTIC: Capture PATCH response
      const patchResponse = await updateSimulationOutput(countryId as any, simulationId, result);
      const patchTimestamp = Date.now();

      console.log(`[HouseholdReportOrchestrator][${timestamp}] ========== PATCH RESPONSE ==========`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] PATCH completed at: ${patchTimestamp}`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] PATCH response status: ${patchResponse.status}`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] PATCH response hasOutput: ${!!patchResponse.output}`);

      // DIAGNOSTIC: Invalidate and immediately check what GET returns
      console.log(`[HouseholdReportOrchestrator][${timestamp}] Invalidating query...`);

      // Log invalidation for cache monitoring
      cacheMonitor.logInvalidation(simulationKeys.byId(simulationId), {
        reason: 'Simulation output persisted',
        simulationId,
      });

      this.queryClient.invalidateQueries({
        queryKey: simulationKeys.byId(simulationId),
      });

      // DIAGNOSTIC: Wait a moment and manually fetch to see what the API returns
      console.log(`[HouseholdReportOrchestrator][${timestamp}] Waiting 100ms before GET...`);
      await new Promise(resolve => setTimeout(resolve, 100));

      const getTimestamp = Date.now();
      const getFreshData = await fetchSimulationById(countryId as any, simulationId);

      console.log(`[HouseholdReportOrchestrator][${timestamp}] ========== GET RESPONSE (after 100ms) ==========`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] GET completed at: ${getTimestamp}`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] Time delta (GET - PATCH): ${getTimestamp - patchTimestamp}ms`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] GET response status: ${getFreshData.status}`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] GET response hasOutput: ${!!getFreshData.output}`);

      console.log(`[HouseholdReportOrchestrator][${timestamp}] ========== COMPARISON ==========`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] PATCH status: ${patchResponse.status} | GET status: ${getFreshData.status}`);
      console.log(`[HouseholdReportOrchestrator][${timestamp}] Status match: ${patchResponse.status === getFreshData.status}`);

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

      // Clean up progress coordinator
      const coordinatorData = this.progressCoordinators.get(reportId);
      if (coordinatorData) {
        coordinatorData.coordinator.cleanup(coordinatorData.timer);
        this.progressCoordinators.delete(reportId);
      }
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

      // Clean up progress coordinator
      const coordinatorData = this.progressCoordinators.get(reportId);
      if (coordinatorData) {
        coordinatorData.coordinator.cleanup(coordinatorData.timer);
        this.progressCoordinators.delete(reportId);
      }
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Failed to mark report error:`, error);
    }
  }
}
