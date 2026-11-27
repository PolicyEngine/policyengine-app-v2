import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderWithCountry, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  LocalStorageFlagshipReportStore,
  type FlagshipReportRecord,
} from '@/api/flagshipReportStore';
import { CalcOrchestratorProvider } from '@/contexts/CalcOrchestratorContext';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import { saveReportMeta } from '@/libs/flagship/runReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import {
  EXISTING_REPORT,
  EXISTING_REPORT_ID,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import {
  REMOVED_US_PARAMETER,
  v1PolicyContent,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import {
  KEPT_PARAMETER,
  KEPT_PROVISION,
  REMOVED_PROVISION,
} from '@/tests/fixtures/libs/flagship/missingParameterTransferMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

/**
 * The report page when its policies set parameters the model no longer
 * has: a report this browser saved offers to transfer it, and any other
 * report only says why it cannot run.
 */

const REPORT_DIALOG_NAME = 'This report uses parameters the model no longer has';

/** The v1 report a transfer runs. */
const NEW_API_REPORT_ID = '9002';

const mockUseFlagshipReport = vi.fn();
const mockFetchEconomy = vi.fn();
const mockRun = vi.fn();
const mockRerunSettings = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/libs/flagship/reportRerun', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/reportRerun')>()),
  rerunSettings: (...args: unknown[]) => mockRerunSettings(...args),
}));

// The transfer reads the report's policies again: its reform policy sets the removed parameter.
vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async () => ({ simulation_1_id: '101', simulation_2_id: '102', year: '2026' }),
}));

vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: async (_countryId: string, simulationId: string) => ({
    population_type: 'geography',
    population_id: 'us',
    policy_id: simulationId === '101' ? '2' : '77',
  }),
}));

vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: async (_countryId: string, policyId: string) =>
    policyId === '77'
      ? v1PolicyContent(
          {
            [KEPT_PARAMETER]: { '2026-01-01.2100-12-31': 3600 },
            [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 },
          },
          [REMOVED_US_PARAMETER]
        )
      : v1PolicyContent({}, []),
}));

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchSocietyWideCalculation: (...args: unknown[]) => mockFetchEconomy(...args),
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
    missingParameters: [REMOVED_US_PARAMETER],
    retry: vi.fn(),
    ...overrides,
  };
}

/** The report as this browser saved it, with a provision for the removed parameter too. */
function saveReport(
  provisions = [KEPT_PROVISION, REMOVED_PROVISION]
): Promise<FlagshipReportRecord> {
  return new LocalStorageFlagshipReportStore().create({
    countryId: 'us',
    apiReportId: EXISTING_REPORT_ID,
    title: 'Bigger CTC',
    sourceNote: 'Hand-built',
    provisions,
    year: '2026',
    reformId: 'rf-local1',
  });
}

/** The page, at `path` when given: a section's link opens that section. */
function renderPage(path?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = (
    <QueryClientProvider client={queryClient}>
      <CalcOrchestratorProvider>
        <FlagshipReportPage userReportId={EXISTING_REPORT_ID} />
      </CalcOrchestratorProvider>
    </QueryClientProvider>
  );
  return path ? renderWithCountry(page, 'us', path) : render(page);
}

/** The run's details, so stored results need not wait for the reform's. */
function saveRunDetails() {
  saveReportMeta(EXISTING_REPORT_ID, {
    title: 'Bigger CTC',
    sourceNote: 'Hand-built',
    provisions: [KEPT_PROVISION, REMOVED_PROVISION],
    createdAt: '2026-10-13T00:00:00Z',
  });
}

/** The report with its results stored. */
const COMPLETE_REPORT = {
  ...EXISTING_REPORT,
  status: 'complete' as const,
  output: createMockSocietyWideOutput(),
};

describe('FlagshipReportPage with parameters the model no longer has', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({}))
    );
    mockUseFlagshipReport.mockReturnValue(reportData());
    mockRerunSettings.mockResolvedValue({ year: 2026 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  test('given a report this browser saved then its transfer dialog opens as the page loads', async () => {
    // Given
    await saveReport();

    // When
    renderPage();

    // Then
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
    expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Transfer and run again' })).toBeEnabled();
    expect(within(dialog).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  test("given this browser's saved report then the dialog says it opens the new results, not that its link does", async () => {
    // Given: kept in this browser, the report's link is its v1 report, which a transfer replaces
    await saveReport();

    // When
    renderPage();

    // Then
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
    expect(dialog).toHaveTextContent(/your saved report then opens the new results/i);
    expect(dialog).not.toHaveTextContent(/keeps its link/i);
  });

  test('given a report this browser did not save then only the notice shows', async () => {
    // When
    renderPage();

    // Then
    const notice = await screen.findByRole('alert');
    expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('given stored results then the dialog opens over them too', async () => {
    // Given
    await saveReport();
    saveRunDetails();
    mockUseFlagshipReport.mockReturnValue(reportData({ report: COMPLETE_REPORT }));

    // When
    renderPage();

    // Then
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
    expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(mockFetchEconomy).not.toHaveBeenCalled();
  });

  test('given stored results opened at another section then the dialog opens there too', async () => {
    // Given
    await saveReport();
    saveRunDetails();
    mockUseFlagshipReport.mockReturnValue(reportData({ report: COMPLETE_REPORT }));

    // When: a link to the economic impacts, as Back, a reload or a copied link opens it
    renderPage(`/us/report/${EXISTING_REPORT_ID}?tab=economy`);

    // Then
    expect(await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME })).toBeInTheDocument();
  });

  test('given Transfer and run again then the report runs without them, onto the same saved report', async () => {
    // Given
    const saved = await saveReport();
    // Kept in this browser, the run's link is the new v1 report.
    mockRun.mockResolvedValue(NEW_API_REPORT_ID);
    const user = userEvent.setup();
    renderPage();
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });

    // When
    await user.click(within(dialog).getByRole('button', { name: 'Transfer and run again' }));

    // Then
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    expect(mockRun).toHaveBeenCalledWith(
      'Bigger CTC',
      'Hand-built',
      [KEPT_PROVISION],
      'rf-local1',
      2026,
      // The page it runs from shows this link: a run that keeps it stays here.
      { savedReportId: saved.id, currentLink: EXISTING_REPORT_ID }
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('given Not now then the dialog closes and the notice stays', async () => {
    // Given
    await saveReport();
    const user = userEvent.setup();
    renderPage();
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });

    // When
    await user.click(within(dialog).getByRole('button', { name: 'Not now' }));

    // Then
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(screen.getByRole('alert')).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('given only the removed parameter then Transfer and run again is off and says why', async () => {
    // Given
    await saveReport([REMOVED_PROVISION]);

    // When
    renderPage();

    // Then
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
    expect(within(dialog).getByRole('button', { name: 'Transfer and run again' })).toBeDisabled();
    expect(dialog).toHaveTextContent(
      /this report changes nothing, so there is nothing to transfer/i
    );
  });

  test('given the run cannot start then the dialog says so and stays open', async () => {
    // Given
    await saveReport();
    mockRun.mockResolvedValue(null);
    const user = userEvent.setup();
    renderPage();
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });

    // When
    await user.click(within(dialog).getByRole('button', { name: 'Transfer and run again' }));

    // Then
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Could not transfer the report. Try again.'
    );
    expect(mockRun).toHaveBeenCalledTimes(1);
  });
});
