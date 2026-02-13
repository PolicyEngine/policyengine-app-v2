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
import { useMediaQuery, useViewportSize } from '@mantine/hooks';
import { colors } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import { getClampedChartHeight, RECHARTS_FONT_STYLE, RECHARTS_WATERMARK } from '@/utils/chartUtils';
import { currencySymbol } from '@/utils/formatters';
import { getValueFromHousehold } from '@/utils/householdValues';
import * as styles from './earningsCharts.css';

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
    <div
      style={{
        background: '#fff',
        border: '1px solid #E2E8F0',
        borderRadius: 6,
        padding: '8px 12px',
      }}
    >
      <p style={{ fontWeight: 600, margin: 0 }}>
        Earnings: {symbol}
        {Number(label).toLocaleString()}
      </p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ margin: '2px 0', fontSize: 13, color: p.stroke }}>
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
  const mobile = useMediaQuery('(max-width: 768px)');
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

  return (
    <div className={styles.chartWrapper}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 80, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="earnings"
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
          <YAxis tick={RECHARTS_FONT_STYLE}>
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
      <img
        src={RECHARTS_WATERMARK.src}
        alt=""
        className={styles.watermark}
        style={{ width: RECHARTS_WATERMARK.width }}
      />
    </div>
  );
}
