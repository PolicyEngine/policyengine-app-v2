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
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import { getClampedChartHeight, getNiceTicks, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
import { getValueFromHousehold } from '@/utils/householdValues';

interface Props {
  baseline: Household;
  baselineVariation: Household;
  variableName: string;
  year: string;
}

function EarningsTooltip({ active, payload, label, symbol }: any) {
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
          {p.name}: {p.value}
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
  variableName,
  year,
}: Props) {
  const mobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const { height: viewportHeight } = useViewportSize();
  const countryId = useCurrentCountry();
  const metadata = useSelector((state: RootState) => state.metadata);
  const chartHeight = getClampedChartHeight(viewportHeight, mobile);

  const variable = metadata.variables[variableName];
  if (!variable) {
    return <div>Variable not found</div>;
  }

  // Get variation data (401-point array)
  const yValues = getValueFromHousehold(variableName, year, null, baselineVariation, metadata);

  if (!Array.isArray(yValues)) {
    return <div>No variation data available</div>;
  }

  // Get current value at actual earnings
  const currentValue = getValueFromHousehold(
    variableName,
    year,
    null,
    baseline,
    metadata
  ) as number;

  // Get current earnings to show marker position
  const currentEarnings = getValueFromHousehold(
    'employment_income',
    year,
    null,
    baseline,
    metadata
  ) as number;

  // X-axis is earnings range
  const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
  const xValues = Array.from({ length: 401 }, (_, i) => (i * maxEarnings) / 400);

  const symbol = currencySymbol(countryId);

  const chartData = xValues.map((x, i) => ({
    earnings: x,
    value: yValues[i],
  }));

  const xTicks = getNiceTicks([0, maxEarnings]);
  const yNumValues = chartData.map((d) => d.value);
  const yTicks = getNiceTicks([Math.min(...yNumValues), Math.max(...yNumValues)]);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 80, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="earnings"
            ticks={xTicks}
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
            ticks={yTicks}
            domain={[yTicks[0], yTicks[yTicks.length - 1]]}
            tick={RECHARTS_FONT_STYLE}
          >
            <Label
              value={variable.label}
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
            />
          </YAxis>
          <Tooltip content={<EarningsTooltip symbol={symbol} />} />
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
            x={currentEarnings}
            y={currentValue}
            r={5}
            fill={colors.primary[500]}
            stroke={colors.primary[500]}
          />
        </LineChart>
      </ResponsiveContainer>
      <ChartWatermark />
    </div>
  );
}
