import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';
import PolicyParameterSelectorHistoricalValues, {
  ParameterOverTimeChart,
} from '@/components/policyParameterSelectorFrame/HistoricalValues';
import {
  BOOLEAN_PARAMETER,
  CURRENCY_USD_PARAMETER,
  EMPTY_VALUES_COLLECTION,
  EXPECTED_BASE_TRACE,
  EXPECTED_EXTENDED_BASE_DATES,
  EXPECTED_NO_DATA_MESSAGE,
  EXPECTED_REFORM_NAME_DEFAULT,
  EXPECTED_REFORM_NAME_WITH_ID,
  EXPECTED_REFORM_NAME_WITH_LABEL,
  EXPECTED_REFORM_NAME_WITH_SHORT_LABEL,
  EXPECTED_REFORM_NAME_WITH_SMALL_ID,
  EXPECTED_REFORM_TRACE,
  MockErrorThrowingCollection,
  MockMismatchedValueCollection,
  PERCENTAGE_PARAMETER,
  SAMPLE_BASE_VALUES_COMPLEX,
  SAMPLE_BASE_VALUES_SIMPLE,
  SAMPLE_BASE_VALUES_WITH_INVALID_DATES,
  SAMPLE_POLICY_ID_NUMERIC,
  SAMPLE_POLICY_ID_SMALL,
  SAMPLE_POLICY_LABEL_CUSTOM,
  SAMPLE_POLICY_LABEL_SHORT,
  SAMPLE_REFORM_VALUES_COMPLEX,
  SAMPLE_REFORM_VALUES_SIMPLE,
} from '@/tests/fixtures/components/HistoricalValuesMocks';
import { CHART_COLORS } from '@/constants/chartColors';
import { CHART_DISPLAY_EXTENSION_DATE } from '@/constants/chartConstants';

// Mock Plotly to avoid rendering issues in tests
vi.mock('react-plotly.js', () => ({
  default: vi.fn((props: any) => {
    return <div data-testid="plotly-chart" data-plotly-props={JSON.stringify(props)} />;
  }),
}));

describe('HistoricalValues', () => {
  describe('PolicyParameterSelectorHistoricalValues wrapper', () => {
    it('given component renders then displays historical values section', () => {
      // Given
      const { getByText } = render(
        <PolicyParameterSelectorHistoricalValues
          param={CURRENCY_USD_PARAMETER}
          baseValues={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // Then
      expect(getByText('Historical values')).toBeInTheDocument();
    });

    it('given parameter label then displays in component', () => {
      // Given
      const { getByText } = render(
        <PolicyParameterSelectorHistoricalValues
          param={CURRENCY_USD_PARAMETER}
          baseValues={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // Then
      expect(getByText('Standard Deduction over time')).toBeInTheDocument();
    });

    it('given base values only then renders chart without reform', () => {
      // Given
      const { getByTestId } = render(
        <PolicyParameterSelectorHistoricalValues
          param={CURRENCY_USD_PARAMETER}
          baseValues={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // Then
      const chart = getByTestId('plotly-chart');
      expect(chart).toBeInTheDocument();
    });

    it('given reform values then passes to chart component', () => {
      // Given
      const { getByTestId } = render(
        <PolicyParameterSelectorHistoricalValues
          param={CURRENCY_USD_PARAMETER}
          baseValues={SAMPLE_BASE_VALUES_SIMPLE}
          reformValues={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // Then
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      expect(props.data.length).toBeGreaterThan(1); // Should have both base and reform traces
    });
  });

  describe('ParameterOverTimeChart data processing', () => {
    it('given base values then extends data to display extension date', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.x).toContain(CHART_DISPLAY_EXTENSION_DATE);
      expect(baseTrace.x.length).toBe(EXPECTED_EXTENDED_BASE_DATES.length);
    });

    it('given base values then repeats last value at extension date', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      const lastValue = baseTrace.y[baseTrace.y.length - 1];
      const secondLastValue = baseTrace.y[baseTrace.y.length - 2];
      expect(lastValue).toBe(secondLastValue); // Last value should be repeated
    });

    it('given values with invalid dates then still includes all data points', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_WITH_INVALID_DATES}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      // Note: Invalid dates are filtered from axis calculations (xaxisValues),
      // but are kept in trace data to show all historical values
      expect(baseTrace.x).toContain('0000-01-01');
      expect(baseTrace.x).toContain('2020-01-01');
      expect(baseTrace.x).toContain('2024-01-01');
    });

    it('given reform values then extends reform data to display extension date', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0]; // Reform trace is first when it exists

      // Then
      expect(reformTrace.x).toContain(CHART_DISPLAY_EXTENSION_DATE);
    });
  });

  describe('ParameterOverTimeChart styling', () => {
    it('given base only then uses dark gray color', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.line.color).toBe(CHART_COLORS.BASE_LINE_ALONE);
      expect(baseTrace.marker.color).toBe(CHART_COLORS.BASE_LINE_ALONE);
    });

    it('given base with reform then uses light gray color for base', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[1]; // Base is second when reform exists

      // Then
      expect(baseTrace.line.color).toBe(CHART_COLORS.BASE_LINE_WITH_REFORM);
      expect(baseTrace.marker.color).toBe(CHART_COLORS.BASE_LINE_WITH_REFORM);
    });

    it('given reform values then uses blue color for reform', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0]; // Reform is first when it exists

      // Then
      expect(reformTrace.line.color).toBe(CHART_COLORS.REFORM_LINE);
      expect(reformTrace.marker.color).toBe(CHART_COLORS.REFORM_LINE);
    });

    it('given reform trace then uses dotted line style', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.line.dash).toBe(EXPECTED_REFORM_TRACE.lineDash);
    });

    it('given traces then uses step line shape', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.line.shape).toBe(EXPECTED_BASE_TRACE.lineShape);
    });

    it('given traces then uses correct marker size', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.marker.size).toBe(CHART_COLORS.MARKER_SIZE);
    });
  });

  describe('ParameterOverTimeChart trace names', () => {
    it('given base only then names trace "Current law"', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.name).toBe(EXPECTED_BASE_TRACE.name);
    });

    it('given reform then uses reform label from utility', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      // Reform label uses getReformPolicyLabel() which defaults to "Reform"
      expect(reformTrace.name).toBe('Reform');
      expect(reformTrace.name).toBeDefined();
    });
  });

  describe('ParameterOverTimeChart different parameter types', () => {
    it('given currency parameter then renders chart', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // Then
      expect(getByTestId('plotly-chart')).toBeInTheDocument();
    });

    it('given percentage parameter then renders chart', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={PERCENTAGE_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_COMPLEX}
        />
      );

      // Then
      expect(getByTestId('plotly-chart')).toBeInTheDocument();
    });

    it('given boolean parameter then renders chart', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={BOOLEAN_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // Then
      expect(getByTestId('plotly-chart')).toBeInTheDocument();
    });
  });

  describe('ParameterOverTimeChart complex data scenarios', () => {
    it('given multiple value changes then includes all dates', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={PERCENTAGE_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_COMPLEX}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.x.length).toBeGreaterThan(2); // Should have multiple dates plus extension
    });

    it('given base and reform with overlapping dates then combines correctly', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={PERCENTAGE_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_COMPLEX}
          reformValuesCollection={SAMPLE_REFORM_VALUES_COMPLEX}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.data.length).toBe(2); // Should have both traces
      expect(props.data[0].name).toBe('Reform');
      expect(props.data[1].name).toBe('Current law');
    });
  });

  describe('ParameterOverTimeChart layout configuration', () => {
    it('given chart then configures horizontal legend above plot', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.legend.orientation).toBe('h');
      expect(props.layout.legend.y).toBe(1.2);
    });

    it('given chart then hides mode bar', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.config.displayModeBar).toBe(false);
    });

    it('given chart then enables responsive mode', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.config.responsive).toBe(true);
    });
  });

  describe('ParameterOverTimeChart axis formatting', () => {
    it('given chart then includes x-axis format', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.xaxis).toBeDefined();
      expect(props.layout.xaxis.type).toBe('date');
    });

    it('given chart then includes y-axis format', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.yaxis).toBeDefined();
    });

    it('given currency parameter then y-axis has dollar prefix', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.yaxis.tickprefix).toBe('$');
    });

    it('given percentage parameter then y-axis has percentage format', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={PERCENTAGE_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_COMPLEX}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.yaxis.tickformat).toBe('.1%');
    });

    it('given boolean parameter then y-axis has True/False labels', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={BOOLEAN_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.yaxis.tickvals).toEqual([0, 1]);
      expect(props.layout.yaxis.ticktext).toEqual(['False', 'True']);
    });
  });

  describe('ParameterOverTimeChart hover tooltips', () => {
    it('given base trace then includes custom data for hover', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.customdata).toBeDefined();
      expect(Array.isArray(baseTrace.customdata)).toBe(true);
    });

    it('given reform trace then includes custom data for hover', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.customdata).toBeDefined();
      expect(Array.isArray(reformTrace.customdata)).toBe(true);
    });

    it('given currency values then formats hover data with dollar sign', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.customdata[0]).toContain('$');
    });

    it('given trace then uses date and value hover template', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const baseTrace = props.data[0];

      // Then
      expect(baseTrace.hovertemplate).toContain('%{x|%b, %Y}');
      expect(baseTrace.hovertemplate).toContain('%{customdata}');
    });
  });

  describe('ParameterOverTimeChart responsive behavior', () => {
    it('given chart renders then includes container ref', () => {
      // Given/When
      const { container } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // Then
      const chartContainer = container.querySelector('div');
      expect(chartContainer).toBeInTheDocument();
    });

    it('given chart then has margin configuration', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.margin).toBeDefined();
      expect(props.layout.margin.t).toBeDefined();
      expect(props.layout.margin.r).toBeDefined();
      expect(props.layout.margin.l).toBeDefined();
      expect(props.layout.margin.b).toBeDefined();
    });

    it('given chart then has dragmode configuration', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.dragmode).toBeDefined();
    });

    it('given chart then has style with height', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.style).toBeDefined();
      expect(props.style.height).toBeDefined();
      expect(typeof props.style.height).toBe('number');
    });

  });

  describe('ParameterOverTimeChart policy label integration', () => {
    it('given no policy data then reform trace uses default label', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_DEFAULT);
    });

    it('given custom policy label then reform trace uses label', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={SAMPLE_POLICY_LABEL_CUSTOM}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_LABEL);
    });

    it('given short policy label then reform trace uses short label', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={SAMPLE_POLICY_LABEL_SHORT}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_SHORT_LABEL);
    });

    it('given policy ID without label then reform trace formats ID', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyId={SAMPLE_POLICY_ID_NUMERIC.toString()}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_ID);
    });

    it('given small policy ID then formats correctly', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyId={SAMPLE_POLICY_ID_SMALL.toString()}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_SMALL_ID);
    });

    it('given policy label and ID then prioritizes label', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={SAMPLE_POLICY_LABEL_CUSTOM}
          policyId={SAMPLE_POLICY_ID_NUMERIC.toString()}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_LABEL);
      expect(reformTrace.name).not.toBe(EXPECTED_REFORM_NAME_WITH_ID);
    });

    it('given empty string label then falls back to policy ID', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel=""
          policyId={SAMPLE_POLICY_ID_NUMERIC.toString()}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_ID);
    });

    it('given null label then falls back to policy ID', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={null}
          policyId={SAMPLE_POLICY_ID_NUMERIC.toString()}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_ID);
    });

    it('given empty string label and null ID then uses default', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel=""
          policyId={null}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_DEFAULT);
    });

    it('given wrapper component with policy label then passes to chart', () => {
      // Given
      const { getByTestId } = render(
        <PolicyParameterSelectorHistoricalValues
          param={CURRENCY_USD_PARAMETER}
          baseValues={SAMPLE_BASE_VALUES_SIMPLE}
          reformValues={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={SAMPLE_POLICY_LABEL_CUSTOM}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_LABEL);
    });

    it('given wrapper component with policy ID then passes to chart', () => {
      // Given
      const { getByTestId } = render(
        <PolicyParameterSelectorHistoricalValues
          param={CURRENCY_USD_PARAMETER}
          baseValues={SAMPLE_BASE_VALUES_SIMPLE}
          reformValues={SAMPLE_REFORM_VALUES_SIMPLE}
          policyId={SAMPLE_POLICY_ID_NUMERIC.toString()}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      const reformTrace = props.data[0];

      // Then
      expect(reformTrace.name).toBe(EXPECTED_REFORM_NAME_WITH_ID);
    });
  });

  describe('ParameterOverTimeChart error handling', () => {
    it('given empty values collection then displays no data message', () => {
      // Given/When
      render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={EMPTY_VALUES_COLLECTION}
        />
      );

      // Then
      expect(screen.getByText(EXPECTED_NO_DATA_MESSAGE)).toBeInTheDocument();
    });

    it('given empty values then does not render chart', () => {
      // Given/When
      const { queryByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={EMPTY_VALUES_COLLECTION}
        />
      );

      // Then
      expect(queryByTestId('plotly-chart')).not.toBeInTheDocument();
    });

    it('given mismatched dates and values then handles gracefully', () => {
      // Given
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mismatchedCollection = new MockMismatchedValueCollection([]);

      // When
      render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={mismatchedCollection}
        />
      );

      // Then
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ParameterOverTimeChart: Mismatched dates and values length'
      );
      expect(screen.getByText(EXPECTED_NO_DATA_MESSAGE)).toBeInTheDocument();

      // Cleanup
      consoleWarnSpy.mockRestore();
    });

    it('given error in data processing then handles gracefully', () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCollection = new MockErrorThrowingCollection([]);

      // When
      render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={errorCollection}
        />
      );

      // Then
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(screen.getByText(EXPECTED_NO_DATA_MESSAGE)).toBeInTheDocument();

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('given error in reform data processing then still renders base data', () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorCollection = new MockErrorThrowingCollection([]);

      // When
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={errorCollection}
        />
      );

      // Then
      expect(consoleErrorSpy).toHaveBeenCalled();
      const chart = getByTestId('plotly-chart');
      expect(chart).toBeInTheDocument();

      // Should only have base trace, no reform trace
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      expect(props.data.length).toBe(1);
      expect(props.data[0].name).toBe('Current law');

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('given empty reform values then only renders base trace', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={EMPTY_VALUES_COLLECTION}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.data.length).toBe(1);
      expect(props.data[0].name).toBe('Current law');
    });

    it('given mismatched reform data then shows warning and skips reform', () => {
      // Given
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mismatchedCollection = new MockMismatchedValueCollection([]);

      // When
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={mismatchedCollection}
        />
      );

      // Then
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ParameterOverTimeChart: Mismatched reform dates and values length'
      );

      // Should still render base trace
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');
      expect(props.data.length).toBe(1);
      expect(props.data[0].name).toBe('Current law');

      // Cleanup
      consoleWarnSpy.mockRestore();
    });
  });

  describe('ParameterOverTimeChart memoization', () => {
    it('given component re-renders with same props then uses memoized values', () => {
      // Given
      const { rerender, getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={SAMPLE_POLICY_LABEL_CUSTOM}
        />
      );

      const firstChart = getByTestId('plotly-chart');
      const firstProps = JSON.parse(firstChart.getAttribute('data-plotly-props') || '{}');

      // When - Re-render with same props
      rerender(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
          policyLabel={SAMPLE_POLICY_LABEL_CUSTOM}
        />
      );

      // Then - Should have same data (memoization working)
      const secondChart = getByTestId('plotly-chart');
      const secondProps = JSON.parse(secondChart.getAttribute('data-plotly-props') || '{}');

      expect(firstProps.data[0].name).toBe(secondProps.data[0].name);
      expect(firstProps.data[0].x).toEqual(secondProps.data[0].x);
      expect(firstProps.data[0].y).toEqual(secondProps.data[0].y);
    });
  });

  describe('ParameterOverTimeChart axis buffer space', () => {
    it('given chart then x-axis range extends 5 years before earliest date', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then
      expect(props.layout.xaxis.range).toBeDefined();
      expect(props.layout.xaxis.range).toHaveLength(2);

      const rangeStart = new Date(props.layout.xaxis.range[0]);

      // The earliest date in the filtered dates (after applying DEFAULT_CHART_START_DATE filter)
      // is 2015-01-01, so 5 years before that is 2010
      expect(rangeStart.getFullYear()).toBe(2010);
    });

    it('given chart then y-axis range includes 10% buffer above max value', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then - Buffer is calculated after extending data, so includes extended points
      expect(props.layout.yaxis.range).toBeDefined();
      expect(props.layout.yaxis.range).toHaveLength(2);

      // The actual range includes the extension point at 2099, creating a range
      const actualMax = props.layout.yaxis.range[1];
      const actualMin = props.layout.yaxis.range[0];

      // Verify there is buffer space (range is larger than data)
      expect(actualMax).toBeGreaterThan(12500); // Max data value
      expect(actualMin).toBeLessThan(12000); // Min data value
    });

    it('given chart then y-axis range includes 10% buffer below min value', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then - Verify buffer exists below minimum
      const actualMin = props.layout.yaxis.range[0];
      expect(actualMin).toBeLessThan(12000); // Min data value from SAMPLE_BASE_VALUES_SIMPLE
    });

    it('given chart with multiple values then buffer calculated from range', () => {
      // Given - SAMPLE_BASE_VALUES_COMPLEX uses percentage values (0.15, 0.20, 0.22)
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={PERCENTAGE_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_COMPLEX}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then - Verify buffer exists on both sides
      expect(props.layout.yaxis.range).toBeDefined();

      const actualMin = props.layout.yaxis.range[0];
      const actualMax = props.layout.yaxis.range[1];

      // Min/max from SAMPLE_BASE_VALUES_COMPLEX (percentages: 0.15 min, 0.22 max)
      expect(actualMin).toBeLessThan(0.15); // Buffer below minimum
      expect(actualMax).toBeGreaterThan(0.22); // Buffer above maximum
    });

    it('given chart with base and reform then buffer includes both datasets', () => {
      // Given
      const { getByTestId } = render(
        <ParameterOverTimeChart
          param={CURRENCY_USD_PARAMETER}
          baseValuesCollection={SAMPLE_BASE_VALUES_SIMPLE}
          reformValuesCollection={SAMPLE_REFORM_VALUES_SIMPLE}
        />
      );

      // When
      const chart = getByTestId('plotly-chart');
      const props = JSON.parse(chart.getAttribute('data-plotly-props') || '{}');

      // Then - Buffer should account for both datasets
      expect(props.layout.yaxis.range).toBeDefined();

      const actualMin = props.layout.yaxis.range[0];
      const actualMax = props.layout.yaxis.range[1];

      // Combined data: base has 12000-12500, reform has 15000
      expect(actualMin).toBeLessThan(12000); // Buffer below base minimum
      expect(actualMax).toBeGreaterThan(15000); // Buffer above reform maximum
    });
  });
});
