// Fixtures for SimulationSetupFrame tests

// UI text constants
export const UI_TEXT = {
  ADD_POPULATION: 'Add Population',
  ADD_POLICY: 'Add Policy',
  FROM_BASELINE_SUFFIX: '(from baseline)',
  INHERITED_HOUSEHOLD_PREFIX: 'Household population #',
  INHERITED_GEOGRAPHY_PREFIX: 'Geographic population #',
  INHERITED_SUFFIX: '• Inherited from baseline simulation',
  SELECT_GEOGRAPHIC_OR_HOUSEHOLD: 'Select a geographic scope or specific household',
};

// Mock populations
export const MOCK_HOUSEHOLD_POPULATION = {
  label: 'My Household',
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

export const MOCK_GEOGRAPHY_POPULATION = {
  label: 'United States',
  isCreated: true,
  household: null,
  geography: {
    id: 'geography-456',
    countryId: 'us' as any,
    scope: 'national',
    geographyId: 'us',
  },
};

export const MOCK_UNFILLED_POPULATION = {
  label: null,
  isCreated: false,
  household: null,
  geography: null,
};

// Mock policies
export const MOCK_POLICY = {
  id: 'policy-789',
  label: 'Test Policy',
  isCreated: true,
};

export const MOCK_UNFILLED_POLICY = {
  id: null,
  label: null,
  isCreated: false,
};

// Mock simulations
export const MOCK_SIMULATION = {
  id: 'sim-123',
  label: 'Test Simulation',
  policyId: 'policy-789',
  populationId: 'household-123',
  populationType: 'household' as const,
  isCreated: true,
};

export const MOCK_SIMULATION_NO_POPULATION = {
  id: 'sim-456',
  label: 'Sim Without Population',
  policyId: 'policy-789',
  populationId: undefined,
  populationType: undefined,
  isCreated: false,
};

// Test positions
export const POSITION_0 = 0;
export const POSITION_1 = 1;

// Mode constants
export const MODE_REPORT = 'report';
export const MODE_STANDALONE = 'standalone';
