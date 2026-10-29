import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import DistrictImpactCard from '@/components/flagship/report/DistrictImpactCard';
import StateDistrictComputePanel from '@/components/flagship/report/StateDistrictComputePanel';
import { Stack } from '@/components/ui';
import { colors, spacing } from '@/designTokens';
import { useCongressionalDistrictImpacts } from '@/hooks/useCongressionalDistrictImpacts';

/**
 * A US report's Districts tab content, inside its
 * CongressionalDistrictDataProvider. A state report maps its own result's
 * districts, as before. A nationwide report maps each state's own run on
 * the state-level dataset, never the districts stored on the nationwide
 * result: the panel looks up each state's saved result and offers Compute
 * for the rest, and the map appears once a state is in and fills in state
 * by state, with the states still to come not called missing.
 */
export default function CongressionalDistrictSection({
  output,
}: {
  output: SocietyWideReportOutput;
}) {
  const { scope, districts, runs, pendingStates, failedStates } =
    useCongressionalDistrictImpacts(output);

  if (scope !== 'nationwide' || !runs) {
    return <DistrictImpactCard output={output} />;
  }

  return (
    <Stack style={{ gap: spacing.md }}>
      {runs.status !== 'complete' && (
        <div
          style={{
            padding: spacing.lg,
            border: `1px solid ${colors.border.light}`,
            borderRadius: spacing.radius.container,
            background: colors.background.primary,
          }}
        >
          <StateDistrictComputePanel runs={runs} />
        </div>
      )}
      {districts && (
        <DistrictImpactCard
          districts={districts}
          pendingStates={pendingStates}
          failedStates={failedStates}
        />
      )}
    </Stack>
  );
}
