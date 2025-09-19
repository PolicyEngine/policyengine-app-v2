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
export const SELECTED_SIMULATION_LOG_PREFIX = 'Selected simulation:';
