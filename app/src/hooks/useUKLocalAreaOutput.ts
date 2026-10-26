import { useMemo } from 'react';
import {
  breakdownLevelsWithheld,
  localAreaOutput,
  outputServesLocalAreaBreakdowns,
  withheldUKAreasOf,
  type UKBreakdownWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { useRegions } from '@/hooks/useRegions';
import {
  useUKLocalAreaBreakdown,
  type UKLocalAreaBreakdownState,
  type UKReportLocalAreaRequest,
} from '@/hooks/useUKLocalAreaBreakdown';

export interface UKLocalAreaOutput {
  /**
   * Whether the views may offer the breakdown: the result came from a .py
   * release that serves breakdowns (6.10.0 on), and the report's policies
   * are known. Otherwise views show their level as they did before.
   */
  canCompute: boolean;
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
   * against the UK region metadata, or a nation's areas, where the lists
   * allow (countWithheldUKAreas). Saved levels get none.
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
  request: UKReportLocalAreaRequest | null
): UKLocalAreaOutput {
  const canCompute = !!request && outputServesLocalAreaBreakdowns(output);
  // An older release's result sends no request, even with a cached run.
  const breakdown = useUKLocalAreaBreakdown({ countryId: 'uk', ...(canCompute ? request : null) });
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
  return { canCompute: canCompute && breakdown.canStart, breakdown, areaOutput, withheld };
}
