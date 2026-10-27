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
