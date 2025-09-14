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
  id: 'sim-1',
  label: 'Test Simulation 1',
  policyId: 'policy-1',
  populationId: 'pop-1',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_CONFIGURED_SIMULATION_2 = {
  id: 'sim-2',
  label: 'Test Simulation 2',
  policyId: 'policy-2',
  populationId: 'pop-2',
  populationType: 'geography' as const,
  isCreated: true,
};

export const MOCK_CONFIGURED_SIMULATION_WITHOUT_LABEL = {
  id: 'sim-3',
  label: null,
  policyId: 'policy-3',
  populationId: 'pop-3',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_UNCONFIGURED_SIMULATION = {
  id: 'sim-4',
  label: 'Incomplete Simulation',
  policyId: undefined,
  populationId: undefined,
  populationType: undefined,
  isCreated: false,
};

// Console log messages
export const SELECTED_SIMULATION_LOG_PREFIX = 'Selected simulation:';