/**
 * US District Choropleth Map module
 *
 * Provides components and utilities for rendering choropleth maps
 * of US congressional districts.
 */

export { USDistrictChoroplethMap } from './USDistrictChoroplethMap';

export type {
  ChoroplethDataPoint,
  ChoroplethMapConfig,
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
