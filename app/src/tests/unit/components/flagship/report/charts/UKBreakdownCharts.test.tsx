import React from 'react';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BudgetaryImpactByProgramSubPage, {
  getChangedPrograms,
  getOtherProgramsAmount,
} from '@/components/flagship/report/charts/BudgetaryImpactByProgramSubPage';
import DistributionalImpactIncomeAverageSubPage from '@/components/flagship/report/charts/DistributionalImpactIncomeAverageSubPage';
import WinnersLosersIncomeDecileSubPage from '@/components/flagship/report/charts/WinnersLosersIncomeDecileSubPage';
import {
  EMPLOYER_NI_TOTAL,
  REPORT_4332_OUTPUT,
  UC_FREEZE_TOTAL,
  withBudget,
  withEmployerNIBudget,
  withFlaggedUCFreezeBudget,
  withUCFreezeBudget,
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

  test('given benefit spending changes then they become budget changes that add up to the total', () => {
    // A Wales report's shape: income tax falls and Universal Credit spending rises.
    const output = {
      ...UK_OUTPUT,
      budget: { ...UK_OUTPUT.budget, budgetary_impact: -21.57e9 },
      detailed_budget: {
        income_tax: { baseline: 300e9, reform: 280e9, difference: -20e9 },
        universal_credit: { baseline: 70e9, reform: 71.57e9, difference: 1.57e9 },
      },
    } as typeof UK_OUTPUT;

    const programs = getChangedPrograms(output, {});

    expect(programs.map((program) => program.value)).toEqual([-20e9, -1.57e9]);
    expect(programs.reduce((sum, program) => sum + program.value, 0)).toBeCloseTo(-21.57e9);
  });
});

describe('getChangedPrograms with is_tax flags', () => {
  test('given flagged rows then a benefit no list names is signed as spending', () => {
    // Given: report 4738 with a Scottish Child Payment row flagged as a benefit.
    const output = withFlaggedUCFreezeBudget(REPORT_4332_OUTPUT);

    // When
    const programs = getChangedPrograms(output, {});

    // Then: both benefits fell, so both save money, and they add up to the total.
    expect(programs).toEqual([
      { key: 'universal_credit', label: 'universal_credit', value: 933.5e6 },
      { key: 'scottish_child_payment', label: 'scottish_child_payment', value: 25e6 },
    ]);
    expect(getOtherProgramsAmount(UC_FREEZE_TOTAL, programs)).toBe(0);
  });

  test('given a row flagged as a tax then its change is signed as revenue', () => {
    const output = {
      ...withBudget(UK_OUTPUT, { federal: 40e6, state: 0 }),
      detailed_budget: {
        capital_gains_tax: { baseline: 15e9, reform: 15.04e9, difference: 40e6, is_tax: true },
      },
    } as typeof UK_OUTPUT;

    expect(getChangedPrograms(output, {})).toEqual([
      { key: 'capital_gains_tax', label: 'capital_gains_tax', value: 40e6 },
    ]);
  });
});

describe('getChangedPrograms with the tax credits row', () => {
  test('given tax credits with their own rows then the combined row is dropped', () => {
    // Given: tax_credits is Working Tax Credit and Child Tax Credit together.
    const output = {
      ...withBudget(UK_OUTPUT, { federal: 0, state: 0, benefits: -300e6 }),
      detailed_budget: {
        working_tax_credit: { baseline: 1e9, reform: 0.9e9, difference: -100e6 },
        child_tax_credit: { baseline: 2e9, reform: 1.8e9, difference: -200e6 },
        tax_credits: { baseline: 3e9, reform: 2.7e9, difference: -300e6 },
      },
    } as typeof UK_OUTPUT;

    // When
    const programs = getChangedPrograms(output, {});

    // Then: the two rows add up to the total with nothing counted twice.
    expect(programs.map((program) => program.key)).toEqual([
      'working_tax_credit',
      'child_tax_credit',
    ]);
    expect(getOtherProgramsAmount(300e6, programs)).toBe(0);
  });

  test('given only the combined tax credits row then it counts towards the total', () => {
    const output = {
      ...withBudget(UK_OUTPUT, { federal: 0, state: 0, benefits: -300e6 }),
      detailed_budget: { tax_credits: { baseline: 3e9, reform: 2.7e9, difference: -300e6 } },
    } as typeof UK_OUTPUT;

    const programs = getChangedPrograms(output, {});

    expect(programs).toEqual([{ key: 'tax_credits', label: 'tax_credits', value: 300e6 }]);
    expect(getOtherProgramsAmount(300e6, programs)).toBe(0);
  });
});

describe('getOtherProgramsAmount', () => {
  test('given programs that add up to the total then there is nothing else', () => {
    expect(getOtherProgramsAmount(1.5e9, [{ value: 2e9 }, { value: -0.5e9 }])).toBe(0);
  });

  test('given a total that the programs fall short of then returns the difference', () => {
    // Report 4738: £25.0m of Scottish Child Payment has no row of its own.
    expect(getOtherProgramsAmount(UC_FREEZE_TOTAL, [{ value: 933.5e6 }])).toBeCloseTo(25e6);
  });

  test('given a difference within rounding then there is nothing else', () => {
    expect(getOtherProgramsAmount(958.5e6, [{ value: 958.4e6 }])).toBe(0);
  });

  test('given a total that no listed program explains then returns all of it', () => {
    expect(getOtherProgramsAmount(17e6, [])).toBe(17e6);
  });

  test('given a row the total leaves out then it does not count towards the total', () => {
    // Given: the employer NI threshold rise, whose £15.5bn of employer NI the total leaves out.
    const programs = getChangedPrograms(withEmployerNIBudget(REPORT_4332_OUTPUT), {});

    // When
    const other = getOtherProgramsAmount(EMPLOYER_NI_TOTAL, programs);

    // Then: the other rows add up to the total, so there is nothing else.
    expect(other).toBe(0);
  });
});

describe('BudgetaryImpactByProgramSubPage', () => {
  test('given a total the programmes fall short of then an other programmes bar makes up the gap', () => {
    // Given
    const output = withUCFreezeBudget(REPORT_4332_OUTPUT);

    // When
    render(<BudgetaryImpactByProgramSubPage output={output} fillHeight />, 'uk');

    // Then
    expect(screen.getByText('Other programmes')).toBeInTheDocument();
    expect(screen.getByText('£25.0m')).toBeInTheDocument();
    expect(screen.getByText('£958.5m')).toBeInTheDocument();
  });

  test('given flagged rows for every programme then no other programmes bar is needed', () => {
    render(
      <BudgetaryImpactByProgramSubPage
        output={withFlaggedUCFreezeBudget(REPORT_4332_OUTPUT)}
        fillHeight
      />,
      'uk'
    );

    expect(screen.queryByText('Other programmes')).not.toBeInTheDocument();
    expect(screen.getByText('£25.0m')).toBeInTheDocument();
  });

  test('given a row the total leaves out then no other programmes bar offsets it', () => {
    // Given
    const output = withEmployerNIBudget(REPORT_4332_OUTPUT);

    // When
    const { container } = render(
      <BudgetaryImpactByProgramSubPage output={output} fillHeight />,
      'uk'
    );

    // Then: the bars before the total add up to it, and employer NI stands after it.
    expect(screen.queryByText('Other programmes')).not.toBeInTheDocument();
    expect(screen.getByText('£5.3bn')).toBeInTheDocument();
    // The axis label wraps over two lines.
    expect(container).toHaveTextContent(/Total.*Employer NI \(not\s*in total\)/);
    expect(screen.getByText('−£15.5bn')).toBeInTheDocument();
  });

  test('given programmes that add up to the total then there is no other programmes bar', () => {
    render(<BudgetaryImpactByProgramSubPage output={UK_OUTPUT} fillHeight />, 'uk');

    expect(screen.queryByText('Other programmes')).not.toBeInTheDocument();
  });

  test('given a total with no listed programme changing then the whole total is other programmes', () => {
    // Given: a PIP cut, which no listed programme covers.
    const output = {
      ...withBudget(UK_OUTPUT, { federal: 0, state: 0, benefits: -17e6 }),
      detailed_budget: { universal_credit: { baseline: 1, reform: 1, difference: 0 } },
    } as typeof UK_OUTPUT;

    // When
    render(<BudgetaryImpactByProgramSubPage output={output} fillHeight />, 'uk');

    // Then
    expect(screen.getByText('Other programmes')).toBeInTheDocument();
    expect(
      screen.queryByText('This reform has no impact on individual programmes.')
    ).not.toBeInTheDocument();
  });

  test('given no detailed budget then says it is not available', () => {
    render(<BudgetaryImpactByProgramSubPage output={REPORT_4332_OUTPUT} fillHeight />, 'uk');

    expect(
      screen.getByText('Detailed budgetary impact by programme is not available for this report.')
    ).toBeInTheDocument();
  });

  test('given a budget where no program changes then says so', () => {
    const output = {
      ...withBudget(UK_OUTPUT, { federal: 0, state: 0 }),
      detailed_budget: { income_tax: { baseline: 1, reform: 1, difference: 0 } },
    } as typeof UK_OUTPUT;

    render(<BudgetaryImpactByProgramSubPage output={output} fillHeight />, 'uk');

    expect(
      screen.getByText('This reform has no impact on individual programmes.')
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
