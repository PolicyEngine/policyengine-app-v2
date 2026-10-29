/**
 * Choropleth map module
 *
 * Provides components and utilities for rendering choropleth maps of US
 * congressional districts and of UK constituencies and local authorities.
 */

export { MapTypeToggle } from './MapTypeToggle';
export { UKAreaChoroplethMap } from './UKAreaChoroplethMap';
export { USDistrictChoroplethMap } from './USDistrictChoroplethMap';
export { ukNationFromRegion } from './ukAreaBoundaries';

export type {
  ChoroplethDataPoint,
  ChoroplethMapConfig,
  MapVisualizationType,
  PartialChoroplethMapConfig,
  USDistrictChoroplethMapProps,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  ColorRange,
  UKAreaChoroplethDataPoint,
  UKAreaChoroplethMapProps,
  UKBoundaryLevel,
  UKNation,
} from './types';

export {
  createDataLookupMap,
  calculateColorRange,
  getDistrictColor,
  mergeConfig,
  DEFAULT_CHOROPLETH_CONFIG,
} from './utils';
