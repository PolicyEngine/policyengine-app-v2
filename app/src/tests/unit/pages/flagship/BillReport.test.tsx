import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import BillReportPage from '@/pages/flagship/BillReport.page';

const mockFetchTrackerBills = vi.fn();

vi.mock('@/api/billFeed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/billFeed')>();
  return {
    ...actual,
    fetchTrackerBills: () => mockFetchTrackerBills(),
  };
});

const DECILE_SHARES = {
  gainMore5Pct: 0.2,
  gainLess5Pct: 0.1,
  noChange: 0.7,
  loseLess5Pct: 0,
  loseMore5Pct: 0,
};

const TRACKED_BILL = {
  id: 'us-hr1425',
  countryId: 'us',
  jurisdiction: 'US',
  title: 'HR 1425: Child Tax Credit to $5,000',
  status: 'In committee',
  summary: 'Raises the CTC to $5,000 per qualifying child.',
  provisions: [],
  keyFindings: ['External check (cost): within CRFB band.'],
  sourceUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/1425',
  author: 'Rep. Mackenzie, Ryan [R-PA-7]',
  date: '2026-07-06',
  provenance: {
    modelVersion: '1.729.3',
    dataset: 'populace-us',
    datasetVersion: '1.17.0',
    computedAt: '2026-07-09T14:09:18Z',
  },
  impacts: { revenue: -225_500_000_000, povertyPercentChange: -14.3 },
  impactData: {
    budgetary: { stateRevenueImpact: -225_500_000_000, households: 163_000_000 },
    poverty: { baselineRate: 0.169, reformRate: 0.145, percentChange: -14.3 },
    childPoverty: { baselineRate: 0.166, reformRate: 0.099, percentChange: -39.9 },
    winnersLosers: {
      gainMore5Pct: 0.236,
      gainLess5Pct: 0.199,
      noChange: 0.565,
      loseLess5Pct: 0,
      loseMore5Pct: 0,
      byDecile: { 1: DECILE_SHARES, 2: DECILE_SHARES },
    },
    decile: {
      average: { 1: 198.7, 2: 544.3 },
      relative: { 1: 0.0108, 2: 0.0164 },
    },
  },
};

function renderReport() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BillReportPage billId="us-hr1425" />
    </QueryClientProvider>
  );
}

describe('BillReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchTrackerBills.mockResolvedValue([TRACKED_BILL]);
  });

  test('given full impact data then the overview leads with all headline tiles', async () => {
    renderReport();

    expect(await screen.findByText('−$225.5 billion')).toBeInTheDocument();
    expect(screen.getByText('child poverty change')).toBeInTheDocument();
    expect(screen.getByText('16.6% → 9.9%')).toBeInTheDocument();
    // The total household count is not a "households affected" figure
    expect(screen.queryByText(/households affected/i)).not.toBeInTheDocument();
  });

  test('given the header then sponsor, analysis date, and bill text link show', async () => {
    renderReport();

    expect(await screen.findByText(/Sponsored by Rep\. Mackenzie/)).toBeInTheDocument();
    expect(screen.getByText(/Analyzed July 6, 2026/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bill text/i })).toHaveAttribute(
      'href',
      TRACKED_BILL.sourceUrl
    );
  });

  test('given the distribution tab then the chart toggles dollars and percent', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(await screen.findByRole('button', { name: 'Distribution' }));
    expect(screen.getByText('Average household income change by decile')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Percent' }));
    expect(screen.getByText('Relative household income change by decile')).toBeInTheDocument();
  });

  test('given the winners tab then outcome tiles and the decile chart render', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(await screen.findByRole('button', { name: 'Winners and losers' }));

    expect(screen.getByText('households better off')).toBeInTheDocument();
    expect(screen.getByText('no change')).toBeInTheDocument();
    expect(screen.getByText('Outcomes by income decile')).toBeInTheDocument();
  });

  test('given the notes tab then findings and provenance render', async () => {
    const user = userEvent.setup();
    renderReport();

    await user.click(await screen.findByRole('button', { name: 'Notes and sources' }));

    expect(screen.getByText(/CRFB band/)).toBeInTheDocument();
    expect(screen.getByText(/policyengine-us 1\.729\.3/)).toBeInTheDocument();
    expect(screen.getByText(/populace-us 1\.17\.0/)).toBeInTheDocument();
  });
});
