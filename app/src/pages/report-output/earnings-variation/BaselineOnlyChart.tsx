import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartWatermark, TOOLTIP_STYLE } from '@/components/charts';
import { colors, typography } from '@/designTokens';
import { MOBILE_BREAKPOINT_QUERY } from '@/hooks/useChartDimensions';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useViewportSize } from '@/hooks/useViewportSize';
import type { AppHouseholdInputEnvelope as Household } from '@/models/household/appTypes';
import type { RootState } from '@/store';
import {
  getClampedChartHeight,
  getNiceTicks,
  getYAxisLayout,
  RECHARTS_FONT_STYLE,
} from '@/utils/chartUtils';
import { formatChartValueForVariable } from '@/utils/chartValueFormatting';
import { currencySymbol } from '@/utils/formatters';
import { getHeadOfHouseholdPersonName } from '@/utils/householdHead';
import { getValueFromHousehold } from '@/utils/householdValues';
import {
  buildHouseholdVariationEarningsAxis,
  getHouseholdVariationIndexForEarnings,
  getHouseholdVariationMaxEarnings,
} from '@/utils/householdVariationAxes';

interface Props {
  baseline: Household;
  baselineVariation: Household;
  focusPersonName?: string | null;
  variableName: string;
  year: string;
}

function EarningsTooltip({ active, payload, label, formatValue, symbol }: any) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div style={TOOLTIP_STYLE}>
      <p style={{ fontWeight: typography.fontWeight.semibold, margin: 0 }}>
        Earnings: {symbol}
        {Number(label).toLocaleString()}
      </p>
      {payload.map((p: any) => (
        <p
          key={p.name}
          style={{ margin: '2px 0', fontSize: typography.fontSize.sm, color: p.stroke }}
        >
          {p.name}: {formatValue(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

/**
 * Chart showing baseline values across earnings range
 * Single line with marker at current earnings position
 */
export default function BaselineOnlyChart({
  baseline,
  baselineVariation,
  focusPersonName,
  variableName,
  year,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);
  const variable = metadata.variables[variableName];

  const chartSeries = useMemo(() => {
    const yValues = getValueFromHousehold(variableName, year, null, baselineVariation, metadata);

    if (!Array.isArray(yValues)) {
      return null;
    }

    const resolvedFocusPersonName = focusPersonName ?? getHeadOfHouseholdPersonName(baseline, year);
    const currentEarnings = getValueFromHousehold(
      'employment_income',
      year,
      resolvedFocusPersonName,
      baseline,
      metadata
    ) as number;
    const maxEarnings = getHouseholdVariationMaxEarnings(currentEarnings, countryId);
    const xValues = buildHouseholdVariationEarningsAxis(maxEarnings);
    const currentIndex = getHouseholdVariationIndexForEarnings(currentEarnings, maxEarnings);
    const chartData = xValues.map((earnings, index) => ({
      earnings,
      value: yValues[index],
    }));
    const exactCurrentValue = getValueFromHousehold(variableName, year, null, baseline, metadata);
    const currentValue =
      typeof exactCurrentValue === 'number'
        ? exactCurrentValue
        : ((chartData[currentIndex]?.value ??
            getValueFromHousehold(variableName, year, null, baseline, metadata)) as number);
    const yNumValues = chartData.map((datum) => datum.value);

    return {
      chartData,
      currentEarnings,
      currentValue,
      maxEarnings,
      xTicks: getNiceTicks([0, maxEarnings]),
      yTicks: getNiceTicks([Math.min(...yNumValues), Math.max(...yNumValues)]),
    };
  }, [baseline, baselineVariation, countryId, metadata, variableName, year]);

  if (!variable) {
    return <div>Variable not found</div>;
  }

  if (!chartSeries) {
    return <div>No variation data available</div>;
  }

  const symbol = currencySymbol(countryId);
  const formatValue = (value: number) => formatChartValueForVariable(value, variable, countryId);
  const yAxis = getYAxisLayout(chartSeries.yTicks, true, formatValue);
  const chartMargin = { top: 20, right: 20, bottom: 80, left: yAxis.marginLeft };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartSeries.chartData} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="earnings"
            type="number"
            domain={[0, chartSeries.maxEarnings]}
            ticks={chartSeries.xTicks}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={(v: number) => `${symbol}${v.toLocaleString()}`}
          >
            <Label
              value="Employment income"
              position="bottom"
              offset={20}
              style={RECHARTS_FONT_STYLE}
            />
          </XAxis>
          <YAxis
            ticks={chartSeries.yTicks}
            domain={[chartSeries.yTicks[0], chartSeries.yTicks[chartSeries.yTicks.length - 1]]}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={(value: number) => formatValue(value)}
            width={yAxis.yAxisWidth}
          >
            <Label
              value={variable.label}
              angle={-90}
              position="center"
              dx={yAxis.labelDx}
              style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
            />
          </YAxis>
          <Tooltip content={<EarningsTooltip symbol={symbol} formatValue={formatValue} />} />
          <Legend verticalAlign="top" align="left" />
          <Line
            type="monotone"
            dataKey="value"
            name="Baseline"
            stroke={colors.primary[500]}
            strokeWidth={2}
            dot={false}
          />
          <ReferenceDot
            x={chartSeries.currentEarnings}
            y={chartSeries.currentValue}
            r={5}
            fill={colors.primary[500]}
            stroke={colors.background.primary}
            strokeWidth={2}
            ifOverflow="visible"
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartWatermark />
    </div>
  );
}
