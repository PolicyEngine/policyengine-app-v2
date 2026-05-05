import { fireEvent, render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ChartContainer } from '@/components/ChartContainer';
import { downloadChartAsSvg, downloadCsv } from '@/utils/chartUtils';

vi.mock('@/utils/chartUtils', async () => {
  const actual = await vi.importActual<typeof import('@/utils/chartUtils')>('@/utils/chartUtils');
  return {
    ...actual,
    downloadChartAsSvg: vi.fn(),
    downloadCsv: vi.fn(),
  };
});

vi.mock('@/utils/analytics', () => ({
  trackChartCsvDownloaded: vi.fn(),
}));

describe('ChartContainer', () => {
  test('given csv data then CSV download button downloads the provided rows', () => {
    const csvRows = [
      ['Income decile', 'Gain more than 5%'],
      ['All', '0.25'],
    ];

    render(
      <ChartContainer title="Winners and losers" csvFilename="winners-losers.csv" csvData={csvRows}>
        <div>Chart body</div>
      </ChartContainer>
    );

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }));

    expect(downloadCsv).toHaveBeenCalledWith(csvRows, 'winners-losers.csv');
  });

  test('given svg and csv downloads then both export actions are available', () => {
    render(
      <ChartContainer
        title="Winners and losers"
        downloadFilename="winners-losers.svg"
        csvFilename="winners-losers.csv"
        csvData={[['Header'], ['Value']]}
      >
        <svg width="100" height="100" />
      </ChartContainer>
    );

    fireEvent.click(screen.getByRole('button', { name: /download as svg/i }));
    fireEvent.click(screen.getByRole('button', { name: /download csv/i }));

    expect(downloadChartAsSvg).toHaveBeenCalled();
    expect(downloadCsv).toHaveBeenCalledWith([['Header'], ['Value']], 'winners-losers.csv');
  });
});
