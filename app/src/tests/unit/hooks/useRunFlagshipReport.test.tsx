import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import { flagshipReportQueryKeys } from '@/libs/flagship/runReport';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  EARLIER_REPORT_ID,
  EARLIER_REPORTS,
  NEW_REPORT_ID,
  REPORTS_AFTER_RUN,
  RUN_PROVISIONS,
  RUN_REFORM_ID,
  RUN_TITLE,
} from '@/tests/fixtures/hooks/useRunFlagshipReportMocks';

const mockRunFlagshipReport = vi.fn();
const mockFindMine = vi.fn();
const mockFetchStatus = vi.fn();

vi.mock('@/libs/flagship/runReport', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/runReport')>()),
  runFlagshipReport: (...args: unknown[]) => mockRunFlagshipReport(...args),
}));

/** Your reforms' list of reports, as fresh for five minutes as the app keeps it. */
function ReportsList() {
  const { data } = useQuery({
    queryKey: flagshipReportQueryKeys.mine('us'),
    queryFn: () => mockFindMine(),
    staleTime: 5 * 60 * 1000,
  });
  return <p>{data ? `${data.length} reports` : 'Loading'}</p>;
}

/** Where the earlier report stood when Your reforms last asked. */
function EarlierReportStatus() {
  const { data } = useQuery({
    queryKey: flagshipReportQueryKeys.status('us', EARLIER_REPORT_ID),
    queryFn: () => mockFetchStatus(),
    staleTime: 60_000,
  });
  return <p>{data}</p>;
}

function RunButton() {
  const { run } = useRunFlagshipReport();
  return (
    <button type="button" onClick={() => run(RUN_TITLE, '', RUN_PROVISIONS, RUN_REFORM_ID)}>
      Run impact report
    </button>
  );
}

function renderRun(queryClient: QueryClient, children: React.ReactNode) {
  return render(
    <QueryClientProvider client={queryClient}>
      {children}
      <RunButton />
    </QueryClientProvider>
  );
}

describe('useRunFlagshipReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    seedDeductionMetadata();
    mockRunFlagshipReport.mockResolvedValue(NEW_REPORT_ID);
    mockFetchStatus.mockResolvedValue('checked');
  });

  test('given a report runs then Your reforms lists it at once', async () => {
    // Given
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockFindMine.mockResolvedValueOnce(EARLIER_REPORTS).mockResolvedValue(REPORTS_AFTER_RUN);
    renderRun(queryClient, <ReportsList />);
    expect(await screen.findByText('1 reports')).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('button', { name: 'Run impact report' }));

    // Then
    expect(await screen.findByText('2 reports')).toBeInTheDocument();
  });

  test('given a report runs then the reports’ statuses are asked for again', async () => {
    // Given
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderRun(queryClient, <EarlierReportStatus />);
    await screen.findByText('checked');

    // When
    await user.click(screen.getByRole('button', { name: 'Run impact report' }));

    // Then
    await waitFor(() => expect(mockFetchStatus).toHaveBeenCalledTimes(2));
  });

  test('given the run fails then the list stays as it was', async () => {
    // Given
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockRunFlagshipReport.mockRejectedValue(new Error('API down'));
    mockFindMine.mockResolvedValue(EARLIER_REPORTS);
    renderRun(queryClient, <ReportsList />);
    await screen.findByText('1 reports');

    // When
    await user.click(screen.getByRole('button', { name: 'Run impact report' }));

    // Then
    expect(mockFindMine).toHaveBeenCalledTimes(1);
  });
});
