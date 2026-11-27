import type { CalcStatus, RunStage } from '@/types/calculation';

/**
 * The shared progress model for a society-wide run's bar: the report's own
 * year, its other budget-window years, bill reports, UK local areas and
 * state district runs. A run's query cache entry keeps its start time and
 * the highest value its bar reached at a poll; the bar's value at any
 * moment comes from those, its stage and the clock.
 */

/**
 * What a computing run's bar is computed from, as its query cache entry
 * keeps it.
 */
export interface RunProgressState {
  /** When the run was first requested (epoch ms). */
  startedAt: number;
  /** The highest value the bar reached at a poll, 0–100; none before the first. */
  highestProgress?: number;
  /** The stage the API reported at the last poll, when it reports one. */
  runStage?: RunStage;
}

/** How long a run like this one is expected to take. */
export interface RunDurationEstimate {
  /** The typical duration from the first request, in milliseconds. */
  expectedMs: number;
}

/**
 * The bar by the clock alone: steady to 85% over the typical run, then
 * slowing toward 95%, so a run that takes longer still moves.
 */
export function clockProgress(elapsed: number, expectedMs: number): number {
  if (elapsed <= expectedMs) {
    return (elapsed / expectedMs) * 85;
  }
  return 85 + 10 * (1 - Math.exp(-(elapsed - expectedMs) / expectedMs));
}

/**
 * The bar's value: the time estimate, held inside the stage the API reports
 * (from where the stage starts to just before the next one), else the
 * estimate alone.
 */
export function runProgressValue(estimate: number, runStage?: RunStage): number {
  if (typeof runStage?.floor !== 'number' || typeof runStage.max !== 'number') {
    return estimate;
  }
  return Math.min(Math.max(estimate, runStage.floor), runStage.max);
}

/**
 * A computing run's bar at `now`: the clock since its first request, held
 * inside its current stage, and never below the highest value it reached
 * at a poll. For a given state it never decreases as time passes, so a bar
 * computed again, after the reader leaves the run and returns, is never
 * lower than the one shown before.
 */
export function runProgressAt(
  state: RunProgressState,
  now: number,
  estimate: RunDurationEstimate
): number {
  const elapsed = Math.max(0, now - state.startedAt);
  const byStage = runProgressValue(clockProgress(elapsed, estimate.expectedMs), state.runStage);
  return Math.max(state.highestProgress ?? 0, byStage);
}

/**
 * The highest value a run's bar has reached by a poll answered at `now`,
 * for the query cache to keep. A bar keeps moving between polls by the
 * last poll's stage, so this counts the bar at `now` by that stage as well
 * as by the stage this poll reports. The last poll's state counts only for
 * the same run, the one with the same start time.
 */
export function highestProgressAtPoll(
  current: Omit<RunProgressState, 'highestProgress'>,
  previous: RunProgressState | undefined,
  now: number,
  estimate: RunDurationEstimate
): number {
  const shownBefore =
    previous?.startedAt === current.startedAt ? runProgressAt(previous, now, estimate) : 0;
  return runProgressAt({ ...current, highestProgress: shownBefore }, now, estimate);
}

/**
 * A society-wide run's progress state from its cached status, while it
 * computes; none for a run not computing.
 */
export function runProgressStateOf(status: CalcStatus | undefined): RunProgressState | undefined {
  // A cached status is read defensively: one without its start time starts a new clock.
  const startedAt = status?.metadata?.startedAt;
  if (status?.status !== 'pending' || typeof startedAt !== 'number') {
    return undefined;
  }
  return { startedAt, highestProgress: status.progress, runStage: status.runStage };
}

/**
 * When a society-wide run was first requested, from its cached status: a
 * run still computing keeps its start time, so its clock carries on across
 * polls and remounts; a new run, or one tried again after it failed,
 * starts `now`.
 */
export function economyRunStartedAt(cached: CalcStatus | undefined, now = Date.now()): number {
  return runProgressStateOf(cached)?.startedAt ?? now;
}
