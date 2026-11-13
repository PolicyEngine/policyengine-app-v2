import type { UKAreaChoroplethDataPoint } from '@/components/visualization/choropleth/types';

/** A constituency and its `[q, r]` position in data/ukHexLayouts/constituencies_2024.json. */
export const BARNSLEY_NORTH_CODE = 'E14001074';
export const BARNSLEY_NORTH_HEX = [57, -23];

/** A local authority and its position in data/ukHexLayouts/local_authorities_2023.json. */
export const HARTLEPOOL_CODE = 'E06000001';
export const HARTLEPOOL_HEX = [8, 18];

/** Barnsley North's result, as the maps' adapters give it. */
export const BARNSLEY_NORTH_POINT: UKAreaChoroplethDataPoint = {
  id: 'Barnsley North',
  label: 'Barnsley North',
  value: 120,
  code: BARNSLEY_NORTH_CODE,
};

/** Hartlepool's result, as the maps' adapters give it. */
export const HARTLEPOOL_POINT: UKAreaChoroplethDataPoint = {
  id: 'Hartlepool',
  label: 'Hartlepool',
  value: -60,
  code: HARTLEPOOL_CODE,
};

/** An area from an older saved result, which has no code. */
export const UNCODED_POINT: UKAreaChoroplethDataPoint = {
  id: 'Westminster North',
  label: 'Westminster North',
  value: -40,
};

/**
 * Darlington's result, as the maps' adapters give it. The layout places it
 * at (7, 19), a row above the Public API's position for it.
 */
export const DARLINGTON_POINT: UKAreaChoroplethDataPoint = {
  id: 'Darlington',
  label: 'Darlington',
  value: 45,
  code: 'E06000005',
};

/**
 * Allerdale, a district abolished in April 2023, as an older saved result
 * holds it: a code the layout, which follows the April 2023 boundaries,
 * does not have.
 */
export const ALLERDALE_CODE = 'E07000026';
export const ALLERDALE_POINT: UKAreaChoroplethDataPoint = {
  id: 'Allerdale',
  label: 'Allerdale',
  value: -15,
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

/** Three of Wales's 32 constituencies' results, as the maps' adapters give them. */
export const WELSH_CONSTITUENCY_POINTS: UKAreaChoroplethDataPoint[] = [
  { id: 'Clwyd East', label: 'Clwyd East', value: -355.03, code: 'W07000094' },
  { id: 'Monmouthshire', label: 'Monmouthshire', value: -90.78, code: 'W07000101' },
  { id: 'Gower', label: 'Gower', value: 237.22, code: 'W07000097' },
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
 * A result's areas for its ONS codes, one each, as the maps' adapters give
 * them: without a position, which the layout supplies.
 */
export function pointsWithCodes(codes: readonly string[]): UKAreaChoroplethDataPoint[] {
  return codes.map((code) => ({ id: code, label: code, value: 0, code }));
}
