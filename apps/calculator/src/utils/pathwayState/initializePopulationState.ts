import { PopulationStateProps } from '@/types/pathwayState';

/**
 * Creates an empty PopulationStateProps object with default values
 *
 * Used to initialize population state in PathwayWrappers.
 * Matches the default state from populationReducer.ts but as a plain object.
 */
export function initializePopulationState(): PopulationStateProps {
  return {
    label: null,
    type: null,
    household: null,
    geography: null,
  };
}
