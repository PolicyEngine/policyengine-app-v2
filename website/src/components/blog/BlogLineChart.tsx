"use client";

/**
 * Line body for ```chart blocks of type "line".
 *
 * Draws one or more series against a numeric x axis, such as a tax schedule
 * by income. Both axes round out to nice ticks; the y axis includes zero
 * unless "yIncludesZero" is false, and the x axis spans the data only. A series with "step": true holds each value
 * until the next point, for rates that jump at thresholds. Optional markers
 * draw dashed vertical lines at named x values, labelled horizontally in a
 * strip above the plot, one row per marker, so labels cross neither the
 * data nor each other.
 *
 * Spec:
 * {
 *   "type": "line",
 *   "title": "...", "subtitle": "...",
 *   "xKey": "income",
 *   "xLabel": "Total income",
 *   "series": [
 *     { "key": "baseline", "name": "Without the reform", "color": "quinary" },
 *     { "key": "reform", "name": "With the reform", "color": "primary", "step": false }
 *   ],
 *   "data": [{ "income": 12000, "baseline": 0, "reform": 0 }, ...],
 *   "markers": [{ "x": 12570, "label": "Personal Allowance" }],
 *   "yLabel": "...",
 *   "format": { "prefix": "£", "decimals": 0, "separator": true },
 *   "xFormat": { "prefix": "£", "decimals": 0, "separator": true },
 *   "source": "..."
 * }
 *
 * Data rows must be sorted by x, and every row needs a number for every
 * series, or the spec is rejected.
 */

import {
  AXIS_STYLE,
  GRID_STYLE,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
} from "@policyengine/ui-kit/charts";
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
} from "recharts";

import {
  type BlogChartFormat,
  type BlogChartRow,
  type ChartColorName,
  chartColor,
  formatChartValue,
  isFiniteNumber,
  isRecord,
  niceTicks,
  validFormat,
} from "./blogChartUtils";

export interface BlogLineSeries {
  key: string;
  name: string;
  color?: ChartColorName;
  step?: boolean;
}

export interface BlogLineMarker {
  x: number;
  label: string;
}

export interface BlogLineSpec {
  type: "line";
  title?: string;
  subtitle?: string;
  xKey: string;
  xLabel?: string;
  series: BlogLineSeries[];
  data: BlogChartRow[];
  markers?: BlogLineMarker[];
  yLabel?: string;
  /** False fits the y axis to the data, for levels far from zero. */
  yIncludesZero?: boolean;
  format?: BlogChartFormat;
  xFormat?: BlogChartFormat;
  source?: string;
  height?: number;
}

export function parseLineSpec(s: Record<string, unknown>): BlogLineSpec | null {
  if (s.type !== "line" || typeof s.xKey !== "string") return null;
  if (s.xLabel !== undefined && typeof s.xLabel !== "string") return null;
  if (!validFormat(s.xFormat)) return null;
  if (s.yIncludesZero !== undefined && typeof s.yIncludesZero !== "boolean") {
    return null;
  }
  if (!Array.isArray(s.series) || s.series.length === 0) return null;
  if (
    !s.series.every(
      (x) =>
        isRecord(x) &&
        typeof x.key === "string" &&
        typeof x.name === "string" &&
        (x.step === undefined || typeof x.step === "boolean"),
    )
  ) {
    return null;
  }
  if (!Array.isArray(s.data) || s.data.length < 2) return null;
  const keys = (s.series as BlogLineSeries[]).map((x) => x.key);
  const xKey = s.xKey;
  let previous = -Infinity;
  for (const row of s.data) {
    if (!isRecord(row) || !isFiniteNumber(row[xKey])) return null;
    if (row[xKey] < previous) return null;
    previous = row[xKey];
    if (!keys.every((k) => isFiniteNumber(row[k]))) return null;
  }
  if (
    s.markers !== undefined &&
    !(
      Array.isArray(s.markers) &&
      s.markers.every(
        (m) =>
          isRecord(m) && isFiniteNumber(m.x) && typeof m.label === "string",
      )
    )
  ) {
    return null;
  }
  return s as unknown as BlogLineSpec;
}

const MARKER_ROW_HEIGHT = 16;

interface MarkerLabelProps {
  viewBox?: { x?: number; y?: number };
  value: string;
  row: number;
  rows: number;
  anchor: "start" | "end";
}

/** A marker's label in the strip above the plot, in its own row, beside its
 * line: right of it in the left half of the plot, left of it in the right
 * half. */
function MarkerLabel({ viewBox, value, row, rows, anchor }: MarkerLabelProps) {
  const x = Number(viewBox?.x);
  const y = Number(viewBox?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return (
    <text
      x={anchor === "start" ? x + 4 : x - 4}
      y={y - 6 - (rows - 1 - row) * MARKER_ROW_HEIGHT}
      textAnchor={anchor}
      style={{
        ...AXIS_STYLE,
        fill: "var(--text-secondary)",
        stroke: "var(--background)",
        strokeWidth: 3,
        paintOrder: "stroke",
      }}
    >
      {value}
    </text>
  );
}

export function LineBody({ spec }: { spec: BlogLineSpec }) {
  const format = spec.format ?? {};
  const xFormat = spec.xFormat ?? {};
  const xs = spec.data.map((row) => row[spec.xKey] as number);
  const values = spec.data.flatMap((row) =>
    spec.series.map((s) => row[s.key] as number),
  );
  const yAxis = niceTicks(values, 4, spec.yIncludesZero ?? true);
  const xAxis = niceTicks(xs, 6, false);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const xTicks = xAxis.ticks.filter((t) => t >= xMin && t <= xMax);
  const markerRows = spec.markers?.length ?? 0;
  const yTick = (v: number) =>
    formatChartValue(v, { ...format, decimals: yAxis.decimals });
  // Room for the longest tick label, plus the rotated axis title.
  const yAxisWidth =
    Math.max(...yAxis.ticks.map((t) => yTick(t).length)) * 7 +
    (spec.yLabel ? 28 : 12);
  const xTick = (v: number) =>
    formatChartValue(v, { ...xFormat, decimals: xAxis.decimals });

  return (
    <ResponsiveContainer width="100%" height={spec.height ?? 360}>
      <LineChart
        data={spec.data}
        margin={{
          top: 16 + markerRows * MARKER_ROW_HEIGHT,
          right: 24,
          bottom: 8,
          left: 8,
        }}
      >
        <CartesianGrid {...GRID_STYLE} vertical={false} />
        <XAxis
          dataKey={spec.xKey}
          type="number"
          domain={[xMin, xMax]}
          ticks={xTicks}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          tickFormatter={xTick}
          label={
            spec.xLabel
              ? {
                  value: spec.xLabel,
                  position: "insideBottom",
                  offset: -4,
                  style: AXIS_STYLE,
                }
              : undefined
          }
        />
        <YAxis
          width={yAxisWidth}
          tick={AXIS_STYLE}
          axisLine={false}
          tickLine={false}
          tickFormatter={yTick}
          domain={yAxis.domain}
          ticks={yAxis.ticks}
          label={
            spec.yLabel
              ? {
                  value: spec.yLabel,
                  angle: -90,
                  position: "insideLeft",
                  style: { ...AXIS_STYLE, textAnchor: "middle" },
                }
              : undefined
          }
        />
        {(spec.markers ?? []).map((m, i) => (
          <ReferenceLine
            key={`${m.x}-${m.label}`}
            x={m.x}
            stroke="var(--border-dark)"
            strokeDasharray="4 4"
            label={(props: { viewBox?: { x?: number; y?: number } }) => (
              <MarkerLabel
                viewBox={props.viewBox}
                value={m.label}
                row={i}
                rows={markerRows}
                anchor={m.x < (xMin + xMax) / 2 ? "start" : "end"}
              />
            )}
          />
        ))}
        <Tooltip
          {...TOOLTIP_STYLE}
          labelFormatter={(x) => formatChartValue(Number(x), xFormat)}
          formatter={(value, name) => [
            formatChartValue(Number(value), format),
            String(name),
          ]}
        />
        <Legend {...LEGEND_STYLE} iconType="plainline" />
        {spec.series.map((s, i) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={s.name}
            type={s.step ? "stepAfter" : "linear"}
            stroke={chartColor(s.color, i)}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
