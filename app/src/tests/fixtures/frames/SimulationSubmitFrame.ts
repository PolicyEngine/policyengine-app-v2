import { Simulation } from '@/types/ingredients/Simulation';

// Test IDs
export const TEST_SIMULATION_ID = '123';
export const TEST_SIMULATION_ID_MISSING = '999';
export const TEST_HOUSEHOLD_ID = '456';
export const TEST_POLICY_ID = '789';

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
    policies: [{
      id: TEST_POLICY_ID,
      label: TEST_POLICY_LABEL,
      parameters: [],
      isCreated: true,
    }, null] as any,
  },
  population: {
    populations: [{
      household: {
        id: TEST_HOUSEHOLD_ID,
      },
      label: TEST_POPULATION_LABEL,
      isCreated: true,
      geography: null,
    }, null] as any,
  },
};

export const mockStateWithNewSimulation = {
  simulations: {
    simulations: [mockSimulationComplete, null] as [Simulation | null, Simulation | null],
  },
  policy: {
    policies: [{
      id: TEST_POLICY_ID,
      label: TEST_POLICY_LABEL,
      parameters: [],
      isCreated: true,
    }, null] as any,
  },
  population: {
    populations: [{
      household: {
        id: TEST_HOUSEHOLD_ID,
      },
      label: TEST_POPULATION_LABEL,
      isCreated: true,
      geography: null,
    }, null] as any,
  },
};

export const mockStateWithBothSimulations = {
  // Old state
  simulation: mockSimulationPartial,
  // New state
  simulations: {
    simulations: [mockSimulationComplete, null] as [Simulation | null, Simulation | null],
  },
  policy: {
    policies: [{
      id: TEST_POLICY_ID,
      label: TEST_POLICY_LABEL,
      parameters: [],
      isCreated: true,
    }, null] as any,
  },
  population: {
    populations: [{
      household: {
        id: TEST_HOUSEHOLD_ID,
      },
      label: TEST_POPULATION_LABEL,
      isCreated: true,
      geography: null,
    }, null] as any,
  },
};
