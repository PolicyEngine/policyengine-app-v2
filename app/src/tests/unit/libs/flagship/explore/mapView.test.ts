import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { describe, expect, test } from 'vitest';
import {
  fitProjection,
  IDENTITY,
  interpolateTransform,
  pathFor,
  transformFor,
  type MapFrame,
} from '@/libs/flagship/explore/mapView';

const square = (lon: number, lat: number, size: number): Feature<Polygon> => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [lon, lat],
        [lon, lat + size],
        [lon + size, lat + size],
        [lon + size, lat],
        [lon, lat],
      ],
    ],
  },
});

// Two boxes in the lower 48: one in the west, one in the east.
const WEST = square(-120, 38, 4);
const EAST = square(-80, 36, 2);
const COUNTRY: FeatureCollection = { type: 'FeatureCollection', features: [WEST, EAST] };
const FRAME: MapFrame = {
  width: 1200,
  height: 800,
  inset: { top: 150, right: 400, bottom: 50, left: 20 },
};

describe('mapView', () => {
  test('given overlays then the country fits in the area they leave free', () => {
    const path = pathFor(fitProjection(FRAME, COUNTRY));
    const [[x0, y0], [x1, y1]] = path.bounds(COUNTRY);

    expect(x0).toBeGreaterThanOrEqual(19.9);
    expect(y0).toBeGreaterThanOrEqual(149.9);
    expect(x1).toBeLessThanOrEqual(800.1);
    expect(y1).toBeLessThanOrEqual(750.1);
  });

  test('given a shape then its zoom centers it in the free area', () => {
    const path = pathFor(fitProjection(FRAME, COUNTRY));
    const zoom = transformFor(path, FRAME, EAST);
    const [[x0, y0], [x1, y1]] = path.bounds(EAST);
    const center = [zoom.x + zoom.k * ((x0 + x1) / 2), zoom.y + zoom.k * ((y0 + y1) / 2)];

    expect(zoom.k).toBeGreaterThan(1);
    expect(center[0]).toBeCloseTo(20 + 780 / 2);
    expect(center[1]).toBeCloseTo(150 + 600 / 2);
  });

  test('given the ends of a glide then it starts and stops at those zooms', () => {
    const target = { x: -500, y: -300, k: 4 };

    expect(interpolateTransform(FRAME, IDENTITY, target, 0)).toEqual(IDENTITY);
    const end = interpolateTransform(FRAME, IDENTITY, target, 1);
    expect(end.k).toBeCloseTo(4);
    expect(end.x).toBeCloseTo(-500);
    expect(end.y).toBeCloseTo(-300);
  });
});
