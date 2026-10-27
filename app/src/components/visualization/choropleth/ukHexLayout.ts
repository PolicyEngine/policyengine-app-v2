/**
 * The UK hex maps' layouts: one hex per area, keyed by ONS code, from Open
 * Innovations' HexJSON files, and each area's name, from the boundary
 * files. Their sources, licences and update procedure are in
 * data/ukHexLayouts/README.md.
 */

import constituencies from '@/data/ukHexLayouts/constituencies_2024.json';
import constituencyNames from '@/data/ukHexLayouts/constituency_names_2024.json';
import localAuthorities from '@/data/ukHexLayouts/local_authorities_2023.json';
import localAuthorityNames from '@/data/ukHexLayouts/local_authority_names_2023.json';
import type { HexMapDataPoint, HexMapMissingArea } from '@/types/visualization/HexMapDataPoint';
import type { UKBoundaryLevel } from './types';
import { ukNationFromCode, ukNationFromRegion } from './ukAreaBoundaries';

/** Each level's `[q, r]` HexJSON `odd-r` position, by ONS code. */
export const UK_HEX_LAYOUTS: Record<UKBoundaryLevel, Record<string, number[]>> = {
  constituency: constituencies,
  local_authority: localAuthorities,
};

/**
 * Each level's area names, by ONS code: the boundary files' PCON24NM and
 * LAD23NM, which are .py 6.10.0's names. The hex map names the areas a
 * result leaves out with them.
 */
export const UK_HEX_AREA_NAMES: Record<UKBoundaryLevel, Record<string, string>> = {
  constituency: constituencyNames,
  local_authority: localAuthorityNames,
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

/**
 * The areas of a report's region that a result leaves out, as hex-map
 * areas without a value: each at its layout position, named from the
 * boundary files, with its ONS code as its id. For a disclosure-controlled
 * breakdown these are the areas disclosure control withheld.
 *
 * The region's areas are the layout's: all of them for a UK-wide report
 * (`uk`, or no region), and the nation's for a nation's report, as
 * countWithheldUKAreas counts a nation's against UK_AREA_COUNTS_BY_NATION.
 * None are listed when the result cannot be matched to them: an area with
 * no code (an older saved result), a code outside the region's layout
 * (such as a district abolished in April 2023), or a region that is
 * neither the UK nor a nation. So a map that keeps its result's own
 * positions, because placeOnUKHexLayout could not place every area, never
 * gets any: they are drawn only on the tiled grid.
 */
export function withheldUKHexAreas(
  level: UKBoundaryLevel,
  points: Pick<HexMapDataPoint, 'code'>[],
  region?: string | null
): HexMapMissingArea[] {
  const nation = ukNationFromRegion(region);
  if (region && region.toLowerCase() !== 'uk' && !nation) {
    return [];
  }
  const layout = UK_HEX_LAYOUTS[level];
  const inRegion = (code: string) =>
    Object.hasOwn(layout, code) && (!nation || ukNationFromCode(code) === nation);
  if (points.some((point) => !point.code || !inRegion(point.code))) {
    return [];
  }
  const reportedCodes = new Set(points.map((point) => point.code));
  return Object.keys(layout)
    .filter((code) => inRegion(code) && !reportedCodes.has(code))
    .flatMap((code) => {
      const position = ukHexPosition(level, code);
      return position
        ? [{ id: code, label: UK_HEX_AREA_NAMES[level][code] ?? code, ...position }]
        : [];
    });
}
