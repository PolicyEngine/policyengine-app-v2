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
