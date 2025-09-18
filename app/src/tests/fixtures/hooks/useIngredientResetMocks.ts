import { vi } from 'vitest';

// Create a mock dispatch function
export const createMockDispatch = () => vi.fn();

// Create a mock store
export const createMockStore = (dispatch: ReturnType<typeof vi.fn>) => ({
  getState: vi.fn(),
  dispatch,
  subscribe: vi.fn(),
  replaceReducer: vi.fn(),
  [Symbol.observable]: vi.fn(),
});

// Test constants
export const TEST_MODES = {
  STANDALONE: 'standalone',
  REPORT: 'report',
} as const;

export const TEST_POSITIONS = {
  FIRST: 0,
  SECOND: 1,
} as const;

export const TEST_INGREDIENTS = {
  POLICY: 'policy',
  POPULATION: 'population',
  SIMULATION: 'simulation',
  REPORT: 'report',
} as const;

// Expected action types
export const ACTION_TYPES = {
  CLEAR_ALL_POLICIES: 'policy/clearAllPolicies',
  CLEAR_ALL_POPULATIONS: 'population/clearAllPopulations',
  CLEAR_REPORT: 'report/clearReport',
  CLEAR_ALL_SIMULATIONS: 'simulations/clearAllSimulations',
  SET_MODE: 'report/setMode',
  SET_ACTIVE_SIMULATION_POSITION: 'report/setActiveSimulationPosition',
} as const;