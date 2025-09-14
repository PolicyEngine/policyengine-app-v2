import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdCalculation } from '@/api/household_calculation';
import { useHouseholdCalculation } from '@/hooks/useHouseholdCalculation';
import {
  mockHouseholdResult,
  mockHouseholdResultUK,
  mockLargeHouseholdResult,
} from '@/tests/fixtures/api/householdCalculationMocks';
import {
  ERROR_MESSAGES,
  mockOnError,
  mockOnSuccess,
  TEST_COUNTRIES,
  TEST_HOUSEHOLD_IDS,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/hooks/useHouseholdCalculationMocks';

// Mock the API module
vi.mock('@/api/household_calculation', () => ({
  fetchHouseholdCalculation: vi.fn(),
}));

// Helper to create test wrapper with React Query
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient };
};

describe('useHouseholdCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSuccess.mockClear();
    mockOnError.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given valid parameters then initiates household calculation', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResult);

    // When
    renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(fetchHouseholdCalculation).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_HOUSEHOLD_IDS.EXISTING,
        TEST_POLICY_IDS.BASELINE
      );
    });
  });

  test('given calculation completes then calls onSuccess', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResult);

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
          onSuccess: mockOnSuccess,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.data).toEqual(mockHouseholdResult);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockHouseholdResult);
    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
  });

  test('given calculation fails then calls onError', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    const error = new Error(ERROR_MESSAGES.API_ERROR);
    (fetchHouseholdCalculation as any).mockRejectedValue(error);

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.NON_EXISTENT,
          policyId: TEST_POLICY_IDS.BASELINE,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockOnError).toHaveBeenCalledWith(error);
  });

  test('given UK parameters then returns UK household data', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResultUK);

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.UK,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.household).toEqual(mockHouseholdResultUK);
    });

    expect(result.current.household?.countryId).toBe('uk');
  });

  test('given large household then handles complex data correctly', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockLargeHouseholdResult);

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.LARGE_HOUSEHOLD,
          policyId: TEST_POLICY_IDS.REFORM,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.household).toEqual(mockLargeHouseholdResult);
    });

    const people = Object.keys(result.current.household?.householdData.people || {});
    expect(people).toHaveLength(5);
  });

  test('given enabled is false then does not fetch', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResult);

    // When
    renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
          enabled: false,
        }),
      { wrapper }
    );

    // Then
    await waitFor(
      () => {
        expect(fetchHouseholdCalculation).not.toHaveBeenCalled();
      },
      { timeout: 100 }
    );
  });

  test('given enabled changes to true then fetches data', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResult);

    // When - start with enabled false
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
          enabled,
        }),
      {
        wrapper,
        initialProps: { enabled: false },
      }
    );

    // Then - no fetch initially
    expect(fetchHouseholdCalculation).not.toHaveBeenCalled();

    // When - enable fetching
    rerender({ enabled: true });

    // Then - fetch is called
    await waitFor(() => {
      expect(fetchHouseholdCalculation).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_HOUSEHOLD_IDS.EXISTING,
        TEST_POLICY_IDS.BASELINE
      );
    });

    await waitFor(() => {
      expect(result.current.household).toEqual(mockHouseholdResult);
    });
  });

  test('given retry is called then refetches data and resets state', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    let callCount = 0;
    (fetchHouseholdCalculation as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error(ERROR_MESSAGES.NETWORK_ERROR));
      }
      return Promise.resolve(mockHouseholdResult);
    });

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
          onSuccess: mockOnSuccess,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(mockOnError).toHaveBeenCalledTimes(1);

    // When - retry
    await result.current.retry();

    // Then - successful retry
    await waitFor(() => {
      expect(result.current.household).toEqual(mockHouseholdResult);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockHouseholdResult);
    expect(callCount).toBe(2);
  });

  test('given query key changes then refetches with new parameters', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResult);

    // When - initial render
    const { result, rerender } = renderHook(
      ({ policyId }: { policyId: string }) =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId,
        }),
      {
        wrapper,
        initialProps: { policyId: TEST_POLICY_IDS.BASELINE as string },
      }
    );

    // Then - initial fetch
    await waitFor(() => {
      expect(fetchHouseholdCalculation).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_HOUSEHOLD_IDS.EXISTING,
        TEST_POLICY_IDS.BASELINE
      );
    });

    // When - change policy ID
    rerender({ policyId: TEST_POLICY_IDS.REFORM });

    // Then - new fetch with updated parameters
    await waitFor(() => {
      expect(fetchHouseholdCalculation).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_HOUSEHOLD_IDS.EXISTING,
        TEST_POLICY_IDS.REFORM
      );
    });

    expect(fetchHouseholdCalculation).toHaveBeenCalledTimes(2);
  });

  test('given successful fetch then provides correct status flags', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchHouseholdCalculation as any).mockResolvedValue(mockHouseholdResult);

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
        }),
      { wrapper }
    );

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);

    // Then - after fetch completes
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toEqual(mockHouseholdResult);
    expect(result.current.household).toEqual(mockHouseholdResult);
  });

  test('given network error then throwOnError prevents React error boundary', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    const networkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);
    (fetchHouseholdCalculation as any).mockRejectedValue(networkError);

    // When
    const { result } = renderHook(
      () =>
        useHouseholdCalculation({
          countryId: TEST_COUNTRIES.US,
          householdId: TEST_HOUSEHOLD_IDS.EXISTING,
          policyId: TEST_POLICY_IDS.BASELINE,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Error is handled but not thrown to React Error Boundary
    expect(result.current.error).toEqual(networkError);
    expect(mockOnError).toHaveBeenCalledWith(networkError);
  });
});