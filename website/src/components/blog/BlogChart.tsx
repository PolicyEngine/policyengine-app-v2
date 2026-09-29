"use client";

/**
 * Recharts chart block for blog posts.
 *
 * Renders a ```chart fenced block whose body is a JSON spec, using the same
 * ui-kit chart defaults as the app's charts: the shared axis, grid, tooltip
 * and legend styles, the chart color tokens, and the PolicyEngine watermark.
 * Posts carry data, not styling. Styles are inline token variables because
 * the website's Tailwind build uses a prefix that ui-kit's utility classes lack.
 *
 * Spec (type "bar"):
 * {
 *   "type": "bar",
 *   "title": "...", "subtitle": "...",
 *   "xKey": "group",
 *   "series": [{ "key": "census", "name": "Census", "color": "quinary" }, ...],
 *   "data": [{ "group": "All people", "census": 0.07 }, ...],
 *   "yLabel": "...",
 *   "format": { "decimals": 2, "suffix": " pp", "signed": true },
 *   "source": "..."
 * }
 */

import {
  AXIS_STYLE,
  GRID_STYLE,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
  chartColors,
} from "@policyengine/ui-kit/charts";
import { PolicyEngineWatermark } from "@policyengine/ui-kit/display";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartColorName = Exclude<keyof typeof chartColors, "series">;

export interface BlogChartSeries {
  key: string;
  name: string;
  color?: ChartColorName;
}

export interface BlogChartFormat {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  signed?: boolean;
}

export interface BlogChartSpec {
  type: "bar";
  title?: string;
  subtitle?: string;
  xKey: string;
  series: BlogChartSeries[];
  data: Record<string, string | number>[];
  yLabel?: string;
  format?: BlogChartFormat;
  source?: string;
  height?: number;
}

export function formatChartValue(
  value: number,
  format: BlogChartFormat = {},
): string {
  const { decimals = 1, prefix = "", suffix = "", signed = false } = format;
  const magnitude = Math.abs(value).toFixed(decimals);
  const isZero = Number(magnitude) === 0;
  const sign = value < 0 && !isZero ? "−" : signed && !isZero ? "+" : "";
  return `${sign}${prefix}${magnitude}${suffix}`;
}

export function parseBlogChartSpec(raw: string): BlogChartSpec | null {
  let spec: unknown;
  try {
    spec = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!spec || typeof spec !== "object") return null;
  const s = spec as Partial<BlogChartSpec>;
  if (s.type !== "bar" || typeof s.xKey !== "string") return null;
  if (!Array.isArray(s.series) || s.series.length === 0) return null;
  if (!Array.isArray(s.data) || s.data.length === 0) return null;
  if (
    !s.series.every(
      (x) => x && typeof x.key === "string" && typeof x.name === "string",
    )
  ) {
    return null;
  }
  return s as BlogChartSpec;
}

/**
 * Round the value range out to a step of 1, 2, 2.5 or 5 times a power of ten,
 * including zero, so tick labels land on round numbers.
 */
export function niceTicks(
  values: number[],
  target = 4,
): { domain: [number, number]; ticks: number[]; decimals: number } {
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  const span = hi - lo || 1;
  const raw = span / target;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ??
    10 * power;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= end + step / 2; t += step)
    ticks.push(Number(t.toFixed(10)));
  const decimals = Math.max(
    0,
    -Math.floor(Math.log10(step) + 1e-9) + (step / power === 2.5 ? 1 : 0),
  );
  return { domain: [start, end], ticks, decimals };
}

function seriesColor(series: BlogChartSeries, index: number): string {
  if (series.color && series.color in chartColors) {
    return chartColors[series.color];
  }
  return chartColors.series[index % chartColors.series.length];
}

interface ValueLabelProps {
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  value?: unknown;
  format: BlogChartFormat;
}

/** Value label above a positive bar and below a negative one; the unit lives on the axis. */
function ValueLabel({ x, y, width, height, value, format }: ValueLabelProps) {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  const nx = Number(x),
    ny = Number(y),
    nw = Number(width),
    nh = Number(height);
  const top = Math.min(ny, ny + nh);
  const bottom = Math.max(ny, ny + nh);
  return (
    <text
      x={nx + nw / 2}
      y={v >= 0 ? top - 6 : bottom + 14}
      textAnchor="middle"
      style={{ ...AXIS_STYLE, fill: "var(--text-secondary)" }}
    >
      {formatChartValue(v, { ...format, suffix: "" })}
    </text>
  );
}

export function BlogChart({ data }: { data: string | string[] }) {
  const raw = Array.isArray(data) ? data.join("") : data;
  const spec = parseBlogChartSpec(raw);
  if (!spec) return null;

  const format = spec.format ?? {};
  const hasNegative = spec.data.some((row) =>
    spec.series.some(
      (s) => typeof row[s.key] === "number" && (row[s.key] as number) < 0,
    ),
  );
  const values = spec.data.flatMap((row) =>
    spec.series
      .map((s) => row[s.key])
      .filter((v): v is number => typeof v === "number"),
  );
  const axis = niceTicks(values);
  const tickFormat = (v: number) =>
    formatChartValue(v, { ...format, decimals: axis.decimals });

  return (
    <figure style={{ margin: "24px 0 32px" }}>
      {(spec.title || spec.subtitle) && (
        <div style={{ marginBottom: 12 }}>
          {spec.title && (
            <h3
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.4,
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              {spec.title}
            </h3>
          )}
          {spec.subtitle && (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--muted-foreground)",
                margin: "4px 0 0",
              }}
            >
              {spec.subtitle}
            </p>
          )}
        </div>
      )}
      <ResponsiveContainer width="100%" height={spec.height ?? 360}>
        <BarChart
          data={spec.data}
          margin={{ top: 24, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid {...GRID_STYLE} vertical={false} />
          <XAxis
            dataKey={spec.xKey}
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            tickFormatter={tickFormat}
            domain={axis.domain}
            ticks={axis.ticks}
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
          {hasNegative && <ReferenceLine y={0} stroke="var(--border-dark)" />}
          <Tooltip
            {...TOOLTIP_STYLE}
            cursor={{ fill: "var(--background-tertiary)" }}
            formatter={(value, name) => [
              formatChartValue(Number(value), format),
              String(name),
            ]}
          />
          <Legend {...LEGEND_STYLE} iconType="square" />
          {spec.series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={seriesColor(s, i)}
              radius={[2, 2, 0, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey={s.key}
                content={(props) => <ValueLabel {...props} format={format} />}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <PolicyEngineWatermark
        styles={{
          root: { display: "flex", justifyContent: "flex-end", marginTop: 4 },
        }}
      />
      {spec.source && (
        <figcaption
          style={{
            ...AXIS_STYLE,
            color: "var(--text-secondary)",
            marginTop: 8,
          }}
        >
          {spec.source}
        </figcaption>
      )}
    </figure>
  );
}
