import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useReportYearEconomies, useReportYearEconomy } from '@/hooks/useReportYearEconomy';
import {
  hideBrowserTab,
  restoreBrowserTabTracking,
} from '@/tests/fixtures/libs/queries/browserTabMocks';

const execute = vi.fn();
vi.mock('@/libs/calculations/economy/SocietyWideCalcStrategy', () => ({
  SocietyWideCalcStrategy: class {
    execute = (...args: unknown[]) => execute(...args);
  },
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const args = {
  countryId: 'us',
  reformPolicyId: '98746',
  baselinePolicyId: '2',
  region: 'state/ny',
  year: '2027',
};

/** How often a year still computing is checked on. */
const REPORT_YEAR_POLL_INTERVAL_MS = 2000;

const COMPUTING_YEAR = { status: 'pending', progress: 10, message: 'Computing...' };

describe('report year polling while the tab is hidden', () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue(COMPUTING_YEAR);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    hideBrowserTab();
  });

  afterEach(() => {
    restoreBrowserTabTracking();
    vi.useRealTimers();
  });

  test('given the tab hidden while a picked year computes then it is still checked on', async () => {
    // Given
    renderHook(() => useReportYearEconomy({ ...args, enabled: true }), { wrapper });
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(REPORT_YEAR_POLL_INTERVAL_MS * 2));

    // Then
    expect(execute).toHaveBeenCalledTimes(3);
  });

  test('given the tab hidden while a requested year of the window computes then it is still checked on', async () => {
    // Given
    const { year, ...windowArgs } = args;
    renderHook(() => useReportYearEconomies({ ...windowArgs, years: [year] }), { wrapper });
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(REPORT_YEAR_POLL_INTERVAL_MS * 2));

    // Then
    expect(execute).toHaveBeenCalledTimes(3);
  });
});

describe('report year checks give the strategy the last status', () => {
  beforeEach(() => {
    execute.mockReset();
    execute.mockResolvedValue(COMPUTING_YEAR);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // The strategy outlasts a failed poll only when it has the run's last status.
  test('given a picked year computes then the next check gives the strategy its last status', async () => {
    // Given
    renderHook(() => useReportYearEconomy({ ...args, enabled: true }), { wrapper });
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(REPORT_YEAR_POLL_INTERVAL_MS));

    // Then
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0][2]).toBeUndefined();
    expect(execute.mock.calls[1][2]).toEqual(COMPUTING_YEAR);
  });

  test('given a requested year of the window computes then the next check gives the strategy its last status', async () => {
    // Given
    const { year, ...windowArgs } = args;
    renderHook(() => useReportYearEconomies({ ...windowArgs, years: [year] }), { wrapper });
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(REPORT_YEAR_POLL_INTERVAL_MS));

    // Then
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0][2]).toBeUndefined();
    expect(execute.mock.calls[1][2]).toEqual(COMPUTING_YEAR);
  });

  // The strategy measures a year's progress from this start time.
  test('given a requested year of the window is checked again then that check has its own start time', async () => {
    // Given
    const requestTimes: number[] = [];
    execute.mockImplementation(async () => {
      requestTimes.push(Date.now());
      return COMPUTING_YEAR;
    });
    const { year, ...windowArgs } = args;
    renderHook(() => useReportYearEconomies({ ...windowArgs, years: [year] }), { wrapper });
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(REPORT_YEAR_POLL_INTERVAL_MS));

    // Then
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[1][1].startedAt).toBe(requestTimes[1]);
  });
});

describe('useReportYearEconomy', () => {
  beforeEach(() => execute.mockReset());

  test('given no year picked then nothing runs', () => {
    const { result } = renderHook(() => useReportYearEconomy({ ...args, enabled: false }), {
      wrapper,
    });

    expect(result.current.status).toBe('idle');
    expect(execute).not.toHaveBeenCalled();
  });

  test('given a year picked then that year is scored for the same reform, comparison and population', async () => {
    execute.mockResolvedValue({ status: 'complete', result: { budget: { budgetary_impact: -5 } } });

    const { result } = renderHook(() => useReportYearEconomy({ ...args, enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(execute.mock.calls[0][0]).toMatchObject({
      year: '2027',
      region: 'state/ny',
      policyIds: { reform: '98746', baseline: '2' },
    });
    expect(result.current.output).toEqual({ budget: { budgetary_impact: -5 } });
  });
});
