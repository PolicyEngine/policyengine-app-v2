import { render, screen, userEvent, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import AllYearsView from '@/components/flagship/report/AllYearsView';

const budgetWindow = vi.hoisted(() => ({ perYear: -600e6 }));

vi.mock('@/hooks/useBudgetWindow', () => ({
  useBudgetWindow: () => ({
    data: {
      status: 'ok',
      result: {
        annualImpacts: [
          { year: 2026, budgetaryImpact: budgetWindow.perYear },
          { year: 2027, budgetaryImpact: budgetWindow.perYear },
          { year: 2028, budgetaryImpact: budgetWindow.perYear },
        ],
        totals: { year: 'Total', budgetaryImpact: budgetWindow.perYear * 3 },
      },
    },
  }),
}));

const OUTPUT_2026 = {
  intra_decile: {
    all: {
      'Gain more than 5%': 0.1,
      'Gain less than 5%': 0.041,
      'Lose more than 5%': 0,
      'Lose less than 5%': 0,
    },
  },
  poverty: {
    poverty: { all: { baseline: 0.1, reform: 0.099 }, child: { baseline: 0.12, reform: 0.105 } },
  },
  inequality: { gini: { baseline: 0.4, reform: 0.399 } },
} as unknown as SocietyWideReportOutput;

describe('AllYearsView', () => {
  test('given a window then the budget totals, and each year shows its own rates', async () => {
    const user = userEvent.setup();
    const onCalculateAll = vi.fn();
    render(
      <AllYearsView
        countryId="us"
        reformPolicyId="1"
        baselinePolicyId="2"
        years={['2026', '2027', '2028']}
        outputs={{ '2026': OUTPUT_2026, '2027': null, '2028': null }}
        statusByYear={{ '2026': 'done', '2027': 'computing', '2028': 'not-run' }}
        onCalculateAll={onCalculateAll}
      />
    );

    const table = screen.getByRole('table');
    const budget = within(table).getByRole('row', { name: /budgetary impact/i });
    expect(budget).toHaveTextContent('−$600.0m');
    expect(budget).toHaveTextContent('−$1.8bn');
    const gaining = within(table).getByRole('row', { name: /people gaining income/i });
    expect(gaining).toHaveTextContent('14.1%');
    expect(gaining).toHaveTextContent('Calculating…');

    await user.click(screen.getByRole('button', { name: 'Calculate 2028' }));
    expect(onCalculateAll).toHaveBeenCalled();
  });

  test('given a UK window with no budget change then it reads £0', () => {
    budgetWindow.perYear = 0;
    render(
      <AllYearsView
        countryId="uk"
        reformPolicyId="1"
        baselinePolicyId="2"
        years={['2026', '2027', '2028']}
        outputs={{ '2026': OUTPUT_2026, '2027': null, '2028': null }}
        statusByYear={{ '2026': 'done', '2027': 'computing', '2028': 'not-run' }}
        onCalculateAll={vi.fn()}
      />
    );

    const budget = within(screen.getByRole('table')).getByRole('row', {
      name: /budgetary impact/i,
    });
    expect(budget).toHaveTextContent('£0');
    expect(budget).not.toHaveTextContent('$');
    budgetWindow.perYear = -600e6;
  });
});
