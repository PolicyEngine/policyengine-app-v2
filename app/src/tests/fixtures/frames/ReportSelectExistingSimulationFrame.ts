// Test constants for ReportSelectExistingSimulationFrame
export const SELECT_EXISTING_SIMULATION_FRAME_TITLE = 'Select an Existing Simulation';

// UI labels
export const NEXT_BUTTON_LABEL = 'Next';
export const NO_SIMULATIONS_MESSAGE = 'No simulations available. Please create a new simulation.';
export const SEARCH_LABEL = 'Search';
export const SEARCH_TODO = 'TODO: Search';
export const YOUR_SIMULATIONS_LABEL = 'Your Simulations';
export const SHOWING_SIMULATIONS_PREFIX = 'Showing';
export const SIMULATIONS_SUFFIX = 'simulations';

// Mock simulation data
export const MOCK_CONFIGURED_SIMULATION_1 = {
  id: '1',
  label: 'Test Simulation 1',
  policyId: '1',
  populationId: '1',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_CONFIGURED_SIMULATION_2 = {
  id: '2',
  label: 'Test Simulation 2',
  policyId: '2',
  populationId: 'pop-2',
  populationType: 'geography' as const,
  isCreated: true,
};

export const MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL = {
  id: '3',
  label: null,
  policyId: '3',
  populationId: '3',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_UNCONFIGURED_SIMULATION = {
  id: '4',
  label: 'Incomplete Simulation',
  policyId: undefined,
  populationId: undefined,
  populationType: undefined,
  isCreated: false,
};

// Console log messages
export const SELECTED_SIMULATION_LOG_PREFIX = 'Submitting Simulation in handleSubmit:';
export const AFTER_SORTING_LOG = '[ReportSelectExistingSimulationFrame] ========== AFTER SORTING ==========';

// Incompatibility messages
export const INCOMPATIBLE_POPULATION_MESSAGE = 'Incompatible: different population than configured simulation';

// Population IDs for sorting tests
export const SHARED_POPULATION_ID = 'pop-123';
export const DIFFERENT_POPULATION_ID = 'pop-different';
export const BASE_POPULATION_ID = 'pop-base';
export const SHARED_POPULATION_ID_2 = 'pop-shared';

// Simulations for sorting tests
export const OTHER_SIMULATION_CONFIG = {
  id: 'other-sim',
  label: 'Other Simulation',
  policyId: 'policy-1',
  populationId: SHARED_POPULATION_ID,
  populationType: 'household' as const,
  isCreated: true,
};

export const INCOMPATIBLE_SIMULATION_CONFIG = {
  id: '1',
  label: 'Incompatible Sim',
  policyId: '1',
  populationId: DIFFERENT_POPULATION_ID,
  populationType: 'household' as const,
  isCreated: true,
};

export const COMPATIBLE_SIMULATION_CONFIG = {
  id: '2',
  label: 'Compatible Sim',
  policyId: '2',
  populationId: SHARED_POPULATION_ID,
  populationType: 'household' as const,
  isCreated: true,
};

// Compatible simulations for "all compatible" test
export const COMPATIBLE_SIMULATIONS = [
  {
    id: '1',
    label: 'Sim A',
    policyId: '1',
    populationId: SHARED_POPULATION_ID_2,
    populationType: 'household' as const,
    isCreated: true,
  },
  {
    id: '2',
    label: 'Sim B',
    policyId: '2',
    populationId: SHARED_POPULATION_ID_2,
    populationType: 'household' as const,
    isCreated: true,
  },
  {
    id: '3',
    label: 'Sim C',
    policyId: '3',
    populationId: SHARED_POPULATION_ID_2,
    populationType: 'household' as const,
    isCreated: true,
  },
];

// Incompatible simulations for "all incompatible" test
export const INCOMPATIBLE_SIMULATIONS = [
  {
    id: '1',
    label: 'Sim X',
    policyId: '1',
    populationId: 'pop-different-1',
    populationType: 'household' as const,
    isCreated: true,
  },
  {
    id: '2',
    label: 'Sim Y',
    policyId: '2',
    populationId: 'pop-different-2',
    populationType: 'household' as const,
    isCreated: true,
  },
  {
    id: '3',
    label: 'Sim Z',
    policyId: '3',
    populationId: 'pop-different-3',
    populationType: 'household' as const,
    isCreated: true,
  },
];

// Simulations for "no other simulation" test
export const VARIOUS_POPULATION_SIMULATIONS = [
  {
    id: '1',
    label: 'Sim 1',
    policyId: '1',
    populationId: 'pop-A',
    populationType: 'household' as const,
    isCreated: true,
  },
  {
    id: '2',
    label: 'Sim 2',
    policyId: '2',
    populationId: 'pop-B',
    populationType: 'household' as const,
    isCreated: true,
  },
];

// Simulation for log message test
export const TEST_SIMULATION_CONFIG = {
  id: '1',
  label: 'Test Sim',
  policyId: '1',
  populationId: 'pop-1',
  populationType: 'household' as const,
  isCreated: true,
};

// Helper function to create other simulation with custom populationId
export function createOtherSimulation(populationId: string) {
  return {
    id: 'other-sim',
    label: 'Other Simulation',
    policyId: 'policy-1',
    populationId,
    populationType: 'household' as const,
    isCreated: true,
  };
}

// Helper function to create EnhancedUserSimulation from a basic simulation
export function createEnhancedUserSimulation(
  simulation:
    | typeof MOCK_CONFIGURED_SIMULATION_1
    | typeof MOCK_CONFIGURED_SIMULATION_2
    | typeof MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL
    | typeof MOCK_UNCONFIGURED_SIMULATION
) {
  return {
    userSimulation: {
      id: `user-sim-${simulation.id}`,
      userId: '1',
      simulationId: simulation.id,
      label: simulation.label,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      isCreated: simulation.isCreated,
    },
    simulation,
    policy: simulation.policyId
      ? {
          id: simulation.policyId,
          label: `Policy ${simulation.policyId}`,
          countryId: 'us',
          data: {},
        }
      : undefined,
    household:
      simulation.populationType && simulation.populationId
        ? {
            id: simulation.populationId,
            label: `Household ${simulation.populationId}`,
            countryId: 'us',
            data: {},
          }
        : undefined,
    geography:
      simulation.populationType && simulation.populationId
        ? {
            id: simulation.populationId,
            name: `Geography ${simulation.populationId}`,
            countryId: 'us',
            type: 'state' as const,
          }
        : undefined,
    isLoading: false,
    error: null,
  };
}
