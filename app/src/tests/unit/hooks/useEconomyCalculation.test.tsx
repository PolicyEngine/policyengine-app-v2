import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useEconomyCalculation } from '@/hooks/useEconomyCalculation';
import {
  mockCompletedResponse,
  mockErrorCalculationResponse,
  mockPendingResponse,
  mockUSReportOutput,
} from '@/tests/fixtures/api/economyMocks';
import {
  mockOnError,
  mockOnQueueUpdate,
  mockOnSuccess,
  TEST_COUNTRIES,
  TEST_POLICY_IDS,
  TEST_REGIONS,
} from '@/tests/fixtures/hooks/useEconomyCalculationMocks';

// Mock the API module
vi.mock('@/api/economy', () => ({
  fetchEconomyCalculation: vi.fn(),
}));

// Import after mocking
import { fetchEconomyCalculation } from '@/api/economy';

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

describe('useEconomyCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSuccess.mockClear();
    mockOnError.mockClear();
    mockOnQueueUpdate.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test('given valid parameters then initiates economy calculation', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchEconomyCalculation as any).mockResolvedValue(mockCompletedResponse);

    // When
    renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          params: { region: TEST_REGIONS.ENHANCED_US },
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(fetchEconomyCalculation).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        { region: TEST_REGIONS.ENHANCED_US }
      );
    });
  });

  test('given calculation completes then calls onSuccess', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchEconomyCalculation as any).mockResolvedValue(mockCompletedResponse);

    // When
    const { result } = renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          onSuccess: mockOnSuccess,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.data).toEqual(mockCompletedResponse);
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockUSReportOutput);
  });

  test('given calculation returns error then calls onError', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchEconomyCalculation as any).mockResolvedValue(mockErrorCalculationResponse);

    // When
    const { result } = renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.data).toEqual(mockErrorCalculationResponse);
    });

    expect(mockOnError).toHaveBeenCalledWith(
      new Error('Calculation failed due to invalid parameters')
    );
  });

  test('given pending status then continues polling and calls onQueueUpdate', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    let callCount = 0;
    (fetchEconomyCalculation as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve(mockPendingResponse);
      }
      if (callCount === 2) {
        return Promise.resolve({ ...mockPendingResponse, queue_position: 3 });
      }
      return Promise.resolve(mockCompletedResponse);
    });

    // When
    const { result } = renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          onQueueUpdate: mockOnQueueUpdate,
          onSuccess: mockOnSuccess,
        }),
      { wrapper }
    );

    // Then - First poll returns pending
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.isPending).toBe(true);
    });
    expect(mockOnQueueUpdate).toHaveBeenCalledWith(5, 120);

    // Wait for refetch interval and second poll
    await waitFor(() => {
      expect(callCount).toBeGreaterThanOrEqual(2);
    }, { timeout: 2000 });

    // Check queue update was called with new position
    expect(mockOnQueueUpdate).toHaveBeenCalledWith(3, 120);

    // Wait for final poll to complete
    await waitFor(() => {
      expect(result.current.isCompleted).toBe(true);
    }, { timeout: 2000 });

    expect(mockOnSuccess).toHaveBeenCalledWith(mockUSReportOutput);
  });

  test('given calculation exceeds timeout then throws timeout error', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    let fetchCount = 0;

    // Mock always returns pending, but we'll manually trigger timeout after 2 fetches
    (fetchEconomyCalculation as any).mockImplementation(async () => {
      fetchCount++;
      // After a couple of fetches, simulate that we've exceeded the timeout
      if (fetchCount > 2) {
        const timeoutError = new Error('Economy calculation timed out after 25 minutes, the max length for a Google Cloud economy-wide simulation Workflow');
        throw timeoutError;
      }
      return mockPendingResponse;
    });

    // When
    const { result } = renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Wait for initial fetch and polling
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.isPending).toBe(true);
    });

    // Wait for the timeout to be triggered
    await waitFor(() => {
      expect(fetchCount).toBeGreaterThan(2);
    }, { timeout: 3000 });

    // Then - onError should have been called with timeout error
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('timed out after 25 minutes')
        })
      );
    });
  });

  test('given enabled is false then does not fetch', async () => {
    // Given
    const { wrapper } = createTestWrapper();

    // When
    renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          enabled: false,
        }),
      { wrapper }
    );

    // Then
    // Wait a bit to ensure no fetch happens
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(fetchEconomyCalculation).not.toHaveBeenCalled();
  });

  test('given network error then calls onError', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    const networkError = new Error('Network error');
    (fetchEconomyCalculation as any).mockRejectedValue(networkError);

    // When
    const { result } = renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.US,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
          onError: mockOnError,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });

    expect(mockOnError).toHaveBeenCalledWith(networkError);
    // Note: React Query still sets the error in state even when throwOnError returns false
    // It just doesn't throw to the Error Boundary
    expect(result.current.error).toEqual(networkError);
  });

  test('given no params then fetches without query parameters', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchEconomyCalculation as any).mockResolvedValue(mockCompletedResponse);

    // When
    const { result } = renderHook(
      () =>
        useEconomyCalculation({
          countryId: TEST_COUNTRIES.UK,
          reformPolicyId: TEST_POLICY_IDS.REFORM,
          baselinePolicyId: TEST_POLICY_IDS.BASELINE,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(fetchEconomyCalculation).toHaveBeenCalledWith(
      TEST_COUNTRIES.UK,
      TEST_POLICY_IDS.REFORM,
      TEST_POLICY_IDS.BASELINE,
      undefined
    );
  });
});