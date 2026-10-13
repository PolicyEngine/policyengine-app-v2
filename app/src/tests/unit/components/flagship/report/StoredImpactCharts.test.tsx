import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import StoredImpactCharts from '@/components/flagship/report/StoredImpactCharts';

describe('StoredImpactCharts', () => {
  test('given a stored state revenue change then the budget leads, as a gain or a loss', () => {
    render(
      <StoredImpactCharts
        impact={{ budgetary: { stateRevenueImpact: 11_482_293, netCost: 11_482_293 } }}
      />
    );

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('+$11.5m');
    expect(budget).toHaveTextContent('Annual state revenue gain');
  });

  test('given a stored revenue loss then it reads as a loss with a minus sign', () => {
    render(<StoredImpactCharts impact={{ budgetary: { stateRevenueImpact: -282_165_820 } }} />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('−$282.2m');
    expect(budget).toHaveTextContent('Annual state revenue loss');
  });

  test('given no stored results then nothing shows', () => {
    const { container } = render(<StoredImpactCharts impact={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
