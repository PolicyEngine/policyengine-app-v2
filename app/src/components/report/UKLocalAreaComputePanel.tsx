import BreakdownComputePanel, {
  BreakdownComputeButton,
  type BreakdownComputeCopy,
} from '@/components/flagship/report/BreakdownComputePanel';
import { runStageCaption } from '@/components/flagship/report/RunProgress';
import type { UKLocalAreaBreakdownState } from '@/hooks/useUKLocalAreaBreakdown';

const UK_LOCAL_AREA_COPY: BreakdownComputeCopy = {
  intro:
    'Constituency and local authority impacts are calculated in a separate run, which takes a few minutes.',
  computeLabel: 'Compute local-area impacts',
  computingMessage: 'Computing local-area impacts…',
  progressLabel: 'Computing local-area impacts',
  errorMessage: 'Local-area impacts could not be calculated.',
};

/** The button that sends a report's breakdown request; shown only before it is sent. */
export function UKLocalAreaComputeButton({
  breakdown,
}: {
  breakdown: Pick<UKLocalAreaBreakdownState, 'status' | 'canStart' | 'start'>;
}) {
  return (
    <BreakdownComputeButton
      status={breakdown.status}
      copy={UK_LOCAL_AREA_COPY}
      canStart={breakdown.canStart}
      onStart={breakdown.start}
    />
  );
}

/** The line under the message: the queue position, else the API's stage. */
function computingDetail(breakdown: UKLocalAreaBreakdownState): string | undefined {
  if (typeof breakdown.queuePosition === 'number' && breakdown.queuePosition > 0) {
    return `In queue (position ${breakdown.queuePosition})`;
  }
  return runStageCaption(breakdown.stage ? { stage: breakdown.stage } : undefined);
}

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
  return (
    <BreakdownComputePanel
      status={breakdown.status}
      copy={UK_LOCAL_AREA_COPY}
      canStart={breakdown.canStart}
      onStart={breakdown.start}
      onRetry={breakdown.retry}
      progress={breakdown.progress}
      detail={breakdown.status === 'computing' ? computingDetail(breakdown) : undefined}
      reason={breakdown.error}
      showStartButton={showStartButton}
    />
  );
}
