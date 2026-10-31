import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CalcOrchestratorProvider } from '@/contexts/CalcOrchestratorContext';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import type { FlagshipReportMeta } from '@/libs/flagship/runReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import {
  EXISTING_REPORT,
  EXISTING_REPORT_ID,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { REMOVED_US_PARAMETER } from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

/**
 * The report page with the real calculation machinery: only the API
 * calls are stubbed, so what the page asks of the API is what it would.
 */

const mockUseFlagshipReport = vi.fn();
const mockFetchEconomy = vi.fn();
const mockFetchLocalAreaBreakdown = vi.fn();
const mockMarkReportCompleted = vi.fn();
const mockMarkReportError = vi.fn();

const META: FlagshipReportMeta = {
  title: 'Bigger CTC',
  sourceNote: 'Hand-built',
  createdAt: '2026-10-13T00:00:00Z',
  provisions: [
    {
      path: 'gov.irs.credits.ctc.refundable.individual_max',
      breadcrumb: 'IRS → Credits → CTC → Refundable maximum',
      unit: 'currency-USD',
      baselineValue: 1700,
      value: 2500,
    },
  ],
};

/** The economy endpoint's answer when the run fails on the server. */
const FAILED_ECONOMY_RESPONSE = {
  status: 'error' as const,
  result: null,
  error: 'Simulation failed: out of memory',
};

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchSocietyWideCalculation: (...args: unknown[]) => mockFetchEconomy(...args),
  fetchLocalAreaBreakdown: (...args: unknown[]) => mockFetchLocalAreaBreakdown(...args),
}));

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  markReportCompleted: (...args: unknown[]) => mockMarkReportCompleted(...args),
  markReportError: (...args: unknown[]) => mockMarkReportError(...args),
}));

/** The run's details this page reads; a test may give it a budget window. */
const mockMeta: { current: FlagshipReportMeta } = { current: META };

vi.mock('@/libs/flagship/runReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/runReport')>()),
  readReportMeta: () => mockMeta.current,
}));

const mockFetchBudgetWindow = vi.fn();

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: (...args: unknown[]) => mockFetchBudgetWindow(...args),
}));

/** A three-year window from the report's year, and a later year asked for before. */
function withWindowAndRequestedYear() {
  mockMeta.current = { ...META, budgetWindow: { startYear: 2026, windowSize: 3 } };
  localStorage.setItem(`pe-flagship-report-years-${EXISTING_REPORT_ID}`, JSON.stringify(['2027']));
}

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

function reportData(overrides: Partial<FlagshipReportData> = {}): FlagshipReportData {
  return {
    report: EXISTING_REPORT,
    simulations: EXISTING_SIMULATIONS,
    policies: [],
    isLoading: false,
    error: null,
    notFound: false,
    failedPolicyIds: [],
    policiesChecked: true,
    missingParameters: [],
    retry: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CalcOrchestratorProvider>
        <FlagshipReportPage userReportId={EXISTING_REPORT_ID} />
      </CalcOrchestratorProvider>
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage run lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Sections the page opens may ask the API for more; none of it is under test.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({}))
    );
    mockFetchEconomy.mockResolvedValue({ status: 'ok', result: createMockSocietyWideOutput() });
    mockFetchLocalAreaBreakdown.mockResolvedValue({
      status: 'computing',
      queue_position: 1,
      result: null,
    });
    mockMarkReportCompleted.mockResolvedValue({});
    mockMarkReportError.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    mockMeta.current = META;
    localStorage.clear();
  });

  test('given a pending report then it runs and saves the result', async () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(reportData());

    // When
    renderPage();

    // Then
    expect(await screen.findByRole('tab', { name: 'Validation' })).toBeInTheDocument();
    expect(mockFetchEconomy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockMarkReportCompleted).toHaveBeenCalledTimes(1));
  });

  test('given the run fails then the record says it failed', async () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(reportData());
    mockFetchEconomy.mockResolvedValue(FAILED_ECONOMY_RESPONSE);

    // When
    renderPage();

    // Then
    await waitFor(() =>
      expect(mockMarkReportError).toHaveBeenCalledWith(
        EXISTING_REPORT.countryId,
        EXISTING_REPORT_ID,
        expect.objectContaining({ id: EXISTING_REPORT_ID, status: 'error' }),
        expect.stringContaining(FAILED_ECONOMY_RESPONSE.error)
      )
    );
  });

  test('given the run fails then nothing is saved as its results', async () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(reportData());
    mockFetchEconomy.mockResolvedValue(FAILED_ECONOMY_RESPONSE);

    // When
    renderPage();

    // Then
    await waitFor(() => expect(mockMarkReportError).toHaveBeenCalled());
    expect(mockMarkReportCompleted).not.toHaveBeenCalled();
  });

  test('given a report whose policies are still being checked then it does not run yet', async () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(reportData({ policiesChecked: false }));

    // When
    renderPage();

    // Then
    expect(await screen.findByText(/loading report/i)).toBeInTheDocument();
    expect(mockFetchEconomy).not.toHaveBeenCalled();
  });

  test('given a UK report whose policies are still being checked then its local areas do not start calculating', async () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(
      reportData({ report: { ...EXISTING_REPORT, countryId: 'uk' }, policiesChecked: false })
    );

    // When
    renderPage();

    // Then
    expect(await screen.findByText(/loading report/i)).toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given a pending report whose policy sets parameters the model no longer has then it names them and runs nothing', async () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(
      reportData({ missingParameters: [REMOVED_US_PARAMETER] })
    );

    // When
    renderPage();

    // Then
    const notice = await screen.findByRole('alert');
    expect(notice).toHaveTextContent(/this report cannot be run/i);
    expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(mockFetchEconomy).not.toHaveBeenCalled();
    expect(mockMarkReportError).not.toHaveBeenCalled();
  });

  describe('given a report whose record is already complete', () => {
    const completeReport = () =>
      reportData({
        report: { ...EXISTING_REPORT, status: 'complete', output: createMockSocietyWideOutput() },
      });

    test('then it opens from the stored results', async () => {
      // Given
      mockUseFlagshipReport.mockReturnValue(completeReport());

      // When
      renderPage();

      // Then
      expect(await screen.findByRole('tab', { name: 'Validation' })).toBeInTheDocument();
      expect(mockFetchEconomy).not.toHaveBeenCalled();
    });

    test('then with a policy that sets parameters the model no longer has, its results show with a notice, and nothing more runs', async () => {
      // Given
      const user = userEvent.setup();
      mockUseFlagshipReport.mockReturnValue({
        ...completeReport(),
        missingParameters: [REMOVED_US_PARAMETER],
      });

      // When
      renderPage();

      // Then: the stored results open, and say why nothing more runs
      expect(await screen.findByRole('tab', { name: 'Validation' })).toBeInTheDocument();
      const notice = screen.getByRole('alert');
      expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /open adjust parameters/i }));
      expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /edit in build/i })).toBeDisabled();
      await user.click(screen.getByRole('tab', { name: 'Household' }));
      expect(
        screen.getByText(/households cannot be calculated for this report/i)
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^calculate/i })).not.toBeInTheDocument();
      expect(mockFetchEconomy).not.toHaveBeenCalled();
    });

    test('then while its policies are being checked it waits, and starts no other year or window', async () => {
      // Given
      withWindowAndRequestedYear();
      mockUseFlagshipReport.mockReturnValue({ ...completeReport(), policiesChecked: false });

      // When
      renderPage();

      // Then
      expect(await screen.findByText(/loading report/i)).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'Validation' })).not.toBeInTheDocument();
      expect(mockFetchEconomy).not.toHaveBeenCalled();
      expect(mockFetchBudgetWindow).not.toHaveBeenCalled();
    });

    test('then with missing parameters and a window, no other year or window runs', async () => {
      // Given
      withWindowAndRequestedYear();
      mockUseFlagshipReport.mockReturnValue({
        ...completeReport(),
        missingParameters: [REMOVED_US_PARAMETER],
      });

      // When
      renderPage();

      // Then
      expect(await screen.findByRole('tab', { name: 'Validation' })).toBeInTheDocument();
      expect(mockFetchEconomy).not.toHaveBeenCalled();
      expect(mockFetchBudgetWindow).not.toHaveBeenCalled();
    });

    test('then the record is not written again', async () => {
      // Given
      mockUseFlagshipReport.mockReturnValue(completeReport());

      // When
      renderPage();

      // Then
      await screen.findByRole('tab', { name: 'Validation' });
      expect(mockMarkReportCompleted).not.toHaveBeenCalled();
    });
  });
});
