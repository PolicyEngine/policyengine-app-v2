import type { ChoroplethDataPoint } from '@/components/visualization/USDistrictChoroplethMap';

export const ALABAMA_FIRST: ChoroplethDataPoint = {
  geoId: 'AL-01',
  label: "Alabama's 1st congressional district",
  value: 312.45,
};

export const CALIFORNIA_TWELFTH: ChoroplethDataPoint = {
  geoId: 'CA-12',
  label: "California's 12th congressional district",
  value: -145.89,
};

export const NEW_YORK_TENTH: ChoroplethDataPoint = {
  geoId: 'NY-10',
  label: "New York's 10th congressional district",
  value: 0,
};

export const TEXAS_TWENTYTHIRD: ChoroplethDataPoint = {
  geoId: 'TX-23',
  label: "Texas's 23rd congressional district",
  value: 567.0,
};

export const MOCK_DISTRICT_CHOROPLETH_DATA: ChoroplethDataPoint[] = [
  ALABAMA_FIRST,
  CALIFORNIA_TWELFTH,
  NEW_YORK_TENTH,
  TEXAS_TWENTYTHIRD,
];

export const MOCK_POSITIVE_VALUES: ChoroplethDataPoint[] = [
  { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 100 },
  { geoId: 'AL-02', label: "Alabama's 2nd congressional district", value: 200 },
  { geoId: 'AL-03', label: "Alabama's 3rd congressional district", value: 300 },
];

export const MOCK_NEGATIVE_VALUES: ChoroplethDataPoint[] = [
  { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: -100 },
  { geoId: 'AL-02', label: "Alabama's 2nd congressional district", value: -200 },
  { geoId: 'AL-03', label: "Alabama's 3rd congressional district", value: -300 },
];

export const MOCK_MIXED_VALUES: ChoroplethDataPoint[] = [
  { geoId: 'AL-01', label: "Alabama's 1st congressional district", value: 500 },
  { geoId: 'CA-12', label: "California's 12th congressional district", value: -300 },
  { geoId: 'NY-10', label: "New York's 10th congressional district", value: 0 },
  { geoId: 'TX-23', label: "Texas's 23rd congressional district", value: 150 },
];

/**
 * Mock GeoJSON feature collection for testing
 */
export const MOCK_GEOJSON_FEATURE_COLLECTION = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'AL-01',
      properties: {
        DISTRICT_ID: 'AL-01',
        NAMELSAD: "Alabama's 1st congressional district",
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-88.0, 31.0],
            [-87.0, 31.0],
            [-87.0, 30.0],
            [-88.0, 30.0],
            [-88.0, 31.0],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'CA-12',
      properties: {
        DISTRICT_ID: 'CA-12',
        NAMELSAD: "California's 12th congressional district",
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.5, 38.0],
            [-122.0, 38.0],
            [-122.0, 37.5],
            [-122.5, 37.5],
            [-122.5, 38.0],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'NY-10',
      properties: {
        DISTRICT_ID: 'NY-10',
        NAMELSAD: "New York's 10th congressional district",
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-74.1, 40.8],
            [-73.9, 40.8],
            [-73.9, 40.6],
            [-74.1, 40.6],
            [-74.1, 40.8],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 'TX-23',
      properties: {
        DISTRICT_ID: 'TX-23',
        NAMELSAD: "Texas's 23rd congressional district",
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-104.0, 32.0],
            [-103.0, 32.0],
            [-103.0, 31.0],
            [-104.0, 31.0],
            [-104.0, 32.0],
          ],
        ],
      },
    },
  ],
};
