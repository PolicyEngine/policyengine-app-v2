import BreakdownComputePanel, {
  type BreakdownComputeCopy,
} from '@/components/flagship/report/BreakdownComputePanel';
import { RunLoading } from '@/components/flagship/report/RunProgress';
import type { StateDistrictRuns } from '@/hooks/useStateDistrictRuns';

const CHECKING_LABEL = 'Checking for saved state results';

const NONE_COMPUTED_INTRO =
  'Congressional district impacts come from a separate run for each state and DC, on its own state data. They take a few minutes.';

const DISTRICT_COPY: Omit<BreakdownComputeCopy, 'intro'> = {
  computeLabel: 'Compute district impacts',
  computingMessage: 'Computing district impacts…',
  progressLabel: 'Computing district impacts',
  errorMessage: 'District impacts could not be calculated.',
};

/** The most failed states the panel names before counting the rest. */
const NAMED_STATES = 5;

/** "Texas", "Texas and Utah", or "Ohio, Texas and Utah"; past five, the rest are counted. */
export function listStates(labels: string[]): string {
  if (labels.length > NAMED_STATES) {
    const others = labels.length - NAMED_STATES;
    return `${labels.slice(0, NAMED_STATES).join(', ')} and ${others} other ${others === 1 ? 'state' : 'states'}`;
  }
  if (labels.length <= 1) {
    return labels[0] ?? '';
  }
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

function intro(runs: StateDistrictRuns): string {
  if (runs.completedCount === 0) {
    return NONE_COMPUTED_INTRO;
  }
  const rest = runs.totalStates - runs.completedCount;
  return `${runs.completedCount} of ${runs.totalStates} states are saved. Compute the other ${rest} to fill in the map; they take a few minutes.`;
}

/**
 * Where a nationwide US report's congressional districts are not all in:
 * a spinner while each state's saved result is looked up, then Compute
 * (saying how many states are saved already), the states' progress with
 * how many are in, or which states failed and why, with Retry when asking
 * again could help. Shows nothing once every state is in.
 */
export default function StateDistrictComputePanel({
  runs,
  showStartButton = true,
}: {
  runs: StateDistrictRuns;
  /** Off where the button sits elsewhere, e.g. in a section's header. */
  showStartButton?: boolean;
}) {
  if (runs.status === 'checking') {
    return <RunLoading label={CHECKING_LABEL} />;
  }

  const partial = runs.status === 'partial';
  const failedNames = listStates(runs.failedStateLabels);
  return (
    <BreakdownComputePanel
      status={runs.status}
      copy={{ ...DISTRICT_COPY, intro: intro(runs) }}
      canStart={runs.canStart}
      onStart={runs.start}
      onRetry={runs.canRetry ? runs.retry : undefined}
      progress={runs.progress}
      detail={`${runs.completedCount} of ${runs.totalStates} states`}
      summary={partial ? `${runs.completedCount} of ${runs.totalStates} states are in.` : undefined}
      reason={
        partial && failedNames
          ? `${failedNames} could not be calculated${runs.error ? `: ${runs.error}` : '.'}`
          : runs.error
      }
      showStartButton={showStartButton}
    />
  );
}
