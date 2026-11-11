import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import UKLocalAreaMaps from '@/components/flagship/report/UKLocalAreaMaps';
import UKLocalAreaComputePanel from '@/components/report/UKLocalAreaComputePanel';
import { colors, spacing } from '@/designTokens';
import { useUKLocalAreaOutput } from '@/hooks/useUKLocalAreaOutput';

/**
 * A UK report's "Local areas" tab content. A result that holds its area
 * impacts (an older saved report) shows them at once, and a result from a
 * release before .py 6.10.0 shows what it holds as before. A national
 * result without them (.py 6.10.0 on) shows the compute panel; its button sends one
 * breakdown request for the report's region and year, and the maps replace
 * the panel when the run completes, with notes on the areas disclosure
 * control withheld or published as approximate. Nothing is drawn before
 * then: the maps have no results to colour, though the hex map's positions
 * come from the app's own layout files.
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
  const { canCompute, breakdown, areaOutput, withheld } = useUKLocalAreaOutput(output, {
    reformPolicyId,
    baselinePolicyId,
    region,
    year,
  });

  // A result from an older release reads as before: no breakdown to offer.
  if (!canCompute) {
    return <UKLocalAreaMaps output={output} region={region} />;
  }

  if (areaOutput) {
    // A saved result with one level offers the breakdown for the other.
    return (
      <UKLocalAreaMaps
        output={areaOutput}
        region={region}
        withheld={withheld}
        missingLevelContent={<UKLocalAreaComputePanel breakdown={breakdown} />}
      />
    );
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
