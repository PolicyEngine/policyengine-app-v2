import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { WinnersLosersTooltip } from '@/components/flagship/report/charts/WinnersLosersIncomeDecileSubPage';

const PAYLOAD = [{ dataKey: 'Gain less than 5%', value: 0.141, fill: '#319795' }];

describe('WinnersLosersTooltip', () => {
  test('given the All row then it names everyone the shares count: people', () => {
    render(<WinnersLosersTooltip active payload={PAYLOAD} label="All" />);

    expect(screen.getByText('All people')).toBeInTheDocument();
    expect(screen.queryByText('All households')).not.toBeInTheDocument();
  });

  test('given a decile row then it names the decile', () => {
    render(<WinnersLosersTooltip active payload={PAYLOAD} label="3" />);

    expect(screen.getByText('Decile 3')).toBeInTheDocument();
  });
});
