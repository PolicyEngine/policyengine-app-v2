/**
 * What a report is doing while it loads, as a short list of stages
 * derived from the real state of the run, so the loading view can say
 * what is happening rather than show placeholders for every section.
 */

export type StageState = 'done' | 'active' | 'pending';

export interface ReportStage {
  id: 'report' | 'reform' | 'run' | 'validate';
  label: string;
  /** One line under the label, e.g. queue position or a count. */
  detail?: string;
  state: StageState;
}

export interface ReportStageInput {
  /** The report and its simulations have loaded from the API. */
  reportLoaded: boolean;
  /** Provisions are known (local stash or rebuilt from the policy). */
  provisionsLoaded: boolean;
  provisionCount: number;
  calc: {
    status: string;
    message?: string;
    queuePosition?: number;
    progress?: number;
  };
  /** Both validation checks have settled. */
  validationResolved: boolean;
  /** Calibrated variables found, once resolved. */
  calibratedCount?: number;
  /** Scorecard programs found, once resolved. */
  scorecardPrograms?: string[];
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function runDetail(calc: ReportStageInput['calc']): string | undefined {
  if (typeof calc.queuePosition === 'number' && calc.queuePosition > 0) {
    return `In queue, position ${calc.queuePosition}`;
  }
  if (calc.message) {
    return calc.message;
  }
  if (typeof calc.progress === 'number') {
    return `${Math.round(calc.progress)}% through the population`;
  }
  return undefined;
}

function validationDetail(input: ReportStageInput): string | undefined {
  if (!input.validationResolved) {
    return undefined;
  }
  const parts: string[] = [];
  if (typeof input.calibratedCount === 'number') {
    parts.push(
      input.calibratedCount > 0
        ? `${plural(input.calibratedCount, 'calibrated variable')} found`
        : 'no calibrated variables among those the reform moves'
    );
  }
  if (input.scorecardPrograms && input.scorecardPrograms.length > 0) {
    parts.push(`scorecard context for ${input.scorecardPrograms.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

/** The stages in order, with exactly one active unless everything is done. */
export function reportStages(input: ReportStageInput): ReportStage[] {
  const runStarted = input.reportLoaded && input.calc.status !== 'initializing';
  const runDone = input.calc.status === 'complete';
  const done = [input.reportLoaded, input.provisionsLoaded, runDone, input.validationResolved];
  const firstOpen = done.indexOf(false);
  const state = (index: number): StageState =>
    done[index] ? 'done' : index === firstOpen ? 'active' : 'pending';

  return [
    { id: 'report', label: 'Loading the report', state: state(0) },
    {
      id: 'reform',
      label: 'Loading the reform',
      detail: input.provisionsLoaded ? plural(input.provisionCount, 'provision') : undefined,
      state: state(1),
    },
    {
      id: 'run',
      label: runStarted ? 'Running the society-wide calculation' : 'Starting the society-wide run',
      detail: runStarted && !runDone ? runDetail(input.calc) : undefined,
      state: state(2),
    },
    {
      id: 'validate',
      label: 'Checking the data behind the estimate',
      detail: validationDetail(input),
      state: state(3),
    },
  ];
}

/** "1m 20s" style elapsed time for the status line. */
export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
}
