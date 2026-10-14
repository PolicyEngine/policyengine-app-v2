import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import {
  EXISTING_REPORT_ID,
  MISSING_REPORT_ID,
  REPORT_NOT_FOUND_ERROR,
  SIMULATION_UNAVAILABLE_ERROR,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';

const mockUseFlagshipReport = vi.fn();
const mockRetry = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => ({
    status: 'idle',
    isComplete: false,
    isError: false,
    result: null,
  }),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: () => undefined,
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
  });

  test('given the report is loading then the run card placeholder holds its place', () => {
    mockUseFlagshipReport.mockReturnValue(reportData({ isLoading: true }));

    renderPage(EXISTING_REPORT_ID);

    expect(screen.getByRole('status', { name: 'Loading report' })).toBeInTheDocument();
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
});
