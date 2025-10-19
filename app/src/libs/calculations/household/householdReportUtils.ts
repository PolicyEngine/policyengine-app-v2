import type { HouseholdData } from '@/types/ingredients/Household';
import type { HouseholdReportOutput } from '@/types/calculation/household';

/**
 * Build household report output from simulation results
 * Creates an object mapping simulation IDs (alphabetically sorted) to their outputs
 *
 * @param simulationResults - Map of simulation IDs to their HouseholdData outputs
 * @returns Object with alphabetically sorted simulation IDs as keys
 */
export function buildHouseholdReportOutput(
  simulationResults: Map<string, HouseholdData>
): HouseholdReportOutput {
  const output: HouseholdReportOutput = {};

  // Sort simulation IDs alphabetically
  const sortedSimIds = Array.from(simulationResults.keys()).sort();

  // Build output object with sorted keys
  for (const simId of sortedSimIds) {
    const result = simulationResults.get(simId);
    if (result) {
      output[simId] = result;
    }
  }

  return output;
}
