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
 * Types: "bar" (below), "waterfall" (BlogWaterfallChart.tsx) and "stateMap"
 * (BlogStateMap.tsx). Every type takes an optional "title", "subtitle" and
 * "source"; an invalid spec renders nothing.
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

import { type ReactNode, useId } from "react";
import {
  AXIS_STYLE,
  GRID_STYLE,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
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

import {
  type BlogChartFormat,
  type BlogChartRow,
  type ChartColorName,
  chartColor,
  formatChartValue,
  isFiniteNumber,
  isRecord,
  niceTicks,
  validSharedFields,
} from "./blogChartUtils";
import {
  type BlogStateMapSpec,
  StateMapBody,
  parseStateMapSpec,
} from "./BlogStateMap";
import {
  type BlogWaterfallSpec,
  WaterfallBody,
  parseWaterfallSpec,
} from "./BlogWaterfallChart";

export { formatChartValue, niceTicks } from "./blogChartUtils";
export type { BlogChartFormat } from "./blogChartUtils";

export interface BlogChartSeries {
  key: string;
  name: string;
  color?: ChartColorName;
}

export interface BlogBarChartSpec {
  type: "bar";
  title?: string;
  subtitle?: string;
  xKey: string;
  series: BlogChartSeries[];
  data: BlogChartRow[];
  yLabel?: string;
  format?: BlogChartFormat;
  source?: string;
  height?: number;
}

export type BlogChartSpec =
  | BlogBarChartSpec
  | BlogWaterfallSpec
  | BlogStateMapSpec;

function parseBarSpec(s: Record<string, unknown>): BlogBarChartSpec | null {
  if (s.type !== "bar" || typeof s.xKey !== "string") return null;
  if (!Array.isArray(s.series) || s.series.length === 0) return null;
  if (!Array.isArray(s.data) || s.data.length === 0) return null;
  if (
    !s.series.every(
      (x) =>
        isRecord(x) && typeof x.key === "string" && typeof x.name === "string",
    )
  ) {
    return null;
  }
  const keys = (s.series as BlogChartSeries[]).map((x) => x.key);
  const xKey = s.xKey;
  if (
    !s.data.every(
      (row) =>
        isRecord(row) &&
        (typeof row[xKey] === "string" || isFiniteNumber(row[xKey])) &&
        keys.every((k) => row[k] === undefined || isFiniteNumber(row[k])),
    )
  ) {
    return null;
  }
  return s as unknown as BlogBarChartSpec;
}

export function parseBlogChartSpec(raw: string): BlogChartSpec | null {
  let spec: unknown;
  try {
    spec = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(spec) || !validSharedFields(spec)) return null;
  switch (spec.type) {
    case "bar":
      return parseBarSpec(spec);
    case "waterfall":
      return parseWaterfallSpec(spec);
    case "stateMap":
      return parseStateMapSpec(spec);
    default:
      return null;
  }
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

function BarBody({ spec }: { spec: BlogBarChartSpec }) {
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
            fill={chartColor(s.color, i)}
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
  );
}

/** Title, subtitle, watermark and source around any chart body. */
function ChartFigure({
  spec,
  children,
}: {
  spec: { title?: string; subtitle?: string; source?: string };
  children: ReactNode;
}) {
  const titleId = useId();
  return (
    <figure
      aria-labelledby={spec.title ? titleId : undefined}
      style={{ margin: "24px 0 32px" }}
    >
      {(spec.title || spec.subtitle) && (
        <div style={{ marginBottom: 12 }}>
          {spec.title && (
            <h3
              id={titleId}
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
      {children}
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

export function BlogChart({ data }: { data: string | string[] }) {
  const raw = Array.isArray(data) ? data.join("") : data;
  const spec = parseBlogChartSpec(raw);
  if (!spec) return null;
  return (
    <ChartFigure spec={spec}>
      {spec.type === "bar" && <BarBody spec={spec} />}
      {spec.type === "waterfall" && <WaterfallBody spec={spec} />}
      {spec.type === "stateMap" && <StateMapBody spec={spec} />}
    </ChartFigure>
  );
}
