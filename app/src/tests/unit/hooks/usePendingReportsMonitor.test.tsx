import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { usePendingReportsMonitor } from '@/hooks/usePendingReportsMonitor';
import { calculationQueries } from '@/libs/queryOptions/calculations';
import {
  mockCalculationComplete,
  mockCalculationComputing,
  mockCalculationError,
  mockPendingReport1,
  mockReportsAllComplete,
  mockReportsWithMissingIds,
  mockReportsWithPending,
  PENDING_REPORT_ID_1,
  PENDING_REPORT_ID_2,
  TEST_COUNTRY_ID,
} from '@/tests/fixtures/hooks/usePendingReportsMonitorMocks';

// Mock calculation queries
vi.mock('@/libs/queryOptions/calculations', () => ({
  calculationQueries: {
    forReport: vi.fn((_reportId: string) => ({
      queryKey: ['calculation', _reportId],
      queryFn: vi.fn(),
      refetchInterval: vi.fn(),
      staleTime: Infinity,
    })),
  },
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  reportKeys: {
    all: ['reports'],
  },
  reportAssociationKeys: {
    all: ['report-associations'],
  },
}));

describe('usePendingReportsMonitor', () => {
  let queryClient: QueryClient;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test('given no reports then does nothing', () => {
    // Given
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    // When
    renderHook(() => usePendingReportsMonitor(undefined, TEST_COUNTRY_ID), { wrapper });

    // Then
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  test('given empty reports array then does nothing', () => {
    // Given
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    // When
    renderHook(() => usePendingReportsMonitor([], TEST_COUNTRY_ID), { wrapper });

    // Then
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  test('given only complete reports then does not start polling', () => {
    // Given
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    // When
    renderHook(() => usePendingReportsMonitor(mockReportsAllComplete, TEST_COUNTRY_ID), { wrapper });

    // Then
    expect(prefetchSpy).not.toHaveBeenCalled();
  });

  test('given pending reports then starts calculation queries for each', () => {
    // Given
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    // When
    renderHook(() => usePendingReportsMonitor(mockReportsWithPending, TEST_COUNTRY_ID), { wrapper });

    // Then
    expect(prefetchSpy).toHaveBeenCalledTimes(2);
    expect(calculationQueries.forReport).toHaveBeenCalledWith(
      PENDING_REPORT_ID_1,
      undefined,
      queryClient,
      TEST_COUNTRY_ID
    );
    expect(calculationQueries.forReport).toHaveBeenCalledWith(
      PENDING_REPORT_ID_2,
      undefined,
      queryClient,
      TEST_COUNTRY_ID
    );
  });

  test('given pending report completes then invalidates reports list', async () => {
    // Given
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => usePendingReportsMonitor([mockPendingReport1], TEST_COUNTRY_ID), { wrapper });

    // When - Simulate calculation query updating to complete
    queryClient.setQueryData(['calculation', PENDING_REPORT_ID_1], mockCalculationComplete);

    // Then
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        '[usePendingReportsMonitor] Report completed, refreshing reports list'
      );
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['report-associations'] });
    });
  });

  test('given pending report errors then invalidates reports list', async () => {
    // Given
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => usePendingReportsMonitor([mockPendingReport1], TEST_COUNTRY_ID), { wrapper });

    // When - Simulate calculation query updating to error
    queryClient.setQueryData(['calculation', PENDING_REPORT_ID_1], mockCalculationError);

    // Then
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['report-associations'] });
    });
  });

  test('given pending report still computing then does not invalidate', async () => {
    // Given
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => usePendingReportsMonitor([mockPendingReport1], TEST_COUNTRY_ID), { wrapper });

    // When - Simulate calculation query updating with computing status
    queryClient.setQueryData(['calculation', PENDING_REPORT_ID_1], mockCalculationComputing);

    // Then - Wait a bit to ensure no invalidation occurs
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  test('given reports with missing IDs then skips those reports', () => {
    // Given
    const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

    // When
    renderHook(() => usePendingReportsMonitor(mockReportsWithMissingIds, TEST_COUNTRY_ID), { wrapper });

    // Then - Should only prefetch for the valid report
    expect(prefetchSpy).toHaveBeenCalledTimes(1);
  });

  test('given hook unmounts then unsubscribes from cache updates', () => {
    // Given
    const { unmount } = renderHook(() => usePendingReportsMonitor([mockPendingReport1], TEST_COUNTRY_ID), {
      wrapper,
    });

    // When
    unmount();

    // Then - Set query data after unmount should not trigger invalidation
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['calculation', PENDING_REPORT_ID_1], mockCalculationComplete);

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
