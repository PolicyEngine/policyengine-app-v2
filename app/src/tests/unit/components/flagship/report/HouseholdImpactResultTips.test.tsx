import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import type { HouseholdBreakdownSource } from '@/components/flagship/report/household/HouseholdBreakdowns';
import HouseholdImpactResult from '@/components/flagship/report/household/HouseholdImpactResult';
import type { FlagshipHouseholdImpact } from '@/libs/flagship/householdRun';
import {
  BASELINE_POLICY_ID,
  BASELINE_RESULT,
  CREATED_HOUSEHOLD_ID,
  HOUSEHOLD_YEAR,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';

// The v2 breakdowns, tested on their own: a stand-in names the view open.
vi.mock('@/components/flagship/report/household/HouseholdBreakdowns', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/flagship/report/household/HouseholdBreakdowns')
  >()),
  default: ({ view }: { view: string }) => <div aria-label="Breakdown">{view}</div>,
}));

const BREAKDOWNS: HouseholdBreakdownSource = {
  countryId: 'uk',
  year: HOUSEHOLD_YEAR,
  householdId: String(CREATED_HOUSEHOLD_ID),
  baselinePolicyId: BASELINE_POLICY_ID,
  reformPolicyId: REFORM_POLICY_ID,
  baseline: BASELINE_RESULT,
  reform: REFORM_RESULT,
  gains: true,
};

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

const programme = (variable: string, label: string, effect: number, change = effect) => ({
  variable,
  label,
  change,
  effect,
});

/** The "What changes" card. */
const whatChanges = () => screen.getByText('What changes').parentElement!;

describe('HouseholdImpactResult what changes', () => {
  test('given one programme then it is named alone, with its tip and no total', async () => {
    const user = userEvent.setup();
    render(
      <HouseholdImpactResult
        impact={IMPACT}
        summary="Single · no children"
        countryId="uk"
        programmes={[programme('ebr_council_tax_rebate', 'Council Tax Rebate (EBR)', 100)]}
        describe={() => 'A one-off rebate.'}
      />
    );

    expect(whatChanges()).toHaveTextContent(/^What changesCouncil Tax Rebate \(EBR\)\+£100$/);
    await user.click(
      within(whatChanges()).getByRole('button', { name: 'About Council Tax Rebate (EBR)' })
    );
    expect(screen.getByRole('tooltip')).toHaveTextContent('Per yearA one-off rebate.');
  });

  test('given a tax and a benefit then each is signed by net income, then the total', () => {
    render(
      <HouseholdImpactResult
        impact={IMPACT}
        summary="Single · no children"
        countryId="uk"
        programmes={[
          programme('universal_credit', 'Universal Credit', 1040),
          programme('income_tax', 'Income Tax', -40, 40),
        ]}
      />
    );

    expect(whatChanges()).toHaveTextContent(
      'Universal Credit+£1,040Income Tax−£40Net income+£1,000'
    );
  });

  test('given more than 4 programmes then 4 show, and the rest open the Net income view', async () => {
    const user = userEvent.setup();
    render(
      <HouseholdImpactResult
        impact={IMPACT}
        summary="Single · no children"
        countryId="uk"
        programmes={[500, 300, 200, 100, 50, 25].map((amount) =>
          programme(`p${amount}`, `Programme ${amount}`, amount)
        )}
        breakdowns={BREAKDOWNS}
      />
    );

    expect(within(whatChanges()).queryByText('Programme 50')).not.toBeInTheDocument();
    expect(within(whatChanges()).getByText('Programme 100')).toBeInTheDocument();
    await user.click(within(whatChanges()).getByRole('button', { name: 'and 2 more' }));

    expect(screen.getByRole('tab', { name: 'Net income' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });
});

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
