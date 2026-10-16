import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedMetadataError } from '@/tests/fixtures/hooks/useFlagshipMetadataStatusMocks';
import {
  EXISTING_REPORT,
  EXISTING_REPORT_ID,
  EXISTING_SIMULATIONS,
  MISSING_REPORT_ID,
  REPORT_NOT_FOUND_ERROR,
  SIMULATION_UNAVAILABLE_ERROR,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { HOUSEHOLD_SIMULATIONS } from '@/tests/fixtures/pages/flagship/sharedReportMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';
import { mockHouseholdResult } from '@/tests/fixtures/types/calculationFixtures';

const mockUseFlagshipReport = vi.fn();
const mockRetry = vi.fn();
const mockCalcStatus = vi.fn();
const mockFetchMetadata = vi.fn();
const mockStartCalculationOnLoad = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
}));

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: (...args: unknown[]) => mockFetchMetadata(...args),
}));

const IDLE_STATUS = { status: 'idle', isComplete: false, isError: false, result: null };
const PENDING_STATUS = { ...IDLE_STATUS, status: 'pending', progress: 20 };

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: (args: unknown) => mockStartCalculationOnLoad(args),
}));

vi.mock('@/hooks/useReportValidationSnapshot', () => ({
  useReportValidationSnapshot: () => undefined,
}));

vi.mock('@/components/flagship/CalibrationMatches', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/CalibrationMatches')>()),
  useCalibrationMatches: () => null,
}));

vi.mock('@/components/flagship/ValidationPanel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ValidationPanel')>()),
  useModelTrackRecord: () => null,
}));

/** What the report hook returns before anything has loaded. */
function reportData(overrides: Partial<FlagshipReportData> = {}): FlagshipReportData {
  return {
    report: undefined,
    simulations: [],
    policies: [],
    isLoading: false,
    error: null,
    notFound: false,
    failedPolicyIds: [],
    retry: mockRetry,
    ...overrides,
  };
}

function renderPage(userReportId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={userReportId} />
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage load states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Cleared before each test, not after: the last page is still mounted then.
    store.dispatch(clearMetadata());
    mockCalcStatus.mockReturnValue(IDLE_STATUS);
    // A retried metadata fetch stays in flight.
    mockFetchMetadata.mockReturnValue(new Promise(() => {}));
  });

  test('given the report is loading then a spinner holds the wait', () => {
    mockUseFlagshipReport.mockReturnValue(reportData({ isLoading: true }));

    renderPage(EXISTING_REPORT_ID);

    // One status, the spinner's own: no live region around it.
    expect(screen.getAllByRole('status')).toEqual([
      screen.getByRole('status', { name: 'Loading report' }),
    ]);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given the run is calculating then the run card is the one status', () => {
    mockCalcStatus.mockReturnValue(PENDING_STATUS);
    mockUseFlagshipReport.mockReturnValue(
      reportData({ report: EXISTING_REPORT, simulations: EXISTING_SIMULATIONS })
    );

    renderPage(EXISTING_REPORT_ID);

    const [status, ...others] = screen.getAllByRole('status');
    expect(status).toHaveTextContent('Calculating the nationwide results');
    expect(others).toHaveLength(0);
  });

  test('given the results are in and the parameters failed then the overview says so and asks again', async () => {
    // Given
    const user = userEvent.setup();
    seedMetadataError();
    mockCalcStatus.mockReturnValue({
      status: 'complete',
      isComplete: true,
      isError: false,
      result: createMockSocietyWideOutput(),
    });
    mockUseFlagshipReport.mockReturnValue(
      reportData({ report: EXISTING_REPORT, simulations: EXISTING_SIMULATIONS })
    );
    renderPage(EXISTING_REPORT_ID);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the parameters');

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(mockFetchMetadata).toHaveBeenCalledWith('us');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given a link that names no report then it says not found, with no retry', () => {
    mockUseFlagshipReport.mockReturnValue(
      reportData({ error: REPORT_NOT_FOUND_ERROR, notFound: true })
    );

    renderPage(MISSING_REPORT_ID);

    expect(screen.getByRole('heading', { name: 'Report not found' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading report' })).not.toBeInTheDocument();
  });

  test('given the report failed to load then try again asks for it again', async () => {
    // Given
    const user = userEvent.setup();
    mockUseFlagshipReport.mockReturnValue(reportData({ error: SIMULATION_UNAVAILABLE_ERROR }));
    renderPage(EXISTING_REPORT_ID);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(screen.getByRole('heading', { name: 'Could not load the report' })).toBeInTheDocument();
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  describe('given a household report', () => {
    test('then it says this page cannot open it', () => {
      mockUseFlagshipReport.mockReturnValue(
        reportData({ report: EXISTING_REPORT, simulations: HOUSEHOLD_SIMULATIONS })
      );

      renderPage(EXISTING_REPORT_ID);

      expect(screen.getByRole('alert')).toHaveTextContent('This report cannot open here');
    });

    test('then no calculation starts, so its stored outputs stay as they are', () => {
      mockUseFlagshipReport.mockReturnValue(
        reportData({ report: EXISTING_REPORT, simulations: HOUSEHOLD_SIMULATIONS })
      );

      renderPage(EXISTING_REPORT_ID);

      expect(mockStartCalculationOnLoad).toHaveBeenLastCalledWith(
        expect.objectContaining({ enabled: false, configs: [] })
      );
    });

    test('then a household result is never read as society-wide results', () => {
      mockCalcStatus.mockReturnValue({
        status: 'complete',
        isComplete: true,
        isError: false,
        result: mockHouseholdResult(),
      });
      mockUseFlagshipReport.mockReturnValue(
        reportData({ report: EXISTING_REPORT, simulations: HOUSEHOLD_SIMULATIONS })
      );

      renderPage(EXISTING_REPORT_ID);

      expect(screen.getByRole('alert')).toHaveTextContent('This report cannot open here');
      expect(screen.queryByRole('tab', { name: 'Validation' })).not.toBeInTheDocument();
    });
  });
});
