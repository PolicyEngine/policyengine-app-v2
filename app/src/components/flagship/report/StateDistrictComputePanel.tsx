import BreakdownComputePanel, {
  BreakdownComputeButton,
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
  // Neutral, as the reasons below it may say a run may still finish.
  errorMessage: 'District impacts are not in.',
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

/** The button that computes the remaining states; shown only before they are computed. */
export function StateDistrictComputeButton({ runs }: { runs: StateDistrictRuns }) {
  return (
    <BreakdownComputeButton
      status={runs.status === 'checking' ? 'computing' : runs.status}
      copy={{ ...DISTRICT_COPY, intro: '' }}
      canStart={runs.canStart}
      onStart={runs.start}
    />
  );
}

/** Ends `text` with a full stop unless it already ends a sentence. */
function asSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** The most failure reasons the panel gives before naming the other states together. */
const NAMED_REASONS = 3;

/**
 * Which states failed, and why: one sentence for each reason, naming the
 * states that failed with it (the first three reasons; the other states are
 * named together), then one for the states whose result has no districts.
 * Empty when no state failed.
 */
function failureReason(runs: StateDistrictRuns): string {
  const labelsByError = new Map<string, string[]>();
  for (const { label, error } of runs.calculationFailures) {
    labelsByError.set(error, [...(labelsByError.get(error) ?? []), label]);
  }
  const reasons = [...labelsByError];
  const sentences = reasons
    .slice(0, NAMED_REASONS)
    .map(([error, labels]) => asSentence(`${listStates(labels)}: ${error}`));
  const otherLabels = reasons.slice(NAMED_REASONS).flatMap(([, labels]) => labels);
  if (otherLabels.length > 0) {
    sentences.push(`${listStates(otherLabels)} failed for other reasons.`);
  }
  const noDistrictLabels = runs.noDistrictStateLabels;
  if (noDistrictLabels.length > 0) {
    const several = noDistrictLabels.length > 1;
    sentences.push(
      `The ${several ? 'results' : 'result'} for ${listStates(noDistrictLabels)} ${several ? 'have' : 'has'} no congressional districts.`
    );
  }
  return sentences.join(' ');
}

function intro(runs: StateDistrictRuns): string {
  if (runs.completedCount === 0) {
    return NONE_COMPUTED_INTRO;
  }
  const rest = runs.totalStates - runs.completedCount;
  const saved = `${runs.completedCount} of ${runs.totalStates} states are saved.`;
  return rest === 1
    ? `${saved} Compute the last one to fill in the map; it takes a few minutes.`
    : `${saved} Compute the other ${rest} to fill in the map; they take a few minutes.`;
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
  const failedReason = partial || runs.status === 'error' ? failureReason(runs) : '';
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
      reason={failedReason || runs.error}
      showStartButton={showStartButton}
    />
  );
}
