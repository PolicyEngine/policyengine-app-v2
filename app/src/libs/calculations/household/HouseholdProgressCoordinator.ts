import { QueryClient } from '@tanstack/react-query';
import { calculationKeys } from '@/libs/queryKeys';
import type { CalcStatus } from '@/types/calculation';

/**
 * State tracking for a single simulation within a report
 *
 * Status values:
 * - 'initializing': Simulation not started yet (waiting to begin)
 * - 'pending': Simulation API call in progress (aligns with API status)
 * - 'complete': Simulation finished successfully
 * - 'error': Simulation failed
 */
interface SimulationProgressState {
  simulationId: string;
  status: 'initializing' | 'pending' | 'complete' | 'error';
  startTime?: number;
  completionTime?: number;
}

/**
 * Overall progress information for display
 */
interface OverallProgress {
  totalProgress: number; // 0-90 while running, 90-100 when persisting
  simulationProgresses: {
    [simId: string]: number; // Individual sim progress (0-45 for two-sim, 0-90 for one-sim)
  };
  message: string;
}

/**
 * Coordinates progress tracking across multiple parallel simulations
 *
 * ARCHITECTURE:
 * - Each simulation gets 47.5% of total progress (for 2-sim reports)
 * - Final 5% (95-100%) represents report persistence
 * - Linear progress based on elapsed time vs 70-second estimate
 * - Both simulations run in parallel via Promise.all()
 *
 * PROGRESS MODEL:
 * - Two simulations: Sim1 (0-47.5%) + Sim2 (0-47.5%) + Report (95-100%)
 * - One simulation: Sim1 (0-95%) + Report (95-100%)
 * - Cap at 95% until all simulations complete
 * - Jump to 100% when report status updates to 'complete'
 */
export class HouseholdProgressCoordinator {
  private simulations: Map<string, SimulationProgressState>;
  private reportId: string;
  private queryClient: QueryClient;
  private estimatedDurationPerSim = 70000; // 70 seconds (1 minute 10 seconds) per simulation

  constructor(
    queryClient: QueryClient,
    reportId: string,
    simulationIds: string[]
  ) {
    this.queryClient = queryClient;
    this.reportId = reportId;
    this.simulations = new Map(
      simulationIds.map((id) => [
        id,
        {
          simulationId: id,
          status: 'initializing', // Not started yet
        },
      ])
    );
  }

  /**
   * Start tracking a simulation's progress
   * Called when simulation begins API call
   */
  startSimulation(simulationId: string): void {
    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.status = 'pending'; // API call in progress (aligns with API status)
      sim.startTime = Date.now();
      console.log(`[ProgressCoordinator] Simulation ${simulationId} started (pending)`);
      this.updateProgress();
    }
  }

  /**
   * Mark a simulation as complete
   * Called when simulation API call succeeds
   */
  completeSimulation(simulationId: string): void {
    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.status = 'complete';
      sim.completionTime = Date.now();
      console.log(`[ProgressCoordinator] Simulation ${simulationId} completed`);
      this.updateProgress();
    }
  }

  /**
   * Mark a simulation as failed
   * Called when simulation API call fails
   */
  failSimulation(simulationId: string): void {
    const sim = this.simulations.get(simulationId);
    if (sim) {
      sim.status = 'error';
      console.log(`[ProgressCoordinator] Simulation ${simulationId} failed`);
      this.updateProgress();
    }
  }

  /**
   * Calculate overall progress across all simulations
   */
  private calculateOverallProgress(): OverallProgress {
    const totalSims = this.simulations.size;

    // Each simulation gets an equal share of the 95% total
    // For 2 sims: 47.5% each
    // For 1 sim: 95%
    const progressPerSim = 95 / totalSims;

    let totalProgress = 0;
    const simulationProgresses: { [simId: string]: number } = {};

    // Calculate progress for each simulation (running in parallel)
    for (const [simId, sim] of this.simulations) {
      let simProgress = 0;

      if (sim.status === 'complete') {
        // Simulation complete: full segment
        simProgress = progressPerSim;
      } else if (sim.status === 'pending' && sim.startTime) {
        // Simulation pending (API call in progress): calculate linear progress
        const elapsed = Date.now() - sim.startTime;
        const rawProgress = (elapsed / this.estimatedDurationPerSim) * progressPerSim;

        // Cap at progressPerSim (if running longer than expected, sits at max per-sim progress)
        simProgress = Math.min(rawProgress, progressPerSim);
      }
      // else status === 'initializing' or 'error': simProgress stays 0

      simulationProgresses[simId] = simProgress;
      totalProgress += simProgress;
    }

    // Check if all simulations are complete
    const allComplete = Array.from(this.simulations.values()).every(
      (sim) => sim.status === 'complete'
    );

    // If all simulations complete, cap at 95%
    // The final 95→100% happens when report status updates to 'complete'
    if (allComplete) {
      totalProgress = 95;
    }

    const message = this.getProgressMessage(totalProgress, this.simulations);

    return {
      totalProgress,
      simulationProgresses,
      message,
    };
  }

  /**
   * Get contextual progress message based on current state
   * Messages reflect that simulations run in parallel
   */
  private getProgressMessage(
    progress: number,
    simulations: Map<string, SimulationProgressState>
  ): string {
    const pendingSims = Array.from(simulations.values()).filter(
      (s) => s.status === 'pending'
    );
    const completedSims = Array.from(simulations.values()).filter(
      (s) => s.status === 'complete'
    );

    // All simulations complete
    if (completedSims.length === simulations.size) {
      return 'Finalizing report...';
    }

    // No simulations pending yet (still initializing)
    if (pendingSims.length === 0) {
      return 'Initializing calculations...';
    }

    // Progress-based messages (reflects parallel execution)
    // Thresholds adjusted for 47.5% per sim, 95% total cap
    if (progress < 15) {
      return 'Starting household simulations...';
    }
    if (progress < 47.5) {
      return 'Running simulations in parallel...';
    }
    if (progress < 95) {
      return 'Completing simulations...';
    }

    return 'Finalizing report...';
  }

  /**
   * Update CalcStatus in cache with current progress
   * Sets the same overall progress for all simulations
   */
  private updateProgress(): void {
    const overall = this.calculateOverallProgress();

    console.log('[ProgressCoordinator] Progress update:', {
      totalProgress: overall.totalProgress,
      simulationProgresses: overall.simulationProgresses,
      message: overall.message,
    });

    // Update each simulation's CalcStatus with overall progress
    // All simulations show the same total progress (not individual progress)
    for (const simId of this.simulations.keys()) {
      const calcKey = calculationKeys.bySimulationId(simId);
      const currentStatus = this.queryClient.getQueryData<CalcStatus>(calcKey);

      if (currentStatus) {
        this.queryClient.setQueryData<CalcStatus>(calcKey, {
          ...currentStatus,
          progress: overall.totalProgress, // Use overall progress, not individual
          message: overall.message,
        });
      }
    }
  }

  /**
   * Start the progress update timer
   * Returns the timer so it can be cleaned up later
   */
  startProgressTimer(): NodeJS.Timeout {
    console.log('[ProgressCoordinator] Starting progress timer');
    return setInterval(() => {
      this.updateProgress();
    }, 500); // Update every 500ms for smooth progress bar
  }

  /**
   * Stop the timer and cleanup
   */
  cleanup(timer: NodeJS.Timeout): void {
    console.log('[ProgressCoordinator] Cleaning up progress timer');
    clearInterval(timer);
  }
}
