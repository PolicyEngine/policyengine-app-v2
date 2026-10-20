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

  test('given a card in the grid then it fills its grid cell as a column', () => {
    render(
      <ReportChartCard title="Winners and losers">
        <div>Compact chart</div>
      </ReportChartCard>
    );
    const card = screen.getByText('Compact chart').closest('section')!;
    expect(card.style.display).toBe('flex');
    expect(card.style.flexDirection).toBe('column');
  });

  test('given a half-width card then its chart area grows from the clamped minimum height', () => {
    render(
      <ReportChartCard title="Winners and losers">
        <div>Compact chart</div>
      </ReportChartCard>
    );
    const chartBox = screen.getByText('Compact chart').parentElement!;
    const chartArea = chartBox.parentElement!;
    // The chart is kept out of the row's height, so it can't hold the row tall.
    expect(chartBox.style.position).toBe('absolute');
    expect(chartBox.style.top).toBe('0px');
    expect(chartBox.style.bottom).toBe('0px');
    expect(chartArea.style.position).toBe('relative');
    expect(chartArea.style.flexGrow).toBe('1');
    expect(chartArea.style.minHeight).toBe('clamp(210px, calc((100vh - 620px) / 2), 280px)');
    expect(chartArea.style.height).toBe('');
  });

  test('given a full-width card then its chart area grows from 280px', () => {
    render(
      <ReportChartCard title="Budgetary impact" fullWidth>
        <div>Budget chart</div>
      </ReportChartCard>
    );
    const chartArea = screen.getByText('Budget chart').parentElement!.parentElement!;
    expect(chartArea.style.flexGrow).toBe('1');
    expect(chartArea.style.minHeight).toBe('280px');
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
