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
  ColorRange,
} from './types';

export {
  createDataLookupMap,
  calculateColorRange,
  getDistrictColor,
  mergeConfig,
  DEFAULT_CHOROPLETH_CONFIG,
} from './utils';
