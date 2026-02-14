import { memo, useMemo, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Stack, Text } from '@mantine/core';
import { CHART_COLORS } from '@/constants/chartColors';
import { useChartWidth, useIsMobile, useWindowHeight } from '@/hooks/useChartDimensions';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import {
  extendForDisplay,
  filterInfiniteValues,
  filterValidChartDates,
  getAllChartDates,
  getChartBoundaryDates,
} from '@/utils/chartDateUtils';
import { getReformPolicyLabel } from '@/utils/chartUtils';
import { formatParameterValue, getPlotlyAxisFormat } from '@/utils/chartValueUtils';
import { capitalize } from '@/utils/stringUtils';

interface PolicyParameterSelectorHistoricalValuesProps {
  param: ParameterMetadata;
  baseValues: ValueIntervalCollection;
  reformValues?: ValueIntervalCollection;
  policyLabel?: string | null;
  policyId?: string | null;
}

interface ParameterOverTimeChartProps {
  param: ParameterMetadata;
  baseValuesCollection: ValueIntervalCollection;
  reformValuesCollection?: ValueIntervalCollection;
  policyLabel?: string | null;
  policyId?: string | null;
}

export default function PolicyParameterSelectorHistoricalValues(
  props: PolicyParameterSelectorHistoricalValuesProps
) {
  const {
    param,
    baseValues = new ValueIntervalCollection(),
    reformValues,
    policyLabel,
    policyId,
  } = props;

  return (
    <Stack mt="xl">
      <Text fw={700}>Historical values</Text>
      <Text>{capitalize(param.label)} over time</Text>
      <ParameterOverTimeChart
        param={param}
        baseValuesCollection={baseValues}
        reformValuesCollection={reformValues}
        policyLabel={policyLabel}
        policyId={policyId}
      />
    </Stack>
  );
}

export const ParameterOverTimeChart = memo((props: ParameterOverTimeChartProps) => {
  const { param, baseValuesCollection, reformValuesCollection, policyLabel, policyId } = props;

  // Responsive state
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartWidth = useChartWidth(chartContainerRef);
  const isMobile = useIsMobile();
  const windowHeight = useWindowHeight();

  // Memoize base data processing
  const { x, y, hasInfiniteBase } = useMemo(() => {
    try {
      const dates = [...baseValuesCollection.getAllStartDates()];
      const values = [...baseValuesCollection.getAllValues()];

      // Validate data
      if (dates.length === 0 || values.length === 0) {
        return { x: [], y: [], hasInfiniteBase: false };
      }

      if (dates.length !== values.length) {
        console.warn('ParameterOverTimeChart: Mismatched dates and values length');
        return { x: [], y: [], hasInfiniteBase: false };
      }

      const { filteredDates, filteredValues } = filterInfiniteValues(dates, values);
      const hasInfiniteBase = filteredDates.length < dates.length;

      if (filteredDates.length === 0 || filteredValues.length === 0) {
        return { x: [], y: [], hasInfiniteBase };
      }

      extendForDisplay(filteredDates, filteredValues);
      return { x: filteredDates, y: filteredValues, hasInfiniteBase };
    } catch (error) {
      console.error('ParameterOverTimeChart: Error processing base data', error);
      return { x: [], y: [], hasInfiniteBase: false };
    }
  }, [baseValuesCollection]);

  // Memoize reform data processing
  const { reformedX, reformedY, hasInfiniteReform } = useMemo(() => {
    if (!reformValuesCollection) {
      return { reformedX: [], reformedY: [], hasInfiniteReform: false };
    }

    try {
      const dates = [...reformValuesCollection.getAllStartDates()];
      const values = [...reformValuesCollection.getAllValues()];

      // Validate data
      if (dates.length === 0 || values.length === 0) {
        return { reformedX: [], reformedY: [], hasInfiniteReform: false };
      }

      if (dates.length !== values.length) {
        console.warn('ParameterOverTimeChart: Mismatched reform dates and values length');
        return { reformedX: [], reformedY: [], hasInfiniteReform: false };
      }

      const { filteredDates, filteredValues } = filterInfiniteValues(dates, values);
      const hasInfiniteReform = filteredDates.length < dates.length;

      if (filteredDates.length === 0 || filteredValues.length === 0) {
        return { reformedX: [], reformedY: [], hasInfiniteReform };
      }

      extendForDisplay(filteredDates, filteredValues);
      return { reformedX: filteredDates, reformedY: filteredValues, hasInfiniteReform };
    } catch (error) {
      console.error('ParameterOverTimeChart: Error processing reform data', error);
      return { reformedX: [], reformedY: [], hasInfiniteReform: false };
    }
  }, [reformValuesCollection]);

  // Memoize axis calculations with buffer space
  const { xaxisFormat, yaxisFormat } = useMemo(() => {
    try {
      let xaxisValues = getAllChartDates(x, reformedX);
      xaxisValues = filterValidChartDates(xaxisValues);

      const { minDate, maxDate } = getChartBoundaryDates();
      xaxisValues.push(minDate);
      xaxisValues.push(maxDate);

      const yaxisValues = reformValuesCollection ? [...y, ...reformedY] : y;

      // Calculate x-axis range starting at 2013 (earliest display date, with 2-year buffer)
      const EARLIEST_DISPLAY_DATE = '2013-01-01';

      // Calculate y-axis range anchored at 0 with nice ticks
      const numericYValues = yaxisValues.map((v) => Number(v)).filter((v) => !isNaN(v));
      let minY = Math.min(...numericYValues);
      let maxY = Math.max(...numericYValues);

      // Ensure 0 is always visible for all value types
      minY = Math.min(minY, 0);

      // For percentages, also ensure 100% is always visible
      if (param.unit === '/1') {
        maxY = Math.max(maxY, 1);
      }

      // Compute nice tick step for the y-axis
      const yRange = maxY - minY;
      const targetTicks = 5;
      const rawStep = yRange / targetTicks;
      const magnitude = 10 ** Math.floor(Math.log10(rawStep));
      const normalized = rawStep / magnitude;
      let niceStep: number;
      if (normalized <= 1) {
        niceStep = 1 * magnitude;
      } else if (normalized <= 2) {
        niceStep = 2 * magnitude;
      } else if (normalized <= 2.5) {
        niceStep = 2.5 * magnitude;
      } else if (normalized <= 5) {
        niceStep = 5 * magnitude;
      } else {
        niceStep = 10 * magnitude;
      }

      // Round min/max to nice boundaries (always include 0)
      const niceMin = minY < 0 ? Math.floor(minY / niceStep) * niceStep : 0;
      const niceMax = Math.ceil(maxY / niceStep) * niceStep;

      const xaxisFormatWithRange = {
        ...getPlotlyAxisFormat('date', xaxisValues),
        range: [EARLIEST_DISPLAY_DATE, maxDate],
      };

      const yaxisFormatWithRange = {
        ...getPlotlyAxisFormat(param.unit || '', yaxisValues),
        range: [niceMin, niceMax],
        dtick: niceStep,
      };

      return {
        xaxisFormat: xaxisFormatWithRange,
        yaxisFormat: yaxisFormatWithRange,
      };
    } catch (error) {
      console.error('ParameterOverTimeChart: Error calculating axis formats', error);
      return {
        xaxisFormat: { type: 'date' as const },
        yaxisFormat: {},
      };
    }
  }, [x, y, reformedX, reformedY, reformValuesCollection, param.unit]);

  // Memoize custom data for hover tooltips
  const customData = useMemo(() => {
    try {
      return y.map((value) => formatParameterValue(value, param.unit, { decimalPlaces: 2 }));
    } catch (error) {
      console.error('ParameterOverTimeChart: Error formatting custom data', error);
      return [];
    }
  }, [y, param.unit]);

  const reformedCustomData = useMemo(() => {
    try {
      return reformedY.map((value) =>
        formatParameterValue(value, param.unit, { decimalPlaces: 2 })
      );
    } catch (error) {
      console.error('ParameterOverTimeChart: Error formatting reform custom data', error);
      return [];
    }
  }, [reformedY, param.unit]);

  // Memoize reform label
  const reformLabel = useMemo(() => {
    return getReformPolicyLabel(policyLabel, policyId ? parseInt(policyId, 10) : null);
  }, [policyLabel, policyId]);

  // Check if any infinite values were filtered
  const hasInfiniteValues = hasInfiniteBase || hasInfiniteReform;

  // Early return if no valid data
  if (x.length === 0 || y.length === 0) {
    return (
      <div ref={chartContainerRef}>
        <Text c="dimmed" ta="center" py="xl">
          No data available to display
        </Text>
      </div>
    );
  }

  return (
    <div ref={chartContainerRef}>
      <Plot
        data={[
          ...(reformValuesCollection && reformedX.length > 0 && reformedY.length > 0
            ? [
                {
                  x: reformedX,
                  y: reformedY.map((y) => +y),
                  type: 'line' as any,
                  mode: 'lines+markers' as any,
                  line: {
                    shape: 'hv' as any,
                    dash: 'dot' as any,
                    color: CHART_COLORS.REFORM_LINE,
                  },
                  marker: {
                    color: CHART_COLORS.REFORM_LINE,
                    size: CHART_COLORS.MARKER_SIZE,
                  },
                  name: reformLabel,
                  customdata: reformedCustomData,
                  hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
                },
              ]
            : []),
          {
            x,
            y: y.map((y) => +y),
            type: 'line' as any,
            mode: 'lines+markers' as any,
            line: {
              shape: 'hv' as any,
              color:
                reformValuesCollection && reformedX.length > 0 && reformedY.length > 0
                  ? CHART_COLORS.BASE_LINE_WITH_REFORM
                  : CHART_COLORS.BASE_LINE_ALONE,
            },
            marker: {
              color:
                reformValuesCollection && reformedX.length > 0 && reformedY.length > 0
                  ? CHART_COLORS.BASE_LINE_WITH_REFORM
                  : CHART_COLORS.BASE_LINE_ALONE,
              size: CHART_COLORS.MARKER_SIZE,
            },
            name: 'Current law',
            customdata: customData,
            hovertemplate: '%{x|%b, %Y}: %{customdata}<extra></extra>',
          },
        ].filter((x) => x)}
        layout={{
          xaxis: {
            ...xaxisFormat,
            color: CHART_COLORS.CHART_TEXT,
            gridcolor: '#E5E7EB',
          },
          yaxis: {
            ...yaxisFormat,
            color: CHART_COLORS.CHART_TEXT,
            gridcolor: '#E5E7EB',
          },
          shapes: [
            {
              type: 'line',
              x0: 0,
              x1: 1,
              xref: 'paper',
              y0: 0,
              y1: 0,
              yref: 'y',
              line: { color: '#9CA3AF', width: 1 },
            },
          ],
          legend: {
            // Position above the plot
            y: 1.2,
            orientation: 'h' as any,
            font: {
              color: CHART_COLORS.CHART_TEXT,
            },
          },
          margin: {
            t: isMobile ? 80 : 60,
            r: isMobile ? 50 : 40,
            l: isMobile ? 50 : 60,
            b: isMobile ? 30 : 50,
          },
          dragmode: isMobile ? (false as any) : ('zoom' as any),
          width: chartWidth || undefined,
          paper_bgcolor: CHART_COLORS.CHART_BACKGROUND,
          plot_bgcolor: CHART_COLORS.PLOT_BACKGROUND,
        }}
        style={{
          height: isMobile ? windowHeight * 0.5 : 400,
        }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
      />
      {hasInfiniteValues && (
        <Text size="sm" c="gray.8" fs="italic" mt="xs">
          Note: Charts do not currently display parameters with values of positive or negative
          infinity.
        </Text>
      )}
    </div>
  );
});
