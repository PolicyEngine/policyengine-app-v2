import type { CalcError } from '../CalcError';

/**
 * Progress tracking for a single simulation within a household report
 */
export interface HouseholdSimProgress {
  status: 'pending' | 'computing' | 'complete' | 'error';
  startedAt?: number;
  completedAt?: number;
  error?: CalcError;
}

/**
 * Overall progress tracker for a household report
 * Tracks N independent simulation calculations
 *
 * WHY THIS EXISTS:
 * Household reports run multiple simulation-level calculations.
 * This type tracks the orchestration state at the report level,
 * linking to individual simulation calculations.
 *
 * Persists in cache across navigation so calculations can continue
 * in background if user navigates away.
 */
export interface HouseholdReportProgress {
  /**
   * Report ID this progress tracks
   */
  reportId: string;

  /**
   * IDs of simulations being calculated
   */
  simulationIds: string[];

  /**
   * Progress of each individual simulation
   */
  simulations: {
    [simId: string]: HouseholdSimProgress;
  };

  /**
   * Overall report calculation status
   * - 'pending': Not started yet
   * - 'computing': At least one simulation is running
   * - 'complete': All simulations finished successfully
   * - 'error': At least one simulation failed
   */
  overallStatus: 'pending' | 'computing' | 'complete' | 'error';

  /**
   * When the report calculation started
   */
  startedAt: number;

  /**
   * When the report calculation completed (if finished)
   */
  completedAt?: number;
}
