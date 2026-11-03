import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import type { FlagshipHouseholdImpact } from '@/libs/flagship/householdRun';

const IMPACT: FlagshipHouseholdImpact = {
  netIncome: { baseline: 72000, reform: 73000, change: 1000 },
  components: [
    {
      id: 'federal_income_tax',
      label: 'Federal income tax',
      variable: 'income_tax',
      baseline: 3000,
      reform: 2000,
      change: -1000,
      effect: 1000,
    },
    {
      id: 'payroll_tax',
      label: 'Payroll tax',
      baseline: 500,
      reform: 600,
      change: 100,
      effect: -100,
    },
  ],
  programs: [],
};

const DESCRIPTIONS: Record<string, string> = {
  income_tax: 'Total federal individual income tax liability.',
  household_net_income: 'Market income plus benefits, less taxes.',
};

describe('HouseholdImpactResult variable tips', () => {
  test('given result lines then each tip says per year, then the variable described', async () => {
    const user = userEvent.setup();
    render(
      <HouseholdImpactResult
        impact={IMPACT}
        summary="Single · no children"
        describe={(variable) => DESCRIPTIONS[variable]}
      />
    );
    const parts = screen.getByRole('table', { name: 'Taxes and benefits' });

    await user.click(
      within(within(parts).getByRole('row', { name: /Federal income tax/ })).getByRole('button', {
        name: 'About Federal income tax',
      })
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent(`Per year${DESCRIPTIONS.income_tax}`);
    expect(
      within(within(parts).getByRole('row', { name: /Net income/ })).getByRole('button', {
        name: 'About Net income',
      })
    ).toBeInTheDocument();
    // Payroll tax sums two variables, so no one description explains it: its tip has the period only.
    await user.click(
      within(within(parts).getByRole('row', { name: /Payroll tax/ })).getByRole('button', {
        name: 'About Payroll tax',
      })
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^Per year$/);
    // "What changes" names the same lines, with the same tips.
    expect(screen.getAllByRole('button', { name: 'About Federal income tax' })).toHaveLength(2);
  });

  test('given no descriptions then each line still says per year', async () => {
    const user = userEvent.setup();
    render(<HouseholdImpactResult impact={IMPACT} summary="Single · no children" />);
    const parts = screen.getByRole('table', { name: 'Taxes and benefits' });

    await user.click(within(parts).getByRole('button', { name: 'About Federal income tax' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent(/^Per year$/);
  });
});
