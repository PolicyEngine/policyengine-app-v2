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

  /**
   * On the untiled grid, the size of each hexagon. On either grid, twice it
   * is the margin around the map. A tiled hexagon's size follows the scale
   * instead, so its neighbours touch.
   */
  hexSize?: number;

  /**
   * Scale factor for coordinates to control spacing between hexagons.
   * Values < 1 bring hexagons closer together, values > 1 spread them apart.
   * Default is 1 (no scaling).
   */
  coordinateScale?: number;

  /**
   * Opt-in: draw the positions as a tiled `odd-r` hex grid, with pointy-top
   * hexagons that touch and rows √3/2 of a column apart, as HexJSON layouts
   * expect. Off: flat-topped hexagons on a square grid, as the API's
   * positions expect.
   */
  tiled?: boolean;

  /** Color scale configuration */
  colorScale?: ColorScaleConfig;

  /** Whether to show the color scale bar */
  showColorBar?: boolean;

  /** Function to format hover text values */
  formatValue?: (value: number) => string;

  /**
   * Opt-in: how the color bar's ticks read, e.g. as pounds or percentages.
   * Plain numbers (1.2k, 178, 0.02) when unset.
   */
  formatColorBarTick?: (value: number) => string;
}
