import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BudgetaryImpactSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import {
  MOCK_LARGE_IMPACT,
  MOCK_NEGATIVE_IMPACT,
  MOCK_POSITIVE_IMPACT,
  MOCK_SMALL_IMPACT,
  MOCK_TRILLION_IMPACT,
  MOCK_ZERO_IMPACT,
} from '@/tests/fixtures/pages/report-output/budgetary-impact/BudgetaryImpactSubPageMocks';

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

// Mock hooks
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Mock chart utils
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

describe('BudgetaryImpactSubPage', () => {
  test('given positive budgetary impact then displays raise message', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // Then
    expect(screen.getByText(/This reform would raise \$5\.0bn/i)).toBeInTheDocument();
  });

  test('given negative budgetary impact then displays cost message', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_NEGATIVE_IMPACT} />);

    // Then
    expect(screen.getByText(/This reform would cost \$5\.0bn/i)).toBeInTheDocument();
  });

  test('given zero budgetary impact then displays no effect message', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_ZERO_IMPACT} />);

    // Then
    expect(screen.getByText(/This reform would have no effect on the budget/i)).toBeInTheDocument();
  });

  test('given output then renders download chart button', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // Then — the button now opens a menu with SVG + CSV options when csvData is provided
    expect(screen.getByLabelText(/download chart/i)).toBeInTheDocument();
  });

  test('given user picks SVG from download menu then calls downloadChartAsSvg', async () => {
    // Given
    const user = userEvent.setup();
    const { downloadChartAsSvg } = await import('@/utils/chartUtils');
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // When — open the menu, then click the SVG option
    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download as svg/i }));

    // Then
    expect(downloadChartAsSvg).toHaveBeenCalled();
  });

  test('given user picks CSV from download menu then calls downloadCsv', async () => {
    // Given
    const user = userEvent.setup();
    const { downloadCsv } = await import('@/utils/chartUtils');
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // When
    await user.click(screen.getByLabelText(/download chart/i));
    await user.click(await screen.findByRole('menuitem', { name: /download data \(csv\)/i }));

    // Then
    expect(downloadCsv).toHaveBeenCalled();
  });

  test('given large positive impact then formats with bn suffix', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_LARGE_IMPACT} />);

    // Then
    expect(screen.getByText(/\$12\.3bn/i)).toBeInTheDocument();
  });

  test('given small impact then formats with appropriate suffix', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_SMALL_IMPACT} />);

    // Then
    expect(screen.getByText(/\$500\.0m/i)).toBeInTheDocument();
  });

  test('given trillion impact then formats with tn suffix', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_TRILLION_IMPACT} />);

    // Then
    expect(screen.getByText(/\$2\.5tn/i)).toBeInTheDocument();
  });

  test('given component renders then displays chart container', () => {
    // When
    const { container } = render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // Then
    // Verify the component renders without crashing
    expect(container.firstChild).toBeInTheDocument();
  });
});
