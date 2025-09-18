import { RootState } from '@/store';

/**
 * Cross-cutting selectors that combine report position with other reducers
 * These selectors provide a unified way to access the "active" item based on the current mode
 */

/**
 * Select the currently active simulation based on mode and position
 * In report mode: uses activeSimulationPosition from report
 * In standalone mode: defaults to position 0
 */
export const selectActiveSimulation = (state: RootState) => {
  const position = state.report.mode === 'report'
    ? state.report.activeSimulationPosition
    : 0;
  return state.simulations.simulations[position];
};

/**
 * Select the currently active policy based on mode and position
 * In report mode: uses activeSimulationPosition from report
 * In standalone mode: defaults to position 0
 */
export const selectActivePolicy = (state: RootState) => {
  const position = state.report.mode === 'report'
    ? state.report.activeSimulationPosition
    : 0;
  return state.policy.policies[position];
};

/**
 * Select the currently active population based on mode and position
 * In report mode: uses activeSimulationPosition from report
 * In standalone mode: defaults to position 0
 */
export const selectActivePopulation = (state: RootState) => {
  const position = state.report.mode === 'report'
    ? state.report.activeSimulationPosition
    : 0;
  return state.population.populations[position];
};

/**
 * Get the current position based on mode
 * In report mode: returns activeSimulationPosition from report
 * In standalone mode: returns 0
 */
export const selectCurrentPosition = (state: RootState): 0 | 1 => {
  return state.report.mode === 'report'
    ? state.report.activeSimulationPosition
    : 0;
};