import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
import ReformReports from '@/components/flagship/ReformReports';
import { saveReportMeta } from '@/libs/flagship/runReport';

vi.mock('@/api/report', () => ({
  fetchReportById: vi.fn(async () => ({ status: 'complete' })),
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

function renderReports(reports: FlagshipReportRecord[]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReformReports countryId="us" reports={reports} />
    </QueryClientProvider>
  );
}

describe('ReformReports', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockReset();
  });

  test('given an account report then Open follows its saved report link, not the v1 report', async () => {
    // Given
    const user = userEvent.setup();
    renderReports([record({ id: REPORT_ROW_ID, apiReportId: '55' })]);

    // When
    await user.click(screen.getByRole('button', { name: /open/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith(`/us/report/${REPORT_ROW_ID}`);
  });

  test('given a report kept only in this browser then Open follows the v1 report', async () => {
    // Given
    const user = userEvent.setup();
    renderReports([record({ id: 'lfr-local1', apiReportId: '55' })]);

    // When
    await user.click(screen.getByRole('button', { name: /open/i }));

    // Then
    expect(mockPush).toHaveBeenCalledWith('/us/report/55');
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
      .getAllByRole('button', { name: /open/i })
      .map((button) => button.parentElement!);
    expect(againstPlanB).toHaveTextContent('Compared with Plan B');
    expect(againstCurrentLaw).not.toHaveTextContent('Compared with');
  });

  test('given a report with no record in this browser then it reads as current law', () => {
    renderReports([record({ apiReportId: '57' })]);

    expect(screen.getByText('2026 report')).toBeInTheDocument();
    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
  });
});
