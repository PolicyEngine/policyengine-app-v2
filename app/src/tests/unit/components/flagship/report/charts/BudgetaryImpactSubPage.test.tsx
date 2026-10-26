import React from 'react';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BudgetaryImpactSubPage from '@/components/flagship/report/charts/BudgetaryImpactSubPage';
import { colors } from '@/designTokens';
import {
  REPORT_4332_BUDGET_LABELS,
  REPORT_4332_OUTPUT,
  withBudget,
} from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({ useCurrentCountry: vi.fn(() => 'us') }));

// jsdom has no layout, so the container hands the chart a fixed size.
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

const yTickTexts = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll('.recharts-yAxis-tick-labels .recharts-cartesian-axis-tick-value')
  ).map((tick) => tick.textContent ?? '');

const xAxisLineY = (container: HTMLElement) =>
  Number(
    container
      .querySelector('.recharts-cartesian-axis-line[orientation="bottom"]')
      ?.getAttribute('y1')
  );

describe('BudgetaryImpactSubPage (report)', () => {
  test('given report 4332 then every bar has its value label', () => {
    render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    for (const label of REPORT_4332_BUDGET_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test('given report 4332 then the axis reads in millions', () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    expect(screen.getByText('Budgetary impact ($m)')).toBeInTheDocument();
    expect(yTickTexts(container)).toEqual(['−$300m', '−$200m', '−$100m', '$0']);
  });

  test('given report 4332 then no tick sits above zero when every value is negative', () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    const ticks = yTickTexts(container);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks.every((tick) => tick === '$0' || tick.startsWith('−'))).toBe(true);
  });

  test('given report 4332 then the small bar label sits inside the plot, above the category labels', () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    const label = screen.getByText('−$34.5m');
    const axisY = xAxisLineY(container);
    expect(Number.isFinite(axisY)).toBe(true);
    // The label's baseline, with room for descenders, stays above the plot's bottom edge.
    expect(Number(label.getAttribute('y')) + 3).toBeLessThan(axisY);
    expect(label).toHaveAttribute('fill', colors.gray[700]);
  });

  test('given report 4332 then the tall bars carry their labels inside, in white', () => {
    render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    expect(screen.getByText('−$296.5m')).toHaveAttribute('fill', colors.white);
    expect(screen.getByText('−$331.0m')).toHaveAttribute('fill', colors.white);
  });

  test('given report 4332 then the bars keep the budget colors', () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    const fills = Array.from(container.querySelectorAll('.recharts-bar-rectangle path')).map(
      (bar) => bar.getAttribute('fill')
    );
    expect(fills).toContain(colors.gray[600]);
  });

  test('given a change of billions then the axis reads in billions', () => {
    const output = withBudget(REPORT_4332_OUTPUT, { federal: 5.2e9, state: -1.1e9, benefits: 2e9 });

    const { container } = render(<BudgetaryImpactSubPage output={output} fillHeight />);

    expect(screen.getByText('Budgetary impact ($bn)')).toBeInTheDocument();
    expect(yTickTexts(container)).toContain('$4bn');
    expect(screen.getByText('$2.1bn')).toBeInTheDocument();
  });

  test('given fillHeight then the chart shows the watermark without its own title', () => {
    const { container } = render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} fillHeight />);

    expect(container.querySelector('img[src*="policyengine"]')).toBeInTheDocument();
    expect(screen.queryByText(/This reform would cost/)).not.toBeInTheDocument();
  });

  test('given no fillHeight then the chart has its title and downloads', () => {
    render(<BudgetaryImpactSubPage output={REPORT_4332_OUTPUT} />);

    expect(screen.getByText('This reform would cost $331.0m')).toBeInTheDocument();
    expect(screen.getByLabelText(/download as svg/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/download csv/i)).toBeInTheDocument();
  });
});
