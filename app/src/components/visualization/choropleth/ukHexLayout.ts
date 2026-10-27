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
import type { UKAreaChoroplethDataPoint, UKBoundaryLevel } from './types';
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

/**
 * A level's areas as hex-map points, placed from the app's layout: each
 * area whose code the layout has takes that position. An area the layout
 * has no position for (no code, as in an older saved result, or a code the
 * layout lacks, such as a district abolished in April 2023) is left out, as
 * the map has nowhere to draw it; mixing in its result's position would put
 * two different grids on one map. v2's and v3's UK hex maps both place
 * their areas with this, on the tiled grid.
 */
export function placeOnUKHexLayout(
  level: UKBoundaryLevel,
  points: UKAreaChoroplethDataPoint[]
): HexMapDataPoint[] {
  return points.flatMap((point) => {
    const position = ukHexPosition(level, point.code);
    return position ? [{ ...point, ...position }] : [];
  });
}

/** The areas of a report's region a result leaves out, by ONS code, and how many the region has. */
export interface UKWithheldAreaCodes {
  codes: string[];
  total: number;
}

/**
 * The ONS codes of a report's region's areas that a result leaves out, by
 * the result's codes against the layout, and how many areas the region
 * has; null when the result cannot be matched to the layout. The hex map's
 * withheld areas and the note's count under it both follow this rule, so
 * they always agree.
 *
 * The region's areas are the layout's: all of them for a UK-wide report
 * (`uk`, or no region), and the nation's for a nation's report. The result
 * cannot be matched when an area has no code (an older saved result) or a
 * code outside the region's layout (such as a district abolished in April
 * 2023, or an area of another nation), or when the region is neither the
 * UK nor a nation.
 */
export function withheldUKAreaCodes(
  level: UKBoundaryLevel,
  codes: (string | null | undefined)[],
  region?: string | null
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
  return {
    codes: regionCodes.filter((code) => !reportedCodes.has(code)),
    total: regionCodes.length,
  };
}

/**
 * The areas of a report's region that a result leaves out, as hex-map
 * areas without a value: each at its layout position, named from the
 * boundary files, with its ONS code as its id. For a disclosure-controlled
 * breakdown these are the areas disclosure control withheld.
 *
 * They follow withheldUKAreaCodes, and none are listed when the result
 * cannot be matched to the layout: a layout area the result lacks may then
 * be covered by one of the result's unmatched areas, such as the districts
 * a 2023 unitary authority replaced, so calling it withheld could be wrong.
 * A hex map that leaves out areas placeOnUKHexLayout cannot place
 * therefore draws no withheld areas either.
 */
export function withheldUKHexAreas(
  level: UKBoundaryLevel,
  points: Pick<UKAreaChoroplethDataPoint, 'code'>[],
  region?: string | null
): HexMapMissingArea[] {
  const withheld = withheldUKAreaCodes(
    level,
    points.map((point) => point.code),
    region
  );
  // Each withheld code is one of the layout's own keys, so it has a position.
  return (withheld?.codes ?? []).map((code) => ({
    id: code,
    label: UK_HEX_AREA_NAMES[level][code] ?? code,
    ...gridPosition(UK_HEX_LAYOUTS[level][code]),
  }));
}

/** A level's hex map: its result's areas, placed, and the areas drawn as withheld. */
export interface UKHexMap {
  /** The result's areas the layout places, at their layout positions. */
  points: HexMapDataPoint[];
  /**
   * The region's areas the result leaves out, which the map draws as not
   * reported: only for a disclosure-controlled level whose areas the layout
   * can all match.
   */
  withheldAreas: HexMapMissingArea[];
}

/**
 * A level's hex map, as v2's charts and v3's local-area map draw it, on the
 * tiled grid: the result's areas placed from the layout, leaving out any it
 * cannot place (placeOnUKHexLayout), and, for a level from a
 * disclosure-controlled breakdown, the region's areas the result leaves out
 * (withheldUKHexAreas), of which there are none when any of the result's
 * areas cannot be matched to the layout. A saved level has none.
 */
export function placeUKHexMap(
  level: UKBoundaryLevel,
  points: UKAreaChoroplethDataPoint[],
  { disclosureControlled, region }: { disclosureControlled: boolean; region?: string | null }
): UKHexMap {
  return {
    points: placeOnUKHexLayout(level, points),
    withheldAreas: disclosureControlled ? withheldUKHexAreas(level, points, region) : [],
  };
}
