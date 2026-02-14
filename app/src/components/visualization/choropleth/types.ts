/**
 * Type definitions for US District Choropleth Map
 */

/**
 * GeoJSON Feature interface for congressional districts
 */
export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties: {
    STATEFP?: string;
    CD119FP?: string;
    GEOID?: string;
    DISTRICT_ID?: string; // Matches API format (e.g., "AL-01")
    NAMELSAD?: string;
    [key: string]: unknown;
  } | null;
  geometry: unknown;
}

/**
 * GeoJSON FeatureCollection interface
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Data point for choropleth map visualization
 */
export interface ChoroplethDataPoint {
  /** District ID matching GeoJSON DISTRICT_ID property (e.g., "AL-01") */
  geoId: string;
  /** Display label for hover tooltip */
  label: string;
  /** Value to visualize (determines color) */
  value: number;
}

/**
 * Configuration for the color scale
 */
export interface ColorScaleConfig {
  /** Array of colors for the scale */
  colors: string[];
  /** Format string for color bar tick labels (kept for API compatibility; not used by SVG renderer) */
  tickFormat?: string;
  /** Whether to center the scale at zero */
  symmetric?: boolean;
}

/**
 * Configuration options for the choropleth map
 */
export interface ChoroplethMapConfig {
  /** Map height in pixels */
  height: number;
  /** Color scale configuration */
  colorScale: ColorScaleConfig;
  /** Whether to show the color bar */
  showColorBar: boolean;
  /** Custom value formatter for hover text */
  formatValue: (value: number) => string;
}

/**
 * Partial configuration options (all optional)
 */
export type PartialChoroplethMapConfig = Partial<ChoroplethMapConfig> & {
  colorScale?: Partial<ColorScaleConfig>;
};

/**
 * Props for the USDistrictChoroplethMap component
 */
export interface USDistrictChoroplethMapProps {
  /** Array of data points to visualize */
  data: ChoroplethDataPoint[];
  /** Configuration for the map */
  config?: PartialChoroplethMapConfig;
  /** Path to GeoJSON file (optional, defaults to 119th Congress boundaries) */
  geoDataPath?: string;
  /** State code to focus/zoom on (e.g., 'ca', 'ny'). If provided, map will zoom to fit that state's districts. */
  focusState?: string;
}

/**
 * Color range for the visualization
 */
export interface ColorRange {
  min: number;
  max: number;
}
