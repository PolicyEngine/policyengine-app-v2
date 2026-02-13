import { memo, useMemo, useRef } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Stack, Text } from '@mantine/core';
import { CHART_COLORS } from '@/constants/chartColors';
import { useChartWidth, useIsMobile, useWindowHeight } from '@/hooks/useChartDimensions';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import {
  extendForDisplay,
  filterInfiniteValues,
  getChartBoundaryDates,
} from '@/utils/chartDateUtils';
import { getReformPolicyLabel, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { formatParameterValue, getRechartsTickFormatter } from '@/utils/chartValueUtils';
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

function HistoricalTooltip({ active, payload, label, param }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  const date = new Date(label);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 6,
        padding: '8px 12px',
      }}
    >
      <p style={{ fontWeight: 600, margin: 0 }}>{dateStr}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: 13, color: p.stroke }}>
          {p.name}: {formatParameterValue(p.value, param?.unit, { decimalPlaces: 2 })}
        </p>
      ))}
    </div>
  );
}

export const ParameterOverTimeChart = memo((props: ParameterOverTimeChartProps) => {
  const { param, baseValuesCollection, reformValuesCollection, policyLabel, policyId } = props;

  // Responsive state
  const chartContainerRef = useRef<HTMLDivElement>(null);
  useChartWidth(chartContainerRef);
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

  // Memoize axis calculations
  const { maxDate, yMin, yMax } = useMemo(() => {
    try {
      const { maxDate } = getChartBoundaryDates();

      const yaxisValues = reformValuesCollection ? [...y, ...reformedY] : y;

      // Calculate y-axis range with 10% buffer above and below
      const numericYValues = yaxisValues.map((v) => Number(v)).filter((v) => !isNaN(v));
      let minY = Math.min(...numericYValues);
      let maxY = Math.max(...numericYValues);

      // Ensure 0 is always visible for all value types
      minY = Math.min(minY, 0);

      // For percentages, also ensure 100% is always visible
      if (param.unit === '/1') {
        maxY = Math.max(maxY, 1);
      }

      const yRange = maxY - minY;
      const yBuffer = yRange * 0.1;

      return {
        maxDate,
        yMin: minY - yBuffer,
        yMax: maxY + yBuffer,
      };
    } catch (error) {
      console.error('ParameterOverTimeChart: Error calculating axis formats', error);
      return { maxDate: '2036-12-31', yMin: 0, yMax: 1 };
    }
  }, [x, y, reformedX, reformedY, reformValuesCollection, param.unit]);

  // Memoize reform label
  const reformLabel = useMemo(() => {
    return getReformPolicyLabel(policyLabel, policyId ? parseInt(policyId, 10) : null);
  }, [policyLabel, policyId]);

  // Check if any infinite values were filtered
  const hasInfiniteValues = hasInfiniteBase || hasInfiniteReform;

  const hasReform = reformValuesCollection && reformedX.length > 0 && reformedY.length > 0;

  // Memoize chart data transformation
  const chartData = useMemo(() => {
    const data: Record<string, any>[] = x.map((date, i) => {
      const point: Record<string, any> = {
        date,
        baseline: +y[i],
      };
      if (hasReform) {
        const reformIdx = reformedX.indexOf(date);
        if (reformIdx !== -1) {
          point.reform = +reformedY[reformIdx];
        }
      }
      return point;
    });

    // Merge any reform-only dates
    if (hasReform) {
      reformedX.forEach((date, i) => {
        if (!data.find((d) => d.date === date)) {
          data.push({ date, reform: +reformedY[i] });
        }
      });
      data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    return data;
  }, [x, y, reformedX, reformedY, hasReform]);

  // Memoize tick formatter
  const yTickFormatter = useMemo(() => {
    return getRechartsTickFormatter(param.unit || '', { decimalPlaces: 1 });
  }, [param.unit]);

  const EARLIEST_DISPLAY_DATE = '2013-01-01';

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
      <ResponsiveContainer width="100%" height={isMobile ? windowHeight * 0.5 : 400}>
        <LineChart
          data={chartData}
          margin={{
            top: isMobile ? 40 : 20,
            right: isMobile ? 50 : 40,
            bottom: isMobile ? 30 : 50,
            left: isMobile ? 50 : 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={(d: string) => {
              const dt = new Date(d);
              return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }}
            domain={[EARLIEST_DISPLAY_DATE, maxDate]}
          />
          <YAxis tick={RECHARTS_FONT_STYLE} tickFormatter={yTickFormatter} domain={[yMin, yMax]} />
          <Tooltip content={<HistoricalTooltip param={param} />} />
          <Legend verticalAlign="top" />
          {hasReform && (
            <Line
              type="stepAfter"
              dataKey="reform"
              name={reformLabel}
              stroke={CHART_COLORS.REFORM_LINE}
              strokeDasharray="5 5"
              dot={{ fill: CHART_COLORS.REFORM_LINE, r: 3 }}
              connectNulls
            />
          )}
          <Line
            type="stepAfter"
            dataKey="baseline"
            name="Current law"
            stroke={hasReform ? CHART_COLORS.BASE_LINE_WITH_REFORM : CHART_COLORS.BASE_LINE_ALONE}
            dot={{
              fill: hasReform ? CHART_COLORS.BASE_LINE_WITH_REFORM : CHART_COLORS.BASE_LINE_ALONE,
              r: 3,
            }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      {hasInfiniteValues && (
        <Text size="sm" c="gray.8" fs="italic" mt="xs">
          Note: Charts do not currently display parameters with values of positive or negative
          infinity.
        </Text>
      )}
    </div>
  );
});
