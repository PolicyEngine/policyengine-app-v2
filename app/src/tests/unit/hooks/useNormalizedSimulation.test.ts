import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@test-utils';
import { createElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { useNormalizedSimulation } from '@/hooks/useNormalizedSimulation';
import {
  createTestQueryClient,
} from '@/tests/fixtures/hooks/calculationHookFixtures';
import {
  mockNormalizedSimulation,
  mockNormalizedPolicy,
  mockNormalizedHousehold,
  mockSimulationMetadata,
  mockPolicyMetadata,
  mockHouseholdMetadata,
  mockGeographyMetadata,
  NORMALIZED_HOOK_CONSTANTS,
} from '@/tests/fixtures/hooks/normalizedHookFixtures';
import { configureStore } from '@reduxjs/toolkit';

// Mock the API modules
vi.mock('@/api/simulation', () => ({
  fetchSimulationById: vi.fn(),
}));

vi.mock('@/api/policy', () => ({
  fetchPolicyById: vi.fn(),
}));

vi.mock('@/api/household', () => ({
  fetchHouseholdById: vi.fn(),
}));

// Mock the adapters
vi.mock('@/adapters', () => ({
  SimulationAdapter: {
    fromMetadata: vi.fn((metadata) => ({
      id: metadata.id,
      countryId: metadata.country_id,
      policyId: metadata.policy_id,
      populationId: metadata.household_id,
      populationType: 'household',
      label: metadata.label,
      isCreated: true,
    })),
  },
  PolicyAdapter: {
    fromMetadata: vi.fn((metadata) => ({
      id: metadata.id,
      countryId: metadata.country_id,
      label: metadata.label,
      parameters: metadata.parameters,
      isCreated: true,
    })),
  },
  HouseholdAdapter: {
    fromAPI: vi.fn((metadata) => ({
      id: metadata.id,
      countryId: metadata.country_id,
      householdData: metadata.household_data,
    })),
  },
}));

// Mock useCurrentCountry
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

describe('useNormalizedSimulation', () => {
  let queryClient: any;
  let mockStore: any;
  let wrapper: any;
  let mockFetchSimulation: any;
  let mockFetchPolicy: any;
  let mockFetchHousehold: any;

  beforeEach(async () => {
    queryClient = createTestQueryClient();

    // Create mock Redux store with geography metadata
    mockStore = configureStore({
      reducer: {
        metadata: () => ({
          economyOptions: {
            region: mockGeographyMetadata(),
          },
        }),
      },
    });

    wrapper = ({ children }: { children: React.ReactNode }) => {
      const queryProvider = createElement(QueryClientProvider, { client: queryClient }, children);
      return createElement(Provider, { store: mockStore, children: queryProvider });
    };

    const simulationModule = await import('@/api/simulation');
    const policyModule = await import('@/api/policy');
    const householdModule = await import('@/api/household');

    mockFetchSimulation = simulationModule.fetchSimulationById as any;
    mockFetchPolicy = policyModule.fetchPolicyById as any;
    mockFetchHousehold = householdModule.fetchHouseholdById as any;

    vi.clearAllMocks();
  });

  describe('given household-based simulation', () => {
    it('then fetches simulation, policy, and household', async () => {
      // Given
      mockFetchSimulation.mockResolvedValue(mockSimulationMetadata());
      mockFetchPolicy.mockResolvedValue(mockPolicyMetadata());
      mockFetchHousehold.mockResolvedValue(mockHouseholdMetadata());

      // When
      const { result } = renderHook(
        () => useNormalizedSimulation(NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.simulation).toBeDefined();
      expect(result.current.policy).toBeDefined();
      expect(result.current.population).toBeDefined();
      expect(result.current.populationType).toBe('household');
    });

    it('then calls APIs with correct parameters', async () => {
      // Given
      mockFetchSimulation.mockResolvedValue(mockSimulationMetadata());
      mockFetchPolicy.mockResolvedValue(mockPolicyMetadata());
      mockFetchHousehold.mockResolvedValue(mockHouseholdMetadata());

      // When
      renderHook(
        () => useNormalizedSimulation(NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(mockFetchSimulation).toHaveBeenCalledWith(
          'us',
          NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1
        );
      });

      await waitFor(() => {
        expect(mockFetchPolicy).toHaveBeenCalledWith(
          'us',
          NORMALIZED_HOOK_CONSTANTS.TEST_POLICY_ID_1
        );
      });

      await waitFor(() => {
        expect(mockFetchHousehold).toHaveBeenCalledWith(
          'us',
          NORMALIZED_HOOK_CONSTANTS.TEST_HOUSEHOLD_ID
        );
      });
    });
  });

  describe('given geography-based simulation', () => {
    it('then fetches simulation, policy, and extracts geography from metadata', async () => {
      // Given
      const geoSimMetadata = {
        ...mockSimulationMetadata(),
        household_id: NORMALIZED_HOOK_CONSTANTS.TEST_GEOGRAPHY_ID,
        population_type: 'geography',
      };

      mockFetchSimulation.mockResolvedValue(geoSimMetadata);
      mockFetchPolicy.mockResolvedValue(mockPolicyMetadata());

      const { SimulationAdapter } = await import('@/adapters');
      (SimulationAdapter.fromMetadata as any).mockReturnValueOnce(
        mockNormalizedSimulation({
          populationType: 'geography',
          populationId: NORMALIZED_HOOK_CONSTANTS.TEST_GEOGRAPHY_ID,
        })
      );

      // When
      const { result } = renderHook(
        () => useNormalizedSimulation(NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.simulation).toBeDefined();
      expect(result.current.policy).toBeDefined();
      expect(result.current.population).toBeDefined();
      expect(result.current.populationType).toBe('geography');
      expect(mockFetchHousehold).not.toHaveBeenCalled();
    });
  });

  describe('given simulation without policy', () => {
    it('then skips policy fetch', async () => {
      // Given
      const simWithoutPolicy = {
        ...mockSimulationMetadata(),
        policy_id: undefined,
      };

      mockFetchSimulation.mockResolvedValue(simWithoutPolicy);

      const { SimulationAdapter } = await import('@/adapters');
      (SimulationAdapter.fromMetadata as any).mockReturnValueOnce(
        mockNormalizedSimulation({ policyId: undefined })
      );

      // When
      const { result } = renderHook(
        () => useNormalizedSimulation(NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.simulation).toBeDefined();
      });

      expect(mockFetchPolicy).not.toHaveBeenCalled();
      expect(result.current.policy).toBeUndefined();
    });
  });

  describe('given empty simulationId', () => {
    it('then does not fetch', () => {
      // When
      const { result } = renderHook(() => useNormalizedSimulation(''), { wrapper });

      // Then
      expect(mockFetchSimulation).not.toHaveBeenCalled();
      expect(result.current.simulation).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('given API error', () => {
    it('then returns error state', async () => {
      // Given
      const testError = new Error('API Error');
      mockFetchSimulation.mockRejectedValue(testError);

      // When
      const { result } = renderHook(
        () => useNormalizedSimulation(NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.simulation).toBeUndefined();
    });
  });

  describe('given policy fetch error', () => {
    it('then returns error for policy layer', async () => {
      // Given
      mockFetchSimulation.mockResolvedValue(mockSimulationMetadata());
      const policyError = new Error('Policy fetch failed');
      mockFetchPolicy.mockRejectedValue(policyError);

      // When
      const { result } = renderHook(
        () => useNormalizedSimulation(NORMALIZED_HOOK_CONSTANTS.TEST_SIMULATION_ID_1),
        { wrapper }
      );

      // Then
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.simulation).toBeDefined();
      expect(result.current.policy).toBeUndefined();
    });
  });
});
