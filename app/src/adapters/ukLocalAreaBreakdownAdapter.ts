import { hasUKLocalAreaImpacts } from '@/adapters/societyWideOutputNormalizer';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { Region } from '@/models/region';
import type { Geography } from '@/types/ingredients/Geography';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { LocalAreaBreakdown } from '@/types/metadata/LocalAreaBreakdown';
import { isUKLocalLevelGeography, isUKLocalLevelRegion } from '@/utils/geographyUtils';

/** The result with a completed breakdown's constituency and local authority impacts in it. */
export function withLocalAreaBreakdown(
  output: SocietyWideReportOutput,
  breakdown: LocalAreaBreakdown
): SocietyWideReportOutput {
  return {
    ...output,
    constituency_impact: breakdown.constituency_impact,
    local_authority_impact: breakdown.local_authority_impact,
  } as SocietyWideReportOutput;
}

/**
 * The result whose local-area impacts a UK report shows: its own when it
 * holds them (older saved results), else the result with a completed
 * breakdown's areas in it. Null until there are areas to show.
 */
export function localAreaOutput(
  output: SocietyWideReportOutput,
  breakdown: LocalAreaBreakdown | null
): SocietyWideReportOutput | null {
  if (hasUKLocalAreaImpacts(output)) {
    return output;
  }
  return breakdown ? withLocalAreaBreakdown(output, breakdown) : null;
}

/** A report's breakdown request, as the v2 local-area views take it. */
export interface ReportLocalAreaRequest {
  reformPolicyId?: string;
  baselinePolicyId?: string;
  region?: string;
  year?: string;
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
}): ReportLocalAreaRequest | null {
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

/**
 * How many of a level's areas a disclosure-controlled breakdown left out,
 * out of how many there are; null when the app cannot count them.
 */
export type UKWithheldAreas = { withheld: number; total: number } | null;

export type UKBreakdownWithheldAreas = Record<UKAreaLevel, UKWithheldAreas>;

/**
 * The areas of a level a breakdown did not publish, counted against the
 * region list from the country metadata. A count needs the two lists to
 * name the same areas, so it is given only:
 * - for constituencies, whose 650 names API v1 and .py share. Local
 *   authorities are not counted: API v1 lists 360, .py 361 ("Ards and
 *   North Down" is .py's only);
 * - for a UK-wide report, as the metadata does not say which nation an
 *   area is in;
 * - when every published name is in the list.
 */
export function countWithheldUKAreas({
  level,
  region,
  publishedNames,
  regions,
}: {
  level: UKAreaLevel;
  region?: string | null;
  publishedNames: string[];
  regions: Region[];
}): UKWithheldAreas {
  if (level !== 'constituency' || (region && region.toLowerCase() !== 'uk')) {
    return null;
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
  return {
    constituency: countWithheldUKAreas({
      level: 'constituency',
      region,
      publishedNames: Object.keys(breakdown.constituency_impact?.by_constituency ?? {}),
      regions,
    }),
    local_authority: countWithheldUKAreas({
      level: 'local_authority',
      region,
      publishedNames: Object.keys(breakdown.local_authority_impact?.by_local_authority ?? {}),
      regions,
    }),
  };
}
