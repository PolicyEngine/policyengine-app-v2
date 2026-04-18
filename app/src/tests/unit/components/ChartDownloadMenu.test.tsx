import { createRef } from 'react';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ChartDownloadMenu } from '@/components/ChartDownloadMenu';

vi.mock('@/utils/chartUtils', () => ({
  downloadChartAsSvg: vi.fn(),
  downloadCsv: vi.fn(),
}));

vi.mock('@/utils/analytics', () => ({
  trackChartSvgDownloaded: vi.fn(),
  trackChartCsvDownloaded: vi.fn(),
}));

describe('ChartDownloadMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given no csvData then renders a single SVG download button', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <div ref={ref}>
        <ChartDownloadMenu containerRef={ref} svgFilename="chart.svg" title="Chart" />
      </div>
    );

    expect(screen.getByLabelText(/download as svg/i)).toBeInTheDocument();
    // No dropdown menu trigger should be present.
    expect(screen.queryByLabelText(/download chart/i)).not.toBeInTheDocument();
  });

  test('given csvData then clicking SVG option calls downloadChartAsSvg', async () => {
    const user = userEvent.setup();
    const { downloadChartAsSvg } = await import('@/utils/chartUtils');
    const ref = createRef<HTMLDivElement>();
    render(
      <div ref={ref}>
        <ChartDownloadMenu
          containerRef={ref}
          svgFilename="chart.svg"
          csvData={[['col'], ['value']]}
        />
      </div>
    );

    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download as svg/i }));

    expect(downloadChartAsSvg).toHaveBeenCalled();
  });

  test('given csvData then clicking CSV option calls downloadCsv with derived filename', async () => {
    const user = userEvent.setup();
    const { downloadCsv } = await import('@/utils/chartUtils');
    const csvRows = [
      ['Decile', 'Change'],
      ['1', '100'],
    ];
    const ref = createRef<HTMLDivElement>();
    render(
      <div ref={ref}>
        <ChartDownloadMenu containerRef={ref} svgFilename="winners.svg" csvData={csvRows} />
      </div>
    );

    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download data \(csv\)/i }));

    expect(downloadCsv).toHaveBeenCalledWith(csvRows, 'winners.csv');
  });

  test('given csvData as function then resolves on click', async () => {
    const user = userEvent.setup();
    const { downloadCsv } = await import('@/utils/chartUtils');
    const producer = vi.fn(() => [['a'], ['b']] as string[][]);
    const ref = createRef<HTMLDivElement>();
    render(
      <div ref={ref}>
        <ChartDownloadMenu containerRef={ref} svgFilename="x.svg" csvData={producer} />
      </div>
    );

    // Producer shouldn't run until the user actually picks CSV.
    expect(producer).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download data \(csv\)/i }));

    expect(producer).toHaveBeenCalledTimes(1);
    expect(downloadCsv).toHaveBeenLastCalledWith([['a'], ['b']], 'x.csv');
  });

  test('given analytics wired then SVG and CSV fire distinct events', async () => {
    const user = userEvent.setup();
    const { trackChartSvgDownloaded, trackChartCsvDownloaded } = await import(
      '@/utils/analytics'
    );
    const ref = createRef<HTMLDivElement>();
    render(
      <div ref={ref}>
        <ChartDownloadMenu containerRef={ref} svgFilename="x.svg" csvData={[['a']]} />
      </div>
    );

    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download as svg/i }));
    expect(trackChartSvgDownloaded).toHaveBeenCalledTimes(1);
    expect(trackChartCsvDownloaded).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download data \(csv\)/i }));
    expect(trackChartCsvDownloaded).toHaveBeenCalledTimes(1);
  });
});
