import React from 'react';
import { QueryNormalizerProvider } from '@normy/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { vi } from 'vitest';

export const TEST_USER_ID = 'test-user-123';

export const TEST_IDS = {
  SIMULATION_1: '100',
  SIMULATION_2: '200',
  POLICY_1: '1',
  HOUSEHOLD_1: '456',
} as const;

// Mock metadata state
export const createMockMetadataState = () => ({
  currentCountry: 'us',
  variables: {},
  parameters: {},
  entities: {},
  variableModules: {},
  economyOptions: {
    region: [
      { name: 'state/ca', label: 'California' },
      { name: 'state/ny', label: 'New York' },
    ],
    time_period: [],
    datasets: [],
  },
  currentLawId: 1,
  basicInputs: [],
  modelledPolicies: { core: {}, filtered: {} },
  version: '1.0.0',
  parameterTree: null,
  loading: false,
  error: null,
});

// Mock Redux store
export const createMockStore = () => {
  const metadataReducer = (state = createMockMetadataState()) => state;

  return configureStore({
    reducer: {
      metadata: metadataReducer,
    },
  });
};

// Mock QueryClient
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

// Test wrapper component
export const createWrapper = (
  queryClient: QueryClient,
  store: ReturnType<typeof createMockStore>
) => {
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <QueryNormalizerProvider queryClient={queryClient}>{children}</QueryNormalizerProvider>
      </QueryClientProvider>
    </Provider>
  );
};

// Empty associations for testing
export const emptyAssociations = {
  simulations: [],
  policies: [],
  households: [],
};

// Mock hook return values
export const createMockAssociationHooks = () => ({
  useSimulationAssociationsByUser: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  usePolicyAssociationsByUser: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useHouseholdAssociationsByUser: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
});

// Mock useCurrentCountry
export const mockUseCurrentCountry = () => ({
  useCurrentCountry: vi.fn(() => 'us'),
});
