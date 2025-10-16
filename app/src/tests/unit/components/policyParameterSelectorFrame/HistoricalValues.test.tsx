import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@test-utils';
import PolicyParameterSelectorHistoricalValues, {
  ParameterOverTimeChart,
} from '@/components/policyParameterSelectorFrame/HistoricalValues';
import {
  MOCK_PARAM_USD,
  MOCK_PARAM_PERCENTAGE,
  MOCK_PARAM_BOOLEAN,
  createMockBaseCollection,
  createMockReformCollection,
  EXPECTED_REFORM_COLOR,
  EXPECTED_BASELINE_WITH_REFORM_COLOR,
  EXPECTED_BASELINE_NO_REFORM_COLOR,
} from '@/tests/fixtures/components/policyParameterSelectorFrame/HistoricalValuesMocks';

// Mock Plotly to avoid rendering issues in tests
vi.mock('react-plotly.js', () => ({
  default: vi.fn(({ data, layout, config }) => (
    <div data-testid="plotly-chart" data-plot-data={JSON.stringify({ data, layout, config })} />
  )),
}));

describe('PolicyParameterSelectorHistoricalValues', () => {
  test('given param then renders historical values section', () => {
    // Given
    const baseValues = createMockBaseCollection();
    const param = MOCK_PARAM_USD;

    // When
    render(
      <PolicyParameterSelectorHistoricalValues param={param} baseValues={baseValues} />
    );

    // Then
    expect(screen.getByText('Historical values')).toBeInTheDocument();
    expect(screen.getByText(`${param.label} over time`)).toBeInTheDocument();
  });

  test('given param then renders chart', () => {
    // Given
    const baseValues = createMockBaseCollection();
    const param = MOCK_PARAM_USD;

    // When
    render(
      <PolicyParameterSelectorHistoricalValues param={param} baseValues={baseValues} />
    );

    // Then
    expect(screen.getByTestId('plotly-chart')).toBeInTheDocument();
  });
});

describe('ParameterOverTimeChart', () => {
  describe('given base values only', () => {
    test('given USD param then renders single trace with correct color', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data).toHaveLength(1);
      expect(plotData.data[0].name).toBe('Current law');
      expect(plotData.data[0].marker.color).toBe(EXPECTED_BASELINE_NO_REFORM_COLOR);
    });

    test('given USD param then extends values to 2099', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      const xData = plotData.data[0].x;
      expect(xData[xData.length - 1]).toBe('2099-12-31');

      const yData = plotData.data[0].y;
      expect(yData[yData.length - 1]).toBe(yData[yData.length - 2]);
    });

    test('given USD param then formats hover data', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[0].customdata).toBeDefined();
      expect(plotData.data[0].customdata[0]).toMatch(/\$[\d,]+\.\d{2}/);
    });

    test('given percentage param then formats values as percentages', () => {
      // Given
      const baseValues = createMockBaseCollection({
        '2020-01-01': 0.22,
        '2021-01-01': 0.24,
      });
      const param = MOCK_PARAM_PERCENTAGE;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[0].customdata[0]).toMatch(/\d+\.\d{2}%/);
    });

    test('given boolean param then formats values as True/False', () => {
      // Given
      const baseValues = createMockBaseCollection({
        '2020-01-01': 0,
        '2022-01-01': 1,
      });
      const param = MOCK_PARAM_BOOLEAN;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[0].customdata).toContain('False');
      expect(plotData.data[0].customdata).toContain('True');
    });
  });

  describe('given base and reform values', () => {
    test('given reform then renders two traces', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const reformValues = createMockReformCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart
          param={param}
          baseValuesCollection={baseValues}
          reformValuesCollection={reformValues}
        />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data).toHaveLength(2);
    });

    test('given reform then first trace is reform with blue color', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const reformValues = createMockReformCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart
          param={param}
          baseValuesCollection={baseValues}
          reformValuesCollection={reformValues}
        />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[0].name).toBe('Reform');
      expect(plotData.data[0].marker.color).toBe(EXPECTED_REFORM_COLOR);
      expect(plotData.data[0].line.dash).toBe('dot');
    });

    test('given reform then second trace is baseline with gray color', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const reformValues = createMockReformCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart
          param={param}
          baseValuesCollection={baseValues}
          reformValuesCollection={reformValues}
        />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[1].name).toBe('Current law');
      expect(plotData.data[1].marker.color).toBe(EXPECTED_BASELINE_WITH_REFORM_COLOR);
    });

    test('given reform then extends both traces to 2099', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const reformValues = createMockReformCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart
          param={param}
          baseValuesCollection={baseValues}
          reformValuesCollection={reformValues}
        />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      const reformX = plotData.data[0].x;
      const baseX = plotData.data[1].x;

      expect(reformX[reformX.length - 1]).toBe('2099-12-31');
      expect(baseX[baseX.length - 1]).toBe('2099-12-31');
    });
  });

  describe('given chart layout', () => {
    test('given param then sets title with param label', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.layout.title.text).toBe(`${param.label} over time`);
    });

    test('given param then configures legend above chart', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.layout.legend.y).toBe(1.15);
      expect(plotData.layout.legend.orientation).toBe('h');
    });

    test('given param then sets axis formats', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.layout.xaxis).toBeDefined();
      expect(plotData.layout.xaxis.type).toBe('date');
      expect(plotData.layout.yaxis).toBeDefined();
    });

    test('given param then sets plot colors', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.layout.plot_bgcolor).toBe('#f8f9fa');
      expect(plotData.layout.paper_bgcolor).toBe('transparent');
    });
  });

  describe('given chart configuration', () => {
    test('given param then hides mode bar', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.config.displayModeBar).toBe(false);
    });

    test('given param then enables responsive mode', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.config.responsive).toBe(true);
    });
  });

  describe('given step-line visualization', () => {
    test('given param then uses horizontal-vertical step lines', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart param={param} baseValuesCollection={baseValues} />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[0].line.shape).toBe('hv');
      expect(plotData.data[0].mode).toBe('lines+markers');
    });

    test('given reform then uses dotted line for reform trace', () => {
      // Given
      const baseValues = createMockBaseCollection();
      const reformValues = createMockReformCollection();
      const param = MOCK_PARAM_USD;

      // When
      render(
        <ParameterOverTimeChart
          param={param}
          baseValuesCollection={baseValues}
          reformValuesCollection={reformValues}
        />
      );

      // Then
      const chart = screen.getByTestId('plotly-chart');
      const plotData = JSON.parse(chart.getAttribute('data-plot-data') || '{}');

      expect(plotData.data[0].line.dash).toBe('dot');
    });
  });
});
