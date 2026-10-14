import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useTrackedBills } from '@/hooks/useTrackedBills';
import { TRACKER_UNAVAILABLE_ERROR } from '@/tests/fixtures/hooks/useTrackedBillsMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

const mockFetchTrackerBills = vi.fn();

vi.mock('@/api/billFeed', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/billFeed')>()),
  fetchTrackerBills: () => mockFetchTrackerBills(),
}));

const FEED_KEY = ['tracker-bills'];

function renderBillsHook() {
  // No retry delay, so the feed's own retry settles at once.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, ...renderHook(() => useTrackedBills('us'), { wrapper }) };
}

describe('useTrackedBills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given the feed fails before any bills are in then it is an error', async () => {
    // Given
    mockFetchTrackerBills.mockRejectedValue(TRACKER_UNAVAILABLE_ERROR);

    // When
    const { result } = renderBillsHook();

    // Then
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.bills).toEqual([]);
  });

  test('given bills are in then a refetch that fails keeps them, with no error', async () => {
    // Given
    mockFetchTrackerBills.mockResolvedValue([TRACKED_BILL]);
    const { result, rerender, queryClient } = renderBillsHook();
    await waitFor(() => expect(result.current.bills).toHaveLength(1));
    mockFetchTrackerBills.mockRejectedValue(TRACKER_UNAVAILABLE_ERROR);

    // When — e.g. the reader comes back to the tab after the feed went stale
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: FEED_KEY });
    });
    // A render after the refetch reads the query as it now stands.
    rerender();

    // Then
    expect(queryClient.getQueryState(FEED_KEY)?.error).toBe(TRACKER_UNAVAILABLE_ERROR);
    expect(result.current.isError).toBe(false);
    expect(result.current.bills).toEqual([TRACKED_BILL]);
  });
});
