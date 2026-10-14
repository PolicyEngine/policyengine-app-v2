import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import BudgetWindowSummary from '@/components/flagship/report/BudgetWindowSummary';

const mockFetchBudgetWindow = vi.fn();

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: (...args: unknown[]) => mockFetchBudgetWindow(...args),
}));

const year = (label: string, budgetaryImpact: number) => ({
  year: label,
  taxRevenueImpact: budgetaryImpact,
  federalTaxRevenueImpact: 0,
  stateTaxRevenueImpact: budgetaryImpact,
  benefitSpendingImpact: 0,
  budgetaryImpact,
});

function renderSummary(onOpen = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BudgetWindowSummary
        countryId="us"
        reformPolicyId="98716"
        baselinePolicyId="2"
        region="state/ut"
        window={{ startYear: 2026, windowSize: 10 }}
        onOpen={onOpen}
      />
    </QueryClientProvider>
  );
  return onOpen;
}

describe('BudgetWindowSummary', () => {
  beforeEach(() => {
    mockFetchBudgetWindow.mockReset();
  });

  test('given the window is running then the overview shows its progress', async () => {
    mockFetchBudgetWindow.mockResolvedValue({ status: 'computing', result: null, progress: 40 });

    renderSummary();

    expect(await screen.findByText('Calculating · 40%')).toBeInTheDocument();
    expect(screen.getByText('Budget, 2026–2035')).toBeInTheDocument();
    expect(mockFetchBudgetWindow).toHaveBeenCalledWith('us', '98716', '2', {
      region: 'state/ut',
      startYear: 2026,
      windowSize: 10,
    });
  });

  test('given the window is done then the overview shows its total, and opens the years', async () => {
    mockFetchBudgetWindow.mockResolvedValue({
      status: 'ok',
      progress: 100,
      result: {
        kind: 'budgetWindow',
        startYear: '2026',
        endYear: '2035',
        windowSize: 10,
        annualImpacts: [year('2026', -5.418e8)],
        totals: year('Total', -5.5e9),
      },
    });
    const user = userEvent.setup();
    const onOpen = renderSummary();

    expect(await screen.findByText('−$5.5bn')).toBeInTheDocument();
    expect(screen.getByText('10-year government cost')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /see each year/i }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('given the window failed then the overview says so', async () => {
    mockFetchBudgetWindow.mockResolvedValue({ status: 'error', result: null, error: 'Failed' });

    renderSummary();

    expect(
      await screen.findByText('The budget window could not be calculated.')
    ).toBeInTheDocument();
  });
});
