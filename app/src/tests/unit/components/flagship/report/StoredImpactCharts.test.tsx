import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import StoredImpactCharts from '@/components/flagship/report/StoredImpactCharts';
import { NET_COST_ONLY_IMPACT } from '@/tests/fixtures/components/flagship/report/storedImpactChartsMocks';

describe('StoredImpactCharts', () => {
  test('given a stored state revenue change then the budget leads, as a gain or a loss', () => {
    render(
      <StoredImpactCharts
        impact={{ budgetary: { stateRevenueImpact: 11_482_293, netCost: 11_482_293 } }}
        state="UT"
      />
    );

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('+$11.5m');
    expect(budget).toHaveTextContent('Annual state revenue gain');
  });

  test('given a stored revenue loss then it reads as a loss with a minus sign', () => {
    render(
      <StoredImpactCharts impact={{ budgetary: { stateRevenueImpact: -282_165_820 } }} state="GA" />
    );

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('−$282.2m');
    expect(budget).toHaveTextContent('Annual state revenue loss');
  });

  test('given only a stored net cost then it stands in for the revenue change', () => {
    render(<StoredImpactCharts impact={NET_COST_ONLY_IMPACT} state="KS" />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('−$74.2m');
    expect(budget).toHaveTextContent('Annual state revenue loss');
  });

  test('given a federal bill then its stored revenue change is not called state revenue', () => {
    // As the Overview words it for HR 1425: the federal budget, not a state's.
    render(<StoredImpactCharts impact={{ budgetary: { stateRevenueImpact: -225_500_000_000 } }} />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('−$225.5bn');
    expect(budget).toHaveTextContent('Annual revenue loss');
    expect(budget).not.toHaveTextContent(/state revenue/i);
  });

  test('given no stored results then nothing shows', () => {
    const { container } = render(<StoredImpactCharts impact={{}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
