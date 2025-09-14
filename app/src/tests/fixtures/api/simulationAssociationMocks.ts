import { vi } from 'vitest';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { UserSimulationCreationPayload } from '@/types/payloads';
import {
  EXISTING_SIMULATION_ID,
  HTTP_STATUS,
  NEW_SIMULATION_ID,
  NON_EXISTENT_SIMULATION_ID,
  TEST_USER_ID,
} from './simulationMocks';

// User simulation association IDs
export const EXISTING_ASSOCIATION_ID = 'assoc-sim-123';
export const NON_EXISTENT_ASSOCIATION_ID = 'assoc-sim-999';
export const NEW_ASSOCIATION_ID = 'assoc-sim-new-456';

// Additional user IDs
export const ANOTHER_USER_ID = 'user-202';
export const UNAUTHORIZED_USER_ID = 'user-303';

// Error messages for associations
export const ASSOCIATION_ERROR_MESSAGES = {
  FETCH_FAILED: (userId: string) => `Failed to fetch simulations for user ${userId}`,
  CREATE_FAILED: 'Failed to associate simulation with user',
  DELETE_FAILED: (id: string) => `Failed to remove simulation association ${id}`,
  DUPLICATE_ASSOCIATION: 'Simulation already associated with user',
  UNAUTHORIZED_ACCESS: 'Unauthorized to access this simulation',
  SIMULATION_NOT_FOUND: 'Simulation not found',
} as const;

// Base user simulation association
export const mockUserSimulation: UserSimulation = {
  id: EXISTING_ASSOCIATION_ID,
  userId: TEST_USER_ID,
  simulationId: EXISTING_SIMULATION_ID,
  createdAt: '2024-01-01T00:00:00Z',
  isCreated: true,
};

// Non-owner association
export const mockUserSimulationNonOwner: UserSimulation = {
  id: 'assoc-non-owner',
  userId: ANOTHER_USER_ID,
  simulationId: EXISTING_SIMULATION_ID,
  createdAt: '2024-01-02T00:00:00Z',
  isCreated: true,
};

// Read-only association
export const mockUserSimulationReadOnly: UserSimulation = {
  id: 'assoc-readonly',
  userId: TEST_USER_ID,
  simulationId: 'sim-readonly',
  createdAt: '2024-01-03T00:00:00Z',
  isCreated: true,
};

// Association creation payload
export const mockUserSimulationCreationPayload: UserSimulationCreationPayload = {
  userId: TEST_USER_ID,
  simulationId: NEW_SIMULATION_ID,
  label: 'New Simulation',
};

// Non-owner creation payload
export const mockUserSimulationCreationPayloadNonOwner: UserSimulationCreationPayload = {
  userId: ANOTHER_USER_ID,
  simulationId: EXISTING_SIMULATION_ID,
  label: 'Shared Simulation',
};

// Helper functions for responses
export const mockAssociationSuccessResponse = (data: UserSimulation | UserSimulation[]) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue({ result: data }),
});

export const mockAssociationErrorResponse = (status: number, message?: string) => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.UNAUTHORIZED ? 'Unauthorized' : 'Error',
  json: vi.fn().mockResolvedValue({
    error: message || 'Error processing association',
  }),
});

export const mockCreateAssociationResponse = (id: string = NEW_ASSOCIATION_ID) => ({
  ok: true,
  status: HTTP_STATUS.CREATED,
  json: vi.fn().mockResolvedValue({
    result: { association_id: id },
  }),
});

// Mock list of user simulations
export const mockUserSimulationsList: UserSimulation[] = [
  mockUserSimulation,
  mockUserSimulationReadOnly,
  {
    id: 'assoc-3',
    userId: TEST_USER_ID,
    simulationId: 'sim-3',
    createdAt: '2024-01-04T00:00:00Z',
    isCreated: true,
  },
  {
    id: 'assoc-4',
    userId: TEST_USER_ID,
    simulationId: 'sim-4',
    createdAt: '2024-01-05T00:00:00Z',
    isCreated: true,
  },
];

// Mock response for fetching user's simulations
export const mockFetchUserSimulationsResponse = () => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue({
    result: mockUserSimulationsList,
  }),
});

// Mock response for empty simulations list
export const mockEmptySimulationsResponse = () => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue({
    result: [],
  }),
});

// Helper to create custom user simulation
export const createMockUserSimulation = (overrides?: Partial<UserSimulation>): UserSimulation => ({
  ...mockUserSimulation,
  ...overrides,
});

// SessionStorage mock helpers
export const setupSessionStorageMock = () => {
  const storage: { [key: string]: string } = {};

  global.sessionStorage = {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key];
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    }),
    length: 0,
    key: vi.fn(),
  } as Storage;

  return storage;
};
