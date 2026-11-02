/**
 * The UK boundary files and how the geographic map reads them. The files'
 * origin, licence and simplification are in public/data/geojson/SOURCES.md.
 */

import type { GeoJSONFeature, UKBoundaryLevel, UKNation } from './types';

/** Each level's boundary file, and the properties that hold an area's ONS code and name. */
export const UK_BOUNDARY_FILES: Record<
  UKBoundaryLevel,
  { path: string; codeProperty: string; nameProperty: string }
> = {
  constituency: {
    path: '/data/geojson/uk_constituencies_2024.geojson',
    codeProperty: 'PCON24CD',
    nameProperty: 'PCON24NM',
  },
  local_authority: {
    path: '/data/geojson/uk_local_authorities_2023.geojson',
    codeProperty: 'LAD23CD',
    nameProperty: 'LAD23NM',
  },
};

/**
 * The boundaries' attribution: ONS's required statements for its digital
 * boundary products under the Open Government Licence, with each file's year.
 */
export const UK_BOUNDARY_ATTRIBUTION: Record<UKBoundaryLevel, string> = {
  constituency:
    'Boundaries source: Office for National Statistics licensed under the Open Government Licence v.3.0. Contains OS data © Crown copyright and database right 2024.',
  local_authority:
    'Boundaries source: Office for National Statistics licensed under the Open Government Licence v.3.0. Contains OS data © Crown copyright and database right 2023.',
};

/** The nation each ONS code's first letter stands for. */
export const UK_NATION_BY_CODE_PREFIX: Record<string, UKNation> = {
  E: 'england',
  W: 'wales',
  S: 'scotland',
  N: 'northern_ireland',
};

/** The nation a report's region names, e.g. "country/wales" is Wales. */
const UK_NATION_BY_REGION: Record<string, UKNation> = {
  'country/england': 'england',
  'country/wales': 'wales',
  'country/scotland': 'scotland',
  'country/northern_ireland': 'northern_ireland',
};

export const UK_NATION_NAMES: Record<UKNation, string> = {
  england: 'England',
  wales: 'Wales',
  scotland: 'Scotland',
  northern_ireland: 'Northern Ireland',
};

/** The nation a report's region is, or null for a UK-wide (or missing) region. */
export function ukNationFromRegion(region?: string | null): UKNation | null {
  return (region && UK_NATION_BY_REGION[region.toLowerCase()]) || null;
}

/** The nation an ONS code belongs to, from its first letter; null if it names none. */
export function ukNationFromCode(code?: string | null): UKNation | null {
  return (code && UK_NATION_BY_CODE_PREFIX[code.charAt(0).toUpperCase()]) || null;
}

/** A feature's property as a string, or undefined. */
export function featureProperty(feature: GeoJSONFeature, property: string): string | undefined {
  const value = feature.properties?.[property];
  return typeof value === 'string' ? value : undefined;
}

type Ring = [number, number][];

/** Every ring of a Polygon or MultiPolygon feature; none for other geometries. */
function featureRings(feature: GeoJSONFeature): Ring[] {
  const geometry = feature.geometry as
    | { type: 'Polygon'; coordinates: Ring[] }
    | { type: 'MultiPolygon'; coordinates: Ring[][] }
    | null;
  if (geometry?.type === 'Polygon') {
    return geometry.coordinates;
  }
  if (geometry?.type === 'MultiPolygon') {
    return geometry.coordinates.flat();
  }
  return [];
}

const RADIANS_PER_DEGREE = Math.PI / 180;

/** A latitude's y on the Mercator projection, for a sphere of radius 1. */
function mercatorY(latitude: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latitude * RADIANS_PER_DEGREE) / 2));
}

/** The latitude whose Mercator y is `y`. */
function latitudeAtMercatorY(y: number): number {
  return (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / RADIANS_PER_DEGREE;
}

/**
 * The center and scale that fit `features` in a `width` by `height` frame
 * on d3's Mercator projection, using `padding` of the frame. Exact for
 * Mercator, whose x is proportional to longitude and y to `mercatorY`.
 * Null when the features have no coordinates.
 */
export function fitMercator(
  features: GeoJSONFeature[],
  width: number,
  height: number,
  padding = 0.85
): { center: [number, number]; scale: number } | null {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const feature of features) {
    for (const ring of featureRings(feature)) {
      for (const [longitude, latitude] of ring) {
        west = Math.min(west, longitude);
        east = Math.max(east, longitude);
        south = Math.min(south, latitude);
        north = Math.max(north, latitude);
      }
    }
  }
  if (!Number.isFinite(west)) {
    return null;
  }
  const xSpan = Math.max((east - west) * RADIANS_PER_DEGREE, Number.EPSILON);
  const ySpan = Math.max(mercatorY(north) - mercatorY(south), Number.EPSILON);
  const scale = Math.min((width * padding) / xSpan, (height * padding) / ySpan);
  const center: [number, number] = [
    (west + east) / 2,
    latitudeAtMercatorY((mercatorY(south) + mercatorY(north)) / 2),
  ];
  return { center, scale };
}
