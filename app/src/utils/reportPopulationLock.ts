import { Population } from '@/types/ingredients/Population';
import { Simulation } from '@/types/ingredients/Simulation';

/**
 * Configuration for population selection when in report mode
 */
export interface PopulationLockConfig {
  shouldLock: boolean;
  otherSimulation: Simulation | null;
  otherPopulation: Population | null;
}

/**
 * Determines if population selection should be locked to match another simulation in a report.
 * In report mode, both simulations must use the same population, so when one simulation already
 * has a population configured, the other simulation must use that same population.
 *
 * @param mode - The current mode ('standalone' | 'report')
 * @param otherSimulation - The other simulation in the report (if any)
 * @param otherPopulation - The population of the other simulation (if any, used for display)
 * @returns Configuration object indicating if population should be locked
 */
export function getPopulationLockConfig(
  mode: 'standalone' | 'report',
  otherSimulation: Simulation | null,
  otherPopulation: Population | null
): PopulationLockConfig {
  const shouldLock = mode === 'report' && !!otherSimulation?.populationId;

  return {
    shouldLock,
    otherSimulation,
    otherPopulation,
  };
}

/**
 * Gets the appropriate title for the population selection frame
 *
 * @param shouldLock - Whether population selection is locked
 * @returns The title text
 */
export function getPopulationSelectionTitle(shouldLock: boolean): string {
  return shouldLock ? 'Apply Population' : 'Select Population';
}

/**
 * Gets the appropriate subtitle for the population selection frame
 *
 * @param shouldLock - Whether population selection is locked
 * @returns The subtitle text, or undefined if no subtitle needed
 */
export function getPopulationSelectionSubtitle(shouldLock: boolean): string | undefined {
  return shouldLock
    ? 'This report requires using the same population as the other simulation'
    : undefined;
}
