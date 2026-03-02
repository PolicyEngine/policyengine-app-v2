import { memo, useMemo, useRef } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TOOLTIP_STYLE } from '@/components/charts';
import { CHART_COLORS } from '@/constants/chartColors';
import {
  CHART_DISPLAY_EXTENSION_DATE,
  YEARS_INTO_FUTURE_FOR_CHART,
} from '@/constants/chartConstants';
import { typography } from '@/designTokens';
import { useChartWidth, useIsMobile, useWindowHeight } from '@/hooks/useChartDimensions';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';
import { extendForDisplay, filterInfiniteValues } from '@/utils/chartDateUtils';
import { getNiceTicks, getReformPolicyLabel, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
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
    <div className="tw:flex tw:flex-col tw:gap-sm tw:mt-xl">
      <p className="tw:font-bold">Historical values</p>
      <p>{capitalize(param.label)} over time</p>
      <ParameterOverTimeChart
        param={param}
        baseValuesCollection={baseValues}
        reformValuesCollection={reformValues}
        policyLabel={policyLabel}
        policyId={policyId}
      />
    </div>
  );
}

function HistoricalTooltip({ active, payload, label, param }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  const dateStr = new Date(label).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: typography.fontWeight.semibold, margin: 0 }}>{dateStr}</p>
      {payload.map((p: any) => (
        <p
          key={p.name}
          style={{ margin: '2px 0', fontSize: typography.fontSize.sm, color: p.stroke }}
        >
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

  // Memoize axis calculations with nice ticks
  const { maxDate, yMin, yMax, yTicks } = useMemo(() => {
    try {
      // Compute display end date:
      // - Default: current year + 10
      // - If any real data point (excluding the 2099 extension) goes beyond that,
      //   extend to that point's year + 5
      const currentYear = new Date().getFullYear();
      const defaultEndYear = currentYear + YEARS_INTO_FUTURE_FOR_CHART;

      const allRealDates = [...x, ...reformedX].filter((d) => d !== CHART_DISPLAY_EXTENSION_DATE);
      const latestRealYear =
        allRealDates.length > 0
          ? Math.max(...allRealDates.map((d) => new Date(d).getFullYear()))
          : currentYear;

      const endYear = latestRealYear > defaultEndYear ? latestRealYear + 5 : defaultEndYear;
      const maxDate = `${endYear}-12-31`;

      const yaxisValues = reformValuesCollection ? [...y, ...reformedY] : y;

      const numericYValues = yaxisValues.map((v) => Number(v)).filter((v) => !isNaN(v));
      let minY = Math.min(...numericYValues);
      let maxY = Math.max(...numericYValues);

      // Ensure 0 is always visible
      minY = Math.min(minY, 0);

      // For percentages, also ensure 100% is always visible
      if (param.unit === '/1') {
        maxY = Math.max(maxY, 1);
      }

      if (minY === maxY) {
        return { maxDate, yMin: 0, yMax: 1, yTicks: [0, 1] };
      }

      const ticks = getNiceTicks([minY, maxY]);

      return {
        maxDate,
        yMin: ticks[0],
        yMax: ticks[ticks.length - 1],
        yTicks: ticks,
      };
    } catch (error) {
      console.error('ParameterOverTimeChart: Error calculating axis formats', error);
      return { maxDate: '2036-12-31', yMin: 0, yMax: 1, yTicks: [0, 1] };
    }
  }, [x, y, reformedX, reformedY, reformValuesCollection, param.unit]);

  // Memoize reform label
  const reformLabel = useMemo(() => {
    return getReformPolicyLabel(policyLabel, policyId ? parseInt(policyId, 10) : null);
  }, [policyLabel, policyId]);

  // Check if any infinite values were filtered
  const hasInfiniteValues = hasInfiniteBase || hasInfiniteReform;

  const hasReform = reformValuesCollection && reformedX.length > 0 && reformedY.length > 0;

  const EARLIEST_DISPLAY_DATE = '2013-01-01';

  // Memoize chart data transformation (dates stored as timestamps for proper time scaling)
  // The 2099 extension point is kept in the data so the stepAfter line extends beyond
  // the visible domain — the domain clamp hides it from view
  const displayStartTs = new Date(EARLIEST_DISPLAY_DATE).getTime();

  const chartData = useMemo(() => {
    const data: Record<string, any>[] = x.map((date, i) => {
      const point: Record<string, any> = {
        date: new Date(date).getTime(),
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
        const ts = new Date(date).getTime();
        if (!data.find((d) => d.date === ts)) {
          data.push({ date: ts, reform: +reformedY[i] });
        }
      });
      data.sort((a, b) => a.date - b.date);
    }

    // If all data points are before the display start (e.g. year 0 or 1),
    // the chart would appear empty. Find the value in effect at the display
    // start date and insert a synthetic point so the line begins at the left edge.
    const hasVisiblePoint = data.some(
      (d) => d.date >= displayStartTs && d.date !== new Date(CHART_DISPLAY_EXTENSION_DATE).getTime()
    );
    if (!hasVisiblePoint && data.length > 0) {
      // Find the latest point before the display start (the value in effect)
      const priorPoints = data.filter((d) => d.date < displayStartTs);
      if (priorPoints.length > 0) {
        const latest = priorPoints[priorPoints.length - 1];
        const syntheticPoint: Record<string, any> = {
          date: displayStartTs,
          baseline: latest.baseline,
        };
        if (hasReform && latest.reform !== undefined) {
          syntheticPoint.reform = latest.reform;
        }
        data.push(syntheticPoint);
        data.sort((a, b) => a.date - b.date);
      }
    }

    return data;
  }, [x, y, reformedX, reformedY, hasReform, displayStartTs]);

  // Memoize tick formatter
  const yTickFormatter = useMemo(() => {
    return getRechartsTickFormatter(param.unit || '', { decimalPlaces: 1 });
  }, [param.unit]);

  // Generate x-axis ticks at years divisible by 5 (or 10 if range > 40 years)
  const xTicks = useMemo(() => {
    const startYear = new Date(EARLIEST_DISPLAY_DATE).getFullYear();
    const endYear = new Date(maxDate).getFullYear();
    const range = endYear - startYear;
    const interval = range > 40 ? 10 : 5;

    const ticks: number[] = [];
    // Start from the first year divisible by interval at or after startYear
    const firstTick = Math.ceil(startYear / interval) * interval;
    for (let year = firstTick; year <= endYear; year += interval) {
      ticks.push(new Date(`${year}-01-01`).getTime());
    }
    return ticks;
  }, [maxDate]);

  // Early return if no valid data
  if (x.length === 0 || y.length === 0) {
    return (
      <div ref={chartContainerRef}>
        <p className="tw:text-gray-500 tw:text-center tw:py-xl">No data available to display</p>
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
            type="number"
            scale="time"
            allowDataOverflow
            tick={RECHARTS_FONT_STYLE}
            ticks={xTicks}
            tickFormatter={(ts: number) => String(new Date(ts).getFullYear())}
            domain={[new Date(EARLIEST_DISPLAY_DATE).getTime(), new Date(maxDate).getTime()]}
          />
          <YAxis
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={yTickFormatter}
            domain={[yMin, yMax]}
            ticks={yTicks}
          />
          <ReferenceLine y={0} stroke="#9CA3AF" strokeWidth={1} />
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
        <p className="tw:text-sm tw:text-gray-600 tw:italic tw:mt-xs">
          Note: Charts do not currently display parameters with values of positive or negative
          infinity.
        </p>
      )}
    </div>
  );
});
