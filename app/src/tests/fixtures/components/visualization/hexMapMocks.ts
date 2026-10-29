import { vi } from 'vitest';
import { colors } from '@/designTokens';
import type { HexMapDataPoint, HexMapMissingArea } from '@/types/visualization/HexMapDataPoint';

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

/**
 * Three areas of an odd-r layout: two side by side in one row, and one in
 * the next row up, half a column to the side.
 */
export const MOCK_TILED_HEX_DATA: HexMapDataPoint[] = [
  { id: 'west', label: 'West', value: 10, x: 0, y: 0 },
  { id: 'east', label: 'East', value: 20, x: 1, y: 0 },
  { id: 'north', label: 'North', value: 30, x: 0, y: 1 },
];

/** An area without a value, in the next row up from MOCK_TILED_HEX_DATA's, beside North. */
export const MISSING_NORTH_EAST: HexMapMissingArea = {
  id: 'north-east',
  label: 'North East',
  x: 1,
  y: 1,
};

/**
 * An area without a value, twenty columns east of MOCK_TILED_HEX_DATA's:
 * a map that fits only its valued areas would draw it outside its frame.
 */
export const MISSING_FAR_EAST: HexMapMissingArea = {
  id: 'far-east',
  label: 'Far East',
  x: 20,
  y: 0,
};

/** The text a missing area's tooltip reads when the caller says why it has no value. */
export const NOT_REPORTED_TEXT = 'Not reported';

/**
 * An area without a value and without a stated reason, in the next row up
 * from MOCK_TILED_HEX_DATA's, west of North: a hexagon the map draws as
 * having no data.
 */
export const NO_DATA_NORTH_WEST: HexMapMissingArea = {
  id: 'north-west',
  label: 'North West',
  x: -1,
  y: 1,
};

/** What a no-data area's tooltip reads after its name. */
export const NO_DATA_TEXT = 'No data';

/**
 * A no-data area's fill: the map's background, a plain colour that the
 * colour scale never produces (its lightest colour, at zero, is the
 * tertiary background) and that is not the missing areas' hatching.
 */
export const NO_DATA_AREA_FILL = colors.background.primary;

/** An area without a value inside MOCK_UK_SHAPED_HEX_DATA's grid, which is as dense as the UK constituency map. */
export const MISSING_UK_SHAPED_AREA: HexMapMissingArea = {
  id: 'glasgow',
  label: 'Glasgow',
  x: 50,
  y: -12,
};

/**
 * The closest a missing area's stripes may repeat, in screen pixels: closer,
 * they blend into a flat grey that the colour scale's grey arm holds.
 */
export const MIN_MISSING_AREA_STRIPE_PIXELS = 4;

/** A missing area's edge, where a valued hexagon's is the background colour. */
export const MISSING_AREA_EDGE_COLOR = colors.gray[400];

/** A phone's width, in CSS pixels: what a v2 hex chart is drawn at on one. */
export const PHONE_WIDTH_PIXELS = 375;

/**
 * Makes every SVG element measure `width` CSS pixels wide, as the hex map
 * reads its rendered width, with a ResizeObserver that never reports (the
 * map measures once on mount). Returns a function that undoes both.
 */
export function mockRenderedSvgWidth(width: number): () => void {
  const originalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  const widthSpy = vi
    .spyOn(SVGElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ width } as DOMRect);
  return () => {
    window.ResizeObserver = originalResizeObserver;
    widthSpy.mockRestore();
  };
}

/**
 * How far apart a missing area's stripes sit on screen, in CSS pixels: the
 * hatching pattern's spacing, in SVG units, times the screen pixels per
 * unit. The SVG is `width` pixels wide and as tall as its viewBox, so the
 * viewBox scales to fit the narrower of the two, and never past its height.
 */
export function stripeSpacingOnScreen(container: HTMLElement, width: number): number {
  const pattern = container.querySelector('pattern')!;
  const svg = pattern.ownerSVGElement!;
  const [, , viewBoxWidth] = svg.getAttribute('viewBox')!.split(' ').map(Number);
  const zoomLayer = svg.querySelector('[data-testid="hex-map-zoom-layer"]');
  const zoom = Number(zoomLayer?.getAttribute('transform')?.match(/scale\(([^)]+)\)/)?.[1] ?? 1);
  return Number(pattern.getAttribute('width')) * Math.min(width / viewBoxWidth, 1) * zoom;
}

/** The hex map's viewBox width when it does not fill its frame, and so its width in jsdom. */
export const FIXED_MAP_WIDTH = 600;
