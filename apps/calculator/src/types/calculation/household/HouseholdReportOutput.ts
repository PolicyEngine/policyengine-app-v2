import type { HouseholdData } from '@/types/ingredients/Household';

/**
 * Household report output structure
 * Maps simulation IDs to their household calculation outputs
 * Simulation IDs are sorted alphabetically
 */
export interface HouseholdReportOutput {
  [simulationId: string]: HouseholdData;
}
