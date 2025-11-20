import { vi } from 'vitest';

// Test constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_USER_ID = 'test-user-123';
export const TEST_CURRENT_LAW_ID = 1;
export const TEST_SIMULATION_ID = 'sim-123';
export const TEST_EXISTING_SIMULATION_ID = 'existing-sim-456';
export const TEST_GEOGRAPHY_ID = 'geo-789';

export const DEFAULT_BASELINE_LABELS = {
  US: 'United States current law for all households nationwide',
  UK: 'United Kingdom current law for all households nationwide',
} as const;

// Mock existing simulation that matches default baseline criteria
export const mockExistingDefaultBaselineSimulation: any = {
  userSimulation: {
    id: 'user-sim-1',
    userId: TEST_USER_ID,
    simulationId: TEST_EXISTING_SIMULATION_ID,
    label: DEFAULT_BASELINE_LABELS.US,
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T10:00:00Z',
  },
  simulation: {
    id: TEST_EXISTING_SIMULATION_ID,
    policyId: TEST_CURRENT_LAW_ID.toString(),
    populationType: 'geography',
    populationId: TEST_COUNTRIES.US,
  },
  geography: {
    id: 'geo-1',
    userId: TEST_USER_ID,
    countryId: TEST_COUNTRIES.US,
    geographyId: TEST_COUNTRIES.US,
    scope: 'national',
    label: 'US nationwide',
    createdAt: '2024-01-15T10:00:00Z',
  },
};

// Mock simulation with different policy (not default baseline)
export const mockNonDefaultSimulation: any = {
  userSimulation: {
    id: 'user-sim-2',
    userId: TEST_USER_ID,
    simulationId: 'sim-different',
    label: 'Custom reform',
    countryId: TEST_COUNTRIES.US,
    createdAt: '2024-01-15T11:00:00Z',
  },
  simulation: {
    id: 'sim-different',
    policyId: '999', // Different policy
    populationType: 'geography',
    populationId: TEST_COUNTRIES.US,
  },
  geography: {
    id: 'geo-2',
    userId: TEST_USER_ID,
    countryId: TEST_COUNTRIES.US,
    geographyId: TEST_COUNTRIES.US,
    scope: 'national',
    label: 'US nationwide',
    createdAt: '2024-01-15T11:00:00Z',
  },
};

// Mock callbacks
export const mockOnSelect = vi.fn();

// Mock API responses
export const mockGeographyCreationResponse = {
  id: TEST_GEOGRAPHY_ID,
  userId: TEST_USER_ID,
  countryId: TEST_COUNTRIES.US,
  geographyId: TEST_COUNTRIES.US,
  scope: 'national' as const,
  label: 'US nationwide',
  createdAt: new Date().toISOString(),
};

export const mockSimulationCreationResponse = {
  status: 'ok' as const,
  result: {
    simulation_id: TEST_SIMULATION_ID,
  },
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  mockOnSelect.mockClear();
};

// Mock hook return values
export const mockUseUserSimulationsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  associations: { simulations: [], policies: [], households: [] },
  getSimulationWithFullContext: vi.fn(),
  getSimulationsByPolicy: vi.fn(() => []),
  getSimulationsByHousehold: vi.fn(() => []),
  getSimulationsByGeography: vi.fn(() => []),
  getNormalizedHousehold: vi.fn(),
  getPolicyLabel: vi.fn(),
} as any;

export const mockUseUserSimulationsWithExisting = {
  data: [mockExistingDefaultBaselineSimulation, mockNonDefaultSimulation],
  isLoading: false,
  isError: false,
  error: null,
  associations: { simulations: [], policies: [], households: [] },
  getSimulationWithFullContext: vi.fn(),
  getSimulationsByPolicy: vi.fn(() => []),
  getSimulationsByHousehold: vi.fn(() => []),
  getSimulationsByGeography: vi.fn(() => []),
  getNormalizedHousehold: vi.fn(),
  getPolicyLabel: vi.fn(),
} as any;

export const mockUseCreateGeographicAssociation = {
  mutateAsync: vi.fn().mockResolvedValue(mockGeographyCreationResponse),
  isPending: false,
  isError: false,
  error: null,
  mutate: vi.fn(),
  reset: vi.fn(),
  status: 'idle' as const,
} as any;

export const mockUseCreateSimulation = {
  createSimulation: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
} as any;
