import { Population } from '@/types/ingredients/Population';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Checks if two populations are compatible for use in the same report.
 * Reports require both simulations to use the exact same population (by populationId).
 *
 * @param popId1 - The population ID of the first simulation
 * @param popId2 - The population ID of the second simulation
 * @returns true if the populations are compatible (both undefined or IDs match), false otherwise
 */
export function arePopulationsCompatible(
  popId1: string | undefined,
  popId2: string | undefined
): boolean {
  // If either is undefined, there's no conflict yet
  if (!popId1 || !popId2) {
    return true;
  }

  // Both are defined - they must match exactly
  return popId1 === popId2;
}

/**
 * Gets a human-readable label for a population.
 * Priority: population.label → household ID → geography name → 'Unknown Population'
 *
 * @param population - The population object
 * @returns A human-readable label
 */
export function getPopulationLabel(population: Population | null): string {
  if (!population) {
    return 'Unknown Population';
  }

  // First priority: user-defined label
  if (population.label) {
    return population.label;
  }

  // Second priority: household ID
  if (population.household?.id) {
    return `Household #${population.household.id}`;
  }

  // Third priority: geography name
  if (population.geography?.name) {
    return population.geography.name;
  }

  // Fourth priority: geography ID
  if (population.geography?.id) {
    return population.geography.id;
  }

  return 'Unknown Population';
}

/**
 * Gets a human-readable label for a simulation.
 * Priority: simulation.label → Simulation #${id} → 'Unknown Simulation'
 *
 * @param simulation - The simulation object
 * @returns A human-readable label
 */
export function getSimulationLabel(simulation: Simulation | null): string {
  if (!simulation) {
    return 'Unknown Simulation';
  }

  // First priority: user-defined label
  if (simulation.label) {
    return simulation.label;
  }

  // Second priority: simulation ID
  if (simulation.id) {
    return `Simulation #${simulation.id}`;
  }

  return 'Unknown Simulation';
}
