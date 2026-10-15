/**
 * The report's waterfall chart: the shared WaterfallChart's stacked bars
 * (a transparent base under a visible change), with a value axis that hugs
 * the data and a label on every bar.
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
import {
  ChartWatermark,
  computeWaterfallConnectors,
  type WaterfallDatum,
} from '@/components/charts';
import {
  fitAxisTitle,
  fixedPlotHeight,
  getCategoryAxis,
  getWaterfallLayout,
  tickDecimals,
} from '@/components/flagship/report/charts/barLayout';
import { BarValueText } from '@/components/flagship/report/charts/ReportBarLabel';
import { usePlotSize } from '@/components/flagship/report/charts/usePlotSize';
import { Stack } from '@/components/ui';
import { colors } from '@/designTokens';
import { getYAxisLayout, RECHARTS_FONT_STYLE } from '@/utils/chartUtils';

/** Margins around the plot; the category labels sit in the x-axis's own height. */
const MARGIN = { top: 12, right: 20, bottom: 8, left: 0 };

export interface ReportWaterfallChartProps {
  /** Waterfall bars from computeWaterfallData(). */
  data: WaterfallDatum[];
  /** Fill the parent's height instead of `height`. */
  fillHeight?: boolean;
  /** Chart height, px, when not filling the parent. */
  height?: number;
  /** Axis titles from longest to shortest: the first that fits is shown. */
  yAxisTitles?: string[];
  /** Formats a tick; `decimals` is the fewest that write every tick exactly. */
  formatTick: (value: number, decimals: number) => string;
  /** Formats a bar's signed value for its label. */
  formatBarLabel: (value: number) => string;
  fillColor: (datum: WaterfallDatum) => string;
  tooltipContent: ReactElement;
}

export default function ReportWaterfallChart({
  data,
  fillHeight = false,
  height = 400,
  yAxisTitles = [],
  formatTick,
  formatBarLabel,
  fillColor,
  tooltipContent,
}: ReportWaterfallChartProps) {
  const { plotWidth, plotHeight, probe } = usePlotSize(
    fillHeight ? undefined : fixedPlotHeight(height, MARGIN)
  );
  const { domain, ticks, placements } = getWaterfallLayout(data, plotHeight);
  // Every bar keeps its label on a narrow screen, wrapped to its slot.
  const categoryAxis = getCategoryAxis(
    data.map((datum) => datum.name),
    plotWidth,
    RECHARTS_FONT_STYLE
  );
  const decimals = tickDecimals(ticks);
  const tickFormatter = (value: number) => formatTick(value, decimals);
  const yAxisTitle = fitAxisTitle(yAxisTitles, plotHeight);
  const yAxis = getYAxisLayout(ticks, !!yAxisTitle, tickFormatter);

  const connectorsByTarget = new Map(
    computeWaterfallConnectors(data).map((connector) => [connector.toIndex, connector])
  );
  // Recharts draws the labels in bar order, so each connector finds the
  // bar it starts from already placed.
  const barRects: Array<{ x: number; y: number; width: number; height: number }> = [];

  const renderLabel = (props: any) => {
    const index = props.index as number;
    const datum = data[index];
    const rect = {
      x: Number(props.x),
      y: Number(props.y),
      width: Number(props.width),
      height: Number(props.height),
    };
    barRects[index] = rect;
    const connector = connectorsByTarget.get(index);
    const from = connector ? barRects[connector.fromIndex] : undefined;
    const connectorY =
      from && connector
        ? data[connector.fromIndex].runningTotalEdge === 'top'
          ? from.y
          : from.y + from.height
        : undefined;
    return (
      <g>
        {from && connectorY !== undefined && (
          <line
            x1={from.x + from.width}
            y1={connectorY}
            x2={rect.x}
            y2={connectorY}
            stroke={colors.gray[300]}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        {datum && placements[index] && (
          <BarValueText
            rect={rect}
            text={formatBarLabel(datum.value)}
            placement={placements[index]}
          />
        )}
      </g>
    );
  };

  const chart = (
    <ResponsiveContainer width="100%" height={fillHeight ? '100%' : height}>
      <BarChart data={data} margin={{ ...MARGIN, left: MARGIN.left + yAxis.marginLeft }}>
        {probe}
        <CartesianGrid strokeDasharray="3 3" vertical={false} syncWithTicks />
        <XAxis
          dataKey="name"
          interval={0}
          tick={categoryAxis.tick}
          height={categoryAxis.height}
          tickLine={false}
          axisLine={{ stroke: colors.gray[200] }}
        />
        <YAxis
          domain={domain}
          ticks={ticks}
          tick={RECHARTS_FONT_STYLE}
          tickLine={false}
          axisLine={{ stroke: colors.gray[200] }}
          tickFormatter={tickFormatter}
          width={yAxis.yAxisWidth}
          label={
            yAxisTitle
              ? {
                  value: yAxisTitle,
                  angle: -90,
                  position: 'center' as const,
                  dx: yAxis.labelDx,
                  style: { textAnchor: 'middle', ...RECHARTS_FONT_STYLE },
                }
              : undefined
          }
        />
        <ReferenceLine y={0} stroke={colors.gray[600]} strokeWidth={1} />
        <Tooltip content={tooltipContent} />
        <Bar
          dataKey="base"
          stackId="waterfall"
          fill="none"
          stroke="none"
          isAnimationActive={false}
          // A spacer below zero comes with a negative height, which SVG
          // rejects; draw the same box from its top instead.
          shape={(props: any) => (
            <rect
              x={props.x}
              y={props.height < 0 ? props.y + props.height : props.y}
              width={props.width}
              height={Math.abs(props.height ?? 0)}
              fill="none"
              stroke="none"
            />
          )}
        />
        <Bar
          dataKey="barHeight"
          stackId="waterfall"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
          label={renderLabel}
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
