/**
 * The UK hex maps' layouts: one hex per area, keyed by ONS code, from Open
 * Innovations' HexJSON files. Their source, licence and update procedure are
 * in data/ukHexLayouts/README.md.
 */

import constituencies from '@/data/ukHexLayouts/constituencies_2024.json';
import localAuthorities from '@/data/ukHexLayouts/local_authorities_2023.json';
import type { HexMapDataPoint } from '@/types/visualization/HexMapDataPoint';
import type { UKBoundaryLevel } from './types';

/** Each level's `[q, r]` HexJSON `odd-r` position, by ONS code. */
export const UK_HEX_LAYOUTS: Record<UKBoundaryLevel, Record<string, number[]>> = {
  constituency: constituencies,
  local_authority: localAuthorities,
};

/**
 * An area's position on the hex map's grid, from its ONS code; null when the
 * layout has no such code.
 *
 * The layouts use `odd-r` rows: odd rows sit half a hex to the right, and
 * rows increase northwards. The hex map shifts its even rows instead
 * (applyHexagonalPositioning) and draws higher rows further up, so the row
 * moves up by one to keep each row's shift: `y = r + 1`.
 */
export function ukHexPosition(
  level: UKBoundaryLevel,
  code?: string | null
): { x: number; y: number } | null {
  const position = code ? UK_HEX_LAYOUTS[level][code] : undefined;
  return position ? { x: position[0], y: position[1] + 1 } : null;
}

/** A level's hex-map points placed on its layout, and whether the map tiles them. */
export interface UKHexMapPlacement {
  points: HexMapDataPoint[];
  /** Whether the layout placed every point, so the map draws the tiled grid its positions need. */
  tiled: boolean;
}

/**
 * A level's hex-map points, placed from the app's layout, all or none.
 * When the layout has a position for every point's code, each point takes
 * its position, on the tiled grid. When it lacks even one (a point with no
 * code, as in an older saved result, or with a code the layout does not
 * have, such as a district abolished in April 2023), every point keeps the
 * position its result gave it, on the untiled square grid those positions
 * were made for: the two sets of positions are different grids, so mixing
 * them would overlap or scatter the hexagons. v2's and v3's UK hex maps
 * both place their areas with this.
 */
export function placeOnUKHexLayout(
  level: UKBoundaryLevel,
  points: HexMapDataPoint[]
): UKHexMapPlacement {
  const positions = points.map((point) => ukHexPosition(level, point.code));
  if (positions.some((position) => position === null)) {
    return { points, tiled: false };
  }
  return {
    points: points.map((point, index) => ({ ...point, ...positions[index] })),
    tiled: true,
  };
}
