/**
 * Type definitions for US District Choropleth Map
 */

/**
 * Map visualization type
 * - 'geographic': Natural geographic boundaries (Census Bureau)
 * - 'hex': Equal-size hexagonal grid (each district same visual size)
 */
export type MapVisualizationType = 'geographic' | 'hex';

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
  /** Map visualization type: 'geographic' (natural boundaries) or 'hex' (equal-size hexagons). Defaults to 'geographic'. */
  visualizationType?: MapVisualizationType;
  /** Optional ref to the map container for image export */
  exportRef?: React.Ref<HTMLDivElement>;
  /** Uppercase 2-letter state abbreviations whose fetches errored (e.g., ['CO']). Districts in these states are colored red with error hover text. */
  errorStates?: string[];
}

/**
 * Color range for the visualization
 */
export interface ColorRange {
  min: number;
  max: number;
}

/** A UK area level with boundaries: 2024 constituencies or April 2023 local authorities. */
export type UKBoundaryLevel = 'constituency' | 'local_authority';

/** A UK nation, which a nation's report shows on its own. */
export type UKNation = 'england' | 'wales' | 'scotland' | 'northern_ireland';

/** One UK area's result, for the geographic map. */
export interface UKAreaChoroplethDataPoint {
  /** The caller's identifier for the area, e.g. its name: what selection and clicks use. */
  id: string;
  /** Display label for the tooltip */
  label: string;
  /** Value to visualize (determines color) */
  value: number;
  /**
   * The area's ONS code (e.g. W07000097), which joins it to its boundary. An
   * area without one (an older saved result) joins its boundary by name.
   */
  code?: string;
  /** The value is an approximate estimate (UK disclosure control's `approximate` tier). */
  approximate?: boolean;
  /** The value's 90% interval, when the data gives one. */
  lower?: number;
  upper?: number;
}

/**
 * Props for the UKAreaChoroplethMap component. The first five follow the
 * US district maps' props; the rest are the flagship district map's.
 */
export interface UKAreaChoroplethMapProps {
  /** One point per area with a result */
  data: UKAreaChoroplethDataPoint[];
  /** Which areas' boundaries to draw */
  level: UKBoundaryLevel;
  /** Configuration for the map */
  config?: PartialChoroplethMapConfig;
  /** Path to the GeoJSON file (optional, defaults to the level's boundary file) */
  geoDataPath?: string;
  /** A nation to draw alone, fitted to the frame, as `focusState` does for a US state. */
  focusNation?: UKNation | null;
  /** Optional ref to the map container for image export */
  exportRef?: React.Ref<HTMLDivElement>;
  /**
   * What an area with no result reads in its tooltip, e.g. "Not published"
   * for one disclosure control withheld. Defaults to "No data".
   */
  missingAreaText?: string;
  /**
   * Opt-in, as the flagship district map: zoom buttons and a reset, trackpad
   * pinch, and a fixed height. Without it the map scales with its width, as
   * the v2 district map does.
   */
  navigable?: boolean;
  /** The area to outline, by its `id`, e.g. the one whose details show. */
  selectedId?: string | null;
  /** Called with an area's `id` when it is clicked; areas with no result are not clickable. */
  onAreaClick?: (id: string) => void;
  /** The map's name for screen readers, as one image; without it the map has none. */
  ariaLabel?: string;
}
