import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchBudgetWindow } from '@/api/budgetWindow';
import { useBudgetWindow } from '@/hooks/useBudgetWindow';
import { MAX_FAILED_POLLS } from '@/libs/calculations/polledRun';
import {
  BUDGET_WINDOW_BASELINE_POLICY_ID,
  BUDGET_WINDOW_CHECK_FAILURE,
  BUDGET_WINDOW_COMPUTING,
  BUDGET_WINDOW_COUNTRY_ID,
  BUDGET_WINDOW_PARAMS,
  BUDGET_WINDOW_POLL_INTERVAL_MS,
  BUDGET_WINDOW_REFORM_POLICY_ID,
} from '@/tests/fixtures/hooks/useBudgetWindowMocks';
import {
  hideBrowserTab,
  restoreBrowserTabTracking,
} from '@/tests/fixtures/libs/queries/browserTabMocks';

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: vi.fn(),
}));

const mockFetchBudgetWindow = vi.mocked(fetchBudgetWindow);

function wrapper({ children }: { children: ReactNode }) {
  // React Query's own defaults, as the app's client has them (3 retries), so
  // the hook's own retry setting is what the tests see.
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderWindow() {
  return renderHook(
    () =>
      useBudgetWindow(
        BUDGET_WINDOW_COUNTRY_ID,
        BUDGET_WINDOW_REFORM_POLICY_ID,
        BUDGET_WINDOW_BASELINE_POLICY_ID,
        BUDGET_WINDOW_PARAMS,
        { enabled: true }
      ),
    { wrapper }
  );
}

/** Lets the given number of checks go out, one poll interval apart. */
const checkAgain = (times: number) =>
  act(() => vi.advanceTimersByTimeAsync(BUDGET_WINDOW_POLL_INTERVAL_MS * times));

describe('useBudgetWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    restoreBrowserTabTracking();
    vi.useRealTimers();
  });

  test('given the tab hidden while the window computes then it is still checked on', async () => {
    // Given
    mockFetchBudgetWindow.mockResolvedValue(BUDGET_WINDOW_COMPUTING);
    hideBrowserTab();
    renderWindow();
    await waitFor(() => expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1));

    // When
    await checkAgain(2);

    // Then
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(3);
  });

  test('given the tab hidden and a check fails while the window computes then it is still checked on', async () => {
    // Given
    mockFetchBudgetWindow
      .mockResolvedValueOnce(BUDGET_WINDOW_COMPUTING)
      .mockRejectedValueOnce(BUDGET_WINDOW_CHECK_FAILURE)
      .mockResolvedValue(BUDGET_WINDOW_COMPUTING);
    hideBrowserTab();
    const { result } = renderWindow();
    await waitFor(() => expect(result.current.data?.status).toBe('computing'));

    // When
    await checkAgain(1);

    // Then: the failed check is counted, the window still computes, and the next check goes out.
    await waitFor(() => expect(result.current.data?.failedPolls).toBe(1));
    expect(result.current.isError).toBe(false);
    await checkAgain(1);
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(3);
  });

  test('given MAX_FAILED_POLLS failed checks in a row while the window computes then it keeps computing', async () => {
    // Given
    mockFetchBudgetWindow
      .mockResolvedValueOnce(BUDGET_WINDOW_COMPUTING)
      .mockRejectedValue(BUDGET_WINDOW_CHECK_FAILURE);
    const { result } = renderWindow();
    await waitFor(() => expect(result.current.data?.status).toBe('computing'));

    // When
    await checkAgain(MAX_FAILED_POLLS);

    // Then
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1 + MAX_FAILED_POLLS);
    await waitFor(() => expect(result.current.data?.failedPolls).toBe(MAX_FAILED_POLLS));
    expect(result.current.isError).toBe(false);
    expect(result.current.data?.status).toBe('computing');
  });

  test('given one more failed check after MAX_FAILED_POLLS then the window reports the error', async () => {
    // Given
    mockFetchBudgetWindow
      .mockResolvedValueOnce(BUDGET_WINDOW_COMPUTING)
      .mockRejectedValue(BUDGET_WINDOW_CHECK_FAILURE);
    const { result } = renderWindow();
    await waitFor(() => expect(result.current.data?.status).toBe('computing'));
    await checkAgain(MAX_FAILED_POLLS);
    await waitFor(() => expect(result.current.data?.failedPolls).toBe(MAX_FAILED_POLLS));
    // Read here, so the hook re-renders when it changes: useQuery
    // re-renders only for the result properties already read.
    expect(result.current.isError).toBe(false);

    // When
    await checkAgain(1);

    // Then
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(2 + MAX_FAILED_POLLS);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(BUDGET_WINDOW_CHECK_FAILURE);
  });

  test('given a check succeeds between failed checks then the failures are counted again from zero', async () => {
    // Given
    mockFetchBudgetWindow.mockResolvedValueOnce(BUDGET_WINDOW_COMPUTING);
    for (let failure = 0; failure < MAX_FAILED_POLLS; failure++) {
      mockFetchBudgetWindow.mockRejectedValueOnce(BUDGET_WINDOW_CHECK_FAILURE);
    }
    mockFetchBudgetWindow
      .mockResolvedValueOnce(BUDGET_WINDOW_COMPUTING)
      .mockRejectedValue(BUDGET_WINDOW_CHECK_FAILURE);
    const { result } = renderWindow();
    await waitFor(() => expect(result.current.data?.status).toBe('computing'));

    // When
    await checkAgain(MAX_FAILED_POLLS + 1 + MAX_FAILED_POLLS);

    // Then
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(2 + 2 * MAX_FAILED_POLLS);
    await waitFor(() => expect(result.current.data?.failedPolls).toBe(MAX_FAILED_POLLS));
    expect(result.current.isError).toBe(false);
  });

  test('given the first request fails then the window reports the error without retrying', async () => {
    // Given
    mockFetchBudgetWindow.mockRejectedValue(BUDGET_WINDOW_CHECK_FAILURE);

    // When
    const { result } = renderWindow();

    // Then
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1);
  });
});
