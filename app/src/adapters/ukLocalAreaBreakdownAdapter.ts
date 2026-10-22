import { hasUKLocalAreaImpacts } from '@/adapters/societyWideOutputNormalizer';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
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
