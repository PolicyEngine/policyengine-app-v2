"use client";

/**
 * Waterfall body for ```chart blocks of type "waterfall".
 *
 * Each data row becomes one small-multiple panel, and every panel shares one
 * zero-based axis so the panels compare. Bar geometry comes from ui-kit's
 * computeWaterfallData: a transparent base bar stacked under the visible bar,
 * with dashed connectors at each running total, as in PEWaterfallChart.
 * Labels sit above or below each bar rather than inside it, because
 * PEWaterfallChart only labels bars at least 20px tall and a post's steps are
 * often smaller than that.
 *
 * Spec:
 * {
 *   "type": "waterfall",
 *   "title": "...", "subtitle": "...",
 *   "panelKey": "group",
 *   "steps": [
 *     { "key": "y2024", "name": "2024", "kind": "level", "legend": "Published rate", "color": "primary" },
 *     { "key": "resources", "name": "Resources", "kind": "change", "color": "quinary" },
 *     { "key": "y2025", "name": "2025", "kind": "level", "legend": "Published rate", "color": "primary" }
 *   ],
 *   "data": [{ "group": "All people", "y2024": 13.0, "resources": 0.1, "y2025": 13.1 }, ...],
 *   "format": { "decimals": 1 },
 *   "source": "..."
 * }
 *
 * A "level" bar runs from zero; a "change" bar runs from the previous running
 * total. A level after the first must equal the running total of the steps
 * before it, or the spec is rejected.
 */

import {
  AXIS_STYLE,
  GRID_STYLE,
  LEGEND_STYLE,
  TOOLTIP_CONTAINER_STYLE,
  computeWaterfallData,
  type WaterfallDatum,
} from "@policyengine/ui-kit/charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
} from "./blogChartUtils";

export interface BlogWaterfallStep {
  key: string;
  name: string;
  kind: "level" | "change";
  legend?: string;
  color?: ChartColorName;
}

export interface BlogWaterfallSpec {
  type: "waterfall";
  title?: string;
  subtitle?: string;
  panelKey: string;
  steps: BlogWaterfallStep[];
  data: BlogChartRow[];
  yLabel?: string;
  format?: BlogChartFormat;
  source?: string;
  height?: number;
}

export interface WaterfallBar extends WaterfallDatum {
  /** Height of the visible stacked bar. */
  barHeight: number;
  /** The step's value as the spec gives it: a level, or a signed change. */
  display: number;
  step: BlogWaterfallStep;
  color: string;
}

export interface WaterfallPanel {
  title: string;
  bars: WaterfallBar[];
}

/** Relative tolerance for a later level to equal the running total. */
const LEVEL_TOLERANCE = 1e-6;

function isStep(step: unknown): step is BlogWaterfallStep {
  return (
    isRecord(step) &&
    typeof step.key === "string" &&
    typeof step.name === "string" &&
    (step.kind === "level" || step.kind === "change")
  );
}

export function parseWaterfallSpec(
  s: Record<string, unknown>,
): BlogWaterfallSpec | null {
  const { panelKey, steps, data } = s;
  if (s.type !== "waterfall" || typeof panelKey !== "string") return null;
  if (!Array.isArray(steps) || steps.length < 2 || !steps.every(isStep)) {
    return null;
  }
  if (!Array.isArray(data) || data.length === 0) return null;
  for (const row of data) {
    if (!isRecord(row) || typeof row[panelKey] !== "string") return null;
    let running = 0;
    for (const [i, step] of steps.entries()) {
      const value = row[step.key];
      if (!isFiniteNumber(value)) return null;
      if (step.kind === "change") {
        running += value;
      } else if (i === 0) {
        running = value;
      } else if (
        Math.abs(value - running) >
        LEVEL_TOLERANCE * Math.max(1, Math.abs(value))
      ) {
        return null;
      }
    }
  }
  return s as unknown as BlogWaterfallSpec;
}

/** One panel per data row, with bar geometry from ui-kit's waterfall utils. */
export function buildWaterfallPanels(
  spec: BlogWaterfallSpec,
): WaterfallPanel[] {
  return spec.data.map((row) => {
    const values = spec.steps.map((step) => row[step.key] as number);
    const data = computeWaterfallData(
      spec.steps.map((step, i) => ({
        name: step.name,
        value: values[i],
        isTotal: step.kind === "level" && i > 0,
      })),
      String,
    );
    return {
      title: String(row[spec.panelKey]),
      bars: data.map((d, i) => ({
        ...d,
        barHeight: d.range[1] - d.range[0],
        display: values[i],
        step: spec.steps[i],
        color: chartColor(spec.steps[i].color, i),
      })),
    };
  });
}

interface BarBox {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface LabelProps {
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  index?: unknown;
}

function stepLabel(bar: WaterfallBar, format: BlogChartFormat, unit: boolean) {
  return formatChartValue(bar.display, {
    ...format,
    suffix: unit ? format.suffix : "",
    signed: bar.step.kind === "change",
  });
}

function WaterfallTooltip({
  active,
  payload,
  format,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  format: BlogChartFormat;
}) {
  const bar = payload?.[0]?.payload as WaterfallBar | undefined;
  if (!active || !bar) return null;
  return (
    <div style={{ ...TOOLTIP_CONTAINER_STYLE, lineHeight: 1.4 }}>
      <p style={{ fontWeight: 600, margin: 0, color: "var(--foreground)" }}>
        {bar.name}
      </p>
      <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)" }}>
        {bar.step.legend ?? bar.step.name}: {stepLabel(bar, format, true)}
      </p>
    </div>
  );
}

function WaterfallPanelChart({
  panel,
  axis,
  format,
  height,
  yLabel,
}: {
  panel: WaterfallPanel;
  axis: ReturnType<typeof niceTicks>;
  format: BlogChartFormat;
  height: number;
  yLabel?: string;
}) {
  const tickFormat = (v: number) =>
    formatChartValue(v, { ...format, decimals: axis.decimals, signed: false });
  const tickChars = Math.max(...axis.ticks.map((t) => tickFormat(t).length));
  // Labels render in bar order, so each bar can draw the connector from the
  // running total that the bar before it ends on.
  const boxes: BarBox[] = [];

  const renderLabel = (props: LabelProps) => {
    const index = Number(props.index);
    const bar = panel.bars[index];
    if (!bar) return null;
    const x = Number(props.x),
      y = Number(props.y),
      w = Number(props.width),
      h = Number(props.height);
    const box = {
      top: Math.min(y, y + h),
      bottom: Math.max(y, y + h),
      left: x,
      right: x + w,
    };
    boxes[index] = box;
    const prev = boxes[index - 1];
    const prevBar = panel.bars[index - 1];
    const connectorY =
      prev && prevBar
        ? prevBar.display >= 0
          ? prev.top
          : prev.bottom
        : undefined;
    return (
      <g>
        {connectorY !== undefined && (
          <line
            x1={prev.right}
            x2={box.left}
            y1={connectorY}
            y2={connectorY}
            stroke="var(--border-dark)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        <text
          x={x + w / 2}
          y={bar.display >= 0 ? box.top - 6 : box.bottom + 14}
          textAnchor="middle"
          style={{ ...AXIS_STYLE, fill: "var(--text-secondary)" }}
        >
          {stepLabel(bar, format, false)}
        </text>
      </g>
    );
  };

  return (
    <div>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 600,
          lineHeight: 1.4,
          color: "var(--foreground)",
          margin: "0 0 4px",
        }}
      >
        {panel.title}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={panel.bars}
          margin={{ top: 20, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid {...GRID_STYLE} vertical={false} />
          <XAxis
            dataKey="name"
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={AXIS_STYLE}
            axisLine={false}
            tickLine={false}
            tickFormatter={tickFormat}
            domain={axis.domain}
            ticks={axis.ticks}
            width={tickChars * 7 + 12 + (yLabel ? 20 : 0)}
            label={
              yLabel
                ? {
                    value: yLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { ...AXIS_STYLE, textAnchor: "middle" },
                  }
                : undefined
            }
          />
          <ReferenceLine y={0} stroke="var(--border-dark)" />
          <Tooltip
            cursor={{ fill: "var(--background-tertiary)" }}
            content={(props) => (
              <WaterfallTooltip
                active={props.active}
                payload={props.payload}
                format={format}
              />
            )}
          />
          <Bar
            dataKey="base"
            stackId="waterfall"
            fill="none"
            isAnimationActive={false}
          />
          <Bar
            dataKey="barHeight"
            stackId="waterfall"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          >
            {panel.bars.map((bar, i) => (
              <Cell key={i} fill={bar.color} />
            ))}
            <LabelList content={renderLabel} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function WaterfallLegend({ panels }: { panels: WaterfallPanel[] }) {
  const entries = new Map<string, string>();
  for (const bar of panels[0].bars) {
    const label = bar.step.legend ?? bar.step.name;
    if (!entries.has(label)) entries.set(label, bar.color);
  }
  return (
    <ul
      style={{
        ...LEGEND_STYLE.wrapperStyle,
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "4px 16px",
      }}
    >
      {[...entries].map(([label, color]) => (
        <li
          key={label}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 12,
              height: 12,
              flexShrink: 0,
              borderRadius: 2,
              background: color,
            }}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function WaterfallBody({ spec }: { spec: BlogWaterfallSpec }) {
  const panels = buildWaterfallPanels(spec);
  const axis = niceTicks(panels.flatMap((p) => p.bars.flatMap((b) => b.range)));
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "16px 24px",
        }}
      >
        {panels.map((panel, i) => (
          <WaterfallPanelChart
            key={i}
            panel={panel}
            axis={axis}
            format={spec.format ?? {}}
            height={spec.height ?? 240}
            yLabel={spec.yLabel}
          />
        ))}
      </div>
      <WaterfallLegend panels={panels} />
    </div>
  );
}
