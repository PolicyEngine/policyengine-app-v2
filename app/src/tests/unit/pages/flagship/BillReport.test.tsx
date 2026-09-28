import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { BillEconomy } from '@/hooks/useBillEconomy';
import BillReportPage from '@/pages/flagship/BillReport.page';
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
    expect(screen.getByText('US · In committee')).toBeInTheDocument();
  });

  test('given the full run is calculating then the overview leads with stored estimates', async () => {
    renderReport();

    expect(await screen.findByText('$225.5bn')).toBeInTheDocument();
    expect(screen.getByText('Annual revenue loss')).toBeInTheDocument();
    expect(screen.getByText('39.9% decrease')).toBeInTheDocument();
    expect(
      screen.getByText('Stored estimates from the legislative tracker · full results calculating')
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
    mockUseBillEconomy.mockReturnValue(economy({ message: 'Position 2 in queue' }));
    renderReport();

    await user.click(await screen.findByRole('tab', { name: 'Economic impacts' }));

    expect(screen.getByText('Calculating the full results…')).toBeInTheDocument();
    expect(screen.getByText(/Position 2 in queue/)).toBeInTheDocument();
    expect(screen.queryByText('Economic impact charts')).not.toBeInTheDocument();
  });

  test('given the full results then the overview and charts use them', async () => {
    const user = userEvent.setup();
    mockUseBillEconomy.mockReturnValue(
      economy({ status: 'complete', output: createMockSocietyWideOutput() })
    );
    renderReport();

    expect(await screen.findByText('Annual government savings')).toBeInTheDocument();
    expect(screen.getByText('13.3% decrease')).toBeInTheDocument();
    expect(
      screen.queryByText(/Stored estimates from the legislative tracker/)
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
    expect(screen.getByText('Economic impact charts')).toBeInTheDocument();
  });

  test('given the full run fails then it says so and can retry', async () => {
    const user = userEvent.setup();
    mockUseBillEconomy.mockReturnValue(economy({ status: 'error', message: 'Worker lost' }));
    renderReport();

    expect(
      await screen.findByText(
        'Stored estimates from the legislative tracker · full results unavailable'
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
    expect(screen.getByText('The full results could not be calculated.')).toBeInTheDocument();
    expect(screen.getByText('Worker lost')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(mockRetry).toHaveBeenCalled();
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
    renderReport();

    await screen.findByRole('heading', { level: 1, name: TRACKED_BILL.title });
    expect(mockUseBillEconomy).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: TRACKED_BILL.id }),
      { enabled: false }
    );
  });

  test('given an unknown bill then says it is not in the feed', async () => {
    renderReport('missing-bill');

    expect(await screen.findByText('This bill is not in the current feed.')).toBeInTheDocument();
  });
});
