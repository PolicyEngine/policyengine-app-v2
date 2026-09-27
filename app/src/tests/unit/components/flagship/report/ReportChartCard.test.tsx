import { fireEvent, render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import ReportChartCard from '@/components/flagship/report/ReportChartCard';

describe('ReportChartCard', () => {
  test('given expand is clicked then the full-detail chart shows in a bounded dialog', () => {
    render(
      <ReportChartCard
        title="Winners and losers"
        focusedContent={<div>Full chart labels</div>}
        focusedChartHeight={340}
      >
        <div>Compact chart</div>
      </ReportChartCard>
    );
    expect(screen.queryByText('Full chart labels')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Expand Winners and losers' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Full chart labels');
    expect(screen.getByText('Full chart labels').parentElement).toHaveStyle({
      height: 'min(55dvh, 340px)',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('Compact chart')).toBeInTheDocument();
  });

  test('given no full-detail chart then the dialog shows the card chart', () => {
    render(
      <ReportChartCard title="Budgetary impact" fullWidth>
        <div>Budget chart</div>
      </ReportChartCard>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand Budgetary impact' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Budget chart');
  });
});
