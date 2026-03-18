/**
 * Storybook providers with pre-populated Redux store and React Query cache.
 *
 * Hooks like useUserPolicies, useUserHouseholds, useUserGeographics, and
 * useSelector(getTaxYears) run naturally — they just find data already in
 * the cache instead of hitting APIs or empty Redux state.
 */
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { MOCK_USER_ID } from '@/constants';
import {
  geographicAssociationKeys,
  householdAssociationKeys,
  householdKeys,
  policyAssociationKeys,
  policyKeys,
} from '@/libs/queryKeys';
import metadataReducer from '@/reducers/metadataReducer';
import {
  mockApiHouseholdMetadata1,
  mockApiHouseholdMetadata2,
  mockGeographyAssociation1,
  mockGeographyAssociation2,
  mockHouseholdAssociation1,
  mockHouseholdAssociation2,
} from '@/tests/fixtures/hooks/useUserHouseholdMocks';
import type { Policy } from '@/types/ingredients/Policy';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';

// Inlined from useUserPolicyMocks.ts to avoid importing vitest in Storybook
const TEST_POLICY_ID_1 = 'policy-456';
const TEST_POLICY_ID_2 = 'policy-789';

const mockUserPolicyAssociation1: UserPolicy = {
  id: 'assoc-1',
  userId: 'user-123',
  policyId: TEST_POLICY_ID_1,
  countryId: 'us',
  label: 'Test Policy 1',
  createdAt: '2024-01-15T10:00:00Z',
  isCreated: true,
};

const mockUserPolicyAssociation2: UserPolicy = {
  id: 'assoc-2',
  userId: 'user-123',
  policyId: TEST_POLICY_ID_2,
  countryId: 'us',
  label: 'Test Policy 2',
  createdAt: '2024-02-20T14:30:00Z',
  isCreated: true,
};

// ─── Redux store with pre-loaded metadata ────────────────────────────────────

function createStorybookStore() {
  const preloadedMetadata = {
    loading: false,
    error: null,
    currentCountry: 'us',
    progress: 100,
    variables: {},
    parameters: {},
    entities: {},
    variableModules: {},
    economyOptions: {
      region: [
        { name: 'us', label: 'United States' },
        { name: 'enhanced_us', label: 'Enhanced CPS' },
        { name: 'state/ca', label: 'California' },
        { name: 'state/ny', label: 'New York' },
        { name: 'state/tx', label: 'Texas' },
        { name: 'state/fl', label: 'Florida' },
      ],
      time_period: [
        { name: 2024, label: '2024' },
        { name: 2025, label: '2025' },
        { name: 2026, label: '2026' },
        { name: 2027, label: '2027' },
        { name: 2028, label: '2028' },
      ],
      datasets: [],
    },
    currentLawId: 1,
    basicInputs: [],
    modelledPolicies: { core: { '1': 'Current law' }, filtered: {} },
    version: '1.0.0',
    parameterTree: null,
  };

  return configureStore({
    reducer: { metadata: metadataReducer },
    preloadedState: { metadata: preloadedMetadata as any },
  });
}

// ─── React Query client with seeded cache ────────────────────────────────────

export interface SeedOptions {
  policies?: boolean;
  households?: boolean;
  geographics?: boolean;
}

const mockPolicy1: Policy = {
  id: TEST_POLICY_ID_1,
  countryId: 'us',
  apiVersion: 'v1',
  parameters: [],
  label: 'Test Policy 1',
};

const mockPolicy2: Policy = {
  id: TEST_POLICY_ID_2,
  countryId: 'us',
  apiVersion: 'v1',
  parameters: [],
  label: 'Test Policy 2',
};

function createSeededQueryClient(
  options: SeedOptions = { policies: true, households: true, geographics: true }
) {
  const userId = MOCK_USER_ID.toString();
  const countryId = 'us';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
    },
  });

  if (options.policies) {
    // Seed policy associations (first-level query)
    queryClient.setQueryData(policyAssociationKeys.byUser(userId, countryId), [
      mockUserPolicyAssociation1,
      mockUserPolicyAssociation2,
    ]);
    // Seed individual policy details (second-level useQueries)
    queryClient.setQueryData(policyKeys.byId(TEST_POLICY_ID_1), mockPolicy1);
    queryClient.setQueryData(policyKeys.byId(TEST_POLICY_ID_2), mockPolicy2);
  }

  if (options.households) {
    // Seed household associations
    queryClient.setQueryData(householdAssociationKeys.byUser(userId, countryId), [
      mockHouseholdAssociation1,
      mockHouseholdAssociation2,
    ]);
    // Seed individual household metadata
    queryClient.setQueryData(
      householdKeys.byId(mockHouseholdAssociation1.householdId!),
      mockApiHouseholdMetadata1
    );
    queryClient.setQueryData(
      householdKeys.byId(mockHouseholdAssociation2.householdId!),
      mockApiHouseholdMetadata2
    );
  }

  if (options.geographics) {
    // Seed geographic associations
    queryClient.setQueryData(geographicAssociationKeys.byUser(userId, countryId), [
      mockGeographyAssociation1,
      mockGeographyAssociation2,
    ]);
  }

  return queryClient;
}

// ─── Storybook decorator ─────────────────────────────────────────────────────

/**
 * Storybook decorator that overrides the global Redux store and React Query
 * client with pre-populated data. The global preview decorator (preview.tsx)
 * already provides MemoryRouter, AppProvider, and TooltipProvider — this
 * decorator only overrides the data layers.
 */
export function withMockedProviders(seedOptions?: SeedOptions) {
  return function MockedProvidersDecorator(Story: React.ComponentType) {
    const store = createStorybookStore();
    const queryClient = createSeededQueryClient(seedOptions);

    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      </Provider>
    );
  };
}
