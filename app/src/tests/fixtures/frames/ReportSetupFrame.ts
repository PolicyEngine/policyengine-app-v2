// Test constants for ReportSetupFrame
export const REPORT_SETUP_FRAME_TITLE = 'Setup Report';

// Card titles and descriptions
export const BASELINE_SIMULATION_TITLE = 'Baseline simulation';
export const BASELINE_SIMULATION_DESCRIPTION = 'Select your baseline simulation';
export const COMPARISON_SIMULATION_WAITING_TITLE = 'Comparison simulation · Waiting for baseline';
export const COMPARISON_SIMULATION_WAITING_DESCRIPTION = 'Set up your baseline simulation first';
export const COMPARISON_SIMULATION_OPTIONAL_TITLE = 'Comparison simulation (optional)';
export const COMPARISON_SIMULATION_OPTIONAL_DESCRIPTION =
  'Optional: add a second simulation to compare';
export const COMPARISON_SIMULATION_REQUIRED_TITLE = 'Comparison simulation';
export const COMPARISON_SIMULATION_REQUIRED_DESCRIPTION =
  'Required: add a second simulation to compare';

export const BASELINE_CONFIGURED_TITLE_PREFIX = 'Baseline:';
export const COMPARISON_CONFIGURED_TITLE_PREFIX = 'Comparison:';

// Button labels
export const SETUP_BASELINE_SIMULATION_LABEL = 'Setup baseline simulation';
export const SETUP_COMPARISON_SIMULATION_LABEL = 'Setup comparison simulation';
export const REVIEW_REPORT_LABEL = 'Review report';

// Console log messages
export const ADDING_SIMULATION_1_MESSAGE = 'Adding simulation 1';
export const ADDING_SIMULATION_2_MESSAGE = 'Adding simulation 2';
export const SETTING_UP_SIMULATION_1_MESSAGE = 'Setting up simulation 1';
export const SETTING_UP_SIMULATION_2_MESSAGE = 'Setting up simulation 2';
export const BOTH_SIMULATIONS_CONFIGURED_MESSAGE =
  'Both simulations configured, proceeding to next step';

// Mock simulation data
export const MOCK_HOUSEHOLD_SIMULATION = {
  id: '1',
  label: 'Test Household Sim',
  policyId: '1',
  populationId: 'household-123', // Matches TEST_HOUSEHOLD_ID_1 from useUserHouseholdMocks
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_GEOGRAPHY_SIMULATION = {
  id: '2',
  label: 'Test Geography Sim',
  policyId: '2',
  populationId: 'geography-789', // Matches TEST_GEOGRAPHY_ID_1 from useUserHouseholdMocks
  populationType: 'geography' as const,
  isCreated: true,
};

export const MOCK_COMPARISON_SIMULATION = {
  id: '3',
  label: 'Test Comparison Sim',
  policyId: '3',
  populationId: 'household_2',
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

export const MOCK_PARTIALLY_CONFIGURED_SIMULATION = {
  id: undefined,
  label: 'In Progress',
  policyId: '1',
  populationId: undefined, // Missing population
  populationType: 'household' as const,
  isCreated: false,
};

// Population data for prefill tests
export const MOCK_POPULATION_1 = {
  label: 'Test Population 1',
  isCreated: true,
  household: {
    id: 'household-123',
    countryId: 'us' as any,
    householdData: {
      people: { you: { age: { '2025': 30 } } },
      families: {},
      spm_units: {},
      households: { 'your household': { members: ['you'] } },
      marital_units: {},
      tax_units: { 'your tax unit': { members: ['you'] } },
    },
  },
  geography: null,
};

export const MOCK_POPULATION_2 = {
  label: 'Test Population 2',
  isCreated: true,
  household: {
    id: 'household-456',
    countryId: 'us' as any,
    householdData: {
      people: { you: { age: { '2025': 35 } } },
      families: {},
      spm_units: {},
      households: { 'your household': { members: ['you'] } },
      marital_units: {},
      tax_units: { 'your tax unit': { members: ['you'] } },
    },
  },
  geography: null,
};

export const MOCK_GEOGRAPHY_POPULATION = {
  label: 'Geographic Population',
  isCreated: true,
  household: null,
  geography: {
    id: 'geography-789',
    countryId: 'us' as any,
    scope: 'national',
    geographyId: 'us',
  },
};

// Console messages for prefill
export const PREFILL_CONSOLE_MESSAGES = {
  PRE_FILLING_START: '[ReportSetupFrame] ===== PRE-FILLING POPULATION 2 =====',
  PRE_FILLING_HOUSEHOLD: '[ReportSetupFrame] Pre-filling household population',
  PRE_FILLING_GEOGRAPHY: '[ReportSetupFrame] Pre-filling geographic population',
  HOUSEHOLD_SUCCESS: '[ReportSetupFrame] Household population pre-filled successfully',
  GEOGRAPHY_SUCCESS: '[ReportSetupFrame] Geographic population pre-filled successfully',
  ALREADY_EXISTS: '[ReportSetupFrame] Population 2 already exists, skipping prefill',
  NO_POPULATION: '[ReportSetupFrame] Cannot prefill: simulation1 has no population',
};

// Loading messages
export const LOADING_POPULATION_DATA_MESSAGE = 'Loading population data...';
