import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { act, renderHook } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiFlagshipReportStore } from '@/api/flagshipReportStore';
import { CountryProvider } from '@/contexts/CountryContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import type { CountryId } from '@/libs/countries';
import { flagshipReportQueryKeys, type RunReportProvision } from '@/libs/flagship/runReport';
import { store } from '@/store';
import {
  seedDeductionMetadata,
  seedModelYears,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { UK_PERSONAL_ALLOWANCE_PROVISION } from '@/tests/fixtures/components/flagship/reportAdjustPanelMocks';
import {
  EARLIER_REPORT_ID,
  EARLIER_REPORTS,
  NEW_REPORT_ID,
  REPORTS_AFTER_RUN,
  RUN_PROVISIONS,
  RUN_REFORM_ID,
  RUN_TITLE,
} from '@/tests/fixtures/hooks/useRunFlagshipReportMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import {
  UK_FIRST_SUPPORTED_YEAR,
  UK_LAST_SUPPORTED_YEAR,
  UK_REPORT_START_YEAR,
} from '@/tests/fixtures/libs/flagship/calculationErrorMocks';

const mockRunFlagshipReport = vi.fn();
const mockFindMine = vi.fn();
const mockFetchStatus = vi.fn();

vi.mock('@/libs/flagship/runReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/runReport')>()),
  runFlagshipReport: (...args: unknown[]) => mockRunFlagshipReport(...args),
}));

const PROVISIONS: RunReportProvision[] = [
  {
    path: 'gov.irs.credits.ctc.amount',
    breadcrumb: 'CTC',
    unit: null,
    baselineValue: 2000,
    value: 3000,
  },
];

/** The scope a session with sign-in off keeps its saved work under. */
const BROWSER_SCOPE = 'browser';

function renderRunWithAuth(auth: AuthContextValue, push = vi.fn(), countryId: CountryId = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ReduxProvider store={store}>
        <CountryProvider value={countryId}>
          <AuthTestProvider value={auth}>
            <NavigationProvider value={{ push, replace: vi.fn(), back: vi.fn() }}>
              {children}
            </NavigationProvider>
          </AuthTestProvider>
        </CountryProvider>
      </ReduxProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useRunFlagshipReport(), { wrapper });
}

/** What the hook passed to runFlagshipReport on its first run. */
const runArguments = () => mockRunFlagshipReport.mock.calls[0][0];

describe('useRunFlagshipReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeductionMetadata();
    mockRunFlagshipReport.mockResolvedValue(NEW_REPORT_ID);
    mockFetchStatus.mockResolvedValue('checked');
  });

  describe('where the run records its report', () => {
    test('given a signed-in session then the run records in the account', async () => {
      // Given
      const { result } = renderRunWithAuth(signedInAuthValue());

      // When
      await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

      // Then
      expect(mockRunFlagshipReport).toHaveBeenCalledTimes(1);
      expect(runArguments().accountReportStore).toBeInstanceOf(ApiFlagshipReportStore);
    });

    test("given a signed-out session then the run records as this browser's user in the API", async () => {
      // Given
      const { result } = renderRunWithAuth(makeAuthValue());

      // When
      await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

      // Then
      expect(runArguments().accountReportStore).toBeInstanceOf(ApiFlagshipReportStore);
    });

    test('given sign-in off then the run records in this browser', async () => {
      // Given
      const { result } = renderRunWithAuth(makeAuthValue({ status: 'disabled' }));

      // When
      await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

      // Then
      await waitFor(() => expect(mockRunFlagshipReport).toHaveBeenCalledTimes(1));
      expect(runArguments().accountReportStore).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test("given a signed-in run then the report opens at its saved report's link", async () => {
      // Given: the run answers the account row's ID, which anyone can open
      const reportRowId = '44444444-4444-4444-8444-444444444444';
      mockRunFlagshipReport.mockResolvedValue(reportRowId);
      const push = vi.fn();
      const { result } = renderRunWithAuth(signedInAuthValue(), push);

      // When
      await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

      // Then
      expect(push).toHaveBeenCalledWith(`/us/report/${reportRowId}`);
    });
  });

  describe('the years a run asks for', () => {
    test('given a window past the last year the model covers then the run scores only the years up to it', async () => {
      // Given: the UK model covers 2024 to 2032, and a run asks for ten years from 2026
      seedModelYears({
        countryId: 'uk',
        firstYear: UK_FIRST_SUPPORTED_YEAR,
        lastYear: UK_LAST_SUPPORTED_YEAR,
      });
      const { result } = renderRunWithAuth(makeAuthValue({ status: 'disabled' }), vi.fn(), 'uk');

      // When
      await act(() =>
        result.current.run(
          'Higher personal allowance',
          'Hand-built',
          [UK_PERSONAL_ALLOWANCE_PROVISION],
          null,
          UK_REPORT_START_YEAR,
          { windowYears: 10 }
        )
      );

      // Then: 2026 to 2032
      expect(runArguments().windowYears).toBe(7);
    });
  });

  describe('Your reforms after a run', () => {
    /** Your reforms' list of reports, as fresh for five minutes as the app keeps it. */
    function ReportsList() {
      const { data } = useQuery({
        queryKey: flagshipReportQueryKeys.mine(BROWSER_SCOPE, 'us'),
        queryFn: () => mockFindMine(),
        staleTime: 5 * 60 * 1000,
      });
      return <p>{data ? `${data.length} reports` : 'Loading'}</p>;
    }

    /** Where the earlier report stood when Your reforms last asked. */
    function EarlierReportStatus() {
      const { data } = useQuery({
        queryKey: flagshipReportQueryKeys.status('us', EARLIER_REPORT_ID),
        queryFn: () => mockFetchStatus(),
        staleTime: 60_000,
      });
      return <p>{data}</p>;
    }

    function RunButton() {
      const { run } = useRunFlagshipReport();
      return (
        <button type="button" onClick={() => run(RUN_TITLE, '', RUN_PROVISIONS, RUN_REFORM_ID)}>
          Run impact report
        </button>
      );
    }

    function renderRun(queryClient: QueryClient, children: React.ReactNode) {
      return render(
        <QueryClientProvider client={queryClient}>
          {children}
          <RunButton />
        </QueryClientProvider>
      );
    }

    test('given a report runs then Your reforms lists it at once', async () => {
      // Given
      const user = userEvent.setup();
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockFindMine.mockResolvedValueOnce(EARLIER_REPORTS).mockResolvedValue(REPORTS_AFTER_RUN);
      renderRun(queryClient, <ReportsList />);
      expect(await screen.findByText('1 reports')).toBeInTheDocument();

      // When
      await user.click(screen.getByRole('button', { name: 'Run impact report' }));

      // Then
      expect(await screen.findByText('2 reports')).toBeInTheDocument();
    });

    test('given a report runs then the reports’ statuses are asked for again', async () => {
      // Given
      const user = userEvent.setup();
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      renderRun(queryClient, <EarlierReportStatus />);
      await screen.findByText('checked');

      // When
      await user.click(screen.getByRole('button', { name: 'Run impact report' }));

      // Then
      await waitFor(() => expect(mockFetchStatus).toHaveBeenCalledTimes(2));
    });

    test('given the run fails then the list stays as it was', async () => {
      // Given
      const user = userEvent.setup();
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      mockRunFlagshipReport.mockRejectedValue(new Error('API down'));
      mockFindMine.mockResolvedValue(EARLIER_REPORTS);
      renderRun(queryClient, <ReportsList />);
      await screen.findByText('1 reports');

      // When
      await user.click(screen.getByRole('button', { name: 'Run impact report' }));

      // Then
      expect(mockFindMine).toHaveBeenCalledTimes(1);
    });
  });
});
