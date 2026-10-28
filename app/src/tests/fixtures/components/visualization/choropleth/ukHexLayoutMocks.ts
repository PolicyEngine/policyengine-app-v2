import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

/** A constituency and its `[q, r]` position in data/ukHexLayouts/constituencies_2024.json. */
export const BARNSLEY_NORTH_CODE = 'E14001074';
export const BARNSLEY_NORTH_HEX = [57, -23];

/** A local authority and its position in data/ukHexLayouts/local_authorities_2023.json. */
export const HARTLEPOOL_CODE = 'E06000001';
export const HARTLEPOOL_HEX = [8, 18];

/** Barnsley North's hex-map point, at the position its result gives it. */
export const BARNSLEY_NORTH_POINT: HexMapDataPoint = {
  id: 'Barnsley North',
  label: 'Barnsley North',
  value: 120,
  x: BARNSLEY_NORTH_HEX[0],
  y: BARNSLEY_NORTH_HEX[1],
  code: BARNSLEY_NORTH_CODE,
};

/** Hartlepool's hex-map point, at the position its result gives it. */
export const HARTLEPOOL_POINT: HexMapDataPoint = {
  id: 'Hartlepool',
  label: 'Hartlepool',
  value: -60,
  x: 8,
  y: 19,
  code: HARTLEPOOL_CODE,
};

/** A point from an older saved result, which gives a position and no code. */
export const UNCODED_POINT: HexMapDataPoint = {
  id: 'Westminster North',
  label: 'Westminster North',
  value: -40,
  x: 3,
  y: 4,
};

/**
 * Darlington's hex-map point, at the Public API's position (7, 18). The
 * layout places it a row higher, at (7, 19), so the point moves when placed.
 */
export const DARLINGTON_POINT: HexMapDataPoint = {
  id: 'Darlington',
  label: 'Darlington',
  value: 45,
  x: 7,
  y: 18,
  code: 'E06000005',
};

/**
 * Allerdale, a district abolished in April 2023, as an older saved result
 * holds it: a code the layout, which follows the April 2023 boundaries,
 * does not have. The position is made up.
 */
export const ALLERDALE_CODE = 'E07000026';
export const ALLERDALE_POINT: HexMapDataPoint = {
  id: 'Allerdale',
  label: 'Allerdale',
  value: -15,
  x: 3,
  y: 19,
  code: ALLERDALE_CODE,
};

/** Report regions: the UK, a nation, and one constituency, which has no local-area maps. */
export const UK_WIDE_REGION = 'uk';
export const WALES_REGION = 'country/wales';
export const CONSTITUENCY_REGION = 'constituency/Aldershot';

/** Wales's constituencies in the layout, by code prefix. */
export const WELSH_CONSTITUENCY_COUNT = 32;

/** Cardiff East, a Welsh constituency, and its name in the boundary file. */
export const CARDIFF_EAST_CODE = 'W07000089';
export const CARDIFF_EAST_NAME = 'Cardiff East';

/** Hartlepool's name in the local authority boundary file. */
export const HARTLEPOOL_NAME = 'Hartlepool';

/**
 * Three of Wales's 32 constituencies' results, as the maps' adapters give
 * them, with the Public API's positions.
 */
export const WELSH_CONSTITUENCY_POINTS: HexMapDataPoint[] = [
  { id: 'Clwyd East', label: 'Clwyd East', value: -355.03, x: 49, y: -30, code: 'W07000094' },
  { id: 'Monmouthshire', label: 'Monmouthshire', value: -90.78, x: 50, y: -36, code: 'W07000101' },
  { id: 'Gower', label: 'Gower', value: 237.22, x: 44, y: -37, code: 'W07000097' },
];

/** Wales's local authorities in the layout, by code prefix. */
export const WELSH_LOCAL_AUTHORITY_COUNT = 22;

/** Swansea, a Welsh local authority, and its name in the boundary file. */
export const SWANSEA_CODE = 'W06000011';
export const SWANSEA_NAME = 'Swansea';

/** Cardiff West, a Welsh constituency. */
export const CARDIFF_WEST_CODE = 'W07000092';

/**
 * Cardiff North, a Welsh constituency that WELSH_CONSTITUENCY_POINTS leave
 * out and that LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES does not name: an
 * area with no data.
 */
export const CARDIFF_NORTH_CODE = 'W07000090';
export const CARDIFF_NORTH_NAME = 'Cardiff North';

/**
 * The Welsh constituencies a Wales breakdown of WELSH_CONSTITUENCY_POINTS
 * lists as withheld, sorted, as the simulation API's
 * `constituency_withheld_codes` gives them: Cardiff East and Cardiff West.
 * Wales's other 27 absent constituencies have no data.
 */
export const LISTED_WITHHELD_WELSH_CONSTITUENCY_CODES = [CARDIFF_EAST_CODE, CARDIFF_WEST_CODE];

/** Newport, a Welsh local authority that no fixture's list names, and its name in the boundary file. */
export const NEWPORT_CODE = 'W06000022';
export const NEWPORT_NAME = 'Newport';

/** The Welsh local authorities a Wales breakdown lists as withheld: Swansea alone. */
export const LISTED_WITHHELD_WELSH_LOCAL_AUTHORITY_CODES = [SWANSEA_CODE];

/**
 * Hex-map points for a result's ONS codes, one each, at a made-up position
 * that the layout replaces when it places them all.
 */
export function pointsWithCodes(codes: readonly string[]): HexMapDataPoint[] {
  return codes.map((code) => ({ id: code, label: code, value: 0, x: 0, y: 0, code }));
}
