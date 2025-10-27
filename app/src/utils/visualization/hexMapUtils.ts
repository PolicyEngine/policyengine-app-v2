import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/**
 * Apply hexagonal grid positioning logic
 *
 * In a hexagonal grid, even rows (y % 2 === 0) are offset by 0.5
 * to create the honeycomb pattern.
 *
 * Based on the positioning logic from policyengine-app v1:
 * https://github.com/PolicyEngine/policyengine-app/blob/master/src/pages/policy/output/constituencies/AverageChangeByConstituency.jsx
 *
 * @param points - Array of data points with x, y coordinates
 * @returns New array with adjusted x coordinates
 *
 * @example
 * ```typescript
 * const points = [
 *   { id: '1', label: 'A', value: 10, x: 0, y: 0 },  // even row
 *   { id: '2', label: 'B', value: 20, x: 1, y: 0 },  // even row
 *   { id: '3', label: 'C', value: 30, x: 0, y: 1 },  // odd row
 * ];
 * const positioned = applyHexagonalPositioning(points);
 * // positioned[0].x === 0.5 (even row offset)
 * // positioned[1].x === 1.5 (even row offset)
 * // positioned[2].x === 0 (odd row unchanged)
 * ```
 */
export function applyHexagonalPositioning(
  points: HexMapDataPoint[]
): HexMapDataPoint[] {
  return points.map((point) => ({
    ...point,
    x: point.y % 2 === 0 ? point.x + 0.5 : point.x,
  }));
}

/**
 * Calculate symmetric range for diverging color scale
 *
 * Ensures the color scale is centered at zero for balanced visualization
 * of positive and negative values.
 *
 * Based on app v1 implementation that uses Math.max(...colorValues.map(Math.abs))
 *
 * @param values - Array of numeric values
 * @returns Object with min and max for symmetric scale
 *
 * @example
 * ```typescript
 * const values = [-50, 10, 30, -20];
 * const range = calculateSymmetricRange(values);
 * // range = { min: -50, max: 50 }
 * ```
 */
export function calculateSymmetricRange(values: number[]): {
  min: number;
  max: number;
} {
  const maxAbs = Math.max(...values.map(Math.abs));
  return { min: -maxAbs, max: maxAbs };
}

/**
 * Generate hover text for a hexagonal map data point
 *
 * @param point - Data point
 * @param formatValue - Function to format the value
 * @returns Formatted hover text string (e.g., "Westminster North: £1,234")
 *
 * @example
 * ```typescript
 * const point = { id: '1', label: 'Westminster North', value: 1234.56, x: 0, y: 0 };
 * const formatCurrency = (val) => `£${val.toFixed(0)}`;
 * const text = generateHoverText(point, formatCurrency);
 * // text = "Westminster North: £1235"
 * ```
 */
export function generateHoverText(
  point: HexMapDataPoint,
  formatValue: (value: number) => string
): string {
  return `${point.label}: ${formatValue(point.value)}`;
}
