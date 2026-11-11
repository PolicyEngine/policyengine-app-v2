import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import CongressionalDistrictSection from '@/components/flagship/report/CongressionalDistrictSection';
import { CongressionalDistrictDataProvider } from '@/contexts/congressional-district';
import { useRegions } from '@/hooks/useRegions';
import { COMPUTE_DISTRICTS_LABEL } from '@/tests/fixtures/components/flagship/report/stateDistrictComputePanelMocks';
import {
  economyWhere,
  fakeStateDistrictApi,
  NATIONWIDE_OUTPUT_WITH_DISTRICTS,
  STATE_COMPUTING,
  STATE_COUNT,
  STATE_POLL_INTERVAL_MS,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_YEAR,
  stateOk,
  stateReportComplete,
  TEXAS,
  US_STATE_REGIONS,
  UTAH,
  UTAH_REPORT_OUTPUT,
  type FakeStateApi,
  type FakeStateApiOptions,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

vi.mock('@/components/flagship/report/DistrictChoroplethMap', () => ({
  DistrictChoroplethMap: ({ data }: { data: unknown[] }) => (
    <div role="img" aria-label={`District map of ${data.length} districts`} />
  ),
}));

let api: FakeStateApi;

function renderSection(
  output: Parameters<typeof CongressionalDistrictSection>[0]['output'],
  region: string,
  apiOptions: FakeStateApiOptions = {}
) {
  api = fakeStateDistrictApi(apiOptions);
  vi.stubGlobal('fetch', api.fetch);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CongressionalDistrictDataProvider
        reformPolicyId={STATE_RUNS_REFORM_POLICY_ID}
        baselinePolicyId={STATE_RUNS_BASELINE_POLICY_ID}
        year={STATE_RUNS_YEAR}
        region={region}
      >
        <CongressionalDistrictSection output={output} />
      </CongressionalDistrictDataProvider>
    </QueryClientProvider>
  );
}

describe('CongressionalDistrictSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
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

  test('given a nationwide report then it offers Compute and maps none of the result’s own districts', async () => {
    // When
    renderSection(NATIONWIDE_OUTPUT_WITH_DISTRICTS, 'us');

    // Then
    expect(
      await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL })
    ).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /District map/ })).not.toBeInTheDocument();
  });

  test('given a nationwide report opened then it looks up every state and computes nothing', async () => {
    // When
    renderSection(NATIONWIDE_OUTPUT_WITH_DISTRICTS, 'us');
    await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL });

    // Then
    expect(api.reportRequests()).toHaveLength(STATE_COUNT);
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given a state already saved then its districts map without Compute', async () => {
    // When
    renderSection(NATIONWIDE_OUTPUT_WITH_DISTRICTS, 'us', {
      reports: { [UTAH]: stateReportComplete(UTAH) },
    });

    // Then
    expect(
      await screen.findByRole('img', { name: 'District map of 2 districts' })
    ).toBeInTheDocument();
    expect(screen.getByText(/^1 of 51 states are saved/)).toBeInTheDocument();
    expect(api.economyRequests()).toHaveLength(0);
  });

  test('given Compute then the map fills state by state, with how many states are in', async () => {
    // Given
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderSection(NATIONWIDE_OUTPUT_WITH_DISTRICTS, 'us', {
      economy: economyWhere(
        {
          [UTAH]: () => stateOk(UTAH),
          [TEXAS]: (request) => (request === 0 ? STATE_COMPUTING : stateOk(TEXAS)),
        },
        () => STATE_COMPUTING
      ),
    });

    // When
    await user.click(await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL }));

    // Then
    expect(await screen.findByText('1 of 51 states')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'District map of 2 districts' })).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(STATE_POLL_INTERVAL_MS));
    await waitFor(() => expect(screen.getByText('2 of 51 states')).toBeInTheDocument());
    expect(screen.getByRole('img', { name: 'District map of 4 districts' })).toBeInTheDocument();
  });

  test('given a state report then it maps its own districts and looks nothing up', async () => {
    // When
    renderSection(UTAH_REPORT_OUTPUT, UTAH);

    // Then
    expect(
      await screen.findByRole('img', { name: 'District map of 2 districts' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_DISTRICTS_LABEL })).not.toBeInTheDocument();
    expect(api.requests()).toHaveLength(0);
  });
});
