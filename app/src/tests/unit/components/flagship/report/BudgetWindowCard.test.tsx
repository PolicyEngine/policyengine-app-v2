import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { BudgetWindowResponse } from '@/api/budgetWindow';
import BudgetWindowCard from '@/components/flagship/report/BudgetWindowCard';

const mockFetchBudgetWindow = vi.fn();

vi.mock('@/api/budgetWindow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/budgetWindow')>();
  return {
    ...actual,
    fetchBudgetWindow: (...args: unknown[]) => mockFetchBudgetWindow(...args),
  };
});

const year = (label: string | number, budgetaryImpact: number, stateTaxRevenueImpact = 0) => ({
  year: label,
  taxRevenueImpact: budgetaryImpact + stateTaxRevenueImpact,
  federalTaxRevenueImpact: budgetaryImpact,
  stateTaxRevenueImpact,
  benefitSpendingImpact: 0,
  budgetaryImpact,
});

const COMPLETE: BudgetWindowResponse = {
  status: 'ok',
  result: {
    kind: 'budgetWindow',
    startYear: '2026',
    endYear: '2028',
    windowSize: 3,
    annualImpacts: [year('2026', -1.2e9), year('2027', -1.3e9), year('2028', -1.4e9)],
    totals: year('Total', -3.9e9),
  },
  progress: 100,
};

const TEN_YEARS = { startYear: 2026, windowSize: 10 };
const THREE_YEARS = { startYear: 2026, windowSize: 3 };

function renderCard(window = TEN_YEARS, region?: string) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <BudgetWindowCard
        countryId="us"
        reformPolicyId="123"
        baselinePolicyId="2"
        region={region}
        window={window}
      />
    </QueryClientProvider>
  );
}

describe('BudgetWindowCard', () => {
  beforeEach(() => {
    mockFetchBudgetWindow.mockReset();
  });

  test('given the report window then it runs at once, with no controls of its own', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      status: 'computing',
      message: 'Scoring 2026, 2027 (2 of 10 complete)...',
      result: null,
      progress: 20,
    });
    renderCard();

    expect(screen.getByRole('heading', { name: 'Budget window' })).toBeInTheDocument();
    expect(await screen.findByText('Calculating the 2026–2035 budget')).toBeInTheDocument();
    expect(await screen.findByText('Scoring 2026, 2027 (2 of 10 complete)')).toBeInTheDocument();
    expect(screen.getByText(/· 20%/)).toBeInTheDocument();
    expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '123', '2', {
      region: 'us',
      startYear: 2026,
      windowSize: 10,
    });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Calculate/ })).not.toBeInTheDocument();
  });

  test('given a finished window then each year and the total read as costs', async () => {
    mockFetchBudgetWindow.mockResolvedValue(COMPLETE);
    renderCard(THREE_YEARS);

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('rowheader', { name: '2027' })).toBeInTheDocument();
    const total = within(table).getByRole('rowheader', { name: 'Total' }).closest('tr')!;
    expect(within(total).getAllByText('−$3.9bn')).toHaveLength(2);
    // A federal reform run nationwide has no state column.
    expect(within(table).queryByText('State tax revenue')).not.toBeInTheDocument();
  });

  test('given a state run then federal and state revenue read apart', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      ...COMPLETE,
      result: {
        ...COMPLETE.result!,
        annualImpacts: [{ ...year('2026', -60.6, -5e7), budgetaryImpact: -5e7 }],
        totals: year('Total', 0, -5e7),
      },
    });
    renderCard(TEN_YEARS, 'state/de');

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Federal tax revenue')).toBeInTheDocument();
    expect(within(table).getByText('State tax revenue')).toBeInTheDocument();
    // A few dollars of rounding, and no spending change, read as nothing.
    const first = within(table).getByRole('rowheader', { name: '2026' }).closest('tr')!;
    expect(within(first).getAllByText('$0')).toHaveLength(2);
    expect(mockFetchBudgetWindow.mock.calls[0][3]).toMatchObject({ region: 'state/de' });
  });

  test('given a failed window then the error shows with a retry', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      status: 'error',
      result: null,
      error: 'The 2031 simulation failed.',
    });
    const user = userEvent.setup();
    renderCard();

    expect(await screen.findByText('The 2031 simulation failed.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(2));
  });
});
