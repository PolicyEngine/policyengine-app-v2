import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchBudgetWindow } from '@/api/budgetWindow';
import { useBudgetWindow } from '@/hooks/useBudgetWindow';
import {
  BUDGET_WINDOW_BASELINE_POLICY_ID,
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

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
    renderHook(
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
    await waitFor(() => expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(BUDGET_WINDOW_POLL_INTERVAL_MS * 2));

    // Then
    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(3);
  });
});
