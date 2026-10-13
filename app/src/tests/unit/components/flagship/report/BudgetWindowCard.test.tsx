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

function renderCard(region?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BudgetWindowCard
        countryId="us"
        reformPolicyId="123"
        baselinePolicyId="2"
        region={region}
        year="2026"
      />
    </QueryClientProvider>
  );
}

async function pick(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('BudgetWindowCard', () => {
  beforeEach(() => {
    mockFetchBudgetWindow.mockReset();
    // Radix Select scrolls its options and captures the pointer, which jsdom lacks.
    Element.prototype.scrollIntoView ??= vi.fn();
    Element.prototype.hasPointerCapture ??= vi.fn(() => false);
  });

  test('given the card then nothing runs until it is asked for', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Budget window' })).toBeInTheDocument();
    expect(screen.getByText('2026–2035')).toBeInTheDocument();
    expect(mockFetchBudgetWindow).not.toHaveBeenCalled();
  });

  test('given calculate then the run shows its progress from the API', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      status: 'computing',
      message: 'Scoring 2026, 2027 (2 of 10 complete)...',
      result: null,
      progress: 20,
    });
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Calculate 10-year budget' }));

    expect(await screen.findByText('Calculating the 2026–2035 budget')).toBeInTheDocument();
    expect(screen.getByText('Scoring 2026, 2027 (2 of 10 complete)')).toBeInTheDocument();
    expect(screen.getByText(/· 20%/)).toBeInTheDocument();
    expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '123', '2', {
      region: 'us',
      startYear: 2026,
      windowSize: 10,
    });
  });

  test('given a finished window then each year and the total read as costs', async () => {
    mockFetchBudgetWindow.mockResolvedValue(COMPLETE);
    const user = userEvent.setup();
    renderCard();
    await pick(user, 'Window length', '3 years');

    await user.click(screen.getByRole('button', { name: 'Calculate 3-year budget' }));

    const table = await screen.findByRole('table');
    expect(within(table).getByRole('rowheader', { name: '2027' })).toBeInTheDocument();
    const total = within(table).getByRole('rowheader', { name: 'Total' }).closest('tr')!;
    expect(within(total).getAllByText('−$3.9bn')).toHaveLength(2);
    // A federal reform run nationwide has no state column.
    expect(within(table).queryByText('State tax revenue')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Calculated' })).toBeDisabled();
  });

  test('given a state run then federal and state revenue read apart', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      ...COMPLETE,
      result: {
        ...COMPLETE.result!,
        annualImpacts: [year('2026', 0, -5e7)],
        totals: year('Total', 0, -5e7),
      },
    });
    const user = userEvent.setup();
    renderCard('state/de');

    await user.click(screen.getByRole('button', { name: 'Calculate 10-year budget' }));

    const table = await screen.findByRole('table');
    expect(within(table).getByText('Federal tax revenue')).toBeInTheDocument();
    expect(within(table).getByText('State tax revenue')).toBeInTheDocument();
    expect(mockFetchBudgetWindow.mock.calls[0][3]).toMatchObject({ region: 'state/de' });
  });

  test('given a new length after a run then nothing runs until the button', async () => {
    mockFetchBudgetWindow.mockResolvedValue(COMPLETE);
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole('button', { name: 'Calculate 10-year budget' }));
    await screen.findByRole('table');

    await pick(user, 'Window length', '5 years');

    expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Calculate 5-year budget' })).toBeEnabled();
  });

  test('given a failed window then the error shows with a retry', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      status: 'error',
      result: null,
      error: 'The 2031 simulation failed.',
    });
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('button', { name: 'Calculate 10-year budget' }));

    expect(await screen.findByText('The 2031 simulation failed.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(mockFetchBudgetWindow).toHaveBeenCalledTimes(2));
  });
});
