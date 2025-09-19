// Test constants for ReportSetupFrame
export const REPORT_SETUP_FRAME_TITLE = 'Setup Report';

// Button labels
export const FIRST_SIMULATION_TITLE = 'Add a first simulation';
export const FIRST_SIMULATION_DESCRIPTION = 'Select a simulation simulation';
export const SECOND_SIMULATION_TITLE = 'Add a second simulation';
export const SECOND_SIMULATION_DESCRIPTION = 'Choose another simulation to compare against';

export const FIRST_SIMULATION_CONFIGURED_TITLE = 'Simulation 1: Configured';
export const SECOND_SIMULATION_CONFIGURED_TITLE = 'Simulation 2: Configured';

export const SETUP_FIRST_SIMULATION_LABEL = 'Setup first simulation';
export const SETUP_SECOND_SIMULATION_LABEL = 'Setup second simulation';
export const NEXT_BUTTON_LABEL = 'Next';

// Console log messages
export const ADDING_SIMULATION_1_MESSAGE = 'Adding simulation 1';
export const ADDING_SIMULATION_2_MESSAGE = 'Adding simulation 2';
export const SETTING_UP_SIMULATION_1_MESSAGE = 'Setting up simulation 1';
export const SETTING_UP_SIMULATION_2_MESSAGE = 'Setting up simulation 2';
export const BOTH_SIMULATIONS_CONFIGURED_MESSAGE =
  'Both simulations configured, proceeding to next step';

// Mock simulation data
export const MOCK_SIMULATION_1 = {
  id: '1',
  label: 'Test Simulation 1',
  policyId: '1',
  populationId: '1',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_SIMULATION_2 = {
  id: '2',
  label: 'Test Simulation 2',
  policyId: '2',
  populationId: '2',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_UNCONFIGURED_SIMULATION = {
  id: undefined,
  label: null,
  policyId: undefined,
  populationId: undefined,
  populationType: undefined,
  isCreated: false,
};
