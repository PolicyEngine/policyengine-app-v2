/**
 * WaterfallChart — a Recharts-based waterfall chart using stacked bars.
 *
 * Matches the policyengine-ui-kit PEWaterfallChart rendering exactly:
 * transparent `base` bar + visible `value` bar with `stackId="waterfall"`,
 * rounded top corners, dynamic y-axis layout, and bar labels.
 */

import type { ReactElement } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Stack } from '@/components/ui';
import { typography } from '@/designTokens';
import { colors } from '@/designTokens/colors';
import { getYAxisLayout, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';
import { ChartWatermark } from './ChartWatermark';
import { TOOLTIP_STYLE } from './tooltipStyle';
import { computeWaterfallConnectors, type WaterfallDatum } from './waterfallUtils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WaterfallChartProps {
  /** Pre-computed waterfall data from computeWaterfallData() */
  data: WaterfallDatum[];
  /** Y-axis domain from getWaterfallDomain() */
  yDomain: [number, number];
  /** Chart height in pixels (ignored when fillHeight is true) */
  height?: number;
  /** When true, chart fills its parent via flex layout instead of using a fixed height */
  fillHeight?: boolean;
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
  /** Chart margins (left is dynamically computed via getYAxisLayout) */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Whether to show bar labels (default: true) */
  showBarLabels?: boolean;
  /** Formatter for bar labels (receives the signed value) */
  barLabelFormatter?: (value: number) => string;
  /** Whether to show dashed connector lines between bars (default: true) */
  showConnectors?: boolean;
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
      <p style={{ fontWeight: typography.fontWeight.semibold, margin: 0 }}>{data.name}</p>
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
  fillHeight = false,
  yAxisLabel,
  yTickFormatter,
  fillColor,
  tooltipContent,
  yTicks,
  yTickCount = 5,
  margin = { top: 20, right: 20, bottom: 40, left: 0 },
  showBarLabels = true,
  barLabelFormatter,
  showConnectors = true,
}: WaterfallChartProps) {
  const computedTicks = yTicks ?? [];
  const yAxis = getYAxisLayout(computedTicks, !!yAxisLabel, yTickFormatter);

  // Pre-compute connector lookup: for each target bar index, the connector info
  const connectors = showConnectors ? computeWaterfallConnectors(data) : [];
  const connectorsByTarget = new Map(connectors.map((c) => [c.toIndex, c]));

  // Mutable array that collects bar pixel positions during label rendering.
  // Recharts calls the label function for each bar in index order, so when
  // bar i+1 renders, bar i's position is already stored.
  const barPositions: { x: number; y: number; width: number; height: number }[] = [];

  // Combined render function for bar labels + connector lines.
  // Recharts' label prop receives exact SVG pixel coordinates for each bar,
  // which is the most reliable way to position connector lines.
  const renderLabelAndConnectors =
    showBarLabels || showConnectors
      ? (props: any) => {
          const idx = props.index as number;
          const x = props.x as number;
          const y = props.y as number;
          const w = props.width as number;
          const h = props.height as number;
          // Use the datum's value, not props.value — Recharts gives the
          // cumulative stack-top for stacked bars, which is wrong for labels.
          const datum = data[idx];

          // Store this bar's pixel rect for the next bar's connector
          barPositions[idx] = { x, y, width: w, height: h };

          // Check if there's a connector INTO this bar from a previous bar
          const conn = connectorsByTarget.get(idx);
          const fromBar = conn ? barPositions[conn.fromIndex] : undefined;

          // The connector Y pixel is the top edge of the FROM bar.
          // For positive bars: y = pixel(base + value) = running total → correct.
          // For negative bars: y = pixel(base) = stacking point; the bar
          //   extends downward, and the running total = base, so y is also correct.
          const connYPx = fromBar?.y;

          const barHeight = Math.abs(h);
          const showLabel = showBarLabels && barHeight >= 20;
          const text = barLabelFormatter ? barLabelFormatter(datum.value) : datum.label;

          return (
            <g>
              {connYPx != null && fromBar && (
                <line
                  x1={fromBar.x + fromBar.width}
                  y1={connYPx}
                  x2={x}
                  y2={connYPx}
                  stroke={colors.gray[300]}
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              )}
              {showLabel && (
                <text
                  x={x + w / 2}
                  y={y + h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fontWeight={500}
                  fontFamily={typography.fontFamily.primary}
                  fill="#FFFFFF"
                >
                  {text}
                </text>
              )}
            </g>
          );
        }
      : undefined;

  const chart = (
    <ResponsiveContainer width="100%" height={fillHeight ? '100%' : height}>
      <BarChart data={data} margin={{ ...margin, left: (margin.left ?? 0) + yAxis.marginLeft }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} syncWithTicks />
        <XAxis
          dataKey="name"
          tick={RECHARTS_FONT_STYLE}
          tickLine={false}
          axisLine={{ stroke: colors.gray[200] }}
        />
        <YAxis
          domain={yDomain}
          ticks={yTicks}
          tickCount={yTicks ? undefined : yTickCount}
          tick={RECHARTS_FONT_STYLE}
          tickLine={false}
          axisLine={{ stroke: colors.gray[200] }}
          tickFormatter={yTickFormatter}
          width={yAxis.yAxisWidth}
          label={
            yAxisLabel
              ? {
                  value: yAxisLabel,
                  angle: -90,
                  position: 'center' as const,
                  dx: yAxis.labelDx,
                  style: { textAnchor: 'middle', ...RECHARTS_FONT_STYLE },
                }
              : undefined
          }
        />
        <ReferenceLine y={0} stroke={colors.gray[600]} strokeWidth={1} />
        {tooltipContent ? (
          <Tooltip content={tooltipContent} />
        ) : (
          <Tooltip content={<WaterfallTooltip />} />
        )}
        <Bar
          dataKey="base"
          stackId="waterfall"
          fill="none"
          stroke="none"
          isAnimationActive={false}
          shape={(props: any) => (
            <rect
              x={props.x}
              y={props.y}
              width={props.width}
              height={props.height}
              fill="none"
              stroke="none"
            />
          )}
        />
        <Bar
          dataKey="value"
          stackId="waterfall"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          label={renderLabelAndConnectors}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={fillColor(entry)} stroke="none" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  if (fillHeight) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flex: 1, minHeight: 0 }}>{chart}</div>
        <div style={{ flexShrink: 0 }}>
          <ChartWatermark />
        </div>
      </div>
    );
  }

  return (
    <Stack gap="sm">
      {chart}
      <ChartWatermark />
    </Stack>
  );
}
