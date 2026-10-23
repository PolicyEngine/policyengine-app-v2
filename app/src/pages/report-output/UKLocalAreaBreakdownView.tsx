import type { ReactNode } from 'react';
import type { UKBreakdownWithheldAreas } from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import UKLocalAreaComputePanel from '@/components/report/UKLocalAreaComputePanel';
import { spacing } from '@/designTokens';
import type { UKReportLocalAreaRequest } from '@/hooks/useUKLocalAreaBreakdown';
import { useUKLocalAreaOutput } from '@/hooks/useUKLocalAreaOutput';

/**
 * A v2 constituency or local authority tab whose result has no area
 * impacts: the compute panel until the report's breakdown completes, then
 * the tab's charts on the result with the breakdown's areas in it, and the
 * areas each level left out. The run is shared with the report's other
 * local-area views.
 */
export function UKLocalAreaBreakdownView({
  output,
  request,
  children,
}: {
  output: SocietyWideReportOutput;
  request: UKReportLocalAreaRequest;
  children: (areaOutput: SocietyWideReportOutput, withheld?: UKBreakdownWithheldAreas) => ReactNode;
}) {
  const { breakdown, areaOutput, withheld } = useUKLocalAreaOutput(output, request);

  // The tab's own level is missing from the result (its parent checks), so
  // it waits for the breakdown even when the result holds the other level.
  if (breakdown.breakdown && areaOutput) {
    return <>{children(areaOutput, withheld)}</>;
  }

  return (
    <div style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
      <UKLocalAreaComputePanel breakdown={breakdown} />
    </div>
  );
}
