/**
 * Utility functions for US District Choropleth Map
 */

import { DIVERGING_GRAY_TEAL, interpolateColor } from '@/utils/visualization/colorScales';
import type {
  ChoroplethDataPoint,
  ChoroplethMapConfig,
  ColorRange,
  PartialChoroplethMapConfig,
} from './types';

/**
 * Default configuration for the choropleth map
 */
export const DEFAULT_CHOROPLETH_CONFIG: ChoroplethMapConfig = {
  height: 500,
  showColorBar: true,
  colorScale: {
    colors: DIVERGING_GRAY_TEAL.colors,
    symmetric: true,
  },
  formatValue: (val: number) => val.toFixed(2),
};

/**
 * Merge partial config with defaults to create full config
 */
export function mergeConfig(partial: PartialChoroplethMapConfig): ChoroplethMapConfig {
  return {
    height: partial.height ?? DEFAULT_CHOROPLETH_CONFIG.height,
    showColorBar: partial.showColorBar ?? DEFAULT_CHOROPLETH_CONFIG.showColorBar,
    colorScale: {
      ...DEFAULT_CHOROPLETH_CONFIG.colorScale,
      ...partial.colorScale,
    },
    formatValue: partial.formatValue ?? DEFAULT_CHOROPLETH_CONFIG.formatValue,
  };
}

/**
 * Create a lookup map from data points for efficient access
 */
export function createDataLookupMap(data: ChoroplethDataPoint[]): Map<string, ChoroplethDataPoint> {
  const map = new Map<string, ChoroplethDataPoint>();
  data.forEach((point) => {
    map.set(point.geoId, point);
  });
  return map;
}

/**
 * Calculate the color range (min/max) for the data
 *
 * @param data - Data points to analyze
 * @param symmetric - Whether to center the range at zero
 * @returns Color range with min and max values
 */
export function calculateColorRange(data: ChoroplethDataPoint[], symmetric: boolean): ColorRange {
  const values = data.map((d) => d.value);

  if (values.length === 0) {
    return { min: -1, max: 1 };
  }

  if (symmetric) {
    const maxAbs = Math.max(...values.map(Math.abs));
    return { min: -maxAbs, max: maxAbs };
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

/**
 * Calculate the fill color for a value given a color range and scale colors.
 *
 * Normalizes the value to [0, 1] based on the range, then interpolates
 * into the color scale.
 *
 * @param value - The data value
 * @param colorRange - Min/max range for normalization
 * @param scaleColors - Array of hex colors defining the scale
 * @returns Hex color string
 */
export function getDistrictColor(
  value: number,
  colorRange: ColorRange,
  scaleColors: string[]
): string {
  // If no variation in data, use the middle of the color scale
  if (colorRange.min >= colorRange.max) {
    const midIdx = Math.floor((scaleColors.length - 1) / 2);
    return scaleColors[midIdx];
  }
  return interpolateColor(value, colorRange.min, colorRange.max, scaleColors);
}

/**
 * State abbreviation to FIPS code mapping for focusState support.
 * Used to filter GeoJSON features by state when zooming.
 */
export const STATE_ABBREV_TO_FIPS: Record<string, string> = {
  al: '01',
  ak: '02',
  az: '04',
  ar: '05',
  ca: '06',
  co: '08',
  ct: '09',
  de: '10',
  dc: '11',
  fl: '12',
  ga: '13',
  hi: '15',
  id: '16',
  il: '17',
  in: '18',
  ia: '19',
  ks: '20',
  ky: '21',
  la: '22',
  me: '23',
  md: '24',
  ma: '25',
  mi: '26',
  mn: '27',
  ms: '28',
  mo: '29',
  mt: '30',
  ne: '31',
  nv: '32',
  nh: '33',
  nj: '34',
  nm: '35',
  ny: '36',
  nc: '37',
  nd: '38',
  oh: '39',
  ok: '40',
  or: '41',
  pa: '42',
  ri: '44',
  sc: '45',
  sd: '46',
  tn: '47',
  tx: '48',
  ut: '49',
  vt: '50',
  va: '51',
  wa: '53',
  wv: '54',
  wi: '55',
  wy: '56',
  as: '60',
  gu: '66',
  mp: '69',
  pr: '72',
  vi: '78',
};
