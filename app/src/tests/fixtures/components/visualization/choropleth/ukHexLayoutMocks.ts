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
