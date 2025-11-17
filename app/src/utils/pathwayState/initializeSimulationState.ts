import { SimulationStateProps } from '@/types/pathwayState';
import { initializePolicyState } from './initializePolicyState';
import { initializePopulationState } from './initializePopulationState';

/**
 * Creates an empty SimulationStateProps object with default values
 *
 * Used to initialize simulation state in PathwayWrappers.
 * Includes nested policy and population state.
 * Matches the default state from simulationsReducer.ts but as a plain object
 * with nested ingredient state.
 */
export function initializeSimulationState(): SimulationStateProps {
  return {
    id: undefined,
    label: null,
    countryId: undefined,
    apiVersion: undefined,
    status: undefined,
    output: null,
    policy: initializePolicyState(),
    population: initializePopulationState(),
  };
}
