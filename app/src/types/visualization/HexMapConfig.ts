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
 * Configuration for rendering a hexagonal map. The map draws its points as
 * a tiled odd-r grid of touching pointy-top hexagons, as the UK layouts
 * (data/ukHexLayouts) expect, sized to fit its frame.
 *
 * @example
 * ```typescript
 * const config: HexMapConfig = {
 *   height: 600,
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
