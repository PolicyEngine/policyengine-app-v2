import type { HouseholdCalculationData } from './HouseholdCalculationOutput';

/**
 * Household report output structure
 * Maps simulation IDs to their household calculation outputs
 * Simulation IDs are sorted alphabetically
 */
export interface HouseholdReportOutput {
  [simulationId: string]: HouseholdCalculationData;
}
