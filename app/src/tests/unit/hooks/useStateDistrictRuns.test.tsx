import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FLAGSHIP_REPORTS_KEY } from '@/api/flagshipReportStore';
import { clockProgress } from '@/components/flagship/report/RunProgress';
import { useRegions } from '@/hooks/useRegions';
import { useStateDistrictRuns } from '@/hooks/useStateDistrictRuns';
import { MAX_FAILED_POLLS } from '@/libs/calculations/polledRun';
import { ALL_US_STATE_CODES } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import {
  allStatesComplete,
  CALIFORNIA,
  economyWhere,
  fakeStateDistrictApi,
  MAX_REQUESTS_IN_FLIGHT,
  normalizedStateDistricts,
  OHIO,
  OTHER_STATE_RUNS_YEAR,
  POLL_FAILURE,
  RECORD_REQUESTS_PER_STATE,
  STATE_COMPUTING,
  STATE_COUNT,
  STATE_ERROR,
  STATE_ERROR_MESSAGE,
  STATE_EXPECTED_MS,
  STATE_POLL_INTERVAL_MS,
  STATE_REPORT_ERROR,
  STATE_REPORT_PENDING,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_REQUEST,
  STATE_RUNS_YEAR,
  STATE_TIME_LIMIT_MESSAGE,
  STATE_TIME_LIMIT_MS,
  stateEconomyUrl,
  stateOk,
  stateOkWithoutDistricts,
  stateReportComplete,
  stateReportCompleteWithoutDistricts,
  TEXAS,
  US_STATE_REGIONS,
  UTAH,
  type FakeStateApi,
  type FakeStateApiOptions,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

function createQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrapperFor(queryClient: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

let api: FakeStateApi;

function serveApi(options: FakeStateApiOptions = {}) {
  api = fakeStateDistrictApi(options);
  vi.stubGlobal('fetch', api.fetch);
}

function renderRuns(
  request: Parameters<typeof useStateDistrictRuns>[0] = STATE_RUNS_REQUEST,
  queryClient = createQueryClient()
) {
  return renderHook(() => useStateDistrictRuns(request), { wrapper: wrapperFor(queryClient) });
}

describe('useStateDistrictRuns lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    vi.mocked(useRegions).mockReturnValue({
      data: US_STATE_REGIONS,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRegions>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  test('given the view opens then each state gets its records, created or reused, and no economy run is asked for', async () => {
    // Given
    serveApi();

    // When
    const { result } = renderRuns();

    // Then
    expect(result.current.status).toBe('checking');
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(api.simulationRequests()).toHaveLength(STATE_COUNT * 2);
    expect(api.reportRequests()).toHaveLength(STATE_COUNT);
    expect(api.economyRequests()).toHaveLength(0);
    expect(new Set(api.simulationRequests().map((request) => request.body.population_id))).toEqual(
      new Set(ALL_US_STATE_CODES)
    );
  });

  test('given a state then its simulations pair each policy on it, and its base report pairs them for the year', async () => {
    // Given
    serveApi();

    // When
    const { result } = renderRuns();
    await waitFor(() => expect(result.current.status).toBe('idle'));

    // Then
    const utahSimulations = api
      .simulationRequests()
      .filter((request) => request.body.population_id === UTAH)
      .map((request) => request.body);
    expect(utahSimulations).toEqual(
      expect.arrayContaining([
        {
          population_id: UTAH,
          population_type: 'geography',
          policy_id: Number(STATE_RUNS_BASELINE_POLICY_ID),
        },
        {
          population_id: UTAH,
          population_type: 'geography',
          policy_id: Number(STATE_RUNS_REFORM_POLICY_ID),
        },
      ])
    );
    expect(api.reportRequests().every((request) => request.body.year === STATE_RUNS_YEAR)).toBe(
      true
    );
  });

  test('given a state whose base report holds its result then its districts show without Compute', async () => {
    // Given
    serveApi({ reports: { [UTAH]: stateReportComplete(UTAH) } });

    // When
    const { result } = renderRuns();

    // Then
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.districts).toEqual(normalizedStateDistricts(UTAH));
    expect(result.current.completedCount).toBe(1);
    expect(result.current.pendingStates).not.toContain(UTAH);
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given every state saved then the districts are complete with no economy run', async () => {
    // Given
    serveApi({ reports: allStatesComplete() });

    // When
    const { result } = renderRuns();

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(result.current.completedCount).toBe(STATE_COUNT);
    expect(result.current.districts).toHaveLength(STATE_COUNT * 2 - 1);
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given base reports complete without districts, pending, or failed then those states wait for Compute', async () => {
    // Given
    serveApi({
      reports: {
        [UTAH]: stateReportCompleteWithoutDistricts(UTAH),
        [CALIFORNIA]: STATE_REPORT_PENDING,
        [TEXAS]: STATE_REPORT_ERROR,
      },
    });

    // When
    const { result } = renderRuns();

    // Then
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.districts).toEqual([]);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.pendingStates).toEqual(expect.arrayContaining([UTAH, CALIFORNIA, TEXAS]));
    expect(result.current.failedStates).toEqual([]);
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given the records requested then no more than four requests are in flight at once', async () => {
    // Given
    serveApi();

    // When
    const { result } = renderRuns();
    await waitFor(() => expect(result.current.status).toBe('idle'));

    // Then
    expect(api.requests()).toHaveLength(STATE_COUNT * RECORD_REQUESTS_PER_STATE);
    expect(api.maxInFlight()).toBe(MAX_REQUESTS_IN_FLIGHT);
  });

  test.each([
    ['reform', { ...STATE_RUNS_REQUEST, reformPolicyId: undefined }],
    ['baseline', { ...STATE_RUNS_REQUEST, baselinePolicyId: undefined }],
    ['year', { ...STATE_RUNS_REQUEST, year: undefined }],
  ])('given no %s yet then nothing is sent', async (_missing, request) => {
    // Given
    serveApi();

    // When
    const { result } = renderRuns(request);
    await vi.advanceTimersByTimeAsync(1000);

    // Then
    expect(api.requests()).toHaveLength(0);
    expect(result.current.canStart).toBe(false);
    expect(result.current.status).toBe('idle');
  });

  test('given a state whose records cannot be created then it is failed, and the others are checked', async () => {
    // Given
    serveApi({ failingRecords: [OHIO] });

    // When
    const { result } = renderRuns();

    // Then
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.failedStates).toEqual([OHIO]);
    expect(result.current.pendingStates).toHaveLength(STATE_COUNT - 1);
  });

  test('given the records checked then no user report or browser report record is written', async () => {
    // Given
    serveApi({ reports: { [UTAH]: stateReportComplete(UTAH) } });

    // When
    const { result } = renderRuns();
    await waitFor(() => expect(result.current.status).toBe('idle'));

    // Then
    expect(api.requests().some((request) => request.url.includes('user-reports'))).toBe(false);
    expect(localStorage.getItem(FLAGSHIP_REPORTS_KEY)).toBeNull();
  });

  test('given a second view of the same report then it reuses the first view’s records', async () => {
    // Given
    serveApi();
    const queryClient = createQueryClient();
    const first = renderRuns(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(first.result.current.status).toBe('idle'));

    // When
    const second = renderRuns(STATE_RUNS_REQUEST, queryClient);

    // Then
    expect(second.result.current.status).toBe('idle');
    expect(api.requests()).toHaveLength(STATE_COUNT * RECORD_REQUESTS_PER_STATE);
  });
});

describe('useStateDistrictRuns compute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    localStorage.clear();
    vi.mocked(useRegions).mockReturnValue({
      data: US_STATE_REGIONS,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRegions>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  /** Opens the view, waits for the records, and clicks Compute. */
  async function computeAll(
    request: Parameters<typeof useStateDistrictRuns>[0] = STATE_RUNS_REQUEST,
    queryClient = createQueryClient()
  ) {
    const view = renderRuns(request, queryClient);
    await waitFor(() => expect(view.result.current.status).toBe('idle'));
    act(() => view.result.current.start());
    return view;
  }

  const poll = () => act(() => vi.advanceTimersByTimeAsync(STATE_POLL_INTERVAL_MS));

  test('given Compute then each state asks for its region and year only, with no dataset', async () => {
    // Given
    serveApi({ economy: () => STATE_COMPUTING });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT));
    expect(result.current.status).toBe('computing');
    expect(api.economyRequestsFor(UTAH)).toEqual([stateEconomyUrl(UTAH)]);
    for (const url of api.economyRequests()) {
      expect([...new URL(url).searchParams.keys()]).toEqual(['region', 'time_period']);
    }
  });

  test('given the view open then nothing is computed before Compute', async () => {
    // Given
    serveApi({ economy: () => STATE_COMPUTING });
    const { result } = renderRuns();
    await waitFor(() => expect(result.current.status).toBe('idle'));

    // When
    await act(() => vi.advanceTimersByTimeAsync(STATE_POLL_INTERVAL_MS * 3));

    // Then
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given states finishing one at a time then their districts fill in as each arrives', async () => {
    // Given
    serveApi({
      economy: economyWhere(
        { [UTAH]: (request) => (request === 0 ? stateOk(UTAH) : STATE_COMPUTING) },
        (region, request) => (request < 1 ? STATE_COMPUTING : stateOk(region))
      ),
    });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.completedCount).toBe(1));
    expect(result.current.districts).toEqual(normalizedStateDistricts(UTAH));
    expect(result.current.status).toBe('computing');
    await poll();
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(result.current.completedCount).toBe(STATE_COUNT);
    expect(result.current.districts).toHaveLength(STATE_COUNT * 2 - 1);
  });

  test('given a state finishes then its result is written to its base report as received', async () => {
    // Given
    serveApi({ economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING) });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.completedCount).toBe(1));
    await waitFor(() => expect(api.reportWrites()).toHaveLength(1));
    const write = api.reportWrites()[0].body;
    expect(write.id).toBe(api.reportIdFor(UTAH));
    expect(write.status).toBe('complete');
    expect(JSON.parse(write.output).congressional_district_impact.districts).toEqual(
      normalizedStateDistricts(UTAH).map((district, index) => ({
        ...district,
        district: (stateOk(UTAH) as any).result.congressional_district_impact.districts[index]
          .district,
      }))
    );
  });

  test('given a base report already complete without districts then its run is not written over it', async () => {
    // Given
    serveApi({
      reports: { [UTAH]: stateReportCompleteWithoutDistricts(UTAH) },
      economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING),
    });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.completedCount).toBe(1));
    await act(() => vi.advanceTimersByTimeAsync(100));
    expect(api.reportWrites()).toHaveLength(0);
  });

  test('given a base report saved with districts then its state is not run', async () => {
    // Given
    serveApi({ reports: { [UTAH]: stateReportComplete(UTAH) }, economy: () => STATE_COMPUTING });

    // When
    await computeAll();

    // Then
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT - 1));
    expect(api.economyRequestsFor(UTAH)).toHaveLength(0);
  });

  test('given a failed base report then the new result is written over the error', async () => {
    // Given
    serveApi({
      reports: { [UTAH]: STATE_REPORT_ERROR },
      economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING),
    });

    // When
    await computeAll();

    // Then
    await waitFor(() => expect(api.reportWrites()).toHaveLength(1));
    expect(api.reportWrites()[0].body.id).toBe(api.reportIdFor(UTAH));
  });

  test('given a state still computing then it is polled every five seconds', async () => {
    // Given
    serveApi({ economy: () => STATE_COMPUTING });
    await computeAll();
    await waitFor(() => expect(api.economyRequestsFor(CALIFORNIA)).toHaveLength(1));

    // When
    await act(() => vi.advanceTimersByTimeAsync(STATE_POLL_INTERVAL_MS - 100));

    // Then
    expect(api.economyRequestsFor(CALIFORNIA)).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(200));
    await waitFor(() => expect(api.economyRequestsFor(CALIFORNIA)).toHaveLength(2));
  });

  test('given states computing then the bar averages each state, with finished states counting in full', async () => {
    // Given
    serveApi({ economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING) });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.completedCount).toBe(1));
    const elapsed = STATE_EXPECTED_MS / 2;

    // When
    await act(() => vi.advanceTimersByTimeAsync(elapsed));

    // Then
    const expected =
      ((1 + (STATE_COUNT - 1) * (clockProgress(elapsed, STATE_EXPECTED_MS) / 100)) / STATE_COUNT) *
      100;
    await waitFor(() => expect(result.current.progress).toBeGreaterThan(expected - 2));
    expect(result.current.progress).toBeLessThanOrEqual(expected + 2);
  });

  test('given polls over time then the bar never moves backwards, and stays under 100 while states run', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [CALIFORNIA]: () => STATE_COMPUTING,
        [TEXAS]: () => STATE_COMPUTING,
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.completedCount).toBe(STATE_COUNT - 2));
    const shown: number[] = [];

    // When
    for (let step = 0; step < 6; step++) {
      await act(() => vi.advanceTimersByTimeAsync(STATE_EXPECTED_MS));
      shown.push(result.current.progress);
    }

    // Then
    expect(shown).toEqual([...shown].sort((first, second) => first - second));
    expect(Math.max(...shown)).toBeLessThanOrEqual(99);
  });

  test('given a few failed polls in a row then the state keeps computing and finishes', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [CALIFORNIA]: (request) =>
          request === 0
            ? STATE_COMPUTING
            : request <= MAX_FAILED_POLLS
              ? POLL_FAILURE
              : stateOk(CALIFORNIA),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.completedCount).toBe(STATE_COUNT - 1));

    // When
    for (let failure = 0; failure < MAX_FAILED_POLLS; failure++) {
      await poll();
      expect(result.current.status).toBe('computing');
    }
    await poll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
  });

  test('given a state computing past its time limit then it fails, and Retry checks the same run', async () => {
    // Given
    let californiaDone = false;
    serveApi({
      economy: economyWhere({
        [CALIFORNIA]: () => (californiaDone ? stateOk(CALIFORNIA) : STATE_COMPUTING),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.completedCount).toBe(STATE_COUNT - 1));

    // When
    vi.setSystemTime(Date.now() + STATE_TIME_LIMIT_MS);
    await poll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.failedStates).toEqual([CALIFORNIA]);
    expect(result.current.error).toBe(STATE_TIME_LIMIT_MESSAGE);
    expect(result.current.canRetry).toBe(true);

    // When
    californiaDone = true;
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(new Set(api.economyRequestsFor(CALIFORNIA))).toEqual(
      new Set([stateEconomyUrl(CALIFORNIA)])
    );
  });

  test('given a failed state and one with no districts then Retry asks again for the failed one only', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? STATE_ERROR : stateOk(TEXAS)),
        [OHIO]: () => stateOkWithoutDistricts(OHIO),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    const requestsBefore = api.economyRequests().length;

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.failedStates).toEqual([OHIO]));
    expect(api.economyRequests().slice(requestsBefore)).toEqual([stateEconomyUrl(TEXAS)]);
    expect(result.current.status).toBe('partial');
    expect(result.current.canRetry).toBe(false);
  });

  test('given a result whose districts are null then the state is settled as failed, not pending', async () => {
    // Given
    serveApi({ economy: economyWhere({ [OHIO]: () => stateOkWithoutDistricts(OHIO) }) });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.failedStates).toEqual([OHIO]);
    expect(result.current.failedStateLabels).toEqual(['Ohio']);
    expect(result.current.pendingStates).toEqual([]);
    expect(result.current.completedCount).toBe(STATE_COUNT - 1);
  });

  test('given some states failed then the runs are partial, with the totals', async () => {
    // Given
    serveApi({
      economy: economyWhere({ [TEXAS]: () => STATE_ERROR, [UTAH]: () => STATE_ERROR }),
    });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.completedCount).toBe(STATE_COUNT - 2);
    expect(new Set(result.current.failedStates)).toEqual(new Set([TEXAS, UTAH]));
    expect(result.current.error).toBe(STATE_ERROR_MESSAGE);
    expect(result.current.progress).toBe(100);
  });

  test('given every state failed then the runs are in error', async () => {
    // Given
    serveApi({ economy: () => STATE_ERROR });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.completedCount).toBe(0);
    expect(result.current.failedStates).toHaveLength(STATE_COUNT);
    expect(api.reportWrites()).toHaveLength(0);
  });

  test('given Compute for one year then another year computes nothing until its own Compute, and the first comes back', async () => {
    // Given
    serveApi({ economy: () => STATE_COMPUTING });
    const queryClient = createQueryClient();
    const { result, rerender } = renderHook(
      ({ year }: { year: string }) => useStateDistrictRuns({ ...STATE_RUNS_REQUEST, year }),
      { wrapper: wrapperFor(queryClient), initialProps: { year: STATE_RUNS_YEAR } }
    );
    await waitFor(() => expect(result.current.status).toBe('idle'));
    act(() => result.current.start());
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT));

    // When
    rerender({ year: OTHER_STATE_RUNS_YEAR });
    await waitFor(() => expect(result.current.status).toBe('idle'));
    await act(() => vi.advanceTimersByTimeAsync(STATE_POLL_INTERVAL_MS / 2));

    // Then
    expect(
      api
        .economyRequests()
        .filter((url) => new URL(url).searchParams.get('time_period') === OTHER_STATE_RUNS_YEAR)
    ).toHaveLength(0);

    // When
    rerender({ year: STATE_RUNS_YEAR });

    // Then
    expect(result.current.status).toBe('computing');
  });

  test('given two views of the same report then one Compute runs each state once for both', async () => {
    // Given
    serveApi({ economy: () => STATE_COMPUTING });
    const queryClient = createQueryClient();
    const first = renderRuns(STATE_RUNS_REQUEST, queryClient);
    const second = renderRuns(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(first.result.current.status).toBe('idle'));

    // When
    act(() => first.result.current.start());

    // Then
    await waitFor(() => expect(second.result.current.status).toBe('computing'));
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT));
    await poll();
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT * 2));
  });

  test('given the view closed while states run then polling stops, queued requests are dropped, and sent ones still write', async () => {
    // Given
    serveApi({ economy: (region) => stateOk(region), holdEconomy: true });
    const { result, unmount } = await computeAll();
    await waitFor(() => expect(api.economyRequests()).toHaveLength(MAX_REQUESTS_IN_FLIGHT));
    expect(result.current.status).toBe('computing');

    // When
    unmount();
    api.releaseEconomy();
    await act(() => vi.advanceTimersByTimeAsync(STATE_POLL_INTERVAL_MS * 3));

    // Then
    expect(api.economyRequests()).toHaveLength(MAX_REQUESTS_IN_FLIGHT);
    await waitFor(() => expect(api.reportWrites()).toHaveLength(MAX_REQUESTS_IN_FLIGHT));
  });

  test('given the view reopened then each state keeps its clock', async () => {
    // Given
    serveApi({ economy: () => STATE_COMPUTING });
    const queryClient = createQueryClient();
    const first = await computeAll(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT));
    await act(() => vi.advanceTimersByTimeAsync(STATE_EXPECTED_MS / 4));
    first.unmount();
    await act(() => vi.advanceTimersByTimeAsync(STATE_EXPECTED_MS / 4));

    // When
    const reopened = renderRuns(STATE_RUNS_REQUEST, queryClient);
    await poll();

    // Then
    const elapsed = STATE_EXPECTED_MS / 2;
    await waitFor(() =>
      expect(reopened.result.current.progress).toBeGreaterThan(
        clockProgress(elapsed, STATE_EXPECTED_MS) - 3
      )
    );
  });

  test('given states computed then no user report or browser report record is written, and no error is written', async () => {
    // Given
    serveApi({ economy: economyWhere({ [TEXAS]: () => STATE_ERROR }) });

    // When
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    await waitFor(() => expect(api.reportWrites()).toHaveLength(STATE_COUNT - 1));

    // Then
    expect(api.requests().some((request) => request.url.includes('user-reports'))).toBe(false);
    expect(localStorage.getItem(FLAGSHIP_REPORTS_KEY)).toBeNull();
    expect(api.reportWrites().every((write) => write.body.status === 'complete')).toBe(true);
    expect(api.reportWrites().map((write) => write.body.id)).not.toContain(api.reportIdFor(TEXAS));
  });
});
