import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import StoredImpactCharts from '@/components/flagship/report/StoredImpactCharts';
import {
  FEDERAL_REVENUE_LOSS_BILL,
  NET_COST_ONLY_BILL,
  STATE_REVENUE_GAIN_BILL,
  STATE_REVENUE_LOSS_BILL,
} from '@/tests/fixtures/components/flagship/report/storedImpactChartsMocks';

describe('StoredImpactCharts', () => {
  test('given a stored state revenue change then the budget leads, as a gain or a loss', () => {
    render(<StoredImpactCharts bill={STATE_REVENUE_GAIN_BILL} />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('$11.5mAnnual state revenue gain');
  });

  test('given a stored revenue loss then the word says loss and the amount has no sign', () => {
    render(<StoredImpactCharts bill={STATE_REVENUE_LOSS_BILL} />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('$282.2mAnnual state revenue loss');
    expect(budget).not.toHaveTextContent('−');
  });

  test('given a federal bill then its revenue is not called state revenue', () => {
    render(<StoredImpactCharts bill={FEDERAL_REVENUE_LOSS_BILL} />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('$225.5bnAnnual revenue loss');
    expect(budget).not.toHaveTextContent(/state revenue/);
  });

  test('given only a stored net cost then it stands in for the revenue change', () => {
    render(<StoredImpactCharts bill={NET_COST_ONLY_BILL} />);

    const budget = screen.getByRole('region', { name: 'Budgetary impact' });
    expect(budget).toHaveTextContent('$74.2mAnnual state revenue loss');
  });

  test('given no stored results then nothing shows', () => {
    const { container } = render(<StoredImpactCharts bill={{ state: 'UT', impactData: {} }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
