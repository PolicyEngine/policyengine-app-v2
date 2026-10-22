import { useMemo } from 'react';
import { localAreaOutput } from '@/adapters/ukLocalAreaBreakdownAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import UKLocalAreaMaps from '@/components/flagship/report/UKLocalAreaMaps';
import UKLocalAreaComputePanel from '@/components/report/UKLocalAreaComputePanel';
import { colors, spacing } from '@/designTokens';
import { useUKLocalAreaBreakdown } from '@/hooks/useUKLocalAreaBreakdown';

/**
 * A UK report's "Local areas" tab content. A result that holds its area
 * impacts (an older saved report) shows them at once. A national result
 * without them (.py 6.10.0 on) shows the compute panel; its button sends one
 * breakdown request for the report's region and year, and the maps replace
 * the panel when the run completes. The hex layout comes with the results,
 * so nothing is drawn before then.
 */
export default function UKLocalAreaSection({
  output,
  region,
  year,
  reformPolicyId,
  baselinePolicyId,
}: {
  output: SocietyWideReportOutput;
  /** The report's region: `uk` (or empty) or `country/*`. */
  region?: string;
  year: string;
  reformPolicyId?: string;
  baselinePolicyId?: string;
}) {
  const breakdown = useUKLocalAreaBreakdown({
    countryId: 'uk',
    reformPolicyId,
    baselinePolicyId,
    region,
    year,
  });
  const areaOutput = useMemo(
    () => localAreaOutput(output, breakdown.breakdown),
    [output, breakdown.breakdown]
  );

  if (areaOutput) {
    return <UKLocalAreaMaps output={areaOutput} region={region} />;
  }

  return (
    <div
      style={{
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
      }}
    >
      <UKLocalAreaComputePanel breakdown={breakdown} />
    </div>
  );
}
