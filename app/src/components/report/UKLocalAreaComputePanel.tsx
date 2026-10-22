import { runStageCaption } from '@/components/flagship/report/RunProgress';
import { Button, Progress, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { UKLocalAreaBreakdownState } from '@/hooks/useUKLocalAreaBreakdown';

const COMPUTE_LABEL = 'Compute local-area impacts';
const COMPUTING_MESSAGE = 'Computing local-area impacts…';

/** The button that sends a report's breakdown request; shown only before it is sent. */
export function UKLocalAreaComputeButton({
  breakdown,
}: {
  breakdown: Pick<UKLocalAreaBreakdownState, 'status' | 'canStart' | 'start'>;
}) {
  if (breakdown.status !== 'idle') {
    return null;
  }
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={breakdown.start}
      disabled={!breakdown.canStart}
    >
      {COMPUTE_LABEL}
    </Button>
  );
}

/** The line under the message: the queue position, else the API's stage. */
function computingDetail(breakdown: UKLocalAreaBreakdownState): string | undefined {
  if (typeof breakdown.queuePosition === 'number' && breakdown.queuePosition > 0) {
    return `In queue (position ${breakdown.queuePosition})`;
  }
  return runStageCaption(breakdown.stage ? { stage: breakdown.stage } : undefined);
}

const SECONDARY_TEXT_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: typography.fontSize.sm,
  color: colors.text.secondary,
};

/**
 * Where a UK report has no local-area impacts yet: the button that
 * calculates them, the run's progress, or its error with Retry. Shows
 * nothing once the impacts are in, for the maps to take its place.
 */
export default function UKLocalAreaComputePanel({
  breakdown,
  showStartButton = true,
}: {
  breakdown: UKLocalAreaBreakdownState;
  /** Off where the button sits elsewhere, e.g. in a section's header. */
  showStartButton?: boolean;
}) {
  if (breakdown.status === 'complete') {
    return null;
  }

  if (breakdown.status === 'computing') {
    const percent = Math.max(0, Math.min(Math.round(breakdown.progress ?? 0), 99));
    const detail = computingDetail(breakdown);
    return (
      <Stack role="status" aria-live="polite" style={{ gap: spacing.sm }}>
        <Text style={{ ...SECONDARY_TEXT_STYLE, color: colors.text.primary }}>
          {COMPUTING_MESSAGE}
        </Text>
        <Progress
          value={breakdown.progress ?? 0}
          aria-label={`Computing local-area impacts, about ${percent}%`}
        />
        {detail && (
          <Text style={{ ...SECONDARY_TEXT_STYLE, fontSize: typography.fontSize.xs }}>
            {detail}
          </Text>
        )}
      </Stack>
    );
  }

  if (breakdown.status === 'error') {
    return (
      <Stack role="alert" style={{ gap: spacing.sm, alignItems: 'flex-start' }}>
        <Text style={{ ...SECONDARY_TEXT_STYLE, color: colors.text.primary }}>
          Local-area impacts could not be calculated.
        </Text>
        <Button type="button" variant="outline" size="sm" onClick={breakdown.retry}>
          Retry
        </Button>
      </Stack>
    );
  }

  return (
    <Stack style={{ gap: spacing.md, alignItems: 'flex-start' }}>
      <Text style={SECONDARY_TEXT_STYLE}>
        Constituency and local authority impacts are calculated in a separate run, which takes a few
        minutes.
      </Text>
      {showStartButton && <UKLocalAreaComputeButton breakdown={breakdown} />}
    </Stack>
  );
}
