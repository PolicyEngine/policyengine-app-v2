import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import type { FlagshipReportMeta } from '@/libs/flagship/runReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { scorecardClaim } from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const mockCalcStatus = vi.fn();
// The report's policies; a baseline policy with parameters is a custom baseline.
const mockPolicies = vi.hoisted(() => ({ current: [] as unknown[] }));
// The policies that failed to load, by id.
const mockFailedPolicyIds = vi.hoisted(() => ({ current: [] as string[] }));
const mockRetry = vi.fn();

const META: FlagshipReportMeta = {
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
};
let mockMeta: FlagshipReportMeta = META;
const mockStartCalculationOnLoad = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => ({
    report: { id: 'r1', countryId: 'us', year: '2026', label: 'Test Reform' },
    simulations: [
      { id: 's1', populationId: 'us', policyId: '2' },
      { id: 's2', populationId: 'us', policyId: '9' },
    ],
    policies: mockPolicies.current,
    isLoading: false,
    failedPolicyIds: mockFailedPolicyIds.current,
    retry: mockRetry,
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
  readReportMeta: () => mockMeta,
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
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
    mockMeta = META;
    mockPolicies.current = [];
    mockFailedPolicyIds.current = [];
    mockRetry.mockReset();
    mockStartCalculationOnLoad.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
  describe('given what the report is compared with', () => {
    const PLAN_B_META: FlagshipReportMeta = {
      ...META,
      baseline: { reformId: 'rf-plan-b', policyId: '2', label: 'Plan B' },
    };

    test('given a saved reform then the results say they are compared with it', () => {
      mockMeta = PLAN_B_META;
      mockCalcStatus.mockReturnValue({
        status: 'complete',
        isComplete: true,
        isError: false,
        result: createMockSocietyWideOutput(),
      });

      renderPage();

      expect(screen.getByText('Compared with Plan B')).toBeInTheDocument();
    });

    test('given a report from before baselines then it reads as current law', () => {
      mockCalcStatus.mockReturnValue({
        status: 'complete',
        isComplete: true,
        isError: false,
        result: createMockSocietyWideOutput(),
      });

      renderPage();

      expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
    });

    describe('given a single Child Tax Credit change', () => {
      const CTC_PROVISION = {
        path: 'gov.irs.credits.ctc.amount.base[0].amount',
        breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
        unit: 'currency-USD',
        baselineValue: 2200,
        value: 2500,
      };
      const complete = () =>
        mockCalcStatus.mockReturnValue({
          status: 'complete',
          isComplete: true,
          isError: false,
          result: createMockSocietyWideOutput(),
        });

      test('given current law then the cover says which way it moves', () => {
        mockMeta = { ...META, provisions: [CTC_PROVISION] };
        complete();

        renderPage();

        expect(
          screen.getByRole('heading', { level: 1, name: 'Increasing the Child Tax Credit' })
        ).toBeInTheDocument();
      });

      test('given a saved reform then the cover does not read the move against current law', () => {
        mockMeta = { ...PLAN_B_META, provisions: [CTC_PROVISION] };
        complete();

        renderPage();

        expect(
          screen.getByRole('heading', { level: 1, name: 'Changing the Child Tax Credit' })
        ).toBeInTheDocument();
        expect(screen.queryByText(/Increasing the Child Tax Credit/)).not.toBeInTheDocument();
      });
    });

    test('given the baseline policy failed to load then the report does not read as current law', async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => Response.json({ built: null, rows: [], unmappedCount: 0 }))
      );
      mockFailedPolicyIds.current = ['2'];
      mockCalcStatus.mockReturnValue({
        status: 'complete',
        isComplete: true,
        isError: false,
        result: createMockSocietyWideOutput(),
      });

      renderPage();

      expect(
        screen.getByText('Compared with a baseline policy that could not be loaded')
      ).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      expect(mockRetry).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole('tab', { name: 'Validation' }));
      expect(within(screen.getByRole('tabpanel')).getAllByText('Not comparable')).toHaveLength(2);
    });

    test('given a failed run then Build gets the reform back with the same comparison', async () => {
      clearDraftReform();
      mockMeta = PLAN_B_META;
      mockCalcStatus.mockReturnValue({
        status: 'error',
        isComplete: false,
        isError: true,
        error: { message: 'Simulation failed' },
        result: null,
      });
      const user = userEvent.setup();

      renderPage();
      await user.click(screen.getByRole('button', { name: 'Edit the reform' }));

      expect(getDraftReform()?.baselineReformId).toBe('rf-plan-b');
      clearDraftReform();
    });
  });

  test('given a finished custom report then validation shows both checks and says no external estimate exists', async () => {
    const user = userEvent.setup();
    // The scorecard links no published score to this reform.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ built: null, rows: [], unmappedCount: 0 }))
    );
    mockCalcStatus.mockReturnValue({
      status: 'complete',
      isComplete: true,
      isError: false,
      result: createMockSocietyWideOutput(),
    });

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Validation' }));

    const panel = screen.getByRole('tabpanel');
    expect(
      await within(panel).findByText('No external estimate is available for this reform.')
    ).toBeInTheDocument();
    expect(
      within(panel)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent)
    ).toEqual(['External estimates', 'Data calibration', 'Baseline comparisons']);
  });

  const COMPLETE = {
    status: 'complete',
    isComplete: true,
    isError: false,
    result: createMockSocietyWideOutput(),
  };

  test('given a finished custom report with a related published score then validation shows it', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          built: '2026-08-29',
          rows: [{ ...scorecardClaim(), matchBasis: 'parameter' }],
          unmappedCount: 0,
        })
      )
    );
    mockCalcStatus.mockReturnValue(COMPLETE);

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Validation' }));

    const panel = screen.getByRole('tabpanel');
    expect(
      await within(panel).findByRole('table', { name: 'Related reforms' })
    ).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'CTC extension' })).toBeInTheDocument();
    expect(
      within(panel).queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given a finished report against a saved reform then the scorecard is not comparable', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ built: null, rows: [], unmappedCount: 0 }))
    );
    mockPolicies.current = [
      {
        id: '2',
        label: 'Smaller CTC',
        parameters: [{ name: 'gov.irs.credits.ctc.refundable.individual_max', values: [] }],
      },
    ];
    mockCalcStatus.mockReturnValue(COMPLETE);

    renderPage();
    await user.click(screen.getByRole('tab', { name: 'Validation' }));

    const panel = screen.getByRole('tabpanel');
    expect(
      within(panel).getByText(
        'External estimates assume current law. This report compares with Smaller CTC.'
      )
    ).toBeInTheDocument();
    expect(within(panel).getAllByText('Not comparable')).toHaveLength(2);
  });
});
