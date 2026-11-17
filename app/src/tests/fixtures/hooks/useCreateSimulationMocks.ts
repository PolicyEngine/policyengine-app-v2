import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import metadataReducer from '@/reducers/metadataReducer';
import { SIMULATION_IDS, TEST_COUNTRIES } from '../api/simulationMocks';

// ============= TEST CONSTANTS =============

// Labels and descriptions
export const TEST_LABELS = {
  SIMULATION: `Test Simulation ${CURRENT_YEAR}`,
  CUSTOM: 'Custom Simulation Label',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  CREATE_FAILED: 'Failed to create simulation',
  ASSOCIATION_FAILED: 'Failed to create simulation association',
} as const;

// Console log messages for assertions
export const CONSOLE_MESSAGES = {
  LABEL_LOG: 'simulation label in useCreateSimulation:',
  ASSOCIATION_ERROR: 'Simulation created but association failed:',
} as const;

// Query key patterns
export const QUERY_KEY_PATTERNS = {
  SIMULATION_ALL: ['simulations'],
  SIMULATION_BY_ID: (id: string) => ['simulations', 'byId', id],
} as const;

// ============= MOCK FUNCTIONS =============

// Mock function for createSimulation API
export const mockCreateSimulation = vi.fn();

// Mock function for association creation
export const mockCreateSimulationAssociationMutateAsync = vi.fn();

// Mock function for useCreateSimulationAssociation hook
export const mockUseCreateSimulationAssociation = vi.fn(() => ({
  mutateAsync: mockCreateSimulationAssociationMutateAsync,
}));

// ============= MOCK RESPONSES =============

// Default successful API response
export const mockCreateSimulationApiResponse = {
  result: {
    simulation_id: SIMULATION_IDS.NEW,
  },
};

// Default successful association response
export const mockCreateAssociationResponse = {
  userId: 'anonymous',
  simulationId: SIMULATION_IDS.NEW,
  label: TEST_LABELS.SIMULATION,
  isCreated: true,
};

// Response without simulation ID
export const mockResponseWithoutId = {
  result: {},
};

// ============= STORE HELPERS =============

/**
 * Creates a test Redux store with custom initial state
 * Uses only metadataReducer since other reducers were removed
 */
export function createTestStore(initialState?: any) {
  const storeConfig = {
    reducer: {
      metadata: metadataReducer,
    },
  };

  // Configure store with or without preloaded state
  if (initialState) {
    return configureStore({
      ...storeConfig,
      preloadedState: initialState,
    } as any);
  }

  return configureStore(storeConfig);
}

/**
 * Creates default metadata state for testing
 */
export function createDefaultMetadataState(country: string = TEST_COUNTRIES.US) {
  return {
    currentCountry: country,
    loading: false,
    error: null,
    variables: {},
    parameters: {},
    entities: {},
    variableModules: {},
    economyOptions: { region: [], time_period: [], datasets: [] },
    currentLawId: 0,
    basicInputs: [],
    modelledPolicies: { core: {}, filtered: {} },
    version: null,
    parameterTree: null,
  };
}

/**
 * Creates a mock store with specified country
 */
export function createMockStoreWithCountry(country: string | null) {
  return createTestStore({
    metadata: createDefaultMetadataState(country || undefined),
  });
}

// ============= CONSOLE SPY HELPERS =============

/**
 * Sets up console spies for testing
 * @returns Object with spies and restore function
 */
export function setupConsoleSpies() {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  return {
    logSpy,
    errorSpy,
    restore: () => {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    },
  };
}

// ============= DEFAULT MOCK SETUP =============

/**
 * Sets up default mock implementations for a test
 */
export function setupDefaultMocks() {
  // Reset all mocks
  mockCreateSimulation.mockReset();
  mockCreateSimulationAssociationMutateAsync.mockReset();
  mockUseCreateSimulationAssociation.mockReset();

  // Set default implementations
  mockCreateSimulation.mockResolvedValue(mockCreateSimulationApiResponse);
  mockCreateSimulationAssociationMutateAsync.mockResolvedValue(mockCreateAssociationResponse);
  mockUseCreateSimulationAssociation.mockReturnValue({
    mutateAsync: mockCreateSimulationAssociationMutateAsync,
  });
}

// ============= QUERY NORMALIZER =============

/** A simulation the cache already holds, as the app reads it: a string ID and parsed output. */
export const CACHED_SIMULATION = {
  id: SIMULATION_IDS.NEW,
  countryId: TEST_COUNTRIES.US,
  apiVersion: '1.0.0',
  policyId: '2',
  populationId: 'us',
  populationType: 'geography' as const,
  label: null,
  isCreated: true,
  output: { poverty: { baseline: 0.12 } },
  status: 'complete' as const,
};

/**
 * createSimulation's answer for that same simulation, which the Public API
 * already holds: its ID, and the simulation as stored (a numeric ID and
 * output as JSON text).
 */
export const mockCreateSimulationAnswerForCachedSimulation = {
  result: { simulation_id: SIMULATION_IDS.NEW },
  simulation: {
    id: Number(SIMULATION_IDS.NEW),
    country_id: TEST_COUNTRIES.US,
    api_version: '1.0.0',
    population_id: 'us',
    population_type: 'geography' as const,
    policy_id: '2',
    output: JSON.stringify({ poverty: { baseline: 0.12 } }),
    status: 'complete' as const,
  },
};
