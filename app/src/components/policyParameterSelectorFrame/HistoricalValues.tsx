import Plot from 'react-plotly.js';
import { Stack, Text, useMantineTheme } from '@mantine/core';
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import {
  formatParameterValue,
  getPlotlyAxisFormat,
  extendDataToFuture,
  buildXAxisValues,
  buildYAxisValues,
  calculateChartHeight,
} from '@/libs/chartUtils';
import {
  DEFAULT_CHART_START_DATE,
  DEFAULT_CHART_END_DATE,
  CHART_COLORS,
  CHART_DIMENSIONS,
  CHART_MARGINS,
} from '@/constants/chart';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

interface PolicyParameterSelectorHistoricalValuesProps {
  param: ParameterMetadata;
  baseValues: ValueIntervalCollection;
  reformValues?: ValueIntervalCollection;
}

interface ParameterOverTimeChartProps {
  param: ParameterMetadata;
  baseValuesCollection: ValueIntervalCollection;
  reformValuesCollection?: ValueIntervalCollection;
}

export default function PolicyParameterSelectorHistoricalValues(
  props: PolicyParameterSelectorHistoricalValuesProps
) {
  const { param, baseValues = new ValueIntervalCollection(), reformValues } = props;

  return (
    <Stack>
      <Text fw={700}>Historical values</Text>
      <Text>{param.label} over time</Text>
      <ParameterOverTimeChart
        param={param}
        baseValuesCollection={baseValues}
        reformValuesCollection={reformValues}
      />
    </Stack>
  );
}

export function ParameterOverTimeChart(props: ParameterOverTimeChartProps) {
  const { param, baseValuesCollection, reformValuesCollection } = props;
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { height: viewportHeight } = useViewportSize();

  // Get data from collections
  const x = baseValuesCollection.getAllStartDates();
  const y = baseValuesCollection.getAllValues();
  extendDataToFuture(x, y);

  const reformedX = reformValuesCollection ? reformValuesCollection.getAllStartDates() : [];
  const reformedY = reformValuesCollection ? reformValuesCollection.getAllValues() : [];
  if (reformValuesCollection) {
    extendDataToFuture(reformedX, reformedY);
  }

  // Build axis values for proper range
  const xaxisValues = buildXAxisValues(x, reformedX);
  const yaxisValues = buildYAxisValues(y, reformedY);

  // Get axis formatting
  const xaxisFormat = getPlotlyAxisFormat('date', xaxisValues);
  const yaxisFormat = getPlotlyAxisFormat(param.unit || '', yaxisValues);

  // Format custom data for hover tooltips
  const customData = y.map((value) => formatParameterValue(param, value, 2));
  const reformedCustomData = reformedY.map((value) => formatParameterValue(param, value, 2));

  // Calculate responsive dimensions
  const chartHeight = calculateChartHeight(
    isMobile,
    viewportHeight,
    CHART_DIMENSIONS.MOBILE_HEIGHT_RATIO,
    CHART_DIMENSIONS.DESKTOP_HEIGHT,
    CHART_DIMENSIONS.MIN_HEIGHT
  );
  const margins = isMobile ? CHART_MARGINS.MOBILE : CHART_MARGINS.DESKTOP;

  return (
    <Plot
      data={[
        ...(reformValuesCollection
          ? [
              {
                x: reformedX,
                y: reformedY.map((y) => +y),
                type: 'scatter' as const,
                mode: 'lines+markers' as const,
                line: {
                  shape: 'hv' as const,
                  dash: 'dot' as const,
                  color: CHART_COLORS.REFORM,
                },
                marker: {
                  color: CHART_COLORS.REFORM,
                },
                name: 'Reform',
                customdata: reformedCustomData,
                hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
              },
            ]
          : []),
        {
          x,
          y: y.map((y) => +y),
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          line: {
            shape: 'hv' as const,
            color: reformValuesCollection
              ? CHART_COLORS.BASELINE_WITH_REFORM
              : CHART_COLORS.BASELINE_NO_REFORM,
          },
          marker: {
            color: reformValuesCollection
              ? CHART_COLORS.BASELINE_WITH_REFORM
              : CHART_COLORS.BASELINE_NO_REFORM,
          },
          name: 'Current law',
          customdata: customData,
          hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
        },
      ]}
      layout={{
        xaxis: { ...xaxisFormat },
        yaxis: { ...yaxisFormat },
        legend: {
          y: 1.15,
          orientation: 'h' as const,
          xanchor: 'left' as const,
          x: 0,
        },
        margin: {
          t: margins.top,
          r: margins.right,
          l: margins.left,
          b: margins.bottom,
        },
        plot_bgcolor: CHART_COLORS.PLOT_BACKGROUND,
        paper_bgcolor: 'transparent',
        font: {
          family: theme.fontFamily,
          size: 12,
        },
        title: {
          text: `${param.label} over time`,
          xanchor: 'left' as const,
          x: 0.04,
          font: {
            size: 14,
          },
        },
        dragmode: isMobile ? false : ('zoom' as const),
        autosize: true,
      }}
      style={{
        width: '100%',
        height: chartHeight,
      }}
      config={{
        displayModeBar: false,
        responsive: true,
      }}
    />
  );
}
