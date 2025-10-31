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
