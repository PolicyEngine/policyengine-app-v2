import { vi } from 'vitest';

// Test strings
export const SIMULATION_SETUP_STRINGS = {
  CANCEL_BUTTON: 'Cancel',
  NEXT_BUTTON: 'Next',
  TEST_POLICY_LABEL: 'Test Policy',
  TEST_POPULATION_LABEL: 'Test Population',
} as const;

// Mock store helper (needs vi.fn, so must stay)
export const createMockStore = (policyState: any = {}, populationState: any = {}) => ({
  getState: () => ({
    policy: policyState,
    population: populationState,
  }),
  dispatch: vi.fn(),
  subscribe: vi.fn(),
  replaceReducer: vi.fn(),
  [Symbol.observable]: vi.fn(),
});

// Test state data
export const mockPolicyState = {
  isCreated: true,
  label: SIMULATION_SETUP_STRINGS.TEST_POLICY_LABEL,
};

export const mockPopulationState = {
  isCreated: true,
  label: SIMULATION_SETUP_STRINGS.TEST_POPULATION_LABEL,
};
