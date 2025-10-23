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

// Helper function to create EnhancedUserSimulation from a basic simulation
export function createEnhancedUserSimulation(simulation: typeof MOCK_CONFIGURED_SIMULATION_1) {
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
    simulation: simulation,
    policy: simulation.policyId
      ? {
          id: simulation.policyId,
          label: `Policy ${simulation.policyId}`,
          countryId: 'us',
          data: {},
        }
      : undefined,
    household: simulation.populationType === 'household' && simulation.populationId
      ? {
          id: simulation.populationId,
          label: `Household ${simulation.populationId}`,
          countryId: 'us',
          data: {},
        }
      : undefined,
    geography: simulation.populationType === 'geography' && simulation.populationId
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
