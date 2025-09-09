import { Simulation } from '@/types/ingredients/Simulation';

// Test IDs
export const TEST_SIMULATION_ID = 'sim-test-123';
export const TEST_SIMULATION_ID_MISSING = 'sim-missing-999';
export const TEST_HOUSEHOLD_ID = 'household-456';
export const TEST_POLICY_ID = 'policy-789';

// Test labels
export const TEST_SIMULATION_LABEL = 'Test Simulation Submit';
export const TEST_POPULATION_LABEL = 'Test Population';
export const TEST_POLICY_LABEL = 'Test Policy Reform';

// UI text constants
export const SUBMIT_BUTTON_TEXT = 'Save Simulation';
export const SUBMIT_VIEW_TITLE = 'Summary of Selections';
export const POPULATION_ADDED_TITLE = 'Population Added';
export const POLICY_REFORM_ADDED_TITLE = 'Policy Reform Added';

// Mock simulations for different test scenarios
export const mockSimulationComplete: Simulation = {
  id: TEST_SIMULATION_ID,
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
  policyId: TEST_POLICY_ID,
  label: TEST_SIMULATION_LABEL,
  isCreated: false,
};

export const mockSimulationPartial: Simulation = {
  id: TEST_SIMULATION_ID,
  populationId: TEST_HOUSEHOLD_ID,
  populationType: 'household',
  policyId: undefined,
  label: TEST_SIMULATION_LABEL,
  isCreated: false,
};

export const mockSimulationEmpty: Simulation = {
  id: undefined,
  populationId: undefined,
  populationType: undefined,
  policyId: undefined,
  label: null,
  isCreated: false,
};

// Mock state configurations for testing
export const mockStateWithOldSimulation = {
  simulation: mockSimulationComplete,
  policy: {
    id: TEST_POLICY_ID,
    label: TEST_POLICY_LABEL,
    isCreated: true,
  },
  population: {
    household: {
      id: TEST_HOUSEHOLD_ID,
    },
    label: TEST_POPULATION_LABEL,
    isCreated: true,
  },
};

export const mockStateWithNewSimulation = {
  simulations: {
    entities: {
      [TEST_SIMULATION_ID]: mockSimulationComplete,
    },
    ids: [TEST_SIMULATION_ID],
    activeId: TEST_SIMULATION_ID,
    mode: 'single' as const,
  },
  policy: {
    id: TEST_POLICY_ID,
    label: TEST_POLICY_LABEL,
    isCreated: true,
  },
  population: {
    household: {
      id: TEST_HOUSEHOLD_ID,
    },
    label: TEST_POPULATION_LABEL,
    isCreated: true,
  },
};

export const mockStateWithBothSimulations = {
  // Old state
  simulation: mockSimulationPartial,
  // New state
  simulations: {
    entities: {
      [TEST_SIMULATION_ID]: mockSimulationComplete,
    },
    ids: [TEST_SIMULATION_ID],
    activeId: TEST_SIMULATION_ID,
    mode: 'single' as const,
  },
  policy: {
    id: TEST_POLICY_ID,
    label: TEST_POLICY_LABEL,
    isCreated: true,
  },
  population: {
    household: {
      id: TEST_HOUSEHOLD_ID,
    },
    label: TEST_POPULATION_LABEL,
    isCreated: true,
  },
};
