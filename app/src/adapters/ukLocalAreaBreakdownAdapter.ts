import {
  hasConstituencyImpacts,
  hasLocalAuthorityImpacts,
} from '@/adapters/societyWideOutputNormalizer';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  UK_AREA_COUNTS_BY_NATION,
  ukNationFromCode,
  ukNationFromRegion,
} from '@/components/visualization/choropleth/ukAreaBoundaries';
import type { UKReportLocalAreaRequest } from '@/hooks/useUKLocalAreaBreakdown';
import type { Region } from '@/models/region';
import type { Geography } from '@/types/ingredients/Geography';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';
import type { ReportOutputSocietyWideUK } from '@/types/metadata/ReportOutputSocietyWideUK';
import { isUKLocalLevelGeography, isUKLocalLevelRegion } from '@/utils/geographyUtils';

/** The first .py release whose bundles serve `breakdown=local_areas`. */
const FIRST_BREAKDOWN_RELEASE = [6, 10, 0] as const;

/**
 * Whether a .py version serves local-area breakdowns: 6.10.0 or later.
 * An empty or unreadable version does not.
 */
export function servesLocalAreaBreakdowns(policyengineVersion: string | null | undefined): boolean {
  const match = policyengineVersion?.trim().match(/^v?(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) {
    return false;
  }
  const version = [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
  for (let index = 0; index < FIRST_BREAKDOWN_RELEASE.length; index++) {
    if (version[index] !== FIRST_BREAKDOWN_RELEASE[index]) {
      return version[index] > FIRST_BREAKDOWN_RELEASE[index];
    }
  }
  return true;
}

/**
 * Whether a national result came from a .py release that serves
 * local-area breakdowns. The version is the result's policyengine_version,
 * which fetchSocietyWideCalculation fills from the policyengine_bundle
 * inside the result. A result saved before the app read that bundle has
 * the bundle but not the field, so the bundle's version is read when the
 * field is absent. Results from older releases (6.7.5 and before) or with
 * no version (saved before the bundle was recorded) do not serve
 * breakdowns: their missing levels are not offered one, which those
 * releases would refuse.
 */
export function outputServesLocalAreaBreakdowns(output: SocietyWideReportOutput): boolean {
  return servesLocalAreaBreakdowns(
    output.policyengine_version ?? output.policyengine_bundle?.policyengine_version
  );
}

/**
 * The result whose local-area impacts a UK report shows, level by level:
 * each level the result holds (older saved results) as it is, and each
 * level it lacks from a completed breakdown. Null until either level has
 * areas to show; a level still lacking stays absent, for its view to offer
 * the breakdown.
 */
export function localAreaOutput(
  output: SocietyWideReportOutput,
  breakdown: LocalAreaBreakdown | null
): SocietyWideReportOutput | null {
  const savedConstituencies = hasConstituencyImpacts(output);
  const savedLocalAuthorities = hasLocalAuthorityImpacts(output);
  if (savedConstituencies && savedLocalAuthorities) {
    return output;
  }
  if (!breakdown) {
    return savedConstituencies || savedLocalAuthorities ? output : null;
  }
  const uk = output as ReportOutputSocietyWideUK;
  return {
    ...output,
    constituency_impact: savedConstituencies
      ? uk.constituency_impact
      : breakdown.constituency_impact,
    local_authority_impact: savedLocalAuthorities
      ? uk.local_authority_impact
      : breakdown.local_authority_impact,
  } as SocietyWideReportOutput;
}

/**
 * A v2 report's breakdown request: the reform (simulations[1], else the
 * baseline, as the national run compares it) over the baseline
 * (simulations[0]), for the baseline's region and the report's year. Null
 * for a report that has no local-area views: outside the UK, or on one
 * constituency or local authority.
 */
export function ukLocalAreaBreakdownRequest({
  report,
  simulations,
  geographies,
}: {
  report?: Report;
  simulations?: Simulation[];
  geographies?: Geography[];
}): UKReportLocalAreaRequest | null {
  const region = simulations?.[0]?.populationId;
  if (
    report?.countryId !== 'uk' ||
    geographies?.some((geography) => isUKLocalLevelGeography(geography)) ||
    isUKLocalLevelRegion(region)
  ) {
    return null;
  }
  return {
    reformPolicyId: simulations?.[1]?.policyId ?? simulations?.[0]?.policyId,
    baselinePolicyId: simulations?.[0]?.policyId,
    region,
    year: report.year,
  };
}

export type UKAreaLevel = 'constituency' | 'local_authority';

/** Each level's area names, singular and plural, for the maps and their notes. */
export const UK_AREA_NOUNS: Record<UKAreaLevel, { one: string; many: string }> = {
  constituency: { one: 'constituency', many: 'constituencies' },
  local_authority: { one: 'local authority', many: 'local authorities' },
};

/**
 * What an area disclosure control withheld reads on the maps, in its
 * tooltip: the geographic map's boundary and the hex map's hexagon alike.
 */
export const UK_WITHHELD_AREA_TEXT = 'Not reported';

/**
 * How many of a level's areas a disclosure-controlled breakdown left out,
 * out of how many there are; null when the app cannot count them.
 */
export type UKWithheldAreas = { withheld: number; total: number } | null;

/** Each level's withheld areas; a level absent here gets no withheld note. */
export type UKBreakdownWithheldAreas = Partial<Record<UKAreaLevel, UKWithheldAreas>>;

/**
 * The areas of a level a breakdown did not report, out of the level's areas
 * in the report's region; null when the app cannot count them.
 *
 * - A UK-wide report counts against the level's areas in the region list
 *   from the country metadata, by name. The count needs every published
 *   name to be in the list; otherwise the lists disagree, and no count is
 *   given. The Public API lists the same 650 constituencies as .py, and
 *   from PolicyEngine/policyengine-api#4024 on the same 361 local
 *   authorities as .py 6.10.0. An earlier deployment lists 360, without
 *   Ards and North Down; a breakdown that publishes that area then gets no
 *   local authority count.
 * - A nation report counts against the nation's areas in the boundary files
 *   (UK_AREA_COUNTS_BY_NATION), by each published area's ONS code, because
 *   the metadata gives an area's name, label and type but not its code or
 *   nation. The count needs every published area to have a code in the
 *   nation.
 */
export function countWithheldUKAreas({
  level,
  region,
  publishedNames,
  publishedCodes = [],
  regions,
}: {
  level: UKAreaLevel;
  region?: string | null;
  publishedNames: string[];
  /** The published areas' ONS codes, one per area, for a nation report. */
  publishedCodes?: (string | undefined)[];
  regions: Region[];
}): UKWithheldAreas {
  if (region && region.toLowerCase() !== 'uk') {
    const nation = ukNationFromRegion(region);
    if (
      !nation ||
      publishedCodes.length !== publishedNames.length ||
      publishedCodes.some((code) => ukNationFromCode(code) !== nation)
    ) {
      return null;
    }
    const total = UK_AREA_COUNTS_BY_NATION[level][nation];
    const published = new Set(publishedCodes).size;
    return published <= total ? { withheld: total - published, total } : null;
  }
  const prefix = `${level}/`;
  const listedNames = new Set(
    regions
      .filter((entry) => entry.code.startsWith(prefix))
      .map((entry) => entry.code.slice(prefix.length))
  );
  if (listedNames.size === 0 || publishedNames.some((name) => !listedNames.has(name))) {
    return null;
  }
  return { withheld: listedNames.size - new Set(publishedNames).size, total: listedNames.size };
}

/**
 * Both levels' withheld areas for a breakdown of a report's region. A level
 * the API returned as null publishes no areas.
 */
export function withheldUKAreasOf(
  breakdown: LocalAreaBreakdown,
  region: string | null | undefined,
  regions: Region[]
): UKBreakdownWithheldAreas {
  const constituencies = breakdown.constituency_impact?.by_constituency ?? {};
  const localAuthorities = breakdown.local_authority_impact?.by_local_authority ?? {};
  return {
    constituency: countWithheldUKAreas({
      level: 'constituency',
      region,
      publishedNames: Object.keys(constituencies),
      publishedCodes: Object.values(constituencies).map((area) => area.code),
      regions,
    }),
    local_authority: countWithheldUKAreas({
      level: 'local_authority',
      region,
      publishedNames: Object.keys(localAuthorities),
      publishedCodes: Object.values(localAuthorities).map((area) => area.code),
      regions,
    }),
  };
}

/**
 * The withheld areas of only the levels a breakdown supplies: a level the
 * result already holds is saved, not disclosure-controlled, so it gets no
 * withheld note.
 */
export function breakdownLevelsWithheld(
  output: SocietyWideReportOutput,
  withheld: UKBreakdownWithheldAreas | undefined
): UKBreakdownWithheldAreas | undefined {
  if (!withheld) {
    return undefined;
  }
  return {
    ...(!hasConstituencyImpacts(output) && { constituency: withheld.constituency }),
    ...(!hasLocalAuthorityImpacts(output) && { local_authority: withheld.local_authority }),
  };
}
