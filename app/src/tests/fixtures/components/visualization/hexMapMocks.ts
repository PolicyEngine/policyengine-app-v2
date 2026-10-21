import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';

export const WESTMINSTER_NORTH: HexMapDataPoint = {
  id: 'westminster-north',
  label: 'Westminster North',
  value: 1234.56,
  x: 0,
  y: 0,
};

export const EDINBURGH_CENTRAL: HexMapDataPoint = {
  id: 'edinburgh-central',
  label: 'Edinburgh Central',
  value: -567.89,
  x: 1,
  y: 0,
};

export const CARDIFF_SOUTH: HexMapDataPoint = {
  id: 'cardiff-south',
  label: 'Cardiff South',
  value: 0,
  x: 0,
  y: 1,
};

export const BELFAST_EAST: HexMapDataPoint = {
  id: 'belfast-east',
  label: 'Belfast East',
  value: 250.0,
  x: 1,
  y: 1,
};

export const MOCK_HEX_MAP_DATA: HexMapDataPoint[] = [
  WESTMINSTER_NORTH,
  EDINBURGH_CENTRAL,
  CARDIFF_SOUTH,
  BELFAST_EAST,
];

export const MOCK_POSITIVE_VALUES: HexMapDataPoint[] = [
  { id: '1', label: 'Area A', value: 100, x: 0, y: 0 },
  { id: '2', label: 'Area B', value: 200, x: 1, y: 0 },
  { id: '3', label: 'Area C', value: 300, x: 0, y: 1 },
];

export const MOCK_NEGATIVE_VALUES: HexMapDataPoint[] = [
  { id: '1', label: 'Area A', value: -100, x: 0, y: 0 },
  { id: '2', label: 'Area B', value: -200, x: 1, y: 0 },
  { id: '3', label: 'Area C', value: -300, x: 0, y: 1 },
];

export const MOCK_MIXED_VALUES: HexMapDataPoint[] = [
  { id: '1', label: 'Area A', value: 500, x: 0, y: 0 },
  { id: '2', label: 'Area B', value: -300, x: 1, y: 0 },
  { id: '3', label: 'Area C', value: 0, x: 0, y: 1 },
  { id: '4', label: 'Area D', value: 150, x: 1, y: 1 },
];

/**
 * The corners of the UK constituency layout in report 4693 (UK-wide): a
 * narrow, tall grid, x 43 to 72 and y -46 to 0.
 */
export const MOCK_UK_SHAPED_HEX_DATA: HexMapDataPoint[] = [
  { id: 'orkney', label: 'Orkney and Shetland', value: 0, x: 51, y: 0 },
  { id: 'western-isles', label: 'Na h-Eileanan an Iar', value: 10, x: 47, y: -2 },
  { id: 'east-kilbride', label: 'East Kilbride', value: -10, x: 48, y: -13 },
  { id: 'weston', label: 'Weston-super-Mare', value: 20, x: 72, y: -40 },
  { id: 'camborne', label: 'Camborne and Redruth', value: -20, x: 69, y: -45 },
  { id: 'st-ives', label: 'St Ives', value: 5, x: 43, y: -46 },
];
