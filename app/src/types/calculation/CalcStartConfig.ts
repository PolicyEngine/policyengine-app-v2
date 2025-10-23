import type { Geography } from '@/types/ingredients/Geography';
import type { Household } from '@/types/ingredients/Household';
import type { Simulation } from '@/types/ingredients/Simulation';

/**
 * Configuration for starting a calculation
 * Contains all necessary information to execute and persist a calculation
 */
export interface CalcStartConfig {
  /**
   * The ID of the target resource (reportId or simulationId)
   */
  calcId: string;

  /**
   * Whether to persist results to a report or simulation
   */
  targetType: 'report' | 'simulation';

  /**
   * The simulations to compare (baseline and optional reform)
   */
  simulations: {
    simulation1: Simulation;
    simulation2?: Simulation | null;
  };

  /**
   * The populations associated with the simulations
   */
  populations: {
    household1?: Household | null;
    household2?: Household | null;
    geography1?: Geography | null;
    geography2?: Geography | null;
  };

  /**
   * Country ID for API calls
   */
  countryId: string;

  /**
   * Parent report ID (only for household simulation-level calculations)
   * Used to mark the parent report as complete after all simulations finish
   */
  reportId?: string;
}
