/**
 * US District Choropleth Map module
 *
 * Provides components and utilities for rendering choropleth maps
 * of US congressional districts.
 */

export { MapTypeToggle } from './MapTypeToggle';
export { USDistrictChoroplethMap } from './USDistrictChoroplethMap';

export type {
  ChoroplethDataPoint,
  ChoroplethMapConfig,
  MapVisualizationType,
  PartialChoroplethMapConfig,
  USDistrictChoroplethMapProps,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  PlotlyGeoConfig,
  ColorRange,
} from './types';

export {
  createDataLookupMap,
  calculateColorRange,
  buildDivergingColorscale,
  buildGeoConfig,
  buildPlotDataAndLayout,
  mergeConfig,
  DEFAULT_CHOROPLETH_CONFIG,
} from './utils';
