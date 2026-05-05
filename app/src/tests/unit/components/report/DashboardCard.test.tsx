import React from 'react';
import { act, fireEvent, render, screen } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import DashboardCard from '@/components/report/DashboardCard';
import { trackChartCsvDownloaded, trackChartSvgDownload } from '@/utils/analytics';
import { downloadChartAsSvg, downloadCsv } from '@/utils/chartUtils';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onAnimationComplete,
      initial,
      animate,
      transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      onAnimationComplete?: () => void;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
    }) => {
      React.useEffect(() => {
        onAnimationComplete?.();
      });

      return <div {...props}>{children}</div>;
    },
  },
}));

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
  trackChartSvgDownload: vi.fn(),
}));

describe('DashboardCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test('given expanded downloads then toolbar buttons download CSV and SVG with analytics', async () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Net impact', 1],
    ];

    render(
      <DashboardCard
        mode="expanded"
        zIndex={1}
        expandDirection="down-right"
        shrunkenHeader={<span>Budget</span>}
        expandedTitle="Budgetary impact"
        expandedContent={<svg width="100" height="100" />}
        downloadFilename="budgetary-impact.svg"
        csvFilename="budgetary-impact.csv"
        csvData={csvData}
      />
    );

    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.click(screen.getByRole('button', { name: /download csv/i }));
    fireEvent.click(screen.getByRole('button', { name: /download as svg/i }));

    expect(downloadCsv).toHaveBeenCalledWith(csvData, 'budgetary-impact.csv');
    expect(trackChartCsvDownloaded).toHaveBeenCalled();
    expect(downloadChartAsSvg).toHaveBeenCalledWith(expect.any(HTMLDivElement), {
      title: 'Budgetary impact',
      filename: 'budgetary-impact.svg',
    });
    expect(trackChartSvgDownload).toHaveBeenCalled();
  });
});
