import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FlagshipReportPage from '@/pages/flagship/Report.page';

const mockCalcStatus = vi.fn();
const mockStartCalculationOnLoad = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => ({
    report: { id: 'r1', countryId: 'us', year: '2026', label: 'Test Reform' },
    simulations: [
      { id: 's1', populationId: 'us', policyId: '2' },
      { id: 's2', populationId: 'us', policyId: '9' },
    ],
    policies: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
}));

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

vi.mock('@/utils/reportSimulations', () => ({
  allSimulationsLoaded: () => true,
}));

vi.mock('@/libs/flagship/runReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/runReport')>()),
  readReportMeta: () => ({
    title: 'Test Reform',
    sourceNote: 'Hand-built',
    createdAt: '2026-10-13T00:00:00Z',
    provisions: [
      {
        path: 'gov.irs.credits.ctc.refundable.individual_max',
        breadcrumb: 'IRS → Credits → CTC → Refundable maximum',
        unit: 'currency-USD',
        baselineValue: 1700,
        value: 499,
      },
    ],
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId="r1" />
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage', () => {
  beforeEach(() => {
    mockCalcStatus.mockReset();
    mockStartCalculationOnLoad.mockReset();
  });

  test('given the report runs then it asks for the region estimate', () => {
    mockCalcStatus.mockReturnValue({
      status: 'pending',
      isComplete: false,
      isError: false,
      progress: 0,
      result: null,
    });

    renderPage();

    expect(mockStartCalculationOnLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        configs: [expect.objectContaining({ calcId: 'r1', estimateByRegion: true })],
      })
    );
  });

  test('given the run is still calculating then the page is the wait, without the adjust panel', () => {
    mockCalcStatus.mockReturnValue({
      status: 'pending',
      isComplete: false,
      isError: false,
      progress: 20,
      result: null,
    });

    renderPage();

    expect(screen.getByText('Calculating the nationwide results')).toBeInTheDocument();
    expect(screen.queryByText('Adjust parameters')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /recompute/i })).not.toBeInTheDocument();
  });

  test('given the run failed then the error shows, without the adjust panel', () => {
    mockCalcStatus.mockReturnValue({
      status: 'error',
      isComplete: false,
      isError: true,
      error: { message: 'Simulation failed' },
      result: null,
    });

    renderPage();

    expect(screen.queryByText('Adjust parameters')).not.toBeInTheDocument();
  });
});
