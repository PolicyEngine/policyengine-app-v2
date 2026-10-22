import { useMemo, type ReactNode } from 'react';
import {
  withLocalAreaBreakdown,
  type UKBreakdownWithheldAreas,
} from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import UKLocalAreaComputePanel from '@/components/report/UKLocalAreaComputePanel';
import { spacing } from '@/designTokens';
import {
  useUKLocalAreaBreakdown,
  type UKLocalAreaBreakdownRequest,
} from '@/hooks/useUKLocalAreaBreakdown';
import { useUKWithheldAreas } from '@/hooks/useUKWithheldAreas';

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
  request: Omit<UKLocalAreaBreakdownRequest, 'countryId'>;
  children: (areaOutput: SocietyWideReportOutput, withheld?: UKBreakdownWithheldAreas) => ReactNode;
}) {
  const breakdown = useUKLocalAreaBreakdown({ countryId: 'uk', ...request });
  const withheld = useUKWithheldAreas(breakdown.breakdown, request.region);
  const areaOutput = useMemo(
    () => (breakdown.breakdown ? withLocalAreaBreakdown(output, breakdown.breakdown) : null),
    [output, breakdown.breakdown]
  );

  if (areaOutput) {
    return <>{children(areaOutput, withheld)}</>;
  }

  return (
    <div style={{ paddingTop: spacing.lg, paddingBottom: spacing.lg }}>
      <UKLocalAreaComputePanel breakdown={breakdown} />
    </div>
  );
}
