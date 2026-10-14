import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ReportView from '@/components/flagship/report/ReportView';
import { BillExternalEstimates } from '@/components/flagship/ValidationPanel';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

vi.mock('@/utils/isSocietyWideReportNoOp', () => ({
  isSocietyWideReportNoOp: () => true,
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
}));

function renderCover(populationLabel?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportView
        title="Bigger CTC"
        sourceNote="Hand-built"
        populationLabel={populationLabel}
        provisions={[]}
        year="2026"
        output={null}
        calibration={null}
        trackRecord={null}
      />
    </QueryClientProvider>
  );
}

describe('ReportView overview', () => {
  test('given a reform that changes nothing then the overview says so first', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          output={createMockSocietyWideOutput()}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    const panel = screen.getByRole('tabpanel');
    expect(panel.querySelector('[aria-label="No change in this year"]')).toHaveTextContent(
      'This reform changes nothing in 2026'
    );
  });

  test('given a report compared with a saved reform then the cover and the notice name it', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          customBaselineLabel="Plan B"
          year="2026"
          output={createMockSocietyWideOutput()}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Compared with Plan B')).toBeInTheDocument();
    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Every result matches Plan B.');
    expect(notice).not.toHaveTextContent('matches current law');
  });
});

describe('ReportView compared with a saved reform', () => {
  const PROVISION = {
    path: 'gov.irs.credits.ctc.amount.base',
    breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
    unit: 'currency-USD',
    baselineValue: 2000,
    value: 2500,
  };
  const renderWith = (customBaselineLabel?: string) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[PROVISION]}
          customBaselineLabel={customBaselineLabel}
          year="2026"
          output={null}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );
  };
  const valueHeadings = () =>
    within(screen.getByRole('region', { name: 'Policy changes' }))
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

  test('then the changes table says its first values are current law', () => {
    renderWith('Plan B');

    expect(valueHeadings()).toEqual(['Change', 'Current law', 'After', 'Start', 'End']);
  });

  test('given current law then the changes table reads before and after, as before', () => {
    renderWith();

    expect(valueHeadings()).toEqual(['Change', 'Before', 'After', 'Start', 'End']);
  });

  test('then Validation says published scores compare with current law', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    renderWith('Plan B');

    await user.click(screen.getByRole('tab', { name: 'Validation' }));

    expect(
      screen.getByText(
        'Published scores compare with current law. This report compares with Plan B.'
      )
    ).toBeInTheDocument();
    fetchSpy.mockRestore();
  });

  test('given current law then Validation has no such note', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    renderWith();

    await user.click(screen.getByRole('tab', { name: 'Validation' }));

    expect(screen.queryByText(/Published scores compare/)).not.toBeInTheDocument();
    fetchSpy.mockRestore();
  });
});

describe('ReportView budget window', () => {
  const renderWith = (budgetWindow?: { startYear: number; windowSize: number }) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          reformPolicyId="9"
          baselinePolicyId="2"
          budgetWindow={budgetWindow}
          output={null}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );
  };

  test('given a window asked for in Build then the overview carries it', async () => {
    renderWith({ startYear: 2026, windowSize: 10 });

    expect(await screen.findByRole('region', { name: 'Budget window' })).toHaveTextContent(
      'Budget, 2026–2035'
    );
  });

  test('given no window asked for then the overview has none', () => {
    renderWith();

    expect(screen.queryByRole('region', { name: 'Budget window' })).not.toBeInTheDocument();
  });
});

describe('ReportView cover', () => {
  test('given a population then the cover reads it and the year, not how the reform was made', () => {
    renderCover('Delaware');

    expect(screen.getByRole('heading', { level: 1, name: 'Bigger CTC' })).toBeInTheDocument();
    expect(screen.getByText('Delaware · 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Hand-built/)).not.toBeInTheDocument();
  });

  test('given no population then the cover has no line under the title', () => {
    renderCover();

    expect(screen.queryByText(/· 2026/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hand-built/)).not.toBeInTheDocument();
  });

  test('given current law then the cover names no comparison', () => {
    renderCover('Delaware');

    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
  });
});

describe('ReportView validation', () => {
  const CTC_PROVISION: RunReportProvision = {
    path: 'gov.irs.credits.ctc.refundable.individual_max',
    breadcrumb: 'IRS → Credits → CTC → Refundable maximum',
    unit: 'currency-USD',
    baselineValue: 1700,
    value: 499,
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderValidationTab = async (extra: Partial<Parameters<typeof ReportView>[0]> = {}) => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ built: null, rows: [], unmappedCount: 0 }))
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Smaller refundable CTC"
          sourceNote="Hand-built"
          provisions={[CTC_PROVISION]}
          year="2026"
          output={null}
          calibration={mockCalibrationMatches}
          trackRecord={{ modelVersion: '1.808.0', reachedCount: 12, programs: [], rows: [] }}
          {...extra}
        />
      </QueryClientProvider>
    );
    await user.click(screen.getByRole('tab', { name: 'Validation' }));
    return screen.getByRole('tabpanel');
  };

  test('given a custom report then validation says no external estimate is available', async () => {
    const panel = await renderValidationTab();

    expect(
      await within(panel).findByText('No external estimate is available for this reform.')
    ).toBeInTheDocument();
    expect(within(panel).getByRole('table', { name: 'Calibration targets' })).toBeInTheDocument();
    expect(
      within(panel).getByRole('heading', { level: 3, name: 'Baseline comparisons' })
    ).toBeInTheDocument();
    // The reform's changes live in the overview; validation does not list them again.
    expect(within(panel).queryByText(/Your reform/)).not.toBeInTheDocument();
    expect(within(panel).queryByText('IRS → Credits → CTC → Refundable maximum')).toBeNull();
  });

  test('given a bill report then validation leads with its fiscal note and the range chip', async () => {
    const panel = await renderValidationTab({
      externalEstimates: (
        <BillExternalEstimates billId={TRACKED_BILL.id} validation={TRACKED_BILL.validation!} />
      ),
    });

    expect(
      within(panel).getByRole('table', { name: 'Estimates for this bill' })
    ).toBeInTheDocument();
    expect(within(panel).getByText('Within fiscal-note range · Δ 2%')).toBeInTheDocument();
    expect(
      within(panel).queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given a custom baseline then validation marks the scorecard not comparable', async () => {
    const panel = await renderValidationTab({ customBaselineLabel: 'Smaller CTC' });

    expect(within(panel).getAllByText('Not comparable')).toHaveLength(2);
    expect(within(panel).getByRole('table', { name: 'Calibration targets' })).toBeInTheDocument();
    // External scores assume current law: the scorecard is not asked.
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls).not.toContain('/api/scorecard-comparisons');
  });

  test('given current law then validation asks the scorecard and marks nothing', async () => {
    const panel = await renderValidationTab();

    await within(panel).findByText('No external estimate is available for this reform.');
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls).toContain('/api/scorecard-comparisons');
    expect(within(panel).queryByText('Not comparable')).not.toBeInTheDocument();
  });
});
