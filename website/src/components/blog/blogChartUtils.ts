/**
 * Formatting, axis and color helpers shared by the blog chart types.
 */

import { chartColors } from "@policyengine/ui-kit/charts";

export type ChartColorName = Exclude<keyof typeof chartColors, "series">;

export interface BlogChartFormat {
  decimals?: number;
  prefix?: string;
  suffix?: string;
  signed?: boolean;
}

export type BlogChartRow = Record<string, string | number>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
  // A span under 1e-9 gets a unit axis: a smaller step underflows, or needs
  // more decimals than toFixed allows.
  const span = hi - lo >= 1e-9 ? hi - lo : 1;
  const raw = span / target;
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step =
    [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ??
    10 * power;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks = Array.from(
    { length: Math.round((end - start) / step) + 1 },
    (_, i) => Number((start + i * step).toPrecision(12)),
  );
  const decimals = Math.max(
    0,
    -Math.floor(Math.log10(step) + 1e-9) + (step / power === 2.5 ? 1 : 0),
  );
  return { domain: [start, end], ticks, decimals };
}

/** A named chart color token, or the series palette color at `index`. */
export function chartColor(name: string | undefined, index: number): string {
  if (
    name &&
    name !== "series" &&
    Object.prototype.hasOwnProperty.call(chartColors, name)
  ) {
    return chartColors[name as ChartColorName];
  }
  return chartColors.series[index % chartColors.series.length];
}
