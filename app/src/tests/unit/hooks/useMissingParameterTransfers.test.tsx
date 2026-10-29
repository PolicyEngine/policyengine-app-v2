import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { CountryProvider } from '@/contexts/CountryContext';
import { useSavedReportTransfer } from '@/hooks/useMissingParameterTransfers';
import { store } from '@/store';
import {
  REMOVED_US_PARAMETER,
  v1PolicyContent,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import {
  KEPT_PARAMETER,
  KEPT_PROVISION,
  REMOVED_PROVISION,
} from '@/tests/fixtures/libs/flagship/missingParameterTransferMocks';

const mockRun = vi.fn();
const mockRerunSettings = vi.fn();
const mockFetchPolicyById = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/libs/flagship/reportRerun', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/reportRerun')>()),
  rerunSettings: (...args: unknown[]) => mockRerunSettings(...args),
}));

/** The saved report's v1 report: its baseline simulation runs current law, its reform the reform policy. */
const CURRENT_LAW_POLICY_ID = '2';
const REFORM_POLICY_ID = '77';

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async () => ({ simulation_1_id: '101', simulation_2_id: '102', year: '2026' }),
}));

vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: async (_countryId: string, simulationId: string) => ({
    population_type: 'geography',
    population_id: 'us',
    policy_id: simulationId === '101' ? CURRENT_LAW_POLICY_ID : REFORM_POLICY_ID,
  }),
}));

vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));

/** A saved report whose reform changes a kept parameter and a removed one. */
const SAVED_REPORT: FlagshipReportRecord = {
  id: 'lfr-saved1',
  countryId: 'us',
  apiReportId: '55',
  title: 'Bigger CTC',
  sourceNote: 'Hand-built',
  provisions: [KEPT_PROVISION, REMOVED_PROVISION],
  year: '2026',
  createdAt: '2026-10-14T09:00:00Z',
  reformId: 'rf-local1',
};

function renderTransfer() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider store={store}>
        <CountryProvider value="us">{children}</CountryProvider>
      </ReduxProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useSavedReportTransfer(), { wrapper });
}

describe('useSavedReportTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRerunSettings.mockResolvedValue({ year: 2026 });
    mockRun.mockResolvedValue('56');
    mockFetchPolicyById.mockImplementation(async (_countryId: string, policyId: string) =>
      policyId === REFORM_POLICY_ID
        ? v1PolicyContent(
            {
              [KEPT_PARAMETER]: { '2026-01-01.2100-12-31': 3600 },
              [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 },
            },
            [REMOVED_US_PARAMETER]
          )
        : v1PolicyContent({}, [])
    );
  });

  test("given a list without the reform policy's missing parameters then the transfer still leaves them out", async () => {
    // Given: the check the dialog opened from could not read the reform policy
    const { result } = renderTransfer();

    // When
    await act(async () => {
      await result.current
        .mutateAsync({
          report: SAVED_REPORT,
          missingParameters: [],
          title: 'Bigger CTC',
          sourceNote: 'Hand-built',
        })
        .catch(() => undefined);
    });

    // Then: the new run sets none of them
    expect(mockRun).toHaveBeenCalledTimes(1);
    expect(mockRun.mock.calls[0][2]).toEqual([KEPT_PROVISION]);
  });

  test('given a policy of the report that cannot be read then nothing is transferred', async () => {
    // Given
    mockFetchPolicyById.mockRejectedValue(new Error(`Failed to fetch policy ${REFORM_POLICY_ID}`));
    const { result } = renderTransfer();

    // When
    await act(async () => {
      await result.current
        .mutateAsync({
          report: SAVED_REPORT,
          missingParameters: [REMOVED_US_PARAMETER],
          title: 'Bigger CTC',
          sourceNote: 'Hand-built',
        })
        .catch(() => undefined);
    });

    // Then
    await waitFor(() =>
      expect(result.current.error?.message).toBe('Could not transfer the report. Try again.')
    );
    expect(mockRun).not.toHaveBeenCalled();
  });
});
