import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FLAGSHIP_REPORTS_KEY } from '@/api/flagshipReportStore';
import { useRegions } from '@/hooks/useRegions';
import { useStateDistrictRuns } from '@/hooks/useStateDistrictRuns';
import { ALL_US_STATE_CODES } from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import {
  allStatesComplete,
  CALIFORNIA,
  fakeStateDistrictApi,
  MAX_REQUESTS_IN_FLIGHT,
  normalizedStateDistricts,
  OHIO,
  RECORD_REQUESTS_PER_STATE,
  STATE_COUNT,
  STATE_REPORT_COMPLETE_WITHOUT_DISTRICTS,
  STATE_REPORT_ERROR,
  STATE_REPORT_PENDING,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_REQUEST,
  STATE_RUNS_YEAR,
  stateReportComplete,
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
        [UTAH]: STATE_REPORT_COMPLETE_WITHOUT_DISTRICTS(UTAH),
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
