import { useMemo } from 'react';
import {
  breakdownLevelsWithheld,
  localAreaOutput,
  withheldUKAreasOf,
  type ReportLocalAreaRequest,
  type UKBreakdownWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { useRegions } from '@/hooks/useRegions';
import {
  useUKLocalAreaBreakdown,
  type UKLocalAreaBreakdownState,
} from '@/hooks/useUKLocalAreaBreakdown';

export interface UKLocalAreaOutput {
  /** The report's breakdown run, for the compute panel and button. */
  breakdown: UKLocalAreaBreakdownState;
  /**
   * The result with each level it holds, and each level it lacks from the
   * completed breakdown; null until either level has areas. A level still
   * lacking stays absent, for its view to offer the breakdown.
   */
  areaOutput: SocietyWideReportOutput | null;
  /**
   * The areas withheld at each level the breakdown supplied, counted
   * against the UK region metadata where the lists allow
   * (countWithheldUKAreas). Saved levels get none.
   */
  withheld: UKBreakdownWithheldAreas | undefined;
}

/**
 * What a UK local-area view shows: the report's breakdown run
 * (useUKLocalAreaBreakdown), the result with the breakdown's areas merged
 * in level by level, and the breakdown levels' withheld areas. Shared by
 * the v3 Local areas tab, and the v2 sections and tabs.
 */
export function useUKLocalAreaOutput(
  output: SocietyWideReportOutput,
  request: ReportLocalAreaRequest | null
): UKLocalAreaOutput {
  const breakdown = useUKLocalAreaBreakdown({ countryId: 'uk', ...request });
  const { data: regions } = useRegions('uk');
  const region = request?.region;
  const areaOutput = useMemo(
    () => localAreaOutput(output, breakdown.breakdown),
    [output, breakdown.breakdown]
  );
  const withheld = useMemo(
    () =>
      breakdown.breakdown
        ? breakdownLevelsWithheld(
            output,
            withheldUKAreasOf(breakdown.breakdown, region, regions ?? [])
          )
        : undefined,
    [output, breakdown.breakdown, region, regions]
  );
  return { breakdown, areaOutput, withheld };
}
