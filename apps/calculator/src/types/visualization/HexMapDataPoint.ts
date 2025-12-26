/**
 * Generic data point for hexagonal map visualizations
 *
 * This type is designed to be reusable for any hexagonal grid visualization,
 * not just constituencies.
 *
 * @example
 * ```typescript
 * const constituencyPoint: HexMapDataPoint = {
 *   id: 'westminster-north',
 *   label: 'Westminster North',
 *   value: 1234.56,
 *   x: 0,
 *   y: 0
 * };
 * ```
 */
export interface HexMapDataPoint {
  /** Unique identifier for this data point */
  id: string;

  /** Display label (e.g., constituency name) */
  label: string;

  /** The value to visualize (determines color) */
  value: number;

  /** X-coordinate on the hexagonal grid (0-based) */
  x: number;

  /** Y-coordinate on the hexagonal grid (0-based) */
  y: number;
}
