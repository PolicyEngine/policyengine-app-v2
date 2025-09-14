import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useEconomyCalculation } from '@/hooks/useEconomyCalculation';
import reportReducer from '@/reducers/reportReducer';
import {
  mockCompletedResponse,
  mockErrorCalculationResponse,
  mockPendingResponse,
  mockUSReportOutput,
} from '@/tests/fixtures/api/economyMocks';
import {
  GC_WORKFLOW_TIMEOUT,
  mockDispatch,
  mockInitialReportState,
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

// Helper to create test wrapper with Redux and React Query
const createTestWrapper = (initialReportState = mockInitialReportState) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const store = configureStore({
    reducer: {
      report: () => initialReportState,
    },
  });

  // Track dispatched actions
  const dispatchedActions: any[] = [];
  const originalDispatch = store.dispatch;
  store.dispatch = ((action: any) => {
    dispatchedActions.push(action);
    return originalDispatch(action);
  }) as any;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );

  return { wrapper, queryClient, store, dispatchedActions };
};

describe('useEconomyCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('given valid parameters then initiates economy calculation', async () => {
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

  test('given calculation completes then updates report state and calls onSuccess', async () => {
    // Given
    const { wrapper, dispatchedActions } = createTestWrapper();
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

    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: 'report/updateReportStatus',
        payload: 'complete',
      })
    );
    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: 'report/updateReportOutput',
        payload: mockUSReportOutput,
      })
    );
    expect(mockOnSuccess).toHaveBeenCalledWith(mockUSReportOutput);
  });

  test('given calculation returns error then updates report state and calls onError', async () => {
    // Given
    const { wrapper, dispatchedActions } = createTestWrapper();
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

    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: 'report/updateReportStatus',
        payload: 'error',
      })
    );
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
      if (callCount === 1) return Promise.resolve(mockPendingResponse);
      if (callCount === 2) return Promise.resolve({ ...mockPendingResponse, queue_position: 3 });
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
        }),
      { wrapper }
    );

    // Then - First poll returns pending
    await waitFor(() => {
      expect(result.current.data?.status).toBe('pending');
    });
    expect(mockOnQueueUpdate).toHaveBeenCalledWith(5, 120);

    // Advance timer for next poll
    vi.advanceTimersByTime(1000);

    // Second poll also pending with updated position
    await waitFor(() => {
      expect(mockOnQueueUpdate).toHaveBeenCalledWith(3, 120);
    });

    // Advance timer for final poll
    vi.advanceTimersByTime(1000);

    // Final poll returns completed
    await waitFor(() => {
      expect(result.current.data?.status).toBe('completed');
    });
  });

  test('given calculation exceeds timeout then throws timeout error', async () => {
    // Given
    const { wrapper, dispatchedActions } = createTestWrapper();
    (fetchEconomyCalculation as any).mockResolvedValue(mockPendingResponse);

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

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    // Fast-forward past timeout
    vi.advanceTimersByTime(GC_WORKFLOW_TIMEOUT + 1000);

    // Then
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });

    expect(result.current.error?.message).toContain('timed out after 25 minutes');
    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: 'report/updateReportStatus',
        payload: 'error',
      })
    );
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
    await waitFor(() => {
      expect(fetchEconomyCalculation).not.toHaveBeenCalled();
    });
  });

  test('given network error then updates report state with error', async () => {
    // Given
    const { wrapper, dispatchedActions } = createTestWrapper();
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
      expect(result.current.error).toBeDefined();
    });

    expect(dispatchedActions).toContainEqual(
      expect.objectContaining({
        type: 'report/updateReportStatus',
        payload: 'error',
      })
    );
    expect(mockOnError).toHaveBeenCalledWith(networkError);
  });

  test('given no params then fetches without query parameters', async () => {
    // Given
    const { wrapper } = createTestWrapper();
    (fetchEconomyCalculation as any).mockResolvedValue(mockCompletedResponse);

    // When
    renderHook(
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
      expect(fetchEconomyCalculation).toHaveBeenCalledWith(
        TEST_COUNTRIES.UK,
        TEST_POLICY_IDS.REFORM,
        TEST_POLICY_IDS.BASELINE,
        undefined
      );
    });
  });
});