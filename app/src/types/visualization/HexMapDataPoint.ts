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

  /** The area's code, e.g. a UK area's ONS code, when the data gives one. */
  code?: string;

  /** The value is an approximate estimate (UK disclosure control's `approximate` tier). */
  approximate?: boolean;

  /** The value's 90% interval, when the data gives one. */
  lower?: number;
  upper?: number;
}

/**
 * An area the hex map places but has no value for, such as one disclosure
 * control withheld. The map draws it hatched with a grey edge, outside its
 * colour scale.
 */
export interface HexMapMissingArea {
  /** Unique identifier for this area, e.g. its code */
  id: string;

  /** Display label (e.g., constituency name) */
  label: string;

  /** X-coordinate on the hexagonal grid (0-based) */
  x: number;

  /** Y-coordinate on the hexagonal grid (0-based) */
  y: number;
}
