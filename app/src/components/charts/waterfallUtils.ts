/**
 * Pure utility functions for computing waterfall chart data.
 *
 * A waterfall chart shows how individual values contribute to a running total.
 * Each bar starts where the previous one ended, and an optional "total" bar
 * always starts from zero.
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
  /** Bottom of the visible bar (data-space Y value) */
  barBottom: number;
  /** Top of the visible bar (data-space Y value) */
  barTop: number;
  /** Original signed value */
  value: number;
  /** Pre-formatted label for display inside bar */
  label: string;
  /** Whether this is the total bar */
  isTotal: boolean;
}

/**
 * Compute waterfall bar positions from a list of items.
 *
 * Non-total bars stack on a running total: positive bars sit above the
 * running total, negative bars hang below it.
 *
 * Total bars always span from 0 to their value.
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

    let barBottom: number;
    let barTop: number;

    if (isTotal) {
      barBottom = Math.min(0, value);
      barTop = Math.max(0, value);
    } else if (value >= 0) {
      barBottom = runningTotal;
      barTop = runningTotal + value;
    } else {
      barBottom = runningTotal + value;
      barTop = runningTotal;
    }

    result.push({
      name,
      barBottom,
      barTop,
      value,
      label: formatValue(value),
      isTotal,
    });

    if (!isTotal) {
      runningTotal += value;
    }
  }

  return result;
}

/**
 * Compute the Y-axis domain for waterfall chart data.
 *
 * Examines all barBottom/barTop values (and always includes 0) then adds
 * 10% padding so bars don't touch the axis edges.
 */
export function getWaterfallDomain(data: WaterfallDatum[]): [number, number] {
  let min = 0;
  let max = 0;

  for (const d of data) {
    min = Math.min(min, d.barBottom, d.barTop);
    max = Math.max(max, d.barBottom, d.barTop);
  }

  const pad = (max - min) * 0.1 || 0.1;
  return [min - pad, max + pad];
}
