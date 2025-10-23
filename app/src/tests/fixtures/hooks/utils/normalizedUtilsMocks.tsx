import { QueryClient } from '@tanstack/react-query';
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

export const TEST_IDS = {
  POLICY_1: 'policy-1',
  POLICY_2: 'policy-2',
  POLICY_3: 'policy-3',
  SIMULATION_1: 'sim-1',
  SIMULATION_2: 'sim-2',
} as const;

export const TEST_ENTITIES = {
  policies: [
    { id: TEST_IDS.POLICY_1, name: 'Policy 1' },
    { id: TEST_IDS.POLICY_2, name: 'Policy 2' },
  ],

  policiesWithDuplicates: [
    { id: TEST_IDS.POLICY_1, name: 'Policy 1' },
    { id: TEST_IDS.POLICY_2, name: 'Policy 2' },
    { id: TEST_IDS.POLICY_1, name: 'Policy 1 Duplicate' },
  ],

  simulationsWithPolicies: [
    { id: TEST_IDS.SIMULATION_1, policyId: TEST_IDS.POLICY_1 },
    { id: TEST_IDS.SIMULATION_2, policyId: TEST_IDS.POLICY_2 },
  ],

  itemsWithNulls: [
    { id: TEST_IDS.POLICY_1, name: 'Policy 1' },
    { id: null, name: 'No ID' },
    { id: undefined, name: 'Also No ID' },
  ],

  numericIds: [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ],

  withNullId: [
    { id: TEST_IDS.POLICY_1, name: 'Policy 1' },
    { id: null as any, name: 'No ID' },
  ],
} as const;

export const mockLoadingStates = {
  allIdle: [
    { isLoading: false, error: null },
    { isLoading: false, error: null },
  ],

  oneLoading: [
    { isLoading: false, error: null },
    { isLoading: true, error: null },
    { isLoading: false, error: null },
  ],

  oneError: [
    { isLoading: false, error: null },
    { isLoading: false, error: new Error('Test error') },
    { isLoading: false, error: null },
  ],
} as const;

export const mockQueryResults = {
  success: {
    data: { id: TEST_IDS.POLICY_1, name: 'Policy 1' },
    isLoading: false,
    isError: false,
    error: null,
  },

  loading: {
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
  },

  error: {
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error('Query failed'),
  },
} as const;

export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

// Test wrapper component factory
export const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock query configs for different scenarios
export const createMockQueryConfig = (overrides?: any) => ({
  queryKey: (id: string) => ['policies', id],
  queryFn: vi.fn((id: string) => Promise.resolve({ id, name: `Policy ${id}` })),
  enabled: true,
  ...overrides,
});

export const createErrorQueryConfig = (error: Error) => ({
  queryKey: (id: string) => ['policies', id],
  queryFn: vi.fn(() => Promise.reject(error)),
  enabled: true,
  retry: false,
});

export const createDisabledQueryConfig = () => ({
  queryKey: (id: string) => ['policies', id],
  queryFn: vi.fn(),
  enabled: false,
});

// Test error instances
export const TEST_ERRORS = {
  FETCH_FAILED: new Error('Fetch failed'),
  NOT_FOUND: new Error('Not found'),
  NETWORK_ERROR: new Error('Network error'),
} as const;
