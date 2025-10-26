import { RootState } from '@/store';

// Helper to detect Immer Proxy objects
function isProxy(obj: any): boolean {
  return obj != null && typeof obj === 'object' && obj.constructor?.name === 'DraftObject';
}

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
  const position = state.report.mode === 'report' ? state.report.activeSimulationPosition : 0;
  return state.simulations.simulations[position];
};

/**
 * Select the currently active policy based on mode and position
 * In report mode: uses activeSimulationPosition from report
 * In standalone mode: defaults to position 0
 */
export const selectActivePolicy = (state: RootState) => {
  const position = state.report.mode === 'report' ? state.report.activeSimulationPosition : 0;
  const policy = state.policy.policies[position];

  console.log('[SELECTOR] selectActivePolicy - position:', position);
  console.log('[SELECTOR] selectActivePolicy - policy:', policy);
  console.log('[SELECTOR] policy is Proxy?', isProxy(policy));

  if (policy?.parameters) {
    console.log('[SELECTOR] policy.parameters:', policy.parameters);
    console.log('[SELECTOR] policy.parameters is Proxy?', isProxy(policy.parameters));

    if (policy.parameters.length > 0) {
      const firstParam = policy.parameters[0];
      console.log('[SELECTOR] first parameter:', firstParam);
      console.log('[SELECTOR] first parameter is Proxy?', isProxy(firstParam));

      if (firstParam?.values && firstParam.values.length > 0) {
        console.log('[SELECTOR] first parameter values:', firstParam.values);
        console.log('[SELECTOR] values is Proxy?', isProxy(firstParam.values));
        console.log('[SELECTOR] first value:', firstParam.values[0]);
        console.log('[SELECTOR] first value is Proxy?', isProxy(firstParam.values[0]));
      }
    }
  }

  return policy;
};

/**
 * Select the currently active population based on mode and position
 * In report mode: uses activeSimulationPosition from report
 * In standalone mode: defaults to position 0
 */
export const selectActivePopulation = (state: RootState) => {
  const position = state.report.mode === 'report' ? state.report.activeSimulationPosition : 0;
  return state.population.populations[position];
};

/**
 * Get the current position based on mode
 * In report mode: returns activeSimulationPosition from report
 * In standalone mode: returns 0
 */
export const selectCurrentPosition = (state: RootState): 0 | 1 => {
  return state.report.mode === 'report' ? state.report.activeSimulationPosition : 0;
};
