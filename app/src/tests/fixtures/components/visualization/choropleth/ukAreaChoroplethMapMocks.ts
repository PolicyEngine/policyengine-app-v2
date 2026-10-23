import { vi } from 'vitest';
import type {
  GeoJSONFeatureCollection,
  UKAreaChoroplethDataPoint,
} from '@/components/visualization/choropleth/types';

/** The boundary files' paths, as the map fetches them. */
export const UK_CONSTITUENCY_BOUNDARY_PATH = '/data/geojson/uk_constituencies_2024.geojson';
export const UK_LOCAL_AUTHORITY_BOUNDARY_PATH = '/data/geojson/uk_local_authorities_2023.geojson';

/**
 * A square boundary, 0.1 degrees wide, whose south-west corner is at
 * (west, south). Its ring runs clockwise, as d3-geo reads an outline.
 */
function squareBoundary(
  properties: Record<string, string>,
  west: number,
  south: number
): GeoJSONFeatureCollection['features'][number] {
  const east = west + 0.1;
  const north = south + 0.1;
  return {
    type: 'Feature',
    properties,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [west, south],
          [west, north],
          [east, north],
          [east, south],
          [west, south],
        ],
      ],
    },
  };
}

function constituencyBoundary(code: string, name: string, west: number, south: number) {
  return squareBoundary({ PCON24CD: code, PCON24NM: name }, west, south);
}

function localAuthorityBoundary(code: string, name: string, west: number, south: number) {
  return squareBoundary({ LAD23CD: code, LAD23NM: name }, west, south);
}

/** Real PCON24 codes and names: four in Wales and one in England. */
export const CLWYD_EAST_CODE = 'W07000094';
export const MONMOUTHSHIRE_CODE = 'W07000101';
export const GOWER_CODE = 'W07000097';
export const CARDIFF_EAST_CODE = 'W07000089';
export const ALDERSHOT_CODE = 'E14001063';

export const MOCK_UK_CONSTITUENCY_BOUNDARIES: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    constituencyBoundary(CLWYD_EAST_CODE, 'Clwyd East', -3.3, 53.1),
    constituencyBoundary(MONMOUTHSHIRE_CODE, 'Monmouthshire', -2.9, 51.7),
    constituencyBoundary(GOWER_CODE, 'Gower', -4.1, 51.6),
    constituencyBoundary(CARDIFF_EAST_CODE, 'Cardiff East', -3.1, 51.45),
    constituencyBoundary(ALDERSHOT_CODE, 'Aldershot', -0.8, 51.25),
  ],
};

/** Real LAD23 codes and names: two in Wales and one in England. */
export const CARDIFF_CODE = 'W06000015';
export const POWYS_CODE = 'W06000023';
export const HARTLEPOOL_CODE = 'E06000001';

export const MOCK_UK_LOCAL_AUTHORITY_BOUNDARIES: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    localAuthorityBoundary(CARDIFF_CODE, 'Cardiff', -3.25, 51.45),
    localAuthorityBoundary(POWYS_CODE, 'Powys', -3.5, 52.2),
    localAuthorityBoundary(HARTLEPOOL_CODE, 'Hartlepool', -1.25, 54.65),
  ],
};

/** A fetch that serves the boundary fixtures for each level's file. */
export function mockUKBoundaryFetch() {
  return vi.fn((url: string) => {
    const collection = url.includes('local_authorities')
      ? MOCK_UK_LOCAL_AUTHORITY_BOUNDARIES
      : MOCK_UK_CONSTITUENCY_BOUNDARIES;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(collection) });
  });
}

/**
 * Four constituencies' results, joined by code. Cardiff East has none, as
 * when disclosure control withholds it. Monmouthshire is approximate.
 */
export const MOCK_UK_CONSTITUENCY_POINTS: UKAreaChoroplethDataPoint[] = [
  { id: 'Clwyd East', label: 'Clwyd East', value: -355.03, code: CLWYD_EAST_CODE },
  {
    id: 'Monmouthshire',
    label: 'Monmouthshire',
    value: -90.78,
    code: MONMOUTHSHIRE_CODE,
    approximate: true,
    lower: -150,
    upper: -30,
  },
  { id: 'Gower', label: 'Gower', value: 237.22, code: GOWER_CODE },
  { id: 'Aldershot', label: 'Aldershot', value: 120, code: ALDERSHOT_CODE },
];

/** A result whose name differs from its boundary's: its code still joins it. */
export const RENAMED_AREA_POINT: UKAreaChoroplethDataPoint = {
  id: 'Clwyd East (as the result names it)',
  label: 'Clwyd East (as the result names it)',
  value: 80,
  code: CLWYD_EAST_CODE,
};

/**
 * A result named after Gower but coded as Clwyd East: the code decides,
 * so Gower's boundary does not take it.
 */
export const MISNAMED_AREA_POINT: UKAreaChoroplethDataPoint = {
  id: 'Gower',
  label: 'Gower',
  value: 80,
  code: CLWYD_EAST_CODE,
};

/** Results in the keyed shape of older saved reports, with no codes. */
export const MOCK_UK_CONSTITUENCY_POINTS_WITHOUT_CODES: UKAreaChoroplethDataPoint[] = [
  { id: 'Gower', label: 'Gower', value: 237.22 },
  { id: 'Monmouthshire', label: 'Monmouthshire', value: -90.78 },
];

/** The text a boundary with no result reads when disclosure control withheld it. */
export const NOT_PUBLISHED_TEXT = 'Not published';

/** The map type toggle's options, as MapTypeToggle labels them. */
export const GEOGRAPHIC_MAP_TAB = 'Geographic';
export const HEX_MAP_TAB = 'Hex grid';

/** The geographic map's legend, which shows once its boundaries have loaded. */
export const MAP_LEGEND_NAME = 'Color scale legend';
