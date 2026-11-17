import {
  geoAlbersUsa,
  geoPath,
  type GeoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from 'd3-geo';
import type { FeatureCollection } from 'geojson';

/** Space that overlays (title, card, legend) cover, in pixels from each edge. */
export interface MapInset {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** The map's box and the part of it that no overlay covers. */
export interface MapFrame {
  width: number;
  height: number;
  inset: MapInset;
}

/** A zoom: shapes drawn at `k` times their size, then moved by (x, y). */
export interface MapTransform {
  x: number;
  y: number;
  k: number;
}

export const IDENTITY: MapTransform = { x: 0, y: 0, k: 1 };

/** Largest zoom: enough for the smallest urban districts. */
const MAX_ZOOM = 60;

function freeArea({ width, height, inset }: MapFrame) {
  const left = inset.left;
  const top = inset.top;
  const w = Math.max(1, width - inset.left - inset.right);
  const h = Math.max(1, height - inset.top - inset.bottom);
  return { left, top, w, h, cx: left + w / 2, cy: top + h / 2 };
}

/**
 * The projection that fits the whole country into the free area, so at
 * the nation level nothing hides under the card or the title. Alaska and
 * Hawaii sit in their usual insets.
 */
export function fitProjection(frame: MapFrame, states: FeatureCollection): GeoProjection {
  const area = freeArea(frame);
  return geoAlbersUsa().fitExtent(
    [
      [area.left, area.top],
      [area.left + area.w, area.top + area.h],
    ],
    states
  );
}

export function pathFor(projection: GeoProjection): GeoPath {
  return geoPath(projection);
}

/** The zoom that fits a shape into `fill` of the free area, centered in it. */
export function transformFor(
  path: GeoPath,
  frame: MapFrame,
  shape: GeoPermissibleObjects,
  fill = 0.85
): MapTransform {
  const [[x0, y0], [x1, y1]] = path.bounds(shape);
  if (![x0, y0, x1, y1].every(Number.isFinite)) {
    return IDENTITY;
  }
  const area = freeArea(frame);
  const k = Math.min(
    MAX_ZOOM,
    Math.max(1, fill * Math.min(area.w / Math.max(x1 - x0, 1e-6), area.h / Math.max(y1 - y0, 1e-6)))
  );
  return { k, x: area.cx - k * ((x0 + x1) / 2), y: area.cy - k * ((y0 + y1) / 2) };
}

/** A shape's size on screen under a zoom, in pixels: [width, height]. */
export function screenSize(
  path: GeoPath,
  shape: GeoPermissibleObjects,
  transform: MapTransform
): [number, number] {
  const [[x0, y0], [x1, y1]] = path.bounds(shape);
  return [(x1 - x0) * transform.k, (y1 - y0) * transform.k];
}

/**
 * A zoom part way between two (t from 0 to 1). The point at the free
 * area's center moves in a straight line and the view's width changes at
 * an even rate, so a zoom in or out feels steady rather than lurching.
 */
export function interpolateTransform(
  frame: MapFrame,
  from: MapTransform,
  to: MapTransform,
  t: number
): MapTransform {
  const area = freeArea(frame);
  const centerOf = (m: MapTransform) => [(area.cx - m.x) / m.k, (area.cy - m.y) / m.k];
  const [ax, ay] = centerOf(from);
  const [bx, by] = centerOf(to);
  const k = from.k * (to.k / from.k) ** t;
  const cx = ax + (bx - ax) * t;
  const cy = ay + (by - ay) * t;
  return { k, x: area.cx - k * cx, y: area.cy - k * cy };
}
