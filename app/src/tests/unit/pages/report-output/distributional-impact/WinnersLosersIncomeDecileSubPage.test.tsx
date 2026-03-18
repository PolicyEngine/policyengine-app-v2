import { render } from '@test-utils';
import { Tooltip, YAxis } from 'recharts';
import { describe, expect, test, vi } from 'vitest';
import WinnersLosersIncomeDecileSubPage from '@/pages/report-output/distributional-impact/WinnersLosersIncomeDecileSubPage';
import { MOCK_WINNERS_LOSERS_OUTPUT } from '@/tests/fixtures/pages/report-output/distributional-impact/WinnersLosersDecileMocks';

// Mock Recharts — capture props via vi.fn()
vi.mock('recharts', () => ({
  Bar: vi.fn(() => null),
  BarChart: vi.fn(({ children }) => children),
  Label: vi.fn(() => null),
  Legend: vi.fn(() => null),
  ResponsiveContainer: vi.fn(({ children }) => children),
  Tooltip: vi.fn(() => null),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

vi.mock('@/utils/chartUtils', () => ({
  DEFAULT_CHART_CONFIG: { displayModeBar: false },
  downloadCsv: vi.fn(),
  getChartLogoImage: vi.fn(() => ({})),
  getClampedChartHeight: vi.fn(() => 500),
  RECHARTS_FONT_STYLE: { fontFamily: 'Inter', fontSize: 12 },
  RECHARTS_WATERMARK: { src: '/test.png', width: 80, opacity: 0.8 },
}));

describe('WinnersLosersIncomeDecileSubPage', () => {
  test('given decile chart then YAxis uses interval={0} to show all labels', () => {
    // When
    render(<WinnersLosersIncomeDecileSubPage output={MOCK_WINNERS_LOSERS_OUTPUT} />);

    // Then — find the YAxis call for the decile chart (has "Income decile" label child)
    const yAxisCalls = vi.mocked(YAxis).mock.calls;
    const decileYAxis = yAxisCalls.find((call) => {
      const props = call[0] as Record<string, unknown>;
      return props.interval === 0;
    });
    expect(decileYAxis).toBeDefined();
  });

  test('given chart then Tooltip has z-index to prevent bars covering it', () => {
    // When
    render(<WinnersLosersIncomeDecileSubPage output={MOCK_WINNERS_LOSERS_OUTPUT} />);

    // Then — all Tooltip calls should have wrapperStyle with zIndex
    const tooltipCalls = vi.mocked(Tooltip).mock.calls;
    expect(tooltipCalls.length).toBeGreaterThan(0);
    tooltipCalls.forEach((call) => {
      const props = call[0] as Record<string, unknown>;
      const wrapperStyle = props.wrapperStyle as Record<string, unknown> | undefined;
      expect(wrapperStyle).toBeDefined();
      expect(wrapperStyle?.zIndex).toBe(1000);
    });
  });
});
