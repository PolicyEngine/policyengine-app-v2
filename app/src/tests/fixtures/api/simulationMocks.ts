import { vi } from 'vitest';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

// Descriptive constants for simulation IDs
export const EXISTING_SIMULATION_ID = 'sim-12345';
export const NON_EXISTENT_SIMULATION_ID = 'sim-99999';
export const NEW_SIMULATION_ID = 'sim-new-123';
export const DUPLICATE_SIMULATION_ID = 'sim-duplicate-456';

// Related entity IDs
export const TEST_HOUSEHOLD_ID = 'household-123';
export const TEST_GEOGRAPHY_ID = 'geo-456';
export const TEST_POLICY_ID = '789';
export const TEST_USER_ID = 'user-101';

// Grouped constants
export const SIMULATION_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const POPULATION_TYPES = {
  HOUSEHOLD: 'household' as const,
  GEOGRAPHY: 'geography' as const,
} as const;

export const TEST_COUNTRIES = {
  US: 'us' as const,
  UK: 'uk' as const,
  CA: 'ca' as const,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages matching implementation
export const ERROR_MESSAGES = {
  FETCH_SIMULATION_FAILED: (id: string) => `Failed to fetch simulation ${id}`,
  CREATE_SIMULATION_FAILED: 'Failed to create simulation',
  DELETE_SIMULATION_FAILED: (id: string) => `Failed to delete simulation ${id}`,
  UPDATE_SIMULATION_FAILED: (id: string) => `Failed to update simulation ${id}`,
  SIMULATION_NOT_FOUND: (id: string) => `Simulation ${id} not found`,
  INVALID_POPULATION_TYPE: 'Invalid population type',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
} as const;

// Base simulation data
export const mockSimulationData: Simulation = {
  id: EXISTING_SIMULATION_ID,
  countryId: TEST_COUNTRIES.US,
  apiVersion: '1.0.0',
  policyId: undefined,
  populationId: TEST_HOUSEHOLD_ID,
  populationType: POPULATION_TYPES.HOUSEHOLD,
  label: 'Test Simulation',
  isCreated: true,
};

// Simulation with policy
export const mockSimulationWithPolicy: Simulation = {
  ...mockSimulationData,
  id: 'sim-with-policy',
  policyId: TEST_POLICY_ID,
  label: 'Simulation with Policy',
};

// Simulation with geography
export const mockSimulationWithGeography: Simulation = {
  ...mockSimulationData,
  id: 'sim-with-geography',
  populationId: TEST_GEOGRAPHY_ID,
  populationType: POPULATION_TYPES.GEOGRAPHY,
  label: 'Geography Simulation',
};

// UK simulation
export const mockUKSimulation: Simulation = {
  ...mockSimulationData,
  id: 'sim-uk-123',
  countryId: TEST_COUNTRIES.UK,
  label: 'UK Simulation',
};

// Complete simulation with all fields
export const mockCompleteSimulation: Simulation = {
  id: 'sim-complete',
  countryId: TEST_COUNTRIES.US,
  apiVersion: '1.0.0',
  policyId: TEST_POLICY_ID,
  populationId: TEST_HOUSEHOLD_ID,
  populationType: POPULATION_TYPES.HOUSEHOLD,
  label: 'Complete Simulation',
  isCreated: true,
};

// Pending simulation
export const mockPendingSimulation: Simulation = {
  ...mockSimulationData,
  id: 'sim-pending',
  isCreated: false,
  label: 'Pending Simulation',
};

// Creation payloads
export const mockSimulationCreationPayload: SimulationCreationPayload = {
  population_id: TEST_HOUSEHOLD_ID,
  population_type: POPULATION_TYPES.HOUSEHOLD,
  policy_id: undefined,
};

export const mockSimulationCreationPayloadWithPolicy: SimulationCreationPayload = {
  population_id: TEST_HOUSEHOLD_ID,
  population_type: POPULATION_TYPES.HOUSEHOLD,
  policy_id: Number(TEST_POLICY_ID),
};

export const mockSimulationCreationPayloadGeography: SimulationCreationPayload = {
  population_id: TEST_GEOGRAPHY_ID,
  population_type: POPULATION_TYPES.GEOGRAPHY,
  policy_id: Number(TEST_POLICY_ID),
};

// Helper functions
export const mockSimulationSuccessResponse = (data: Simulation) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue({ result: data }),
});

export const mockSimulationErrorResponse = (status: number) => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
  json: vi.fn().mockResolvedValue({
    error: status === HTTP_STATUS.NOT_FOUND ? 'Simulation not found' : 'Internal server error',
  }),
});

export const mockCreateSimulationResponse = (id: string = NEW_SIMULATION_ID) => ({
  ok: true,
  status: HTTP_STATUS.CREATED,
  json: vi.fn().mockResolvedValue({
    result: { simulation_id: id },
  }),
});

export const createMockSimulation = (overrides?: Partial<Simulation>): Simulation => ({
  ...mockSimulationData,
  ...overrides,
});

// Array of simulations for list testing
export const mockSimulationList: Simulation[] = [
  mockSimulationData,
  mockSimulationWithPolicy,
  mockSimulationWithGeography,
  mockUKSimulation,
];

// Mock fetch responses
export const setupMockFetch = (response: any) => {
  global.fetch = vi.fn().mockResolvedValue(response);
};

export const setupMockFetchError = (error: Error) => {
  global.fetch = vi.fn().mockRejectedValue(error);
};

// Simulation metadata mock (if needed for API responses)
export const mockSimulationMetadata: SimulationMetadata = {
  id: EXISTING_SIMULATION_ID,
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  policy_id: TEST_POLICY_ID,
  population_id: TEST_HOUSEHOLD_ID,
  population_type: POPULATION_TYPES.HOUSEHOLD,
  label: 'Test Simulation Metadata',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};
