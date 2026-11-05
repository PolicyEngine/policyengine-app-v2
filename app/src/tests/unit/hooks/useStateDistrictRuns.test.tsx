import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FLAGSHIP_REPORTS_KEY } from '@/api/flagshipReportStore';
import { clockProgress } from '@/components/flagship/report/RunProgress';
import { useRegions } from '@/hooks/useRegions';
import { stateDistrictRunQueryKey, useStateDistrictRuns } from '@/hooks/useStateDistrictRuns';
import { MAX_FAILED_POLLS } from '@/libs/calculations/polledRun';
import { reportKeys } from '@/libs/queryKeys';
import { ALL_US_STATE_CODES } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import {
  allStatesComplete,
  BROWSER_TIMER_LIMIT_MS,
  CALIFORNIA,
  economyWhere,
  fakeStateDistrictApi,
  MAX_REQUESTS_IN_FLIGHT,
  MS_PER_SECOND,
  normalizedStateDistricts,
  OHIO,
  OTHER_STATE_RUNS_YEAR,
  POLL_FAILURE,
  RECORD_REQUESTS_PER_STATE,
  STATE_COMPUTING,
  STATE_COUNT,
  STATE_DELETE_LOCKOUT_SECONDS,
  STATE_DELETE_REFUSED_SECONDS,
  STATE_DELETE_WAIT_REASON,
  STATE_ERROR,
  STATE_ERROR_MESSAGE,
  STATE_EXPECTED_MS,
  STATE_FAILURE_REASON,
  STATE_LAST_MINUTE_RETRY_WAIT_SECONDS,
  STATE_LONG_RETRY_WAIT_REASON,
  STATE_NEWER_RUN_REASON,
  STATE_PAST_SHORT_RETRY_WAIT_SECONDS,
  STATE_POLL_INTERVAL_MS,
  STATE_RECORDS_FAILURE_REASON,
  STATE_REPLAYED_RETRY_WAIT_SECONDS,
  STATE_REPORT_ERROR,
  STATE_REPORT_PENDING,
  STATE_REQUEST_FAILURE_REASON,
  STATE_RETRY_NOTE,
  STATE_RETRY_WAIT_MS,
  STATE_RETRY_WAIT_REASON,
  STATE_RETRY_WAIT_SECONDS,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_REQUEST,
  STATE_RUNS_YEAR,
  STATE_SHORT_RETRY_WAIT_LIMIT_SECONDS,
  STATE_STORED_FAILURE_SECONDS,
  STATE_TIME_LIMIT_MESSAGE,
  STATE_TIME_LIMIT_MS,
  stateDeleteMethodNotAllowed,
  stateDeleteNetworkFailure,
  stateDeleteNotAFailure,
  stateDeleteTooSoon,
  stateDeleteUnavailable,
  stateEconomyUrl,
  stateErrorPage,
  stateFailure,
  stateFailureDeletable,
  stateFailureDeleted,
  stateFailureKeptTwoMinutes,
  stateFailureNoLongerKept,
  stateNothingStored,
  stateOk,
  stateOkWithoutDistricts,
  stateOkWithUnreadableDistricts,
  stateReportComplete,
  stateReportCompleteWithoutDistricts,
  stateReportCompleteWithUnreadableDistricts,
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

  test('given a state whose records cannot be created then it is failed with a short reason, and the others are checked', async () => {
    // Given
    serveApi({ failingRecords: [OHIO] });

    // When
    const { result } = renderRuns();

    // Then
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.failedStates).toEqual([OHIO]);
    expect(result.current.calculationFailures).toEqual([
      { label: 'Ohio', error: STATE_RECORDS_FAILURE_REASON },
    ]);
    expect(result.current.pendingStates).toHaveLength(STATE_COUNT - 1);
  });

  test('given a saved base report whose districts cannot be read then the state waits for Compute, which runs it', async () => {
    // Given
    serveApi({
      reports: { [OHIO]: stateReportCompleteWithUnreadableDistricts(OHIO) },
      economy: (region) => stateOk(region),
    });
    const { result } = renderRuns();
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(result.current.failedStates).toEqual([]);
    expect(result.current.pendingStates).toContain(OHIO);

    // When
    act(() => result.current.start());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyRequestsFor(OHIO)).toEqual([stateEconomyUrl(OHIO)]);
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

  test('given every state finishing at once then their result writes stay within four requests in flight', async () => {
    // Given
    serveApi({ economy: (region) => stateOk(region) });

    // When
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('complete'));
    await waitFor(() => expect(api.reportWrites()).toHaveLength(STATE_COUNT));

    // Then
    expect(api.maxInFlight()).toBe(MAX_REQUESTS_IN_FLIGHT);
  });

  test('given a state result written then the report cache holds the whole base report, with its simulations', async () => {
    // Given
    serveApi({ economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING) });
    const queryClient = createQueryClient();

    // When
    await computeAll(STATE_RUNS_REQUEST, queryClient);

    // Then
    await waitFor(() => expect(api.reportWrites()).toHaveLength(1));
    const reportId = String(api.reportIdFor(UTAH));
    await waitFor(() =>
      expect(queryClient.getQueryData(reportKeys.byId(reportId))).toMatchObject({
        id: reportId,
        status: 'complete',
        year: STATE_RUNS_YEAR,
        simulationIds: [
          String(api.simulationIdFor(UTAH, 'baseline')),
          String(api.simulationIdFor(UTAH, 'reform')),
        ],
      })
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
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_FAILURE_REASON },
    ]);
    expect(result.current.noDistrictStateLabels).toEqual(['Ohio']);
    const requestsBefore = api.economyRequests().length;

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.failedStates).toEqual([OHIO]));
    expect(api.economyRequests().slice(requestsBefore)).toEqual([stateEconomyUrl(TEXAS)]);
    expect(result.current.status).toBe('partial');
    expect(result.current.canRetry).toBe(false);
    expect(result.current.calculationFailures).toEqual([]);
    expect(result.current.noDistrictStateLabels).toEqual(['Ohio']);
  });

  test('given a state whose records failed then Retry asks for them again, the state waits meanwhile, and then it runs', async () => {
    // Given
    serveApi({ failingRecords: [OHIO], economy: (region) => stateOk(region) });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.failedStates).toEqual([OHIO]);
    api.setFailingRecords([]);
    api.holdRecords([OHIO]);

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('computing'));
    expect(result.current.failedStates).toEqual([]);
    expect(result.current.pendingStates).toEqual([OHIO]);
    api.releaseRecords();
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyRequestsFor(OHIO)).toEqual([stateEconomyUrl(OHIO)]);
  });

  test('given a failed calculation answered with 502 then the state fails at that answer, with the reason states that failed alike share', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? STATE_COMPUTING : STATE_ERROR),
        [OHIO]: () =>
          stateFailure(
            'Simulation entrypoint execution failed: Simulation failed (correlation_id=state-run-2)'
          ),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(api.economyRequestsFor(TEXAS)).toHaveLength(1));

    // When
    await poll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(api.economyRequestsFor(TEXAS)).toHaveLength(2);
    expect(result.current.calculationFailures).toEqual([
      { label: 'Ohio', error: STATE_FAILURE_REASON },
      { label: 'Texas', error: STATE_FAILURE_REASON },
    ]);
  });

  test('given a failed calculation whose answer says when a new run can be requested then the reason says Retry can start a new run in a few minutes', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: () => stateFailureKeptTwoMinutes(),
      }),
    });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_RETRY_WAIT_REASON },
    ]);
  });

  test('given a failed calculation whose answer says when a new run can be requested then Retry is offered only from then, and the reason drops the wait', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureKeptTwoMinutes() : stateOk(TEXAS)),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.canRetry).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(STATE_RETRY_WAIT_MS - MS_PER_SECOND));
    expect(result.current.canRetry).toBe(false);

    // When
    await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));

    // Then
    expect(result.current.canRetry).toBe(true);
    // Once the wait is over, the reason no longer says Retry has to wait.
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_FAILURE_REASON },
    ]);
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyRequestsFor(TEXAS)).toHaveLength(2);
  });

  test('given Retry before a failure can run again then only the states that can run again are asked again', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: () => stateFailureKeptTwoMinutes(),
        [OHIO]: (request) => (request === 0 ? stateErrorPage() : stateOk(OHIO)),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.canRetry).toBe(true);

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.completedCount).toBe(STATE_COUNT - 1));
    expect(api.economyRequestsFor(OHIO)).toHaveLength(2);
    expect(api.economyRequestsFor(TEXAS)).toHaveLength(1);
    expect(result.current.status).toBe('partial');
    expect(result.current.canRetry).toBe(false);
  });

  test('given a failure whose message has the note but whose answer has no retry_after_seconds then Retry is offered at once', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) =>
          request === 0
            ? stateFailure(`${STATE_ERROR_MESSAGE}. ${STATE_RETRY_NOTE}`)
            : stateOk(TEXAS),
      }),
    });

    // When
    const { result } = await computeAll();

    // Then: the wait comes from the answer's field, never from its message.
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.canRetry).toBe(true);
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_FAILURE_REASON },
    ]);
  });

  test('given an answer whose retry_after_seconds differs from the wait its message gives then Retry is offered from the field’s time', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) =>
          request === 0
            ? stateFailure(
                `${STATE_ERROR_MESSAGE}. ${STATE_RETRY_NOTE}`,
                STATE_REPLAYED_RETRY_WAIT_SECONDS
              )
            : stateOk(TEXAS),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_RETRY_WAIT_REASON },
    ]);
    await act(() =>
      vi.advanceTimersByTimeAsync((STATE_REPLAYED_RETRY_WAIT_SECONDS - 1) * MS_PER_SECOND)
    );
    expect(result.current.canRetry).toBe(false);

    // When
    await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));

    // Then
    expect(result.current.canRetry).toBe(true);
  });

  test.each([
    ['shown', () => document.dispatchEvent(new Event('visibilitychange'))],
    ['focused', () => window.dispatchEvent(new Event('focus'))],
  ])(
    'given the wait over while the tab slept then Retry is offered once the tab is %s, before its timer runs',
    async (_case, returnToTab) => {
      // Given
      serveApi({
        economy: economyWhere({
          [TEXAS]: (request) => (request === 0 ? stateFailureKeptTwoMinutes() : stateOk(TEXAS)),
        }),
      });
      const { result } = await computeAll();
      await waitFor(() => expect(result.current.status).toBe('partial'));
      expect(result.current.canRetry).toBe(false);
      // The clock moves past the wait while the tab's timers are held back.
      vi.setSystemTime(Date.now() + STATE_RETRY_WAIT_MS);

      // When
      act(() => returnToTab());

      // Then
      expect(result.current.canRetry).toBe(true);
    }
  );

  test('given failures with 15 minutes and just over 15 minutes left then the reasons say a few minutes and hours or days', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [OHIO]: () => stateFailure(STATE_ERROR_MESSAGE, STATE_SHORT_RETRY_WAIT_LIMIT_SECONDS),
        [TEXAS]: () => stateFailure(STATE_ERROR_MESSAGE, STATE_SHORT_RETRY_WAIT_LIMIT_SECONDS + 1),
      }),
    });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Ohio', error: STATE_RETRY_WAIT_REASON },
      { label: 'Texas', error: STATE_LONG_RETRY_WAIT_REASON },
    ]);
  });

  test('given a state waiting when the view closes then the tab listeners it added are removed', async () => {
    // Given
    serveApi({ economy: economyWhere({ [TEXAS]: () => stateFailureKeptTwoMinutes() }) });
    const documentListeners = vi.spyOn(document, 'addEventListener');
    const windowListeners = vi.spyOn(window, 'addEventListener');
    const documentRemovals = vi.spyOn(document, 'removeEventListener');
    const windowRemovals = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));

    // When
    unmount();

    // Then
    const added = [...documentListeners.mock.calls, ...windowListeners.mock.calls].filter(
      ([type]) => type === 'visibilitychange' || type === 'focus'
    );
    const removed = [...documentRemovals.mock.calls, ...windowRemovals.mock.calls];
    expect(added.length).toBeGreaterThan(0);
    for (const [type, listener] of added) {
      expect(removed).toContainEqual([type, listener]);
    }
    vi.restoreAllMocks();
  });

  test('given states that failed alike with different seconds left then they share one reason', async () => {
    // Given: Texas's failure is replayed in its last minute, Ohio's just after it was stored.
    serveApi({
      economy: economyWhere({
        [TEXAS]: () => stateFailure(STATE_ERROR_MESSAGE, STATE_LAST_MINUTE_RETRY_WAIT_SECONDS),
        [OHIO]: () => stateFailure(STATE_ERROR_MESSAGE, STATE_RETRY_WAIT_SECONDS),
      }),
    });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Ohio', error: STATE_RETRY_WAIT_REASON },
      { label: 'Texas', error: STATE_RETRY_WAIT_REASON },
    ]);
  });

  test('given a failure the Public API keeps for 30 days then Retry is not offered until then, and the reason says it can take days', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: () => stateFailure(STATE_ERROR_MESSAGE, STATE_STORED_FAILURE_SECONDS),
      }),
    });
    const timers = vi.spyOn(globalThis, 'setTimeout');
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_LONG_RETRY_WAIT_REASON },
    ]);
    await act(() =>
      vi.advanceTimersByTimeAsync((STATE_STORED_FAILURE_SECONDS - 1) * MS_PER_SECOND)
    );
    expect(result.current.canRetry).toBe(false);

    // When
    await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));

    // Then
    expect(result.current.canRetry).toBe(true);
    // A browser runs a longer timer at once, so none is set past its limit.
    const delays = timers.mock.calls.map(([, delay]) => delay ?? 0);
    timers.mockRestore();
    expect(Math.max(...delays)).toBeLessThanOrEqual(BROWSER_TIMER_LIMIT_MS);
  });

  test('given a failure kept just over 15 minutes then the reason says a few minutes once 15 minutes are left, with nothing else drawing the view', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: () =>
          stateFailure(
            STATE_ERROR_MESSAGE,
            STATE_SHORT_RETRY_WAIT_LIMIT_SECONDS + STATE_PAST_SHORT_RETRY_WAIT_SECONDS
          ),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_LONG_RETRY_WAIT_REASON },
    ]);
    await act(() =>
      vi.advanceTimersByTimeAsync((STATE_PAST_SHORT_RETRY_WAIT_SECONDS - 1) * MS_PER_SECOND)
    );
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_LONG_RETRY_WAIT_REASON },
    ]);

    // When
    await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));

    // Then
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_RETRY_WAIT_REASON },
    ]);
  });

  test('given a failure the Public API lets the app delete then Retry deletes it and then requests the state', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.canRetry).toBe(true);

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET']);
    expect(api.deleteRequestsFor(TEXAS)).toEqual([stateEconomyUrl(TEXAS)]);
  });

  test('given a failure a DELETE can clear only in a few seconds then Retry is offered from then, not once the Public API stops keeping it', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) =>
          request === 0 ? stateFailureDeletable(STATE_DELETE_LOCKOUT_SECONDS) : stateOk(TEXAS),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_DELETE_WAIT_REASON },
    ]);
    await act(() =>
      vi.advanceTimersByTimeAsync((STATE_DELETE_LOCKOUT_SECONDS - 1) * MS_PER_SECOND)
    );
    expect(result.current.canRetry).toBe(false);

    // When
    await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));

    // Then
    expect(result.current.canRetry).toBe(true);
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_FAILURE_REASON },
    ]);
  });

  test.each([
    [
      'without delete_after_seconds, as from a deploy from before the DELETE',
      stateFailureKeptTwoMinutes,
      STATE_RETRY_WAIT_MS,
    ],
    [
      'with delete_after_seconds null, as when no failure is kept',
      () => stateFailure(STATE_ERROR_MESSAGE, null, null),
      0,
    ],
  ])(
    'given a failure answered %s then Retry, once offered, requests the state with no DELETE',
    async (_case, failure, waitMs) => {
      // Given
      serveApi({
        economy: economyWhere({
          [TEXAS]: (request) => (request === 0 ? failure() : stateOk(TEXAS)),
        }),
      });
      const { result } = await computeAll();
      await waitFor(() => expect(result.current.status).toBe('partial'));
      await act(() => vi.advanceTimersByTimeAsync(waitMs));
      expect(result.current.canRetry).toBe(true);

      // When
      act(() => result.current.retry());

      // Then
      await waitFor(() => expect(result.current.status).toBe('complete'));
      expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'GET']);
    }
  );

  test('given the DELETE answered that nothing is stored then the state is requested again', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
      deleteFailure: () => stateNothingStored(),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET']);
  });

  test('given the DELETE refused as too soon then the state stays failed, unrequested, with Retry hidden for the seconds the answer gives', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
      deleteFailure: (_region, request) =>
        request === 0 ? stateDeleteTooSoon() : stateFailureDeleted(),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() =>
      expect(result.current.calculationFailures).toEqual([
        { label: 'Texas', error: STATE_DELETE_WAIT_REASON },
      ])
    );
    expect(result.current.status).toBe('partial');
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE']);
    expect(result.current.canRetry).toBe(false);
    await act(() =>
      vi.advanceTimersByTimeAsync((STATE_DELETE_REFUSED_SECONDS - 1) * MS_PER_SECOND)
    );
    expect(result.current.canRetry).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));
    expect(result.current.canRetry).toBe(true);

    // When: Retry again
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'DELETE', 'GET']);
  });

  test('given the DELETE finds a newer run in place of the failure then the state stays failed with a short reason, and Retry requests it with no DELETE', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
      deleteFailure: () => stateDeleteNotAFailure(),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() =>
      expect(result.current.calculationFailures).toEqual([
        { label: 'Texas', error: STATE_NEWER_RUN_REASON },
      ])
    );
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE']);
    expect(result.current.canRetry).toBe(true);

    // When: Retry again
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET']);
  });

  test.each([
    ['answered with an error page', stateErrorPage],
    ['answered with the Public API’s 502 error body', stateDeleteUnavailable],
    ['refused by a deploy without the DELETE', stateDeleteMethodNotAllowed],
    ['failed on the network', stateDeleteNetworkFailure],
  ])(
    'given the DELETE %s then the state stays failed with a short reason, and Retry deletes again',
    async (_case, failedDelete) => {
      // Given
      serveApi({
        economy: economyWhere({
          [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
        }),
        deleteFailure: (_region, request) =>
          request === 0 ? failedDelete() : stateFailureDeleted(),
      });
      const { result } = await computeAll();
      await waitFor(() => expect(result.current.status).toBe('partial'));

      // When
      act(() => result.current.retry());

      // Then
      await waitFor(() =>
        expect(result.current.calculationFailures).toEqual([
          { label: 'Texas', error: STATE_REQUEST_FAILURE_REASON },
        ])
      );
      expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE']);
      expect(result.current.canRetry).toBe(true);

      // When: Retry again
      act(() => result.current.retry());

      // Then
      await waitFor(() => expect(result.current.status).toBe('complete'));
      expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'DELETE', 'GET']);
    }
  );

  test('given Retry pressed again from the view as drawn before the first press then the state is deleted and requested once', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    api.holdDeletes();
    // The press handler as drawn before the first press, which still offers Retry.
    const { retry } = result.current;
    act(() => retry());
    await waitFor(() => expect(api.deleteRequestsFor(TEXAS)).toHaveLength(1));

    // When
    act(() => retry());
    api.releaseDeletes();

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET']);
  });

  test('given a DELETE that keeps failing then Retry deletes again while the failure is kept, and afterwards requests the state alone', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
      deleteFailure: () => stateDeleteMethodNotAllowed(),
    });
    const queryClient = createQueryClient();
    const { result } = await computeAll(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(result.current.status).toBe('partial'));
    // Each Retry is pressed once the one before has had its answer.
    const answered = () => waitFor(() => expect(queryClient.isFetching()).toBe(0));
    act(() => result.current.retry());
    await answered();
    act(() => result.current.retry());
    await answered();
    expect(api.deleteRequestsFor(TEXAS)).toHaveLength(2);
    await act(() => vi.advanceTimersByTimeAsync(STATE_RETRY_WAIT_MS));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'DELETE', 'GET']);
  });

  test('given a failed DELETE and then one refused as too soon then the reason is the calculation’s own again, with the wait', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
      deleteFailure: (_region, request) =>
        request === 0 ? stateErrorPage() : stateDeleteTooSoon(),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.calculationFailures).toEqual([
        { label: 'Texas', error: STATE_REQUEST_FAILURE_REASON },
      ])
    );

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() =>
      expect(result.current.calculationFailures).toEqual([
        { label: 'Texas', error: STATE_DELETE_WAIT_REASON },
      ])
    );
  });

  test.each([
    [
      'while its DELETE is in flight',
      () => api.holdDeletes(),
      () => api.releaseDeletes(),
      ['GET', 'DELETE'],
      ['GET', 'DELETE', 'GET'],
    ],
    [
      'after its DELETE, with its request in flight',
      () => api.holdEconomy(),
      () => api.releaseEconomy(),
      ['GET', 'DELETE', 'GET'],
      ['GET', 'DELETE', 'GET', 'GET'],
    ],
  ])(
    'given the view closed %s then the reopened view’s Retry requests the state with no second DELETE',
    async (_case, hold, release, sentBeforeClose, sentInAll) => {
      // Given
      serveApi({
        economy: economyWhere({
          [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
        }),
      });
      const queryClient = createQueryClient();
      const first = await computeAll(STATE_RUNS_REQUEST, queryClient);
      await waitFor(() => expect(first.result.current.status).toBe('partial'));
      hold();
      act(() => first.result.current.retry());
      await waitFor(() => expect(api.economyMethodsFor(TEXAS)).toEqual(sentBeforeClose));

      // When
      first.unmount();
      release();
      await act(() => vi.advanceTimersByTimeAsync(MS_PER_SECOND));
      const second = renderRuns(STATE_RUNS_REQUEST, queryClient);
      await waitFor(() => expect(second.result.current.canRetry).toBe(true));
      act(() => second.result.current.retry());

      // Then
      await waitFor(() => expect(second.result.current.status).toBe('complete'));
      expect(api.economyMethodsFor(TEXAS)).toEqual(sentInAll);
    }
  );

  test('given two views of the report then Retry pressed in each, as drawn, deletes and requests the state once', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
    });
    const queryClient = createQueryClient();
    const first = await computeAll(STATE_RUNS_REQUEST, queryClient);
    const second = renderRuns(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(first.result.current.status).toBe('partial'));
    await waitFor(() => expect(second.result.current.status).toBe('partial'));
    const retryInFirst = first.result.current.retry;
    const retryInSecond = second.result.current.retry;

    // When
    act(() => {
      retryInFirst();
      retryInSecond();
    });

    // Then
    await waitFor(() => expect(second.result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET']);
  });

  test('given a failure a DELETE can clear that arrives on a later poll then Retry deletes it and requests the state', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) =>
          request === 0
            ? STATE_COMPUTING
            : request === 1
              ? stateFailureDeletable()
              : stateOk(TEXAS),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(api.economyRequestsFor(TEXAS)).toHaveLength(1));
    await poll();
    await waitFor(() => expect(result.current.status).toBe('partial'));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'GET', 'DELETE', 'GET']);
  });

  test('given a failure the Public API no longer keeps then Retry requests the state with no DELETE', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureNoLongerKept() : stateOk(TEXAS)),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'GET']);
  });

  test('given Retry pressed only once the Public API no longer keeps a failure it could delete then Retry requests the state with no DELETE', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    await act(() => vi.advanceTimersByTimeAsync(STATE_RETRY_WAIT_MS));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'GET']);
  });

  test('given the new run fails too then Retry waits for its own delete_after_seconds and deletes it in turn', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) =>
          request === 0
            ? stateFailureDeletable()
            : request === 1
              ? stateFailureDeletable(STATE_DELETE_LOCKOUT_SECONDS)
              : stateOk(TEXAS),
      }),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    act(() => result.current.retry());
    await waitFor(() =>
      expect(result.current.calculationFailures).toEqual([
        { label: 'Texas', error: STATE_DELETE_WAIT_REASON },
      ])
    );
    expect(result.current.canRetry).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(STATE_DELETE_LOCKOUT_SECONDS * MS_PER_SECOND));
    expect(result.current.canRetry).toBe(true);

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET', 'DELETE', 'GET']);
  });

  test('given the view reopened while its DELETE is in flight then Retry waits for that DELETE, sends no second one, and the state completes', async () => {
    // Given
    serveApi({
      economy: economyWhere({
        [TEXAS]: (request) => (request === 0 ? stateFailureDeletable() : stateOk(TEXAS)),
      }),
    });
    const queryClient = createQueryClient();
    const first = await computeAll(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(first.result.current.status).toBe('partial'));
    api.holdDeletes();
    act(() => first.result.current.retry());
    await waitFor(() => expect(api.deleteRequestsFor(TEXAS)).toHaveLength(1));
    first.unmount();
    const second = renderRuns(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(second.result.current.canRetry).toBe(true));

    // When
    act(() => second.result.current.retry());
    api.releaseDeletes();

    // Then
    await waitFor(() => expect(second.result.current.status).toBe('complete'));
    expect(api.economyMethodsFor(TEXAS)).toEqual(['GET', 'DELETE', 'GET']);
    expect(
      queryClient.getQueryData(stateDistrictRunQueryKey(STATE_RUNS_REQUEST, TEXAS))
    ).toMatchObject({ status: 'complete' });
  });

  test('given every state failed with a failure it can delete then Retry deletes and requests each state once, within four requests in flight', async () => {
    // Given
    serveApi({
      economy: (region, request) => (request === 0 ? stateFailureDeletable() : stateOk(region)),
    });
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('error'));

    // When
    act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.status).toBe('complete'));
    for (const region of ALL_US_STATE_CODES) {
      expect(api.economyMethodsFor(region)).toEqual(['GET', 'DELETE', 'GET']);
    }
    expect(api.maxInFlight()).toBeLessThanOrEqual(MAX_REQUESTS_IN_FLIGHT);
  });

  test('given a request answered with an error page then the state fails with a short reason, not the page', async () => {
    // Given
    serveApi({ economy: economyWhere({ [TEXAS]: () => stateErrorPage() }) });

    // When
    const { result } = await computeAll();

    // Then
    await waitFor(() => expect(result.current.status).toBe('partial'));
    expect(result.current.calculationFailures).toEqual([
      { label: 'Texas', error: STATE_REQUEST_FAILURE_REASON },
    ]);
  });

  test('given a result whose districts cannot be read then the state fails, unwritten, and is not polled again', async () => {
    // Given
    serveApi({ economy: economyWhere({ [OHIO]: () => stateOkWithUnreadableDistricts(OHIO) }) });

    // When
    const { result } = await computeAll();
    await waitFor(() => expect(result.current.status).toBe('partial'));
    await poll();

    // Then
    expect(result.current.failedStates).toEqual([OHIO]);
    expect(api.economyRequestsFor(OHIO)).toHaveLength(1);
    expect(api.reportWrites().map((write) => write.body.id)).not.toContain(api.reportIdFor(OHIO));
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
    expect(result.current.error).toBe(STATE_FAILURE_REASON);
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

  test('given results written after the view closed then the reopened view does not write them again', async () => {
    // Given
    serveApi({ economy: (region) => stateOk(region), holdEconomy: true });
    const queryClient = createQueryClient();
    const first = await computeAll(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(api.economyRequests()).toHaveLength(MAX_REQUESTS_IN_FLIGHT));
    first.unmount();
    api.releaseEconomy();
    await waitFor(() => expect(api.reportWrites()).toHaveLength(MAX_REQUESTS_IN_FLIGHT));

    // When
    const reopened = renderRuns(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(reopened.result.current.status).toBe('complete'));
    await poll();

    // Then
    const writtenReportIds = api.reportWrites().map((write) => write.body.id);
    expect(writtenReportIds).toHaveLength(STATE_COUNT);
    expect(new Set(writtenReportIds).size).toBe(STATE_COUNT);
  });

  test('given the view replaced before its in-flight results are written then each state is written once', async () => {
    // Given
    serveApi({ economy: (region) => stateOk(region), holdEconomy: true });
    const queryClient = createQueryClient();
    const first = await computeAll(STATE_RUNS_REQUEST, queryClient);
    await waitFor(() => expect(api.economyRequests()).toHaveLength(MAX_REQUESTS_IN_FLIGHT));

    // When
    first.unmount();
    const replacement = renderRuns(STATE_RUNS_REQUEST, queryClient);
    api.releaseEconomy();
    await waitFor(() => expect(replacement.result.current.status).toBe('complete'));
    await poll();
    await poll();

    // Then
    const writtenReportIds = api.reportWrites().map((write) => write.body.id);
    expect(writtenReportIds).toHaveLength(STATE_COUNT);
    expect(new Set(writtenReportIds).size).toBe(STATE_COUNT);
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
