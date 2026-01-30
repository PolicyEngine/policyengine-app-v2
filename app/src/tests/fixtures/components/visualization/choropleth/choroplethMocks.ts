/**
 * Mock data and fixtures for USDistrictChoroplethMap tests
 */

import type {
  ChoroplethDataPoint,
  ColorRange,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  PartialChoroplethMapConfig,
} from '@/components/visualization/choropleth/types';

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_DISTRICT_IDS = {
  ALABAMA_1: 'AL-01',
  ALABAMA_2: 'AL-02',
  CALIFORNIA_52: 'CA-52',
  NEW_YORK_14: 'NY-14',
  TEXAS_35: 'TX-35',
  DC_AT_LARGE: 'DC-00',
} as const;

export const TEST_VALUES = {
  POSITIVE_LARGE: 612.88,
  POSITIVE_SMALL: 312.45,
  NEGATIVE_SMALL: -45.3,
  NEGATIVE_LARGE: -234.56,
  ZERO: 0,
} as const;

// ============================================================================
// Mock Data Points
// ============================================================================

/**
 * Mock choropleth data points for testing
 */
export const MOCK_CHOROPLETH_DATA_POINTS: ChoroplethDataPoint[] = [
  {
    geoId: TEST_DISTRICT_IDS.ALABAMA_1,
    label: "Alabama's 1st congressional district",
    value: TEST_VALUES.POSITIVE_SMALL,
  },
  {
    geoId: TEST_DISTRICT_IDS.ALABAMA_2,
    label: "Alabama's 2nd congressional district",
    value: TEST_VALUES.NEGATIVE_SMALL,
  },
  {
    geoId: TEST_DISTRICT_IDS.CALIFORNIA_52,
    label: "California's 52nd congressional district",
    value: TEST_VALUES.POSITIVE_LARGE,
  },
  {
    geoId: TEST_DISTRICT_IDS.NEW_YORK_14,
    label: "New York's 14th congressional district",
    value: TEST_VALUES.NEGATIVE_LARGE,
  },
  {
    geoId: TEST_DISTRICT_IDS.TEXAS_35,
    label: "Texas's 35th congressional district",
    value: TEST_VALUES.ZERO,
  },
];

/**
 * Empty data points array
 */
export const MOCK_EMPTY_DATA_POINTS: ChoroplethDataPoint[] = [];

/**
 * Single data point for edge case testing
 */
export const MOCK_SINGLE_DATA_POINT: ChoroplethDataPoint[] = [
  {
    geoId: TEST_DISTRICT_IDS.DC_AT_LARGE,
    label: "District of Columbia's at-large congressional district",
    value: TEST_VALUES.POSITIVE_SMALL,
  },
];

/**
 * Data points with all positive values
 */
export const MOCK_ALL_POSITIVE_DATA_POINTS: ChoroplethDataPoint[] = [
  { geoId: TEST_DISTRICT_IDS.ALABAMA_1, label: 'District 1', value: 100 },
  { geoId: TEST_DISTRICT_IDS.ALABAMA_2, label: 'District 2', value: 200 },
  { geoId: TEST_DISTRICT_IDS.CALIFORNIA_52, label: 'District 3', value: 300 },
];

/**
 * Data points with all negative values
 */
export const MOCK_ALL_NEGATIVE_DATA_POINTS: ChoroplethDataPoint[] = [
  { geoId: TEST_DISTRICT_IDS.ALABAMA_1, label: 'District 1', value: -100 },
  { geoId: TEST_DISTRICT_IDS.ALABAMA_2, label: 'District 2', value: -200 },
  { geoId: TEST_DISTRICT_IDS.CALIFORNIA_52, label: 'District 3', value: -300 },
];

// ============================================================================
// Mock GeoJSON Data
// ============================================================================

/**
 * Create a mock GeoJSON feature for testing
 */
export function createMockGeoJSONFeature(districtId: string): GeoJSONFeature {
  return {
    type: 'Feature',
    properties: {
      DISTRICT_ID: districtId,
      NAMELSAD: `Congressional District ${districtId}`,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    },
  };
}

/**
 * Mock GeoJSON feature collection with test districts
 */
export const MOCK_GEOJSON_FEATURE_COLLECTION: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.ALABAMA_1),
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.ALABAMA_2),
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.CALIFORNIA_52),
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.NEW_YORK_14),
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.TEXAS_35),
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.DC_AT_LARGE),
  ],
};

/**
 * Mock GeoJSON feature without DISTRICT_ID property
 */
export const MOCK_FEATURE_WITHOUT_ID: GeoJSONFeature = {
  type: 'Feature',
  properties: {
    NAMELSAD: 'Unknown District',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  },
};

/**
 * Mock GeoJSON with some features missing DISTRICT_ID
 */
export const MOCK_GEOJSON_WITH_MISSING_IDS: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.ALABAMA_1),
    MOCK_FEATURE_WITHOUT_ID,
    createMockGeoJSONFeature(TEST_DISTRICT_IDS.CALIFORNIA_52),
  ],
};

// ============================================================================
// Mock Configuration
// ============================================================================

/**
 * Default test configuration
 */
export const MOCK_DEFAULT_CONFIG: PartialChoroplethMapConfig = {};

/**
 * Custom height configuration
 */
export const MOCK_CUSTOM_HEIGHT_CONFIG: PartialChoroplethMapConfig = {
  height: 600,
};

/**
 * Custom color scale configuration
 */
export const MOCK_CUSTOM_COLOR_SCALE_CONFIG: PartialChoroplethMapConfig = {
  colorScale: {
    colors: ['#ff0000', '#ffffff', '#0000ff'],
    tickFormat: '.1%',
    symmetric: false,
  },
};

/**
 * Full custom configuration
 */
export const MOCK_FULL_CUSTOM_CONFIG: PartialChoroplethMapConfig = {
  height: 700,
  showColorBar: false,
  colorScale: {
    colors: ['#000000', '#ffffff'],
    tickFormat: '$,.2f',
    symmetric: true,
  },
  formatValue: (val: number) => `$${val.toFixed(2)}`,
};

// ============================================================================
// Expected Color Ranges
// ============================================================================

/**
 * Expected symmetric color range for mock data points
 */
export const EXPECTED_SYMMETRIC_COLOR_RANGE: ColorRange = {
  min: -TEST_VALUES.POSITIVE_LARGE, // Most extreme value (absolute)
  max: TEST_VALUES.POSITIVE_LARGE,
};

/**
 * Expected asymmetric color range for all positive data
 */
export const EXPECTED_ASYMMETRIC_POSITIVE_RANGE: ColorRange = {
  min: 100,
  max: 300,
};

/**
 * Expected asymmetric color range for all negative data
 */
export const EXPECTED_ASYMMETRIC_NEGATIVE_RANGE: ColorRange = {
  min: -300,
  max: -100,
};

/**
 * Expected default color range for empty data
 */
export const EXPECTED_EMPTY_DATA_RANGE: ColorRange = {
  min: -1,
  max: 1,
};

// ============================================================================
// Test State Codes
// ============================================================================

export const TEST_FOCUS_STATES = {
  CALIFORNIA: 'ca',
  NEW_YORK: 'ny',
  DC: 'dc',
  TEXAS: 'tx',
} as const;
