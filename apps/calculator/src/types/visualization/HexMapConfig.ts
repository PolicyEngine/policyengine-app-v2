import type { Layout } from 'plotly.js';

/**
 * Color scale configuration for hexagonal maps
 */
export interface ColorScaleConfig {
  /** Colors for the diverging scale (5-point recommended) */
  colors: string[];

  /** Format string for color bar ticks (e.g., '$,.0f', '.1%') */
  tickFormat: string;

  /** Whether to use symmetric range around zero */
  symmetric?: boolean;
}

/**
 * Configuration for rendering a hexagonal map
 *
 * @example
 * ```typescript
 * const config: HexMapConfig = {
 *   height: 600,
 *   hexSize: 12,
 *   colorScale: {
 *     colors: ['#616161', '#BDBDBD', '#F2F2F2', '#D8E6F3', '#2C6496'],
 *     tickFormat: '£,.0f',
 *     symmetric: true
 *   },
 *   formatValue: (val) => `£${val.toFixed(0)}`
 * };
 * ```
 */
export interface HexMapConfig {
  /** Height of the plot in pixels */
  height?: number;

  /** Size of each hexagon marker */
  hexSize?: number;

  /**
   * Scale factor for coordinates to control spacing between hexagons.
   * Values < 1 bring hexagons closer together, values > 1 spread them apart.
   * Default is 1 (no scaling).
   *
   * @example
   * coordinateScale: 0.5 // Hexagons will be twice as close together
   */
  coordinateScale?: number;

  /** Color scale configuration */
  colorScale?: ColorScaleConfig;

  /** Whether to show the color scale bar */
  showColorBar?: boolean;

  /** Function to format hover text values */
  formatValue?: (value: number) => string;

  /** Additional layout overrides */
  layoutOverrides?: Partial<Layout>;
}
