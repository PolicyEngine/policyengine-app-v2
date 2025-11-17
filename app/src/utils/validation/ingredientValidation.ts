import { PolicyStateProps, PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';

/**
 * Validation utilities for ingredient configuration state
 *
 * These functions replace the `isCreated` flag pattern with validation based on
 * actual data presence (primarily ID fields). This provides a single source of
 * truth and eliminates the possibility of stale flags.
 */

/**
 * Checks if a policy is fully configured and ready for use in a simulation
 *
 * A policy is considered configured if it has an ID, which happens when:
 * - User creates custom policy and submits to API
 * - User selects current law (ID = currentLawId)
 * - User loads existing policy from database
 */
export function isPolicyConfigured(policy: PolicyStateProps | null | undefined): boolean {
  return !!policy?.id;
}

/**
 * Checks if a population is fully configured and ready for use in a simulation
 *
 * A population is considered configured if it has either:
 * - A household with an ID (from API creation)
 * - A geography with an ID (from scope selection via createGeographyFromScope)
 */
export function isPopulationConfigured(population: PopulationStateProps | null | undefined): boolean {
  if (!population) return false;
  return !!(population.household?.id || population.geography?.id);
}

/**
 * Checks if a simulation is fully configured
 *
 * A simulation is considered configured if:
 * - It has a simulation ID from API (fully persisted), OR
 * - Both its policy and population are configured (ready to submit)
 */
export function isSimulationConfigured(simulation: SimulationStateProps | null | undefined): boolean {
  if (!simulation) return false;

  // Fully persisted simulation
  if (simulation.id) return true;

  // Pre-submission: check if ingredients are ready
  return isPolicyConfigured(simulation.policy) && isPopulationConfigured(simulation.population);
}

/**
 * Checks if a simulation is ready to be submitted to the API
 *
 * Different from isSimulationConfigured in that it specifically checks
 * if the ingredients are ready, regardless of whether simulation ID exists.
 * Useful for enabling "Submit" buttons.
 */
export function isSimulationReadyToSubmit(simulation: SimulationStateProps | null | undefined): boolean {
  if (!simulation) return false;
  return isPolicyConfigured(simulation.policy) && isPopulationConfigured(simulation.population);
}

/**
 * Checks if a simulation has been persisted to the database
 *
 * Different from isSimulationConfigured in that it only checks for
 * simulation ID existence, not ingredient readiness.
 */
export function isSimulationPersisted(simulation: SimulationStateProps | null | undefined): boolean {
  return !!simulation?.id;
}
