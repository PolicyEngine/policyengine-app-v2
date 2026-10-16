import React from 'react';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import EconomicImpactCharts from '@/components/flagship/report/EconomicImpactCharts';
import { REPORT_4332_OUTPUT } from '@/tests/fixtures/components/flagship/report/charts/reportChartMocks';

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
