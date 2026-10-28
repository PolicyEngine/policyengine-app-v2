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
  return position ? gridPosition(position) : null;
}

/** A layout's `[q, r]` position on the hex map's grid: `y = r + 1`, as ukHexPosition explains. */
function gridPosition([q, r]: number[]): { x: number; y: number } {
  return { x: q, y: r + 1 };
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

/** The areas of a report's region a result leaves out, by ONS code, and how many the region has. */
export interface UKWithheldAreaCodes {
  /** The areas drawn as withheld, and counted in the note under the map. */
  codes: string[];
  /**
   * The region's other areas the result leaves out, which have no data:
   * those a breakdown's list of withheld codes does not name. Empty
   * without a list.
   */
  noDataCodes: string[];
  total: number;
}

/**
 * The ONS codes of a report's region's areas that a result leaves out, by
 * the result's codes against the layout, split into the withheld ones and
 * the ones with no data, and how many areas the region has; null when the
 * result cannot be matched to the layout. The hex map's withheld areas and
 * the note's count under it both follow this rule, so they always agree.
 *
 * With a breakdown's list of withheld codes (`listedWithheldCodes`, even
 * an empty one), an area the result leaves out is withheld only when the
 * list names it, and has no data otherwise: an area can be missing for
 * another reason, such as having no households in the local-area dataset.
 * A listed code outside the region's layout, or one the result publishes,
 * is not withheld. Without a list (null or absent, as in a result from
 * before the simulation API gave one), every area the result leaves out
 * is withheld.
 *
 * The region's areas are the layout's: all of them for a UK-wide report
 * (`uk`, or no region), and the nation's for a nation's report. The result
 * cannot be matched when an area has no code (an older saved result) or a
 * code outside the region's layout (such as a district abolished in April
 * 2023, or an area of another nation), or when the region is neither the
 * UK nor a nation; a list does not change that.
 */
export function withheldUKAreaCodes(
  level: UKBoundaryLevel,
  codes: (string | null | undefined)[],
  region?: string | null,
  listedWithheldCodes?: readonly string[] | null
): UKWithheldAreaCodes | null {
  const nation = ukNationFromRegion(region);
  if (region && region.toLowerCase() !== 'uk' && !nation) {
    return null;
  }
  const regionCodes = Object.keys(UK_HEX_LAYOUTS[level]).filter(
    (code) => !nation || ukNationFromCode(code) === nation
  );
  const inRegion = new Set(regionCodes);
  if (codes.some((code) => !code || !inRegion.has(code))) {
    return null;
  }
  const reportedCodes = new Set(codes);
  const absentCodes = regionCodes.filter((code) => !reportedCodes.has(code));
  if (!listedWithheldCodes) {
    return { codes: absentCodes, noDataCodes: [], total: regionCodes.length };
  }
  const listed = new Set(listedWithheldCodes);
  return {
    codes: absentCodes.filter((code) => listed.has(code)),
    noDataCodes: absentCodes.filter((code) => !listed.has(code)),
    total: regionCodes.length,
  };
}

/**
 * Layout codes as hex-map areas without a value: each at its layout
 * position, named from the boundary files, with its ONS code as its id.
 */
function layoutHexAreas(level: UKBoundaryLevel, codes: string[]): HexMapMissingArea[] {
  // Each code is one of the layout's own keys, so it has a position.
  return codes.map((code) => ({
    id: code,
    label: UK_HEX_AREA_NAMES[level][code] ?? code,
    ...gridPosition(UK_HEX_LAYOUTS[level][code]),
  }));
}

/**
 * The areas of a report's region that a result leaves out and that are
 * withheld, as hex-map areas without a value: each at its layout position,
 * named from the boundary files, with its ONS code as its id. For a
 * disclosure-controlled breakdown these are the areas disclosure control
 * withheld: the ones its list names, or, without a list, every one.
 *
 * They follow withheldUKAreaCodes, and none are listed when the result
 * cannot be matched to the layout. So a map that keeps its result's own
 * positions, because placeOnUKHexLayout could not place every area, never
 * gets any: they are drawn only on the tiled grid.
 */
export function withheldUKHexAreas(
  level: UKBoundaryLevel,
  points: Pick<HexMapDataPoint, 'code'>[],
  region?: string | null,
  listedWithheldCodes?: readonly string[] | null
): HexMapMissingArea[] {
  const missing = withheldUKAreaCodes(
    level,
    points.map((point) => point.code),
    region,
    listedWithheldCodes
  );
  return layoutHexAreas(level, missing?.codes ?? []);
}

/** A level's hex map: its result's areas, placed, and the region's areas it leaves out. */
export interface UKHexMap extends UKHexMapPlacement {
  /**
   * The region's areas the result leaves out that are withheld, which the
   * map draws as not reported: only for a disclosure-controlled level, on
   * the tiled grid.
   */
  withheldAreas: HexMapMissingArea[];
  /**
   * The region's other areas the result leaves out, which the map draws as
   * having no data: only when the breakdown lists its withheld codes.
   */
  noDataAreas: HexMapMissingArea[];
}

/**
 * A level's hex map, as v2's charts and v3's local-area map draw it: the
 * result's areas placed from the layout, all or none (placeOnUKHexLayout),
 * and, for a level from a disclosure-controlled breakdown, the region's
 * areas the result leaves out (withheldUKAreaCodes): withheld, or with no
 * data when the breakdown's list of withheld codes does not name them.
 * They are listed only when the map is tiled: a result that keeps its own
 * positions cannot be matched to the layout. A saved level has none.
 */
export function placeUKHexMap(
  level: UKBoundaryLevel,
  points: HexMapDataPoint[],
  {
    disclosureControlled,
    region,
    listedWithheldCodes,
  }: {
    disclosureControlled: boolean;
    region?: string | null;
    /** The breakdown's withheld codes at this level; null or absent when it does not list them. */
    listedWithheldCodes?: readonly string[] | null;
  }
): UKHexMap {
  const placement = placeOnUKHexLayout(level, points);
  const missing =
    disclosureControlled && placement.tiled
      ? withheldUKAreaCodes(
          level,
          points.map((point) => point.code),
          region,
          listedWithheldCodes
        )
      : null;
  return {
    ...placement,
    withheldAreas: layoutHexAreas(level, missing?.codes ?? []),
    noDataAreas: layoutHexAreas(level, missing?.noDataCodes ?? []),
  };
}
