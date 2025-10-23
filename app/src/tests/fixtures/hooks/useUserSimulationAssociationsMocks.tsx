import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';

export const TEST_USER_ID = 'test-user-123';

export const TEST_SIMULATION_IDS = {
  SIM_1: '100',
  SIM_2: '200',
} as const;

export const TEST_LABELS = {
  SIM_1: 'Baseline Simulation',
  SIM_2: 'Reform Simulation',
} as const;

export const mockUserSimulation: UserSimulation = {
  id: TEST_SIMULATION_IDS.SIM_1,
  userId: '1',
  simulationId: TEST_SIMULATION_IDS.SIM_1,
  label: TEST_LABELS.SIM_1,
  createdAt: '2024-01-15T10:00:00Z',
};

export const mockUserSimulationList: UserSimulation[] = [
  mockUserSimulation,
  {
    id: TEST_SIMULATION_IDS.SIM_2,
    userId: '1',
    simulationId: TEST_SIMULATION_IDS.SIM_2,
    label: TEST_LABELS.SIM_2,
    createdAt: '2024-01-15T11:00:00Z',
  },
];

// Mock store implementation
export const createMockStore = () => ({
  create: vi.fn(),
  findByUser: vi.fn(),
  findById: vi.fn(),
});

// Setup mock store default behavior
export const setupMockStore = (mockStore: ReturnType<typeof createMockStore>) => {
  mockStore.create.mockImplementation((input: any) =>
    Promise.resolve({
      ...input,
      id: TEST_SIMULATION_IDS.SIM_1,
      createdAt: new Date().toISOString(),
    })
  );
  mockStore.findByUser.mockResolvedValue(mockUserSimulationList);
  mockStore.findById.mockResolvedValue(mockUserSimulation);
};

export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
};

export const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock query config
export const mockQueryConfig = {
  api: {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  localStorage: {
    staleTime: 0,
    gcTime: 0,
  },
};

// Mock query keys
export const mockSimulationAssociationKeys = {
  byUser: (userId: string) => ['simulation-associations', 'byUser', userId],
  bySimulation: (id: string) => ['simulation-associations', 'bySimulation', id],
  specific: (userId: string, id: string) => ['simulation-associations', 'specific', userId, id],
};
