import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CongressionalDistrictDataProvider } from '@/contexts/congressional-district';
import { useCongressionalDistrictImpacts } from '@/hooks/useCongressionalDistrictImpacts';
import { useRegions } from '@/hooks/useRegions';
import {
  fakeStateDistrictApi,
  NATIONWIDE_OUTPUT_WITH_DISTRICTS,
  normalizedStateDistricts,
  STATE_COUNT,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_YEAR,
  stateReportComplete,
  TEXAS,
  US_STATE_REGIONS,
  UTAH,
  UTAH_REPORT_OUTPUT,
  UTAH_REPORT_OUTPUT_WITHOUT_DISTRICTS,
  type FakeStateApi,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(),
}));

let api: FakeStateApi;

function renderImpacts(
  output: Parameters<typeof useCongressionalDistrictImpacts>[0],
  region?: string
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderHook(() => useCongressionalDistrictImpacts(output), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <CongressionalDistrictDataProvider
          reformPolicyId={STATE_RUNS_REFORM_POLICY_ID}
          baselinePolicyId={STATE_RUNS_BASELINE_POLICY_ID}
          year={STATE_RUNS_YEAR}
          region={region}
        >
          {children}
        </CongressionalDistrictDataProvider>
      </QueryClientProvider>
    ),
  });
}

describe('useCongressionalDistrictImpacts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRegions).mockReturnValue({
      data: US_STATE_REGIONS,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRegions>);
    api = fakeStateDistrictApi({ reports: { [UTAH]: stateReportComplete(UTAH) } });
    vi.stubGlobal('fetch', api.fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a state report then it maps its own districts and looks nothing up', async () => {
    // When
    const { result } = renderImpacts(UTAH_REPORT_OUTPUT, UTAH);
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Then
    expect(result.current.scope).toBe('state');
    expect(result.current.districts).toEqual(normalizedStateDistricts(UTAH));
    expect(result.current.runs).toBeNull();
    expect(api.requests()).toHaveLength(0);
  });

  test('given a state report whose districts are null then there are none to map', () => {
    // When
    const { result } = renderImpacts(UTAH_REPORT_OUTPUT_WITHOUT_DISTRICTS, UTAH);

    // Then
    expect(result.current.districts).toBeNull();
  });

  test('given a nationwide report then it maps the state runs and ignores the result’s own districts', async () => {
    // When
    const { result } = renderImpacts(NATIONWIDE_OUTPUT_WITH_DISTRICTS, 'us');

    // Then
    expect(result.current.scope).toBe('nationwide');
    await waitFor(() => expect(result.current.runs?.status).toBe('idle'));
    expect(result.current.districts).toEqual(normalizedStateDistricts(UTAH));
    expect(result.current.pendingStates).toHaveLength(STATE_COUNT - 1);
    expect(result.current.pendingStates).toContain(TEXAS);
    expect(api.reportRequests()).toHaveLength(STATE_COUNT);
  });

  test('given a nationwide report with no state in yet then there are no districts to map', async () => {
    // Given
    api = fakeStateDistrictApi();
    vi.stubGlobal('fetch', api.fetch);

    // When
    const { result } = renderImpacts(NATIONWIDE_OUTPUT_WITH_DISTRICTS);

    // Then
    await waitFor(() => expect(result.current.runs?.status).toBe('idle'));
    expect(result.current.districts).toBeNull();
  });

  test('given a district report then there is nothing, and nothing is sent', async () => {
    // When
    const { result } = renderImpacts(UTAH_REPORT_OUTPUT, 'congressional_district/UT-01');
    await new Promise((resolve) => setTimeout(resolve, 20));

    // Then
    expect(result.current.scope).toBeNull();
    expect(result.current.districts).toBeNull();
    expect(result.current.runs).toBeNull();
    expect(api.requests()).toHaveLength(0);
  });
});
