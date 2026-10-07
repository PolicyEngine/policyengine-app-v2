import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { BillEconomy } from '@/hooks/useBillEconomy';
import BillReportPage from '@/pages/flagship/BillReport.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const mockCalibrationMatchesForPaths = vi.fn();

vi.mock('@/libs/flagship/calibrationMatching', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/flagship/calibrationMatching')>();
  return {
    ...actual,
    calibrationMatchesForPaths: (...args: unknown[]) => mockCalibrationMatchesForPaths(...args),
  };
});

const mockFetchTrackerBills = vi.fn();

vi.mock('@/api/billFeed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/billFeed')>();
  return {
    ...actual,
    fetchTrackerBills: () => mockFetchTrackerBills(),
  };
});

const mockIsAlreadyCurrentLaw = vi.fn();

vi.mock('@/libs/flagship/billMetrics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/libs/flagship/billMetrics')>();
  return {
    ...actual,
    isAlreadyCurrentLaw: (...args: Parameters<typeof actual.isAlreadyCurrentLaw>) =>
      mockIsAlreadyCurrentLaw(...args) ?? actual.isAlreadyCurrentLaw(...args),
  };
});

const mockUseBillEconomy = vi.fn();

vi.mock('@/hooks/useBillEconomy', () => ({
  useBillEconomy: (...args: unknown[]) => mockUseBillEconomy(...args),
}));

vi.mock('@/components/flagship/report/EconomicImpactCharts', () => ({
  default: () => <div>Economic impact charts</div>,
}));

const mockRetry = vi.fn();

function economy(overrides: Partial<BillEconomy> = {}): BillEconomy {
  return {
    output: null,
    status: 'pending',
    reformPolicyId: '98557',
    baselinePolicyId: '2',
    year: '2026',
    region: 'us',
    retry: mockRetry,
    ...overrides,
  };
}

function renderReport(billId = 'us-hr1425') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BillReportPage billId={billId} />
    </QueryClientProvider>
  );
}

describe('BillReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTrackerBills.mockResolvedValue([TRACKED_BILL]);
    mockUseBillEconomy.mockReturnValue(economy());
    mockIsAlreadyCurrentLaw.mockReturnValue(undefined);
    mockCalibrationMatchesForPaths.mockResolvedValue(mockCalibrationMatches);
    // Tests that seed metadata must not leave it loaded for the next one.
    store.dispatch(clearMetadata());
  });

  test('given a bill then it uses the saved report sections', async () => {
    renderReport();

    await screen.findByRole('heading', { level: 1, name: TRACKED_BILL.title });
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Economic impacts',
      'Districts',
      'Household',
      'Validation',
    ]);
    // The title names the bill; no place-and-status line runs under it.
    expect(screen.queryByText('US · In committee')).not.toBeInTheDocument();
  });

  test('given the page opens then the overview leads with stored estimates', async () => {
    renderReport();

    expect(await screen.findByText('$225.5bn')).toBeInTheDocument();
    expect(screen.getByText('Annual revenue loss')).toBeInTheDocument();
    expect(screen.getByText('39.9% decrease')).toBeInTheDocument();
    expect(screen.getByText('Stored estimates from the legislative tracker')).toBeInTheDocument();
  });

  test('given the page and its tabs open then no full run starts until asked', async () => {
    const user = userEvent.setup();
    seedDeductionMetadata();
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));
    await user.click(screen.getByRole('tab', { name: 'Districts' }));
    expect(
      within(screen.getByRole('tabpanel')).getByText('The full results are not calculated yet.')
    ).toBeInTheDocument();
    expect(mockUseBillEconomy).not.toHaveBeenCalledWith(expect.anything(), { enabled: true });

    await user.click(screen.getByRole('button', { name: 'Calculate full results' }));
    expect(mockUseBillEconomy).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: TRACKED_BILL.id }),
      { enabled: true }
    );
    expect(
      within(screen.getByRole('tabpanel')).getByText('Calculating the full results…')
    ).toBeInTheDocument();
  });

  test('given the overview then summary, sponsor, date, bill text link, and verdict show', async () => {
    renderReport();

    expect(await screen.findByText(/Raises the CTC to \$5,000/)).toBeInTheDocument();
    expect(screen.getByText(/Sponsored by Rep\. Mackenzie/)).toBeInTheDocument();
    expect(screen.getByText(/Analyzed July 6, 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bill text/i })).toHaveAttribute(
      'href',
      TRACKED_BILL.sourceUrl
    );
    expect(screen.getAllByText(/Within fiscal-note range/).length).toBeGreaterThanOrEqual(1);
  });

  test('given the full run is calculating then economic impacts show its progress', async () => {
    const user = userEvent.setup();
    mockUseBillEconomy.mockReturnValue(economy({ message: 'In queue (position 2)...' }));
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));
    await user.click(screen.getByRole('button', { name: 'Calculate full results' }));

    expect(screen.getByText('Calculating the full results…')).toBeInTheDocument();
    expect(screen.getByText(/^In queue \(position 2\)\. A bill/)).toBeInTheDocument();
    expect(screen.queryByText('Economic impact charts')).not.toBeInTheDocument();
    // The tracker's stored detail fills the wait.
    expect(screen.getByText('Income change by decile')).toBeInTheDocument();
    expect(screen.getByText('Winners and losers')).toBeInTheDocument();
    expect(screen.getByText('Poverty rate, before and after')).toBeInTheDocument();
  });

  test('given the full results then the overview and charts use them', async () => {
    const user = userEvent.setup();
    mockUseBillEconomy.mockReturnValue(
      economy({ status: 'complete', output: createMockSocietyWideOutput() })
    );
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));
    await user.click(screen.getByRole('button', { name: 'Calculate full results' }));
    expect(screen.getByText('Economic impact charts')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(screen.getByText('Annual government savings')).toBeInTheDocument();
    expect(screen.getByText('13.3% decrease')).toBeInTheDocument();
    expect(
      screen.queryByText(/Stored estimates from the legislative tracker/)
    ).not.toBeInTheDocument();
  });

  test('given the full run fails then it says so and can retry', async () => {
    const user = userEvent.setup();
    mockUseBillEconomy.mockReturnValue(economy({ status: 'error', message: 'Worker lost' }));
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));
    await user.click(screen.getByRole('button', { name: 'Calculate full results' }));
    expect(screen.getByText('The full results could not be calculated.')).toBeInTheDocument();
    expect(screen.getByText('Worker lost')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mockRetry).toHaveBeenCalled();

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    expect(
      screen.getByText('Stored estimates from the legislative tracker · full results unavailable')
    ).toBeInTheDocument();
  });

  test('given the validation tab then external checks and the tracker provenance render', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Validation' }));

    expect(screen.getByText('External checks for this bill')).toBeInTheDocument();
    expect(screen.getByText('-$225.5B')).toBeInTheDocument();
    expect(screen.getByText('CRFB')).toBeInTheDocument();
    expect(screen.getByText(/later effective date/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tracker estimate: policyengine-us 1.729.3 · populace-us 1.17.0 · computed July 9, 2026'
      )
    ).toBeInTheDocument();
  });

  test('given a state bill then its data check runs against that state and says so', async () => {
    const user = userEvent.setup();
    const SNAP_STANDARD_DEDUCTION_PATH = 'gov.usda.snap.income.deductions.standard';
    mockFetchTrackerBills.mockResolvedValue([
      {
        ...TRACKED_BILL,
        id: 'ut-sb60',
        jurisdiction: 'Utah',
        state: 'UT',
        provisions: [{ path: SNAP_STANDARD_DEDUCTION_PATH, value: 250 }],
      },
    ]);
    mockCalibrationMatchesForPaths.mockResolvedValue({
      ...mockCalibrationMatches,
      geography: 'UT',
    });
    renderReport('ut-sb60');

    await user.click(await screen.findByRole('tab', { name: 'Validation' }));

    expect(mockCalibrationMatchesForPaths).toHaveBeenCalledWith(
      [SNAP_STANDARD_DEDUCTION_PATH],
      'UT'
    );
    expect(await screen.findAllByText('IRS Statistics of Income · UT')).toHaveLength(2);
  });

  test('given metadata is still loading then the full run waits for it', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));
    await user.click(screen.getByRole('button', { name: 'Calculate full results' }));
    expect(mockUseBillEconomy).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: TRACKED_BILL.id }),
      { enabled: false }
    );
  });

  test('given a bill already in current law then no run starts and the tracker estimate stays', async () => {
    const user = userEvent.setup();
    mockIsAlreadyCurrentLaw.mockReturnValue(true);
    renderReport();

    expect(
      await screen.findByText(
        'Estimates from the legislative tracker, against the law before this bill'
      )
    ).toBeInTheDocument();
    expect(mockUseBillEconomy).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: TRACKED_BILL.id }),
      { enabled: false }
    );
    await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
    expect(screen.getByText('This bill is already current law.')).toBeInTheDocument();
    expect(screen.getByText('Winners and losers')).toBeInTheDocument();
  });

  test('given the tracker wrote up the changes then the overview lists them as scored', async () => {
    mockFetchTrackerBills.mockResolvedValue([
      {
        ...TRACKED_BILL,
        changes: [
          {
            label: 'Maximum credit per child',
            before: '$2,200',
            after: '$5,000',
            explanation: 'Raises the credit for each qualifying child.',
            section: 'Section 2',
          },
        ],
      },
    ]);
    renderReport();

    const list = await screen.findByRole('region', { name: 'Policy changes' });
    expect(within(list).getByText('Maximum credit per child')).toBeInTheDocument();
    expect(
      within(list).getByText('Raises the credit for each qualifying child.')
    ).toBeInTheDocument();
    expect(within(list).getByText('Section 2')).toBeInTheDocument();
    expect(list).toHaveTextContent('$2,200 → $5,000');
    // The top box keeps the title only.
    const cover = screen.getByRole('heading', { level: 1 }).closest('header')!;
    expect(cover).not.toHaveTextContent('→');
  });

  test('given an enacted bill without a write-up then its values read alone, not as current law', async () => {
    seedDeductionMetadata();
    mockIsAlreadyCurrentLaw.mockReturnValue(true);
    // Today's law already has the bill's $2,200.
    mockFetchTrackerBills.mockResolvedValue([
      { ...TRACKED_BILL, provisions: [{ path: 'gov.irs.credits.ctc.amount.base', value: 2200 }] },
    ]);
    renderReport();

    const list = await screen.findByRole('region', { name: 'Policy changes' });
    expect(within(list).getByText('Maximum credit per child')).toBeInTheDocument();
    // The parameter's own description is the detail.
    expect(within(list).getByText('Maximum credit per qualifying child.')).toBeInTheDocument();
    // Its results compare with the law before it, so today's law is not its "before".
    expect(within(list).getByText('$2,200')).toBeInTheDocument();
    expect(list).not.toHaveTextContent(/current law|now law/);
    expect(list).toHaveTextContent(/compare them with the law before the bill/);
    expect(list).not.toHaveTextContent('→');
    store.dispatch(clearMetadata());
  });

  test('given an enacted bill with the tracker’s baseline then the overview shows what it changed from', async () => {
    seedDeductionMetadata();
    mockIsAlreadyCurrentLaw.mockReturnValue(true);
    mockFetchTrackerBills.mockResolvedValue([
      {
        ...TRACKED_BILL,
        provisions: [
          {
            path: 'gov.irs.credits.ctc.amount.base',
            value: 2200,
            baselineIntervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2000 }],
          },
        ],
      },
    ]);
    renderReport();

    const list = await screen.findByRole('region', { name: 'Policy changes' });
    expect(list).toHaveTextContent('$2,000 → $2,200');
    expect(list).not.toHaveTextContent(/compare them with the law before the bill/);
    store.dispatch(clearMetadata());
  });

  test('given a bill with no mapped provisions then it says the results cannot be calculated', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue([{ ...TRACKED_BILL, provisions: [] }]);
    renderReport();

    expect(
      await screen.findByText(
        'Stored estimates from the legislative tracker · full results unavailable'
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
    expect(screen.getByText(/provisions are mapped to model parameters yet/)).toBeInTheDocument();
    expect(screen.queryByText('Calculating the full results…')).not.toBeInTheDocument();
  });

  test('given an unknown bill then says it is not in the feed', async () => {
    renderReport('missing-bill');

    expect(await screen.findByText('This bill is not in the current feed.')).toBeInTheDocument();
  });
});
