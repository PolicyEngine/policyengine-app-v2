import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import BudgetaryImpactByLevelSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactByLevelSubPage';

// Mock Recharts to avoid rendering SVG in tests
vi.mock('recharts', () => ({
  Bar: vi.fn(() => null),
  BarChart: vi.fn(({ children }) => children),
  CartesianGrid: vi.fn(() => null),
  Cell: vi.fn(() => null),
  Label: vi.fn(() => null),
  ReferenceLine: vi.fn(() => null),
  ResponsiveContainer: vi.fn(({ children }) => children),
  Tooltip: vi.fn(() => null),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
}));

let mockCountry = 'us';
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => mockCountry,
}));

vi.mock('@/utils/chartUtils', () => ({
  DEFAULT_CHART_CONFIG: { displayModeBar: false },
  downloadChartAsSvg: vi.fn(),
  downloadCsv: vi.fn(),
  getChartLogoImage: vi.fn(() => ({})),
  getClampedChartHeight: vi.fn(() => 500),
  getNiceTicks: vi.fn(() => [0, 5, 10]),
  getYAxisLayout: vi.fn(() => ({ yAxisWidth: 60, marginLeft: 10, labelDx: -20 })),
  RECHARTS_FONT_STYLE: { fontFamily: 'Inter', fontSize: 12 },
  RECHARTS_WATERMARK: { src: '/test.png', width: 80, opacity: 0.8 },
}));

const makeOutput = (
  federal: number | undefined,
  state: number | undefined,
  total: number
): SocietyWideReportOutput =>
  ({
    budget: {
      budgetary_impact: total,
      federal_budgetary_impact: federal,
      state_budgetary_impact: state,
      tax_revenue_impact: 0,
      state_tax_revenue_impact: 0,
      benefit_spending_impact: 0,
    },
  }) as SocietyWideReportOutput;

describe('BudgetaryImpactByLevelSubPage', () => {
  test('given US output with federal and state impact then renders chart title with split', () => {
    mockCountry = 'us';
    render(<BudgetaryImpactByLevelSubPage output={makeOutput(90e9, 10e9, 100e9)} />);
    expect(screen.getByText(/federal and state/i)).toBeInTheDocument();
  });

  test('given missing federal/state keys then shows fallback message', () => {
    mockCountry = 'us';
    render(<BudgetaryImpactByLevelSubPage output={makeOutput(undefined, undefined, 0)} />);
    expect(
      screen.getByText(/Federal vs\. state budgetary impact is available/i)
    ).toBeInTheDocument();
  });

  test('given non-US country then shows fallback message', () => {
    mockCountry = 'uk';
    render(<BudgetaryImpactByLevelSubPage output={makeOutput(50e9, 5e9, 55e9)} />);
    expect(
      screen.getByText(/Federal vs\. state budgetary impact is available/i)
    ).toBeInTheDocument();
  });
});
