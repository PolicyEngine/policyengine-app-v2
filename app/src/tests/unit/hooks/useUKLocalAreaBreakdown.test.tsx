import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import {
  ukLocalAreaBreakdownQueryKey,
  useUKLocalAreaBreakdown,
} from '@/hooks/useUKLocalAreaBreakdown';
import {
  BREAKDOWN_POLL_INTERVAL_MS,
  COMPLETE_RESPONSE,
  FAILED_RESPONSE,
  LOADING_DATA_RESPONSE,
  NORMALIZED_BREAKDOWN,
  QUEUED_RESPONSE,
  SCOTLAND_BREAKDOWN_REQUEST,
  UK_BREAKDOWN_REQUEST,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

vi.mock('@/api/societyWideCalculation', () => ({
  fetchLocalAreaBreakdown: vi.fn(),
}));

const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapperFor(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useUKLocalAreaBreakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given the hook mounted then it sends no request before start', () => {
    // When
    const { result } = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(createQueryClient()),
    });

    // Then
    expect(result.current.status).toBe('idle');
    expect(result.current.breakdown).toBeNull();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given start then it polls until the run is ok and returns the areas', async () => {
    // Given
    mockFetchLocalAreaBreakdown
      .mockResolvedValueOnce(QUEUED_RESPONSE)
      .mockResolvedValueOnce(COMPLETE_RESPONSE);
    const { result } = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(createQueryClient()),
    });

    // When
    act(() => result.current.start());

    // Then
    await waitFor(() => expect(result.current.queuePosition).toBe(3));
    expect(result.current.status).toBe('computing');
    await act(() => vi.advanceTimersByTimeAsync(BREAKDOWN_POLL_INTERVAL_MS));
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(result.current.breakdown).toEqual(NORMALIZED_BREAKDOWN);
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(2);
  });

  test('given a run that reports its stage then it exposes the stage and a progress inside it', async () => {
    // Given
    mockFetchLocalAreaBreakdown.mockResolvedValue(LOADING_DATA_RESPONSE);
    const { result } = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(createQueryClient()),
    });

    // When
    act(() => result.current.start());

    // Then
    await waitFor(() => expect(result.current.stage).toBe('loading_data'));
    expect(result.current.progress).toBeGreaterThanOrEqual(LOADING_DATA_RESPONSE.progress!);
    expect(result.current.progress).toBeLessThanOrEqual(LOADING_DATA_RESPONSE.progress_max!);
  });

  test('given the run fails then the status is error and retry sends the request again', async () => {
    // Given
    mockFetchLocalAreaBreakdown
      .mockResolvedValueOnce(FAILED_RESPONSE)
      .mockResolvedValueOnce(COMPLETE_RESPONSE);
    const { result } = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(createQueryClient()),
    });
    act(() => result.current.start());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(FAILED_RESPONSE.error);

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(2);
  });

  test('given the request itself fails then the status is error', async () => {
    // Given
    mockFetchLocalAreaBreakdown.mockRejectedValue(new Error('Society-wide calculation failed'));
    const { result } = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(createQueryClient()),
    });

    // When
    act(() => result.current.start());

    // Then
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  test('given a nation report then it asks for that nation and year with both policies', async () => {
    // Given
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const queryClient = createQueryClient();
    const { result } = renderHook(() => useUKLocalAreaBreakdown(SCOTLAND_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(queryClient),
    });

    // When
    act(() => result.current.start());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledWith(
      SCOTLAND_BREAKDOWN_REQUEST.countryId,
      SCOTLAND_BREAKDOWN_REQUEST.reformPolicyId,
      SCOTLAND_BREAKDOWN_REQUEST.baselinePolicyId,
      { region: SCOTLAND_BREAKDOWN_REQUEST.region, time_period: SCOTLAND_BREAKDOWN_REQUEST.year }
    );
    expect(
      queryClient.getQueryData([
        'uk-local-area-breakdown',
        SCOTLAND_BREAKDOWN_REQUEST.countryId,
        SCOTLAND_BREAKDOWN_REQUEST.reformPolicyId,
        SCOTLAND_BREAKDOWN_REQUEST.baselinePolicyId,
        SCOTLAND_BREAKDOWN_REQUEST.region,
        SCOTLAND_BREAKDOWN_REQUEST.year,
      ])
    ).toBeDefined();
  });

  test('given a report with no region then the key and the request read the UK', () => {
    // When
    const queryKey = ukLocalAreaBreakdownQueryKey({ ...UK_BREAKDOWN_REQUEST, region: undefined });

    // Then
    expect(queryKey).toEqual(ukLocalAreaBreakdownQueryKey(UK_BREAKDOWN_REQUEST));
  });

  test.each([
    ['country', { countryId: 'us' }],
    ['reform', { reformPolicyId: '2' }],
    ['baseline', { baselinePolicyId: '7' }],
    ['region', { region: 'country/wales' }],
    ['year', { year: '2027' }],
  ])('given a different %s then the key differs', (_field, change) => {
    // When
    const queryKey = ukLocalAreaBreakdownQueryKey({ ...UK_BREAKDOWN_REQUEST, ...change });

    // Then
    expect(queryKey).not.toEqual(ukLocalAreaBreakdownQueryKey(UK_BREAKDOWN_REQUEST));
  });

  test('given a result already fetched then a new view gets it without start', async () => {
    // Given
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const queryClient = createQueryClient();
    const first = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(queryClient),
    });
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.status).toBe('complete'));
    first.unmount();

    // When
    const second = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(queryClient),
    });

    // Then
    expect(second.result.current.status).toBe('complete');
    expect(second.result.current.breakdown).toEqual(NORMALIZED_BREAKDOWN);
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1);
  });

  test('given two views of the same report then one start sends one request for both', async () => {
    // Given
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    const { result } = renderHook(
      () => ({
        constituencies: useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST),
        localAuthorities: useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST),
      }),
      { wrapper: wrapperFor(createQueryClient()) }
    );

    // When
    act(() => result.current.constituencies.start());

    // Then
    await waitFor(() => expect(result.current.localAuthorities.status).toBe('complete'));
    expect(result.current.localAuthorities.breakdown).toEqual(NORMALIZED_BREAKDOWN);
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1);
  });

  test('given a view opened while another view runs the breakdown then it follows the run', async () => {
    // Given
    mockFetchLocalAreaBreakdown
      .mockResolvedValueOnce(QUEUED_RESPONSE)
      .mockResolvedValueOnce(COMPLETE_RESPONSE);
    const queryClient = createQueryClient();
    const first = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(queryClient),
    });
    act(() => first.result.current.start());
    await waitFor(() => expect(first.result.current.status).toBe('computing'));
    first.unmount();

    // When
    const second = renderHook(() => useUKLocalAreaBreakdown(UK_BREAKDOWN_REQUEST), {
      wrapper: wrapperFor(queryClient),
    });
    await act(() => vi.advanceTimersByTimeAsync(BREAKDOWN_POLL_INTERVAL_MS));

    // Then
    await waitFor(() => expect(second.result.current.status).toBe('complete'));
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(2);
  });

  test('given the report policies are not known yet then start sends nothing', () => {
    // Given
    const { result } = renderHook(
      () => useUKLocalAreaBreakdown({ ...UK_BREAKDOWN_REQUEST, reformPolicyId: undefined }),
      { wrapper: wrapperFor(createQueryClient()) }
    );

    // When
    act(() => result.current.start());

    // Then
    expect(result.current.canStart).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });
});
