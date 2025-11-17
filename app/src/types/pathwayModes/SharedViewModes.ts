/**
 * SharedViewModes - Common view modes used across multiple pathways
 *
 * These modes are shared between Report, Simulation, Policy, and Population pathways.
 * Each pathway can compose their own view mode enum using these shared modes.
 *
 * This approach:
 * - Reduces duplication
 * - Makes it clear which views are reusable
 * - Allows type-safe navigation across pathways
 * - Maintains independent pathway mode enums for flexibility
 */

/**
 * Policy-related modes used in multiple pathways
 * Used in: Report, Simulation pathways
 */
export enum PolicyViewMode {
  POLICY_LABEL = 'POLICY_LABEL',
  POLICY_PARAMETER_SELECTOR = 'POLICY_PARAMETER_SELECTOR',
  POLICY_SUBMIT = 'POLICY_SUBMIT',
  SELECT_EXISTING_POLICY = 'SELECT_EXISTING_POLICY',
  SETUP_POLICY = 'SETUP_POLICY',
}

/**
 * Population-related modes used in multiple pathways
 * Used in: Report, Simulation pathways
 */
export enum PopulationViewMode {
  POPULATION_SCOPE = 'POPULATION_SCOPE',
  POPULATION_LABEL = 'POPULATION_LABEL',
  POPULATION_HOUSEHOLD_BUILDER = 'POPULATION_HOUSEHOLD_BUILDER',
  POPULATION_GEOGRAPHIC_CONFIRM = 'POPULATION_GEOGRAPHIC_CONFIRM',
  SELECT_EXISTING_POPULATION = 'SELECT_EXISTING_POPULATION',
  SETUP_POPULATION = 'SETUP_POPULATION',
}

/**
 * Simulation-related modes used in multiple pathways
 * Used in: Report pathway (and future standalone Simulation pathway)
 */
export enum SimulationViewMode {
  SIMULATION_LABEL = 'SIMULATION_LABEL',
  SIMULATION_SETUP = 'SIMULATION_SETUP',
  SIMULATION_SUBMIT = 'SIMULATION_SUBMIT',
}

/**
 * Helper type to get all shared view mode values
 * Useful for type narrowing and validation
 */
export type SharedViewModeValue =
  | PolicyViewMode
  | PopulationViewMode
  | SimulationViewMode;

/**
 * Helper to check if a mode is a policy mode
 */
export function isPolicyMode(mode: string): mode is PolicyViewMode {
  return Object.values(PolicyViewMode).includes(mode as PolicyViewMode);
}

/**
 * Helper to check if a mode is a population mode
 */
export function isPopulationMode(mode: string): mode is PopulationViewMode {
  return Object.values(PopulationViewMode).includes(mode as PopulationViewMode);
}

/**
 * Helper to check if a mode is a simulation mode
 */
export function isSimulationMode(mode: string): mode is SimulationViewMode {
  return Object.values(SimulationViewMode).includes(mode as SimulationViewMode);
}
