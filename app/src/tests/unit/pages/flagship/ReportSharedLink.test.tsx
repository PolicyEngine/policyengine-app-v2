import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import { provisionPeriods } from '@/libs/flagship/runReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  seedDeductionMetadata,
  US_REGIONS,
} from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  EXISTING_REPORT_ID,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import {
  EXEMPTION_CURRENT_LAW_2028,
  EXEMPTION_SCHEDULE,
  EXEMPTION_SCHEDULE_PERIODS,
  EXEMPTION_SCHEDULE_POLICY,
  REPORT_YEAR_2028,
  SCHEDULE_REPORT_2028,
} from '@/tests/fixtures/pages/flagship/sharedReportMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const mockUseFlagshipReport = vi.fn();
const mockCalcStatus = vi.fn();
const mockRun = vi.fn();
const mockFindMine = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
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

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/api/reformStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/reformStore')>()),
  getReformStore: () => ({ findMine: mockFindMine, create: mockCreate }),
}));

vi.mock('@/components/flagship/CalibrationMatches', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/CalibrationMatches')>()),
  useCalibrationMatches: () => null,
}));

vi.mock('@/components/flagship/ValidationPanel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ValidationPanel')>()),
  useModelTrackRecord: () => null,
}));

const COMPLETE_STATUS = {
  status: 'complete',
  isComplete: true,
  isError: false,
  result: createMockSocietyWideOutput(),
};

const ERROR_STATUS = {
  status: 'error',
  isComplete: false,
  isError: true,
  error: { message: 'Simulation failed' },
  result: null,
};

/** The 2028 report of the phased reform, as a shared link loads it. */
function sharedReport(overrides: Partial<FlagshipReportData> = {}): FlagshipReportData {
  return {
    report: SCHEDULE_REPORT_2028,
    simulations: EXISTING_SIMULATIONS,
    policies: [EXEMPTION_SCHEDULE_POLICY],
    isLoading: false,
    error: null,
    notFound: false,
    failedPolicyIds: [],
    retry: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const page = () => (
    <QueryClientProvider client={queryClient}>
      <FlagshipReportPage userReportId={EXISTING_REPORT_ID} />
    </QueryClientProvider>
  );
  const result = render(page());
  return { ...result, rerenderPage: () => result.rerender(page()) };
}

const openPanel = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /open adjust parameters/i }));

describe('FlagshipReportPage from a shared link', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No provenance stashed: this browser did not run the report.
    localStorage.clear();
    clearDraftReform();
    store.dispatch(clearMetadata());
    seedDeductionMetadata({ regions: US_REGIONS });
    mockFindMine.mockResolvedValue([]);
    mockCreate.mockResolvedValue({ id: 'rf-new', label: 'Phased exemption (adjusted)' });
    mockCalcStatus.mockReturnValue(COMPLETE_STATUS);
    mockUseFlagshipReport.mockReturnValue(sharedReport());
  });

  test('given a later report year then the panel shows the value that year ran, against that year’s law', async () => {
    // Given
    const user = userEvent.setup();
    renderPage();

    // When
    await openPanel(user);

    // Then
    expect(screen.getByLabelText(/personal exemption amount, from 2028/i)).toHaveValue(8000);
    expect(
      screen.getByText(`Baseline: $${EXEMPTION_CURRENT_LAW_2028.toLocaleString('en-US')}`)
    ).toBeInTheDocument();
  });

  test('given only the population changes then recompute runs the same dated reform', async () => {
    // Given
    const user = userEvent.setup();
    renderPage();
    await openPanel(user);

    // When
    await user.click(screen.getByRole('button', { name: 'Population: Nationwide' }));
    await user.click(await screen.findByRole('option', { name: /California/ }));
    await user.click(screen.getByRole('button', { name: /recompute/i }));

    // Then
    await waitFor(() => expect(mockRun).toHaveBeenCalled());
    const [, , provisions, , year] = mockRun.mock.calls[0];
    expect(year).toBe(Number(REPORT_YEAR_2028));
    expect(provisionPeriods(provisions[0])).toEqual(EXEMPTION_SCHEDULE_PERIODS);
    // Saved to Your reforms as it ran.
    expect(mockCreate.mock.calls[0][0].parameters[0].values).toEqual(EXEMPTION_SCHEDULE);
  });

  test('given a failed run then Edit the reform puts the dated reform back in the draft', async () => {
    // Given
    const user = userEvent.setup();
    mockCalcStatus.mockReturnValue(ERROR_STATUS);
    renderPage();

    // When
    await user.click(screen.getByRole('button', { name: 'Edit the reform' }));

    // Then
    const draft = getDraftReform();
    expect(draft?.year).toBe(Number(REPORT_YEAR_2028));
    expect(draft?.provisions[0].intervals).toEqual(EXEMPTION_SCHEDULE);
    clearDraftReform();
  });

  test('given the reform policy is still loading then the page waits for it', () => {
    // Given: the results are in; the policy waits on the parameter metadata.
    mockUseFlagshipReport.mockReturnValue(sharedReport({ policies: [] }));

    // When
    renderPage();

    // Then
    expect(screen.getByRole('status', { name: 'Loading report' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /open adjust parameters/i })
    ).not.toBeInTheDocument();
  });

  test('given the reform policy arrives then the panel shows it, with nothing to recompute', async () => {
    // Given
    const user = userEvent.setup();
    mockUseFlagshipReport.mockReturnValue(sharedReport({ policies: [] }));
    const { rerenderPage } = renderPage();

    // When
    mockUseFlagshipReport.mockReturnValue(sharedReport());
    rerenderPage();
    await openPanel(user);

    // Then
    expect(screen.getByLabelText(/personal exemption amount, from 2028/i)).toHaveValue(8000);
    expect(screen.getByRole('button', { name: /recompute/i })).toBeDisabled();
  });

  test('given the reform policy failed to load then the report shows without it', () => {
    // Given
    mockUseFlagshipReport.mockReturnValue(
      sharedReport({ policies: [], failedPolicyIds: [EXEMPTION_SCHEDULE_POLICY.id!] })
    );

    // When
    renderPage();

    // Then
    expect(screen.queryByRole('status', { name: 'Loading report' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Validation' })).toBeInTheDocument();
  });
});
