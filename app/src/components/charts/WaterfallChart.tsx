/**
 * WaterfallChart — a Recharts-based waterfall chart using range bars.
 *
 * Recharts has no native waterfall support. The common workaround (stacking a
 * transparent base bar under a visible bar) breaks when barBottom is negative
 * because Recharts stacking always starts from 0.
 *
 * Instead we use Recharts' **range bar** feature: when a Bar's dataKey returns
 * an array `[low, high]`, Recharts renders the bar spanning exactly from `low`
 * to `high` on the Y-axis. This requires no stacking, no custom shapes, and
 * handles positive/negative/mixed values correctly.
 */

import type { ReactElement } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Stack } from '@mantine/core';
import { spacing } from '@/designTokens/spacing';
import { RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { ChartWatermark } from './ChartWatermark';
import { TOOLTIP_STYLE } from './tooltipStyle';
import type { WaterfallDatum } from './waterfallUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WaterfallChartProps {
  /** Pre-computed waterfall data from computeWaterfallData() */
  data: WaterfallDatum[];
  /** Y-axis domain from getWaterfallDomain() */
  yDomain: [number, number];
  /** Chart height in pixels */
  height: number;
  /** Y-axis label (e.g. "Budgetary impact (bn)") */
  yAxisLabel?: string;
  /** Y-axis tick formatter */
  yTickFormatter?: (value: number) => string;
  /** Explicit Y-axis tick values (overrides yTickCount when provided) */
  yTicks?: number[];
  /** Number of Y-axis ticks when yTicks not provided (default: 5) */
  yTickCount?: number;
  /** Fill color resolver — receives datum, returns CSS color string */
  fillColor: (datum: WaterfallDatum) => string;
  /** Optional custom tooltip content */
  tooltipContent?: ReactElement;
  /** Chart margins */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
}

// ---------------------------------------------------------------------------
// Bar label — rendered inside each bar
// ---------------------------------------------------------------------------

function WaterfallBarLabel({ x, y, width, height, index, data }: any) {
  const entry: WaterfallDatum | undefined = data?.[index];
  if (!entry || x === undefined || y === undefined || width === undefined) {
    return null;
  }
  const labelY = y + height / 2;
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fill="#fff"
      fontWeight={500}
    >
      {entry.label}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function WaterfallTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) {
    return null;
  }
  const data = payload[0].payload as WaterfallDatum;
  return (
    <div style={{ ...TOOLTIP_STYLE, maxWidth: 'min(300px, 90vw)' }}>
      <p style={{ fontWeight: 600, margin: 0 }}>{data.name}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WaterfallChart({
  data,
  yDomain,
  height,
  yAxisLabel,
  yTickFormatter,
  fillColor,
  tooltipContent,
  yTicks,
  yTickCount = 5,
  margin = { top: 20, right: 20, bottom: 30, left: 20 },
}: WaterfallChartProps) {
  return (
    <Stack gap={spacing.sm}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={RECHARTS_FONT_STYLE} />
          <YAxis
            domain={yDomain}
            ticks={yTicks}
            tickCount={yTicks ? undefined : yTickCount}
            tick={RECHARTS_FONT_STYLE}
            tickFormatter={yTickFormatter}
          >
            {yAxisLabel && (
              <Label
                value={yAxisLabel}
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', ...RECHARTS_FONT_STYLE }}
              />
            )}
          </YAxis>
          <Tooltip content={tooltipContent ?? <WaterfallTooltip />} />
          <Bar
            dataKey="waterfallRange"
            isAnimationActive={false}
            label={<WaterfallBarLabel data={data} />}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={fillColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartWatermark />
    </Stack>
  );
}
