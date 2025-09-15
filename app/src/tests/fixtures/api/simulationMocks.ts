import { vi } from 'vitest';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';
import { SimulationCreationPayload } from '@/types/payloads';

// Test constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Simulation IDs for different test scenarios
export const SIMULATION_IDS = {
  VALID: '123456',
  NEW: '789012',
  NON_EXISTENT: '999999',
} as const;

// Test payloads
export const mockSimulationPayload: SimulationCreationPayload = {
  population_id: 'household-123',
  population_type: 'household',
  policy_id: 'policy-456',
};

export const mockSimulationPayloadGeography: SimulationCreationPayload = {
  population_id: 'california',
  population_type: 'geography',
  policy_id: 'policy-789',
};

export const mockSimulationPayloadMinimal: SimulationCreationPayload = {
  population_id: 'household-minimal',
  population_type: 'household',
};

// API response structures
export const mockSimulationMetadata: SimulationMetadata = {
  id: parseInt(SIMULATION_IDS.VALID),
  country_id: TEST_COUNTRIES.US,
  api_version: '1.0.0',
  population_id: mockSimulationPayload.population_id,
  population_type: mockSimulationPayload.population_type!,
  policy_id: mockSimulationPayload.policy_id!,
};

export const mockCreateSimulationSuccessResponse = {
  status: 'ok',
  message: 'Simulation created successfully',
  result: {
    id: parseInt(SIMULATION_IDS.NEW),
    country_id: TEST_COUNTRIES.US,
    population_id: mockSimulationPayload.population_id,
    population_type: mockSimulationPayload.population_type,
    policy_id: mockSimulationPayload.policy_id,
  },
};

export const mockCreateSimulationErrorResponse = {
  status: 'error',
  message: 'Invalid simulation parameters',
  result: null,
};

export const mockFetchSimulationSuccessResponse = {
  status: 'ok',
  message: 'Simulation fetched successfully',
  result: mockSimulationMetadata,
};

export const mockFetchSimulationNotFoundResponse = {
  status: 'error',
  message: 'Simulation not found',
  result: null,
};

// Helper functions for mocking fetch responses
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  statusText: 'OK',
  json: vi.fn().mockResolvedValue(data),
});

export const mockErrorResponse = (status: number, statusText?: string) => ({
  ok: false,
  status,
  statusText: statusText || (status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error'),
  json: vi.fn().mockRejectedValue(new Error('Response not JSON')),
});

export const mockNonJsonResponse = () => ({
  ok: true,
  status: HTTP_STATUS.OK,
  statusText: 'OK',
  json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token < in JSON')),
});

// Error messages that match the implementation
export const ERROR_MESSAGES = {
  CREATE_FAILED: 'Failed to create simulation',
  CREATE_FAILED_WITH_STATUS: (status: number, statusText: string) =>
    `Failed to create simulation: ${status} ${statusText}`,
  PARSE_FAILED: (error: any) => `Failed to parse simulation response: ${error}`,
  FETCH_FAILED: (id: string) => `Failed to fetch simulation ${id}`,
  FETCH_FAILED_WITH_STATUS: (id: string, status: number, statusText: string) =>
    `Failed to fetch simulation ${id}: ${status} ${statusText}`,
} as const;