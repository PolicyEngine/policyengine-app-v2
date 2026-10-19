import React from 'react';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BudgetaryImpactByProgramSubPage, {
  getChangedPrograms,
} from '@/components/flagship/report/charts/BudgetaryImpactByProgramSubPage';
import DistributionalImpactIncomeAverageSubPage from '@/components/flagship/report/charts/DistributionalImpactIncomeAverageSubPage';
import WinnersLosersIncomeDecileSubPage from '@/components/flagship/report/charts/WinnersLosersIncomeDecileSubPage';
import {
  REPORT_4332_OUTPUT,
  withUKBreakdowns,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'uk') }));

// jsdom has no layout, so the container hands each chart a fixed size.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 700, height: 260 }}>
        {React.cloneElement(children, { width: 700, height: 260 } as any)}
      </div>
    ),
  };
});

const UK_OUTPUT = withUKBreakdowns(REPORT_4332_OUTPUT);

describe('getChangedPrograms', () => {
  test('given a detailed budget then lists only the programs that change, by label', () => {
    const programs = getChangedPrograms(UK_OUTPUT, { income_tax: { label: 'Income Tax' } });

    expect(programs).toEqual([
      { key: 'income_tax', label: 'Income Tax', value: 2e9 },
      { key: 'universal_credit', label: 'universal_credit', value: -0.5e9 },
    ]);
  });
});

describe('BudgetaryImpactByProgramSubPage', () => {
  test('given no detailed budget then says it is not available', () => {
    render(<BudgetaryImpactByProgramSubPage output={REPORT_4332_OUTPUT} fillHeight />, 'uk');

    expect(
      screen.getByText('Detailed budgetary impact by program is not available for this report.')
    ).toBeInTheDocument();
  });

  test('given a budget where no program changes then says so', () => {
    const output = {
      ...UK_OUTPUT,
      detailed_budget: { income_tax: { baseline: 1, reform: 1, difference: 0 } },
    } as typeof UK_OUTPUT;

    render(<BudgetaryImpactByProgramSubPage output={output} fillHeight />, 'uk');

    expect(
      screen.getByText('This reform has no impact on individual programs.')
    ).toBeInTheDocument();
  });
});

describe('wealth decile charts', () => {
  test('given the wealth breakdown then the decile chart reads wealth deciles', () => {
    const { container } = render(
      <DistributionalImpactIncomeAverageSubPage output={UK_OUTPUT} breakdown="wealth" fillHeight />,
      'uk'
    );

    expect(container).toHaveTextContent('Wealth decile');
    expect(container).toHaveTextContent('Wealth deciles contain an equal number of people');
  });

  test('given the wealth breakdown then winners and losers reads wealth deciles', () => {
    const { container } = render(
      <WinnersLosersIncomeDecileSubPage output={UK_OUTPUT} breakdown="wealth" fillHeight />,
      'uk'
    );

    expect(container).toHaveTextContent('Wealth decile');
    expect(container).toHaveTextContent('grouped by wealth decile');
  });

  test('given a result without wealth deciles then winners and losers still draws', () => {
    const output = { ...UK_OUTPUT, intra_wealth_decile: null } as unknown as typeof UK_OUTPUT;

    const { container } = render(
      <WinnersLosersIncomeDecileSubPage output={output} breakdown="wealth" fillHeight />,
      'uk'
    );

    expect(container).toHaveTextContent('Wealth decile');
  });
});
