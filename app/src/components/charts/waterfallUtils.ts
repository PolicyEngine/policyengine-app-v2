/**
 * Pure utility functions for computing waterfall chart data.
 *
 * A waterfall chart shows how individual values contribute to a running total.
 * Each bar starts where the previous one ended, and an optional "total" bar
 * always starts from zero.
 *
 * Rendering uses the **stacked bar** approach (matching policyengine-ui-kit):
 * a transparent `base` bar sits under a visible `value` bar with
 * `stackId="waterfall"`.
 */

export interface WaterfallItem {
  /** Display name for the X-axis */
  name: string;
  /** Signed numeric value */
  value: number;
  /** Whether this item is the total bar (anchored to 0) */
  isTotal?: boolean;
}

export interface WaterfallDatum {
  /** Display name for X-axis */
  name: string;
  /** Signed value (item.value for steps, running total for totals) */
  value: number;
  /** Absolute bar height for Recharts stacking (always positive) */
  barHeight: number;
  /** Transparent stacking base (lower bound of the bar) */
  base: number;
  /** Range tuple [low, high] for domain calculation */
  range: [number, number];
  /** Which edge of the bar represents the running total: top for positive, bottom for negative */
  runningTotalEdge: 'top' | 'bottom';
  /** Pre-formatted label for display inside bar */
  label: string;
  /** Whether this is the total bar */
  isTotal: boolean;
}

// ---------------------------------------------------------------------------
// Bar metrics strategy — sign-aware positioning for waterfall bars
// ---------------------------------------------------------------------------

export interface BarMetrics {
  base: number;
  barHeight: number;
  range: [number, number];
  runningTotalEdge: 'top' | 'bottom';
}

function positiveBarMetrics(start: number, end: number): BarMetrics {
  return {
    base: start,
    barHeight: end - start,
    range: [start, end],
    runningTotalEdge: 'top',
  };
}

function negativeBarMetrics(start: number, end: number): BarMetrics {
  return {
    base: end,
    barHeight: start - end,
    range: [end, start],
    runningTotalEdge: 'bottom',
  };
}

/** Compute stacking base, bar height, range, and running-total edge for a bar. */
export function computeBarMetrics(start: number, end: number, value: number): BarMetrics {
  return value < 0 ? negativeBarMetrics(start, end) : positiveBarMetrics(start, end);
}

/**
 * Compute waterfall bar positions from a list of items.
 *
 * Matches the policyengine-ui-kit `buildWaterfallData` logic exactly:
 * - `base` = Math.min(start, end)
 * - `value` = signed item value (for steps) or running total (for totals)
 * - `range` = [min, max] of the bar extent
 *
 * @param items - Array of waterfall items (name, value, isTotal flag)
 * @param formatValue - Formatter for the label displayed inside each bar
 * @returns Array of WaterfallDatum with computed positions
 */
export function computeWaterfallData(
  items: WaterfallItem[],
  formatValue: (value: number) => string
): WaterfallDatum[] {
  const result: WaterfallDatum[] = [];
  let runningTotal = 0;

  for (const item of items) {
    const { name, value, isTotal = false } = item;

    if (isTotal) {
      const metrics = computeBarMetrics(0, runningTotal, runningTotal);
      result.push({
        name,
        value: runningTotal,
        ...metrics,
        label: formatValue(runningTotal),
        isTotal: true,
      });
    } else {
      const start = runningTotal;
      runningTotal += value;
      const metrics = computeBarMetrics(start, runningTotal, value);
      result.push({
        name,
        value,
        ...metrics,
        label: formatValue(value),
        isTotal: false,
      });
    }
  }

  return result;
}

/**
 * Compute the Y-axis domain for waterfall chart data.
 *
 * Examines all range values (and always includes 0) then adds 10% padding
 * so bars don't touch the axis edges.
 */
export function getWaterfallDomain(data: WaterfallDatum[]): [number, number] {
  let min = 0;
  let max = 0;

  for (const d of data) {
    min = Math.min(min, d.range[0]);
    max = Math.max(max, d.range[1]);
  }

  const pad = (max - min) * 0.1 || 0.1;
  return [min - pad, max + pad];
}

export interface WaterfallConnector {
  /** Y data value where the connector sits (the running total between bars) */
  y: number;
  /** Index of the source bar in the data array */
  fromIndex: number;
  /** Index of the target bar in the data array */
  toIndex: number;
}

/**
 * Compute horizontal connector lines between consecutive waterfall bars.
 *
 * Each connector sits at the running-total boundary between two bars —
 * i.e. the Y value where bar i ends and bar i+1 begins.
 */
export function computeWaterfallConnectors(data: WaterfallDatum[]): WaterfallConnector[] {
  const connectors: WaterfallConnector[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    const d = data[i];
    const y = d.runningTotalEdge === 'top' ? d.base + d.barHeight : d.base;
    connectors.push({ y, fromIndex: i, toIndex: i + 1 });
  }
  return connectors;
}
