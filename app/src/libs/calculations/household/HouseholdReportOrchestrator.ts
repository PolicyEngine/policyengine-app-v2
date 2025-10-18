import type { QueryClient } from '@tanstack/react-query';
import { HouseholdSimCalculator } from './HouseholdSimCalculator';
import { householdReportProgressKeys, simulationKeys, reportKeys } from '@/libs/queryKeys';
import { updateSimulationOutput } from '@/api/simulation';
import { markReportCompleted } from '@/api/report';
import type { HouseholdReportProgress, HouseholdReportConfig, SimulationConfig } from '@/types/calculation/household';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { Report } from '@/types/ingredients/Report';

/**
 * Singleton orchestrator that manages household report calculations
 * Runs in background independent of component lifecycle
 *
 * WHY THIS EXISTS:
 * Household reports run N independent simulation calculations.
 * This orchestrator:
 * - Manages multiple simulations for a single report
 * - Tracks progress at report level
 * - Persists across navigation (calculations continue in background)
 * - Handles completion and aggregation
 *
 * USAGE:
 * const orchestrator = HouseholdReportOrchestrator.getInstance(queryClient);
 * orchestrator.startReport(config);
 */
export class HouseholdReportOrchestrator {
  private static instance: HouseholdReportOrchestrator | null = null;

  private queryClient: QueryClient;
  private activeReports: Map<string, HouseholdReportProgress>;
  private simulationCalculators: Map<string, HouseholdSimCalculator>;

  private constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.activeReports = new Map();
    this.simulationCalculators = new Map();
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
   * Creates individual calculators for each simulation
   * Tracks progress at report level
   */
  async startReport(config: HouseholdReportConfig): Promise<void> {
    const { reportId, simulationConfigs, countryId } = config;
    const timestamp = Date.now();

    // Check if already started - prevent duplicate starts
    if (this.activeReports.has(reportId)) {
      console.log(`[HouseholdReportOrchestrator] Report ${reportId} already calculating, ignoring duplicate start request`);
      return;
    }

    console.log(`[HouseholdReportOrchestrator][${timestamp}] ========================================`);
    console.log(`[HouseholdReportOrchestrator][${timestamp}] Starting report ${reportId}`);
    console.log(`[HouseholdReportOrchestrator][${timestamp}] ${simulationConfigs.length} simulations to calculate`);

    // Create progress tracker
    const progress: HouseholdReportProgress = {
      reportId,
      simulationIds: simulationConfigs.map((c) => c.simulationId),
      simulations: {},
      overallStatus: 'computing',
      startedAt: Date.now(),
    };

    // Initialize each simulation's progress
    simulationConfigs.forEach((simConfig) => {
      progress.simulations[simConfig.simulationId] = {
        status: 'pending',
      };
    });

    // Store in cache immediately
    this.queryClient.setQueryData(householdReportProgressKeys.byId(reportId), progress);
    this.activeReports.set(reportId, progress);

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Progress tracker created and cached`);

    // Start each simulation calculation IN PARALLEL
    const promises = simulationConfigs.map((simConfig) =>
      this.startSimulation(reportId, simConfig, countryId)
    );

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Started ${promises.length} parallel calculations`);

    // Don't await - let them run in background
    // Each will update progress independently
    Promise.all(promises)
      .then(() => {
        console.log(`[HouseholdReportOrchestrator][${timestamp}] All simulations completed`);
        this.checkReportCompletion(reportId, countryId);
      })
      .catch((error) => {
        console.error(`[HouseholdReportOrchestrator][${timestamp}] Error in parallel execution:`, error);
      });

    console.log(`[HouseholdReportOrchestrator][${timestamp}] ========================================`);
  }

  /**
   * Start individual simulation calculation
   * Updates progress as it runs
   */
  private async startSimulation(
    reportId: string,
    simConfig: SimulationConfig,
    countryId: string
  ): Promise<void> {
    const { simulationId, populationId, policyId } = simConfig;
    const timestamp = Date.now();

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Starting simulation ${simulationId}`);

    // Create calculator for this simulation
    const calculator = new HouseholdSimCalculator(this.queryClient, simulationId, reportId);

    this.simulationCalculators.set(simulationId, calculator);

    // Update progress: computing
    this.updateSimProgress(reportId, simulationId, {
      status: 'computing',
      startedAt: Date.now(),
    });

    try {
      // Execute the long-running calculation
      // This BLOCKS for 30-45s but that's OK - runs in background
      const result = await calculator.execute({
        countryId,
        populationId,
        policyId,
      });

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} completed`);

      // Update progress: complete
      this.updateSimProgress(reportId, simulationId, {
        status: 'complete',
        completedAt: Date.now(),
      });

      // Persist result to simulation.output
      await this.persistSimulation(countryId, simulationId, result);

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} persisted`);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Simulation ${simulationId} failed:`, error);

      // Update progress: error
      this.updateSimProgress(reportId, simulationId, {
        status: 'error',
        completedAt: Date.now(),
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      });
    }
  }

  /**
   * Update individual simulation progress in report tracker
   */
  private updateSimProgress(
    reportId: string,
    simulationId: string,
    update: Partial<HouseholdReportProgress['simulations'][string]>
  ): void {
    const progress = this.activeReports.get(reportId);
    if (!progress) return;

    // Update this simulation's status
    progress.simulations[simulationId] = {
      ...progress.simulations[simulationId],
      ...update,
    };

    // Update overall status
    const statuses = Object.values(progress.simulations).map((s) => s.status);

    if (statuses.every((s) => s === 'complete')) {
      progress.overallStatus = 'complete';
      progress.completedAt = Date.now();
    } else if (statuses.some((s) => s === 'error')) {
      progress.overallStatus = 'error';
    } else if (statuses.some((s) => s === 'computing')) {
      progress.overallStatus = 'computing';
    }

    // Update cache - this triggers UI re-renders
    this.queryClient.setQueryData(householdReportProgressKeys.byId(reportId), { ...progress });
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
   * Check if all simulations complete, if so mark report complete
   */
  private async checkReportCompletion(reportId: string, countryId: string): Promise<void> {
    const timestamp = Date.now();
    const progress = this.activeReports.get(reportId);

    console.log(`[HouseholdReportOrchestrator][${timestamp}] Checking report completion for ${reportId}`);

    if (!progress || progress.overallStatus !== 'complete') {
      console.log(`[HouseholdReportOrchestrator][${timestamp}] Report not complete yet: ${progress?.overallStatus}`);
      return;
    }

    console.log(`[HouseholdReportOrchestrator][${timestamp}] All simulations complete, marking report as complete`);

    // For household reports, individual simulations already have their outputs persisted
    // The report just tracks completion status, not aggregated output
    const report: Report = {
      id: reportId,
      countryId: countryId as any,
      apiVersion: null,
      simulationIds: progress.simulationIds,
      status: 'complete',
      output: null, // Household reports don't have report-level output
    };

    try {
      await markReportCompleted(countryId as any, reportId, report);

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Report ${reportId} marked complete`);

      // Invalidate report cache
      this.queryClient.invalidateQueries({
        queryKey: reportKeys.byId(reportId),
      });

      // Clean up
      this.activeReports.delete(reportId);
      progress.simulationIds.forEach((simId) => {
        this.simulationCalculators.delete(simId);
      });

      console.log(`[HouseholdReportOrchestrator][${timestamp}] Cleaned up orchestrator resources`);
    } catch (error) {
      console.error(`[HouseholdReportOrchestrator][${timestamp}] Failed to mark report complete:`, error);
    }
  }

  /**
   * Get current progress for a report
   */
  getProgress(reportId: string): HouseholdReportProgress | undefined {
    return this.activeReports.get(reportId);
  }

  /**
   * Check if report is currently calculating
   */
  isCalculating(reportId: string): boolean {
    const progress = this.activeReports.get(reportId);
    return progress?.overallStatus === 'computing' || false;
  }
}
