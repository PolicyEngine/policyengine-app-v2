import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { useFlagshipReport } from '@/hooks/useFlagshipReport';
import { reportKeys } from '@/libs/queryKeys';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  BASELINE_SIMULATION_ID,
  EXISTING_REPORT_ID,
  EXISTING_REPORT_METADATA,
  MISSING_REPORT_ID,
  nationwideSimulationMetadata,
  POLICY_UNAVAILABLE_ERROR,
  REFORM_SIMULATION_ID,
  REPORT_NOT_FOUND_ERROR,
  REPORT_UNAVAILABLE_ERROR,
  SIMULATION_UNAVAILABLE_ERROR,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';

const mockFetchReportById = vi.fn();
const mockFetchSimulationById = vi.fn();
const mockFetchPolicyById = vi.fn();

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: (...args: unknown[]) => mockFetchReportById(...args),
}));

vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: (...args: unknown[]) => mockFetchSimulationById(...args),
}));

vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));

// Old association links are not under test here.
vi.mock('@/hooks/useUserReports', () => ({
  useUserReportById: () => ({ report: undefined, simulations: [], policies: [], isLoading: false }),
}));

function renderReportHook(id: string) {
  // No retry delay: a failed request that retries settles at once.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryProvider value="us">{children}</CountryProvider>
      </QueryClientProvider>
    </Provider>
  );
  return { queryClient, ...renderHook(() => useFlagshipReport(id), { wrapper }) };
}

describe('useFlagshipReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(clearMetadata());
    mockFetchReportById.mockResolvedValue(EXISTING_REPORT_METADATA);
    mockFetchSimulationById.mockImplementation(async (_country: string, id: string) =>
      nationwideSimulationMetadata(id, id === BASELINE_SIMULATION_ID ? '2' : '98557')
    );
  });

  test('given a link to a report then it loads with no error', async () => {
    const { result } = renderReportHook(EXISTING_REPORT_ID);

    await waitFor(() => expect(result.current.simulations).toHaveLength(2));
    expect(result.current.error).toBeNull();
    expect(result.current.notFound).toBe(false);
  });

  test('given a link that names no report then it is not found, asked for once', async () => {
    // Given
    mockFetchReportById.mockRejectedValue(REPORT_NOT_FOUND_ERROR);

    // When
    const { result } = renderReportHook(MISSING_REPORT_ID);

    // Then
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(REPORT_NOT_FOUND_ERROR);
    expect(mockFetchReportById).toHaveBeenCalledTimes(1);
  });

  test('given the report is in then a refetch that fails is not a failed load', async () => {
    // Given
    const { result, rerender, queryClient } = renderReportHook(EXISTING_REPORT_ID);
    await waitFor(() => expect(result.current.simulations).toHaveLength(2));
    mockFetchReportById.mockRejectedValue(REPORT_UNAVAILABLE_ERROR);

    // When — e.g. the reader comes back to the tab while the run goes on
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: reportKeys.byId(EXISTING_REPORT_ID) });
    });
    // A render after the refetch reads the query as it now stands.
    rerender();

    // Then
    expect(queryClient.getQueryState(reportKeys.byId(EXISTING_REPORT_ID))?.error).toBe(
      REPORT_UNAVAILABLE_ERROR
    );
    expect(result.current.error).toBeNull();
    expect(result.current.report).toBeDefined();
  });

  test('given the report is in then a refetch that finds nothing does not make it not found', async () => {
    // Given
    const { result, rerender, queryClient } = renderReportHook(EXISTING_REPORT_ID);
    await waitFor(() => expect(result.current.simulations).toHaveLength(2));
    mockFetchReportById.mockRejectedValue(REPORT_NOT_FOUND_ERROR);

    // When
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: reportKeys.byId(EXISTING_REPORT_ID) });
    });
    rerender();

    // Then
    expect(queryClient.getQueryState(reportKeys.byId(EXISTING_REPORT_ID))?.error).toBe(
      REPORT_NOT_FOUND_ERROR
    );
    expect(result.current.notFound).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('given a simulation fails to load then the error says so, and the report is found', async () => {
    // Given
    mockFetchSimulationById.mockImplementation(async (_country: string, id: string) => {
      if (id === REFORM_SIMULATION_ID) {
        throw SIMULATION_UNAVAILABLE_ERROR;
      }
      return nationwideSimulationMetadata(id, '2');
    });

    // When
    const { result } = renderReportHook(EXISTING_REPORT_ID);

    // Then
    await waitFor(() => expect(result.current.error).toBe(SIMULATION_UNAVAILABLE_ERROR));
    expect(result.current.notFound).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  test('given a policy fails to load then the run is not held up by it', async () => {
    // Given: policies load once the model's metadata is in.
    seedDeductionMetadata();
    mockFetchPolicyById.mockRejectedValue(POLICY_UNAVAILABLE_ERROR);

    // When
    const { result } = renderReportHook(EXISTING_REPORT_ID);

    // Then
    await waitFor(() => expect(mockFetchPolicyById).toHaveBeenCalled());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.simulations).toHaveLength(2);
    expect(result.current.error).toBeNull();
    // Each failed policy is named, so a missing baseline reads as unknown.
    await waitFor(() => expect(result.current.failedPolicyIds).toEqual(['2', '98557']));
  });

  test('given a failed simulation then retry asks for it again and the error clears', async () => {
    // Given
    mockFetchSimulationById.mockImplementation(async (_country: string, id: string) => {
      if (id === REFORM_SIMULATION_ID) {
        throw SIMULATION_UNAVAILABLE_ERROR;
      }
      return nationwideSimulationMetadata(id, '2');
    });
    const { result } = renderReportHook(EXISTING_REPORT_ID);
    await waitFor(() => expect(result.current.error).not.toBeNull());
    mockFetchSimulationById.mockImplementation(async (_country: string, id: string) =>
      nationwideSimulationMetadata(id, id === BASELINE_SIMULATION_ID ? '2' : '98557')
    );

    // When
    await act(async () => {
      await result.current.retry();
    });

    // Then
    await waitFor(() => expect(result.current.error).toBeNull());
    expect(result.current.simulations).toHaveLength(2);
    // Only the failed simulation is asked for again.
    expect(
      mockFetchSimulationById.mock.calls.filter(([, id]) => id === BASELINE_SIMULATION_ID)
    ).toHaveLength(1);
  });
});
