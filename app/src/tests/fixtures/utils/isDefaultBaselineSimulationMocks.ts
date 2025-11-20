// Test constants
export const TEST_CURRENT_LAW_ID = 1;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  NG: 'ng',
  IL: 'il',
  UNKNOWN: 'xyz',
} as const;

export const EXPECTED_LABELS = {
  US: 'United States current law for all households nationwide',
  UK: 'United Kingdom current law for all households nationwide',
  CA: 'Canada current law for all households nationwide',
  NG: 'Nigeria current law for all households nationwide',
  IL: 'Israel current law for all households nationwide',
  UNKNOWN: 'XYZ current law for all households nationwide',
} as const;

// Mock simulation that matches all default baseline criteria
export const mockDefaultBaselineSimulation: any = {
  userSimulation: {
    id: 'user-sim-1',
    simulationId: 'sim-123',
    label: EXPECTED_LABELS.US,
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T10:00:00Z',
  },
  simulation: {
    id: 'sim-123',
    policyId: TEST_CURRENT_LAW_ID.toString(),
    label: EXPECTED_LABELS.US,
    isCreated: true,
    populationType: 'geography',
    populationId: TEST_COUNTRIES.US,
  },
  geography: {
    id: 'geo-1',
    countryId: TEST_COUNTRIES.US,
    geographyId: TEST_COUNTRIES.US,
    scope: 'national',
    label: 'US nationwide',
    createdAt: '2024-01-15T10:00:00Z',
  },
};

// Mock simulation with custom policy (not current law)
export const mockCustomPolicySimulation: any = {
  userSimulation: {
    id: 'user-sim-2',
    simulationId: 'sim-456',
    label: 'Custom reform',
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T11:00:00Z',
  },
  simulation: {
    label: 'test',
    isCreated: true,
    id: 'sim-456',
    policyId: '999',
    populationType: 'geography',
    populationId: TEST_COUNTRIES.US,
  },
  geography: {
    id: 'geo-2',
    countryId: TEST_COUNTRIES.US,
    geographyId: TEST_COUNTRIES.US,
    scope: 'national',
    label: 'US nationwide',
    createdAt: '2024-01-15T11:00:00Z',
  },
};

// Mock simulation with subnational geography
export const mockSubnationalSimulation: any = {
  userSimulation: {
    id: 'user-sim-3',
    simulationId: 'sim-789',
    label: 'California simulation',
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T12:00:00Z',
  },
  simulation: {
    label: 'test',
    isCreated: true,
    id: 'sim-789',
    policyId: TEST_CURRENT_LAW_ID.toString(),
    populationType: 'geography',
    populationId: 'state/ca', // Subnational
  },
  geography: {
    id: 'geo-3',
    countryId: TEST_COUNTRIES.US,
    geographyId: 'state/ca',
    scope: 'subnational',
    label: 'California',
    createdAt: '2024-01-15T12:00:00Z',
  },
};

// Mock simulation with household population type
export const mockHouseholdSimulation: any = {
  userSimulation: {
    id: 'user-sim-4',
    simulationId: 'sim-101',
    label: 'Household simulation',
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T13:00:00Z',
  },
  simulation: {
    label: 'test',
    isCreated: true,
    id: 'sim-101',
    policyId: TEST_CURRENT_LAW_ID.toString(),
    populationType: 'household',
    populationId: 'household-123',
  },
};

// Mock simulation with wrong label
export const mockWrongLabelSimulation: any = {
  userSimulation: {
    id: 'user-sim-5',
    simulationId: 'sim-202',
    label: 'Wrong label here',
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T14:00:00Z',
  },
  simulation: {
    label: 'test',
    isCreated: true,
    id: 'sim-202',
    policyId: TEST_CURRENT_LAW_ID.toString(),
    populationType: 'geography',
    populationId: TEST_COUNTRIES.US,
  },
  geography: {
    id: 'geo-5',
    countryId: TEST_COUNTRIES.US,
    geographyId: TEST_COUNTRIES.US,
    scope: 'national',
    label: 'US nationwide',
    createdAt: '2024-01-15T14:00:00Z',
  },
};

// Mock simulation with missing nested data
export const mockIncompleteSimulation: any = {
  userSimulation: {
    id: 'user-sim-6',
    simulationId: 'sim-303',
    label: EXPECTED_LABELS.US,
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T15:00:00Z',
  },
  simulation: undefined,
};

// Mock UK default baseline simulation
export const mockUKDefaultBaselineSimulation: any = {
  userSimulation: {
    id: 'user-sim-7',
    simulationId: 'sim-404',
    label: EXPECTED_LABELS.UK,
    countryId: TEST_COUNTRIES.UK,
    createdAt: '2024-01-15T16:00:00Z',
  },
  simulation: {
    label: 'test',
    isCreated: true,
    id: 'sim-404',
    policyId: TEST_CURRENT_LAW_ID.toString(),
    populationType: 'geography',
    populationId: TEST_COUNTRIES.UK,
  },
  geography: {
    id: 'geo-7',
    countryId: TEST_COUNTRIES.UK,
    geographyId: TEST_COUNTRIES.UK,
    scope: 'national',
    label: 'UK nationwide',
    createdAt: '2024-01-15T16:00:00Z',
  },
};
