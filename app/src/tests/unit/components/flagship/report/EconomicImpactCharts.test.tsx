import React from 'react';
import { render, screen, userEvent, within } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import EconomicImpactCharts from '@/components/flagship/report/EconomicImpactCharts';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import {
  REPORT_4332_OUTPUT,
  withUKBreakdowns,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));

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

describe('EconomicImpactCharts', () => {
  test('given report 4332 then the budget card reads in millions with a label on every bar', () => {
    render(<EconomicImpactCharts output={REPORT_4332_OUTPUT} />);

    const budget = screen
      .getByRole('button', { name: 'Expand Budgetary impact' })
      .closest('section');
    expect(budget).toHaveTextContent('Budgetary impact ($m)');
    expect(budget).not.toHaveTextContent('(bn)');
    for (const label of ['−$296.5m', '−$34.5m', '−$331.0m']) {
      expect(budget).toHaveTextContent(label);
    }
  });
});

describe('EconomicImpactCharts for the UK', () => {
  const UK_CARDS = [
    'Budgetary impact by program',
    'Income change by wealth decile',
    'Winners and losers by wealth decile',
  ];
  const card = (title: string) =>
    screen.getByRole('button', { name: `Expand ${title}` }).closest('section');

  afterEach(() => {
    vi.mocked(useCurrentCountry).mockReturnValue('us');
  });

  test('given a US report then it has no UK-only cards', () => {
    render(<EconomicImpactCharts output={REPORT_4332_OUTPUT} />);

    for (const title of UK_CARDS) {
      expect(screen.queryByRole('button', { name: `Expand ${title}` })).not.toBeInTheDocument();
    }
  });

  test('given a UK report then it adds the budget by program and the wealth decile cards', () => {
    vi.mocked(useCurrentCountry).mockReturnValue('uk');

    render(<EconomicImpactCharts output={withUKBreakdowns(REPORT_4332_OUTPUT)} />);

    for (const title of UK_CARDS) {
      expect(card(title)).toBeInTheDocument();
    }
  });

  test('given a UK report then the program card has a bar for each changed program and the total', () => {
    vi.mocked(useCurrentCountry).mockReturnValue('uk');

    render(<EconomicImpactCharts output={withUKBreakdowns(REPORT_4332_OUTPUT)} />);

    const programs = card('Budgetary impact by program');
    expect(programs).toHaveTextContent('Budgetary impact (£bn)');
    for (const label of ['£2.0bn', '−£500.0m', '£1.5bn']) {
      expect(programs).toHaveTextContent(label);
    }
  });

  test('given a UK report then the wealth decile card reads by wealth decile, absolute then relative', async () => {
    vi.mocked(useCurrentCountry).mockReturnValue('uk');
    const user = userEvent.setup();

    render(<EconomicImpactCharts output={withUKBreakdowns(REPORT_4332_OUTPUT)} />);

    const wealth = card('Income change by wealth decile')!;
    expect(wealth).toHaveTextContent('Wealth decile');
    expect(wealth).toHaveTextContent('£1,054');

    await user.click(within(wealth).getByRole('tab', { name: 'Relative' }));

    expect(card('Income change by wealth decile')).toHaveTextContent('+1.6%');
  });
});
