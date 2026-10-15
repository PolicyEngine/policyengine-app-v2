import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import ReformReports from '@/components/flagship/ReformReports';
import { saveReportMeta } from '@/libs/flagship/runReport';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';

vi.mock('@/api/report', () => ({
  fetchReportById: vi.fn(async (_country: string, id: string) => ({
    // Report 62 is still computing; the rest are done.
    status: id === '62' ? 'pending' : 'complete',
    // Report 61 is an account report's: the row keeps no year, the report does.
    year: id === '61' ? '2028' : '2026',
    finished_at: '2026-10-14T15:12:00Z',
    // Report 60 ran on the model the app has loaded ("test", from the seed).
    output: id === '60' ? JSON.stringify({ model_version: 'test' }) : null,
    simulation_1_id: `sim-${id}`,
  })),
}));

vi.mock('@/api/simulation', () => ({
  // Report 63's baseline ran a reform (policy 88); every other report's ran
  // current law (2, from the seed).
  fetchSimulationById: vi.fn(async (_country: string, simulationId: string) => ({
    policy_id: simulationId === 'sim-63' ? '88' : '2',
  })),
}));

const mockPush = vi.fn();

vi.mock('@/contexts/NavigationContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/contexts/NavigationContext')>();
  return { ...actual, useAppNavigate: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }) };
});

/** An account row's ID: the report's shareable link. */
const REPORT_ROW_ID = '44444444-4444-4444-8444-444444444444';

const record = (overrides: Partial<FlagshipReportRecord>): FlagshipReportRecord => ({
  id: 'rec-1',
  countryId: 'us',
  apiReportId: '55',
  title: 'Bigger CTC',
  sourceNote: 'Hand-built',
  provisions: [],
  year: '2026',
  createdAt: '2026-10-01T00:00:00Z',
  reformId: 'rf-bigger-ctc',
  ...overrides,
});

const META = {
  title: 'Bigger CTC',
  sourceNote: 'Hand-built',
  provisions: [],
  createdAt: '2026-10-01T00:00:00Z',
};

function renderReports(
  reports: FlagshipReportRecord[],
  onRerun?: (report: FlagshipReportRecord) => void,
  reformName?: (reformId: string) => string | undefined
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReformReports countryId="us" reports={reports} onRerun={onRerun} reformName={reformName} />
    </QueryClientProvider>
  );
}

describe('ReformReports', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockReset();
  });

  test('given an unfinished account report then Open follows its saved report link, not the v1 report', async () => {
    // Given
    const user = userEvent.setup();
    renderReports([record({ id: REPORT_ROW_ID, apiReportId: '62' })]);

    // When: a report still computing reads Open
    await user.click(screen.getByRole('button', { name: /^open/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith(`/us/report/${REPORT_ROW_ID}`);
  });

  test('given a finished account report then View results follows its saved report link', async () => {
    // Given
    const user = userEvent.setup();
    renderReports([record({ id: REPORT_ROW_ID, apiReportId: '55' })]);

    // When
    await user.click(await screen.findByRole('button', { name: /view results/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith(`/us/report/${REPORT_ROW_ID}`);
  });

  test('given a finished report kept only in this browser then View results follows the v1 report', async () => {
    // Given
    const user = userEvent.setup();
    renderReports([record({ id: 'lfr-local1', apiReportId: '55' })]);

    // When
    await user.click(await screen.findByRole('button', { name: /view results/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith('/us/report/55');
  });

  test('given an account report with no year of its own then it reads the year from the API', async () => {
    // Given: the account row keeps no year; the v1 report carries it
    renderReports([record({ id: REPORT_ROW_ID, apiReportId: '61', year: undefined })]);

    // Then
    expect(await screen.findByText('2028 report')).toBeInTheDocument();
  });

  test('given an account report compared with a saved reform after a reload then it names that reform', () => {
    // Given: no run details in this page session, only the row's link
    renderReports(
      [record({ id: REPORT_ROW_ID, apiReportId: '55', baselineReformId: 'rf-plan-b' })],
      undefined,
      (reformId) => (reformId === 'rf-plan-b' ? 'Plan B' : undefined)
    );

    // Then
    expect(screen.getByText('Compared with Plan B')).toBeInTheDocument();
  });

  test('given an account report compared with a saved reform then it reads so from its link', () => {
    // Given: a run this session made keeps its details under the report's link
    saveReportMeta(REPORT_ROW_ID, {
      ...META,
      baseline: { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' },
    });

    // When
    renderReports([record({ id: REPORT_ROW_ID, apiReportId: '55' })]);

    // Then
    expect(screen.getByText('Compared with Plan B')).toBeInTheDocument();
  });

  test('given the same reform run against current law and a saved reform then the two read apart', () => {
    // Given
    saveReportMeta('55', META);
    saveReportMeta('56', {
      ...META,
      baseline: { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' },
    });

    // When
    renderReports([
      record({ id: 'rec-1', apiReportId: '55', createdAt: '2026-10-01T00:00:00Z' }),
      record({ id: 'rec-2', apiReportId: '56', createdAt: '2026-10-02T00:00:00Z' }),
    ]);

    // Then
    const [againstPlanB, againstCurrentLaw] = within(
      screen.getByRole('region', { name: 'Reports' })
    )
      .getAllByRole('button', { name: /view results|open/i })
      .map((button) => button.closest('[data-report-row]')!);
    expect(againstPlanB).toHaveTextContent('Compared with Plan B');
    expect(againstCurrentLaw).not.toHaveTextContent('Compared with');
  });

  test('given a report with no record in this browser then it reads as current law', () => {
    renderReports([record({ apiReportId: '57' })]);

    expect(screen.getByText('2026 report')).toBeInTheDocument();
    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
  });

  test('given a finished report then its stored results open as of that run, or it runs again', async () => {
    // Given
    const onRerun = vi.fn();
    const report = record({ apiReportId: '58' });
    renderReports([report], onRerun);

    // Then — the results are from when the run finished
    expect(await screen.findByText('Results from Oct 14, 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view results/i })).toBeInTheDocument();

    // When
    screen.getByRole('button', { name: /re-run/i }).click();

    // Then
    expect(onRerun).toHaveBeenCalledWith(report);
  });

  test('given a report on the current model then it is up to date, with no re-run', async () => {
    seedDeductionMetadata();
    renderReports([record({ apiReportId: '60' })], vi.fn());

    expect(await screen.findByText('Up to date')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /re-run/i })).not.toBeInTheDocument();
    store.dispatch(clearMetadata());
  });
});

describe('ReformReports comparisons without a link', () => {
  beforeEach(() => {
    localStorage.clear();
    store.dispatch(clearMetadata());
    seedDeductionMetadata();
  });

  test('given a report whose compared reform is gone then it still reads as compared', async () => {
    // Given: no run details and no link, but its baseline ran another reform
    renderReports([record({ id: 'rec-63', apiReportId: '63', baselineReformId: null })]);

    // Then
    expect(await screen.findByText('Compared with a saved reform')).toBeInTheDocument();
  });

  test('given a report whose baseline ran current law then no comparison shows', async () => {
    // Given
    renderReports([record({ id: 'rec-64', apiReportId: '64', baselineReformId: null })]);

    // Then
    expect(await screen.findByText('2026 report')).toBeInTheDocument();
    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
  });
});
