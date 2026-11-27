import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ReportYearEconomy } from '@/hooks/useReportYearEconomy';
import type { FlagshipReportMeta } from '@/libs/flagship/runReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';
import type { RunStage } from '@/types/calculation';

const mockCalcStatus = vi.fn();
const mockYearEconomies = vi.fn();
const mockStartCalculationOnLoad = vi.fn();

/** A US report run in 2026 with a three-year budget window. */
const WINDOW_META: FlagshipReportMeta = {
  title: 'Larger refundable CTC',
  sourceNote: 'Hand-built',
  createdAt: '2026-10-13T00:00:00Z',
  provisions: [
    {
      path: 'gov.irs.credits.ctc.refundable.individual_max',
      breadcrumb: 'IRS → Credits → CTC → Refundable maximum',
      unit: 'currency-USD',
      baselineValue: 1700,
      value: 2000,
    },
  ],
  budgetWindow: { startYear: 2026, windowSize: 3 },
};

/** How long a US nationwide run typically takes. */
const US_NATIONWIDE_RUN_MS = 6 * 60 * 1000;

/** A US nationwide run split into regions: loading its data, then running them. */
const SEGMENTED_LOADING_DATA_STAGE: RunStage = { stage: 'loading_data', floor: 3, max: 4 };
const SIMULATING_STAGE: RunStage = { stage: 'simulating', floor: 5, max: 96 };

/** The highest value a queued run's bar can reach. */
const QUEUED_STAGE_MAX = 24;

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => ({
    report: { id: 'r1', countryId: 'us', year: '2026', label: 'Larger refundable CTC' },
    simulations: [
      { id: 's1', populationId: 'us', policyId: '2' },
      { id: 's2', populationId: 'us', policyId: '9' },
    ],
    policies: [],
    isLoading: false,
    failedPolicyIds: [],
    policiesChecked: true,
    missingParameters: [],
    retry: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
}));

vi.mock('@/hooks/useStartCalculationOnLoad', () => ({
  useStartCalculationOnLoad: (args: unknown) => mockStartCalculationOnLoad(args),
}));

vi.mock('@/hooks/useReportYearEconomy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useReportYearEconomy')>()),
  useReportYearEconomies: () => mockYearEconomies(),
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
  readReportMeta: () => WINDOW_META,
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
}));

/** Another year of the window, computing, as useReportYearEconomies gives it. */
function computingYear(overrides: Partial<ReportYearEconomy>): ReportYearEconomy {
  return { output: null, status: 'pending', retry: vi.fn(), ...overrides };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId="r1" />
    </QueryClientProvider>
  );
}

/** Opens a year of the window, then its economic impacts, where its bar shows. */
async function openYear(user: ReturnType<typeof userEvent.setup>, year: string) {
  await user.click(await screen.findByRole('tab', { name: new RegExp(`^${year},`) }));
  await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
}

describe('FlagshipReportPage, the bars of a budget window’s other years', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockCalcStatus.mockReturnValue({
      status: 'complete',
      isComplete: true,
      isError: false,
      result: createMockSocietyWideOutput(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given another year computing then its bar follows the clock from its first request', async () => {
    // Given - half of a typical run since the year's first request, running the regions
    const user = userEvent.setup();
    mockYearEconomies.mockReturnValue({
      '2027': computingYear({
        progress: SIMULATING_STAGE.floor,
        runStage: SIMULATING_STAGE,
        startedAt: Date.now() - US_NATIONWIDE_RUN_MS / 2,
      }),
    });
    renderPage();

    // When
    await openYear(user, '2027');

    // Then - 85% at the typical time, so about 43% at half of it
    expect(
      screen.getByRole('progressbar', { name: 'Calculating 2027, about 43%' })
    ).toBeInTheDocument();
  });

  test('given two other years computing then each year shows its own progress', async () => {
    // Given
    const user = userEvent.setup();
    mockYearEconomies.mockReturnValue({
      '2027': computingYear({ progress: 30, runStage: SIMULATING_STAGE, startedAt: Date.now() }),
      '2028': computingYear({ progress: 60, runStage: SIMULATING_STAGE, startedAt: Date.now() }),
    });
    renderPage();
    await openYear(user, '2028');

    // When
    await openYear(user, '2027');

    // Then
    expect(
      screen.getByRole('progressbar', { name: 'Calculating 2027, about 30%' })
    ).toBeInTheDocument();
  });

  test('given a year left and opened again after its stage started lower then its bar does not drop', async () => {
    // Given - 2027 reached 24% while queued; its run is now loading its data (3–4%)
    const user = userEvent.setup();
    mockYearEconomies.mockReturnValue({
      '2027': computingYear({
        progress: QUEUED_STAGE_MAX,
        runStage: SEGMENTED_LOADING_DATA_STAGE,
        startedAt: Date.now() - 60_000,
      }),
      '2028': computingYear({ progress: 1, runStage: SIMULATING_STAGE, startedAt: Date.now() }),
    });
    renderPage();
    await openYear(user, '2027');
    await openYear(user, '2028');

    // When
    await openYear(user, '2027');

    // Then
    expect(
      screen.getByRole('progressbar', { name: 'Calculating 2027, about 24%' })
    ).toBeInTheDocument();
  });
});

describe('FlagshipReportPage, the bar of the report’s own year', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockYearEconomies.mockReturnValue({});
  });

  test('given the report runs then its run measures from the report’s saved request time', () => {
    // Given
    mockCalcStatus.mockReturnValue({
      status: 'pending',
      isComplete: false,
      isError: false,
      progress: 0,
      result: null,
    });

    // When
    renderPage();

    // Then
    expect(mockStartCalculationOnLoad).toHaveBeenCalledWith(
      expect.objectContaining({
        configs: [expect.objectContaining({ startedAt: Date.parse(WINDOW_META.createdAt) })],
      })
    );
  });

  test('given the report’s own year computing then its bar measures from the run’s cached start time', () => {
    // Given - the run's start time, as its cached status keeps it
    mockCalcStatus.mockReturnValue({
      status: 'pending',
      isComplete: false,
      isError: false,
      progress: SIMULATING_STAGE.floor,
      runStage: SIMULATING_STAGE,
      metadata: {
        calcId: 'r1',
        calcType: 'societyWide',
        targetType: 'report',
        startedAt: Date.now() - US_NATIONWIDE_RUN_MS / 2,
      },
      result: null,
    });

    // When
    renderPage();

    // Then - about 43% at half of a typical run
    expect(
      screen.getByRole('progressbar', { name: 'Calculating the nationwide results, about 43%' })
    ).toBeInTheDocument();
  });
});
