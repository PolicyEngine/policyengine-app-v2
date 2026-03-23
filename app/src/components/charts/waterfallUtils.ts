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
  /** Transparent stacking base = Math.min(start, end) */
  base: number;
  /** Range tuple [low, high] for domain calculation */
  range: [number, number];
  /** Pre-formatted label for display inside bar */
  label: string;
  /** Whether this is the total bar */
  isTotal: boolean;
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
      const start = 0;
      const end = runningTotal;
      result.push({
        name,
        value: runningTotal,
        base: Math.min(start, end),
        range: [Math.min(start, end), Math.max(start, end)],
        label: formatValue(runningTotal),
        isTotal: true,
      });
    } else {
      const start = runningTotal;
      runningTotal += value;
      const end = runningTotal;

      result.push({
        name,
        value,
        base: Math.min(start, end),
        range: [Math.min(start, end), Math.max(start, end)],
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
 * i.e. the Y value where bar i ends and bar i+1 begins. Connectors into
 * total bars are skipped (totals anchor to 0, not the previous running total).
 */
export function computeWaterfallConnectors(data: WaterfallDatum[]): WaterfallConnector[] {
  const connectors: WaterfallConnector[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    const d = data[i];
    // Running total after bar i:
    //   total bar  → d.value (the running total it represents)
    //   positive   → base + value (top of bar)
    //   negative   → base (bottom of bar, since base = end when value < 0)
    const y = d.isTotal ? d.value : d.base + Math.max(0, d.value);
    connectors.push({ y, fromIndex: i, toIndex: i + 1 });
  }
  return connectors;
}
