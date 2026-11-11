import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import { CalcOrchestratorProvider } from '@/contexts/CalcOrchestratorContext';
import type { FlagshipReportData } from '@/hooks/useFlagshipReport';
import FlagshipReportPage from '@/pages/flagship/Report.page';
import { ASSOCIATION_IDS } from '@/tests/fixtures/api/v2UserMocks';
import {
  EXISTING_REPORT,
  EXISTING_REPORT_ID,
  EXISTING_SIMULATIONS,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { REMOVED_US_PARAMETER } from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import {
  KEPT_PROVISION,
  REMOVED_PROVISION,
} from '@/tests/fixtures/libs/flagship/missingParameterTransferMocks';

/**
 * The report page at a saved report's link where accounts exist: the
 * link is the saved report's row, which anyone can open, but only its
 * owner is offered the transfer.
 */

const REPORT_DIALOG_NAME = 'This report uses parameters the model no longer has';

/** The saved report as the link's row reads, for its owner and for anyone. */
const SAVED_REPORT: FlagshipReportRecord = {
  id: ASSOCIATION_IDS.REPORT,
  countryId: 'us',
  apiReportId: EXISTING_REPORT_ID,
  title: 'Bigger CTC',
  sourceNote: 'Hand-built',
  provisions: [KEPT_PROVISION, REMOVED_PROVISION],
  createdAt: '2026-10-13T00:00:00Z',
  reformId: ASSOCIATION_IDS.REFORM,
};

const mockUseFlagshipReport = vi.fn();
/** This session's own record of the link's report: null when someone else saved it. */
const mockOwnRecord: { current: FlagshipReportRecord | null } = { current: null };

vi.mock('@/hooks/useFlagshipReport', () => ({
  isApiReportId: () => true,
  useFlagshipReport: () => mockUseFlagshipReport(),
}));

vi.mock('@/hooks/useFlagshipStores', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useFlagshipStores')>()),
  useFlagshipReportStore: () => ({ store: {}, isAccount: true, scope: 'account:owner' }),
  useSharedReport: () => ({
    data: { record: SAVED_REPORT, baselineReform: null },
    isSuccess: true,
    error: null,
    refetch: vi.fn(),
  }),
  useReportRecord: () => mockOwnRecord.current,
  useReformStore: () => ({ findById: vi.fn().mockResolvedValue(null) }),
}));

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: vi.fn(), isRunning: false, error: null }),
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

function reportData(): FlagshipReportData {
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
  };
}

function renderSavedReportLink() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CalcOrchestratorProvider>
        <FlagshipReportPage userReportId={ASSOCIATION_IDS.REPORT} />
      </CalcOrchestratorProvider>
    </QueryClientProvider>
  );
}

describe('FlagshipReportPage at a saved report link with parameters the model no longer has', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFlagshipReport.mockReturnValue(reportData());
  });

  test("given the signed-in owner's link then the dialog opens and says the link keeps working", async () => {
    // Given
    mockOwnRecord.current = SAVED_REPORT;

    // When
    renderSavedReportLink();

    // Then
    const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
    expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/it keeps its link, which then shows the new results/i);
  });

  test("given another user's saved report then only the notice shows", async () => {
    // Given
    mockOwnRecord.current = null;

    // When
    renderSavedReportLink();

    // Then
    const notice = await screen.findByRole('alert');
    expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
