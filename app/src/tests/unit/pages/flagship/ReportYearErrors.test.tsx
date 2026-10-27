import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportMeta } from '@/libs/flagship/runReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  DATASET_YEAR_UNAVAILABLE_BODY,
  DATASET_YEAR_UNAVAILABLE_MESSAGE,
  jsonResponse,
  SIMULATION_FAILED_BODY,
  UK_REPORT_START_YEAR,
  UK_UNSUPPORTED_YEAR,
} from '@/tests/fixtures/libs/flagship/calculationErrorMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const mockCalcStatus = vi.fn();
const fetchMock = vi.fn();

/** A UK report run in 2026 with a ten-year budget window, from before windows ended at 2032. */
const UK_WINDOW_META: FlagshipReportMeta = {
  title: 'Higher personal allowance',
  sourceNote: 'Hand-built',
  createdAt: '2026-10-13T00:00:00Z',
  provisions: [
    {
      path: 'gov.hmrc.income_tax.allowances.personal_allowance.amount',
      breadcrumb: 'HMRC → Income tax → Allowances → Personal allowance',
      unit: 'currency-GBP',
      baselineValue: 12570,
      value: 13000,
    },
  ],
  budgetWindow: { startYear: UK_REPORT_START_YEAR, windowSize: 10 },
};

/** The year switcher's tab for the first year the UK model does not cover. */
const UNSUPPORTED_YEAR_TAB = /^2033-34,/;
const UNSUPPORTED_YEAR_ERROR_TITLE = 'Could not calculate 2033-34';

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => ({
    report: { id: 'r1', countryId: 'uk', year: '2026', label: 'Higher personal allowance' },
    simulations: [
      { id: 's1', populationId: 'uk', policyId: '2' },
      { id: 's2', populationId: 'uk', policyId: '9' },
    ],
    policies: [],
    isLoading: false,
    failedPolicyIds: [],
    retry: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCalculationStatus', () => ({
  useCalculationStatus: () => mockCalcStatus(),
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

vi.mock('@/utils/reportSimulations', () => ({
  allSimulationsLoaded: () => true,
}));

vi.mock('@/libs/flagship/runReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/runReport')>()),
  readReportMeta: () => UK_WINDOW_META,
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
}));

vi.mock('@/api/metadata', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/metadata')>()),
  fetchMetadata: () => new Promise(() => {}),
}));

/**
 * The economy endpoint answers the unsupported year with the given status
 * and body; every other request is not found.
 */
function answerUnsupportedYearWith(httpStatus: number, body: object) {
  fetchMock.mockImplementation(async (url: string) => {
    const requestUrl = new URL(url);
    const isUnsupportedYear =
      requestUrl.pathname.includes('/economy/') &&
      requestUrl.searchParams.get('time_period') === String(UK_UNSUPPORTED_YEAR);
    return isUnsupportedYear
      ? jsonResponse(httpStatus, body)
      : jsonResponse(404, { status: 'error', message: 'not found' });
  });
}

/**
 * Opens the report, then the unsupported year's economic impacts, where a
 * year's results show once in; answers that year's error.
 */
async function openUnsupportedYear(): Promise<HTMLElement> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId="r1" />
    </QueryClientProvider>,
    'uk'
  );
  const user = userEvent.setup();
  await user.click(await screen.findByRole('tab', { name: UNSUPPORTED_YEAR_TAB }));
  await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
  await screen.findByText(UNSUPPORTED_YEAR_ERROR_TITLE);
  return await waitFor(() => {
    const yearError = screen
      .getAllByRole('alert')
      .find((alert) => alert.textContent?.includes(UNSUPPORTED_YEAR_ERROR_TITLE));
    expect(yearError).toBeDefined();
    return yearError as HTMLElement;
  });
}

describe('FlagshipReportPage, a budget-window year that fails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    store.dispatch(clearMetadata());
    mockCalcStatus.mockReturnValue({
      status: 'complete',
      isComplete: true,
      isError: false,
      result: createMockSocietyWideOutput(),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('given the Public API says the year is outside the UK model data', () => {
    beforeEach(() => {
      answerUnsupportedYearWith(400, DATASET_YEAR_UNAVAILABLE_BODY);
    });

    test('then the year says so in the API message, as it came', async () => {
      const yearError = await openUnsupportedYear();

      expect(within(yearError).getByText(DATASET_YEAR_UNAVAILABLE_MESSAGE)).toBeInTheDocument();
    });

    test('then the raw response stays out of view', async () => {
      const yearError = await openUnsupportedYear();

      expect(yearError).not.toHaveTextContent('"status"');
    });

    test('then running the year again is not offered', async () => {
      const yearError = await openUnsupportedYear();

      expect(
        within(yearError).queryByRole('button', { name: 'Try again' })
      ).not.toBeInTheDocument();
    });
  });

  describe('given the simulation fails for the year', () => {
    beforeEach(() => {
      answerUnsupportedYearWith(502, SIMULATION_FAILED_BODY);
    });

    test('then the year says plainly that the servers failed, without the raw response', async () => {
      const yearError = await openUnsupportedYear();

      expect(yearError).not.toHaveTextContent('"status"');
      expect(yearError).toHaveTextContent(
        "PolicyEngine's servers hit an error while running this reform UK-wide."
      );
    });

    test('then running the year again is offered', async () => {
      const yearError = await openUnsupportedYear();

      expect(within(yearError).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });
  });
});
