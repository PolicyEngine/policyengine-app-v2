/**
 * Reducer for managing congressional district fetch state
 */

import type { FetchState, FetchAction, StateDistrictData } from './types';

/**
 * Initial state for the fetch reducer
 */
export const initialFetchState: FetchState = {
  stateResponses: new Map(),
  completedStates: new Set(),
  loadingStates: new Set(),
  erroredStates: new Set(),
  hasStarted: false,
};

/**
 * Reducer for managing the fetch state of congressional district data.
 * Handles state transitions for starting fetch, completing states, and errors.
 */
export function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'START_FETCH':
      return handleStartFetch(action.stateCodes);

    case 'STATE_COMPLETED':
      return handleStateCompleted(state, action.stateCode, action.data);

    case 'STATE_ERRORED':
      return handleStateErrored(state, action.stateCode);

    case 'RESET':
      return initialFetchState;

    default:
      return state;
  }
}

/**
 * Handle the START_FETCH action - initialize all states as loading
 */
function handleStartFetch(stateCodes: string[]): FetchState {
  return {
    stateResponses: new Map(),
    completedStates: new Set(),
    loadingStates: new Set(stateCodes),
    erroredStates: new Set(),
    hasStarted: true,
  };
}

/**
 * Handle the STATE_COMPLETED action - move state from loading to completed
 */
function handleStateCompleted(
  state: FetchState,
  stateCode: string,
  data: StateDistrictData | null
): FetchState {
  const newStateResponses = new Map(state.stateResponses);
  if (data) {
    newStateResponses.set(stateCode, data);
  }

  const newLoadingStates = new Set(state.loadingStates);
  newLoadingStates.delete(stateCode);

  const newCompletedStates = new Set(state.completedStates);
  newCompletedStates.add(stateCode);

  return {
    ...state,
    stateResponses: newStateResponses,
    loadingStates: newLoadingStates,
    completedStates: newCompletedStates,
  };
}

/**
 * Handle the STATE_ERRORED action - move state from loading to errored
 */
function handleStateErrored(state: FetchState, stateCode: string): FetchState {
  const newLoadingStates = new Set(state.loadingStates);
  newLoadingStates.delete(stateCode);

  const newErroredStates = new Set(state.erroredStates);
  newErroredStates.add(stateCode);

  return {
    ...state,
    loadingStates: newLoadingStates,
    erroredStates: newErroredStates,
  };
}
