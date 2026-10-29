import type { EconomyCalculationResponse } from '@/api/societyWideCalculation';
import { clockProgress, runProgressValue } from '@/components/flagship/report/RunProgress';
import type { RunStage } from '@/types/calculation';

/**
 * Failed polls in a row (for example a 502 from a gateway) that a computing
 * run outlasts. The job may still run on the server, so the run keeps
 * polling and fails only on the next failure after these.
 */
export const MAX_FAILED_POLLS = 3;

/**
 * An economy run that the app polls itself, outside CalcOrchestrator, as
 * the query cache holds it: the UK local-area breakdown, and each state's
 * run for a nationwide report's congressional districts.
 */
export interface PolledRun<Result> {
  status: 'computing' | 'complete' | 'error';
  /** When this run was first sent (epoch ms), for the time estimate and the time limit. */
  startedAt: number;
  /** The run's result, once it is complete. */
  result: Result | null;
  /** 0–100 while computing: the time estimate, held inside the stage the API reports. */
  progress?: number;
  /** The run's stage from the API, e.g. `loading_data`, when it reports one. */
  stage?: string;
  queuePosition?: number;
  error?: string;
  /** Failed polls in a row while computing, up to MAX_FAILED_POLLS. */
  failedPolls?: number;
}

export interface PollRunOptions<Result, Kept> {
  /** How long a run like this one typically takes, for the clock. */
  expectedMs: number;
  /** How long the run may compute, from its first request, before it fails with Retry. */
  timeLimitMs: number;
  /** The error once the run computes past `timeLimitMs`. */
  timeLimitMessage: string;
  /** The error when the run fails without saying why. */
  failureMessage: string;
  /** An ok result as the run keeps it, or why the run cannot use it. */
  readResult: (result: Result) => { result: Kept } | { error: string };
}

/** The API's stage fields as a RunStage, as SocietyWideCalcStrategy reads them. */
export function runStageOf(
  response: Pick<EconomyCalculationResponse<unknown>, 'progress' | 'progress_max'>
): RunStage | undefined {
  if (typeof response.progress !== 'number' || typeof response.progress_max !== 'number') {
    return undefined;
  }
  return {
    floor: response.progress,
    max: Math.max(response.progress, response.progress_max),
  };
}

/**
 * When a run was first sent: a run still computing keeps its start time,
 * so its clock and time limit carry on across polls (and across views); a
 * new run, or one tried again after it failed, starts now.
 */
export function runStartedAt(previous: PolledRun<unknown> | undefined): number {
  return previous?.status === 'computing' ? previous.startedAt : Date.now();
}

function runFromResponse<Result, Kept>(
  response: EconomyCalculationResponse<Result>,
  startedAt: number,
  previous: PolledRun<Kept> | undefined,
  options: PollRunOptions<Result, Kept>
): PolledRun<Kept> {
  if (response.status === 'computing') {
    const elapsed = Date.now() - startedAt;
    if (elapsed > options.timeLimitMs) {
      return { status: 'error', startedAt, result: null, error: options.timeLimitMessage };
    }
    const progress = runProgressValue(
      clockProgress(elapsed, options.expectedMs),
      runStageOf(response)
    );
    return {
      status: 'computing',
      startedAt,
      result: null,
      // The bar never moves backwards between polls.
      progress:
        previous?.status === 'computing' ? Math.max(previous.progress ?? 0, progress) : progress,
      stage: typeof response.stage === 'string' ? response.stage : undefined,
      queuePosition: response.queue_position,
    };
  }
  if (response.status === 'ok' && response.result) {
    const read = options.readResult(response.result);
    if ('error' in read) {
      return { status: 'error', startedAt, result: null, error: read.error };
    }
    return { status: 'complete', startedAt, result: read.result };
  }
  return {
    status: 'error',
    startedAt,
    result: null,
    error: response.error || options.failureMessage,
  };
}

/**
 * Sends one poll of an economy run and answers with the run's next state.
 * A computing run's progress follows the clock (`expectedMs`), held inside
 * the stage the API reports and never moving backwards, and the run fails
 * once it computes for longer than `timeLimitMs`. A computing run outlasts
 * MAX_FAILED_POLLS failed requests in a row; a first request that fails
 * fails the run at once. It never rejects: a failure is a run in error.
 */
export async function pollRun<Result, Kept>(
  request: () => Promise<EconomyCalculationResponse<Result>>,
  previous: PolledRun<Kept> | undefined,
  options: PollRunOptions<Result, Kept>
): Promise<PolledRun<Kept>> {
  const startedAt = runStartedAt(previous);
  try {
    return runFromResponse(await request(), startedAt, previous, options);
  } catch (error) {
    // A computing run outlasts a few failed polls: its job may still run.
    const failedPolls = (previous?.failedPolls ?? 0) + 1;
    if (previous?.status === 'computing' && failedPolls <= MAX_FAILED_POLLS) {
      return { ...previous, failedPolls };
    }
    return {
      status: 'error',
      startedAt,
      result: null,
      error: error instanceof Error ? error.message : options.failureMessage,
    };
  }
}
