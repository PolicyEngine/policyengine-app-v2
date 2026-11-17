import { geoAlbersUsa, geoPath, type GeoPermissibleObjects } from 'd3-geo';

/** The map's drawing size; the SVG scales to its box. */
export const MAP_WIDTH = 975;
export const MAP_HEIGHT = 610;
export const MAP_SCALE = 1300;

/** The view react-simple-maps' ZoomableGroup takes: a [lon, lat] center and a zoom. */
export interface MapView {
  center: [number, number];
  zoom: number;
}

const projection = geoAlbersUsa()
  .scale(MAP_SCALE)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
const path = geoPath(projection);

/** The whole country. */
export const NATION_VIEW: MapView = {
  center: projection.invert?.([MAP_WIDTH / 2, MAP_HEIGHT / 2]) ?? [-96.6, 38.7],
  zoom: 1,
};

/** Share of the map a focused shape fills, so its neighbors stay in sight. */
const FILL = 0.85;
const MAX_ZOOM = 12;

/**
 * The view that fits a shape. Bounds are taken on the projected map, not
 * in degrees, so Alaska and Hawaii, which the projection moves next to
 * the other states, center where they are drawn.
 */
export function viewFor(shape: GeoPermissibleObjects): MapView {
  const [[x0, y0], [x1, y1]] = path.bounds(shape);
  if (![x0, y0, x1, y1].every(Number.isFinite)) {
    return NATION_VIEW;
  }
  const zoom = Math.min(
    MAX_ZOOM,
    FILL / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / MAP_HEIGHT, 1e-6)
  );
  const center = projection.invert?.([(x0 + x1) / 2, (y0 + y1) / 2]);
  return center ? { center, zoom: Math.max(1, zoom) } : NATION_VIEW;
}

/**
 * A view part way from one view to another (t from 0 to 1), in the
 * projected plane, so the move is a straight glide on screen.
 */
export function interpolateView(from: MapView, to: MapView, t: number): MapView {
  const a = projection(from.center);
  const b = projection(to.center);
  const zoom = from.zoom * (to.zoom / from.zoom) ** t;
  if (!a || !b) {
    return t < 1 ? from : to;
  }
  const point: [number, number] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const center = projection.invert?.(point);
  return { center: center ?? to.center, zoom };
}
