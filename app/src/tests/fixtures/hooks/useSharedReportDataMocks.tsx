/**
 * Test fixtures for useSharedReportData tests
 */

import React from 'react';
import { QueryNormalizerProvider } from '@normy/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';

// ReportIngredientsInput fixtures - using Omit<> types which include all fields except userId/timestamps
export const MOCK_SHARE_DATA: ReportIngredientsInput = {
  userReport: {
    id: 'sur-test123',
    reportId: '308',
    countryId: 'us',
    label: 'Test Report',
  },
  userSimulations: [{ simulationId: 'sim-1', countryId: 'us', label: 'Baseline Sim' }],
  userPolicies: [{ policyId: 'policy-1', label: 'Test Policy' }],
  userHouseholds: [],
  userGeographies: [
    {
      type: 'geography',
      geographyId: 'us',
      countryId: 'us',
      scope: 'national',
      label: 'United States',
    },
  ],
};

export const MOCK_HOUSEHOLD_SHARE_DATA: ReportIngredientsInput = {
  userReport: {
    id: 'sur-test456',
    reportId: '309',
    countryId: 'uk',
    label: 'Household Report',
  },
  userSimulations: [{ simulationId: 'sim-2', countryId: 'uk', label: 'HH Sim' }],
  userPolicies: [{ policyId: 'policy-2', label: 'HH Policy' }],
  userHouseholds: [
    { type: 'household', householdId: 'hh-1', countryId: 'uk', label: 'My Household' },
  ],
  userGeographies: [],
};

// API metadata fixtures (cast to any for test simplicity)
export const MOCK_REPORT_METADATA: any = {
  id: 308,
  country_id: 'us',
  year: '2024',
  simulation_ids: ['1'],
  simulation_1_id: '1',
  simulation_2_id: null,
  status: 'complete',
  api_version: '1.0.0',
  output: null,
};

export const MOCK_SIMULATION_METADATA: any = {
  id: 1,
  country_id: 'us',
  year: '2024',
  population_type: 'geography',
  population_id: 'us',
  policy_id: 1,
  api_version: '1.0.0',
};

export const MOCK_POLICY_METADATA: any = {
  id: '1',
  country_id: 'us',
  label: 'Test Policy',
  policy_json: {},
  api_version: '1.0.0',
  policy_hash: 'abc123',
};

export const MOCK_HOUSEHOLD_METADATA: any = {
  id: 'hh-1',
  country_id: 'uk',
  label: 'Test Household',
  household_json: {},
  api_version: '1.0.0',
  household_hash: 'def456',
};

// Helper to create mock Redux store with metadata
export const createMockStore = () => {
  const metadataReducer = (
    state = {
      currentCountry: 'us',
      economyOptions: {
        region: [{ name: 'us', label: 'US Nationwide' }],
        time_period: [],
        datasets: [],
      },
    }
  ) => state;

  return configureStore({
    reducer: { metadata: metadataReducer },
  });
};

// Helper to create query client for tests
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

// Wrapper component factory for renderHook
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
