import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import {
  createMockQueryClient,
  createMockStore,
  createWrapper,
  TEST_USER_ID,
  mockUseCurrentCountry,
  createMockAssociationHooks,
} from '@/tests/fixtures/hooks/useUserSimulationsMocks';

// Mock the association hooks
vi.mock('@/hooks/useUserSimulationAssociations', () => ({
  useSimulationAssociationsByUser: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  usePolicyAssociationsByUser: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useHouseholdAssociationsByUser: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

// Mock useCurrentCountry
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

describe('useUserSimulations', () => {
  let queryClient: QueryClient;
  let store: ReturnType<typeof createMockStore>;
  let wrapper: ReturnType<typeof createWrapper>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    store = createMockStore();
    wrapper = createWrapper(queryClient, store);
  });

  it('given user ID then returns hook result structure', async () => {
    // When
    const { result } = renderHook(() => useUserSimulations(TEST_USER_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('given empty associations then returns empty data array', async () => {
    // When
    const { result } = renderHook(() => useUserSimulations(TEST_USER_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(0);
    expect(result.current.isError).toBe(false);
  });

  it('given hook then provides helper functions', async () => {
    // When
    const { result } = renderHook(() => useUserSimulations(TEST_USER_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getSimulationWithFullContext).toBeDefined();
    expect(typeof result.current.getSimulationWithFullContext).toBe('function');

    expect(result.current.getSimulationsByPolicy).toBeDefined();
    expect(typeof result.current.getSimulationsByPolicy).toBe('function');

    expect(result.current.getSimulationsByHousehold).toBeDefined();
    expect(typeof result.current.getSimulationsByHousehold).toBe('function');
  });

  it('given hook then provides normalized cache accessors', async () => {
    // When
    const { result } = renderHook(() => useUserSimulations(TEST_USER_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getNormalizedSimulation).toBeDefined();
    expect(typeof result.current.getNormalizedSimulation).toBe('function');

    expect(result.current.getNormalizedPolicy).toBeDefined();
    expect(typeof result.current.getNormalizedPolicy).toBe('function');

    expect(result.current.getNormalizedHousehold).toBeDefined();
    expect(typeof result.current.getNormalizedHousehold).toBe('function');
  });

  it('given hook then provides raw associations', async () => {
    // When
    const { result } = renderHook(() => useUserSimulations(TEST_USER_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.associations).toBeDefined();
    expect(result.current.associations.simulations).toBeDefined();
    expect(result.current.associations.policies).toBeDefined();
    expect(result.current.associations.households).toBeDefined();
  });

  it('given hook then returns correct structure', async () => {
    // When
    const { result } = renderHook(() => useUserSimulations(TEST_USER_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify all expected properties exist
    expect(result.current).toHaveProperty('data');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isError');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('associations');
    expect(result.current).toHaveProperty('getSimulationWithFullContext');
    expect(result.current).toHaveProperty('getSimulationsByPolicy');
    expect(result.current).toHaveProperty('getSimulationsByHousehold');
    expect(result.current).toHaveProperty('getNormalizedSimulation');
    expect(result.current).toHaveProperty('getNormalizedPolicy');
    expect(result.current).toHaveProperty('getNormalizedHousehold');
  });
});
