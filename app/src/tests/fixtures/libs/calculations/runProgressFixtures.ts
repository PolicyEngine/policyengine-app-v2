import type { CalcStatus, RunStage } from '@/types/calculation';

/** How long the tests' runs typically take: a US nationwide run. */
export const TYPICAL_RUN_MS = 6 * 60 * 1000;

/** What the tests' bars are estimated with. */
export const TYPICAL_RUN_ESTIMATE = { expectedMs: TYPICAL_RUN_MS };

/** When the tests' run was first requested. */
export const RUN_STARTED_AT = Date.UTC(2026, 10, 27, 12, 0, 0);

/** When another run, such as a retry of the tests' run, was first requested. */
export const RETRY_STARTED_AT = RUN_STARTED_AT + 10 * 60 * 1000;

/** The stage ranges production reports, as RunStage. */
export const QUEUED_STAGE: RunStage = { stage: 'queued', floor: 0, max: 24 };
/** A US nationwide run split into regions, loading its data. */
export const SEGMENTED_LOADING_DATA_STAGE: RunStage = { stage: 'loading_data', floor: 3, max: 4 };
/** A US nationwide run split into regions, running them. */
export const SIMULATING_STAGE: RunStage = { stage: 'simulating', floor: 5, max: 96 };
/** A one-piece run, running the reform. */
export const REFORM_STAGE: RunStage = { stage: 'reform', floor: 67, max: 96 };

/** The highest value a queued run's bar can reach. */
export const QUEUED_STAGE_MAX = 24;

/** The time `elapsedMs` after the tests' run was first requested. */
export const runTimeAfter = (elapsedMs: number) => RUN_STARTED_AT + elapsedMs;

/** A society-wide run's cached status while it computes. */
export const mockPendingEconomyStatus = (overrides: Partial<CalcStatus> = {}): CalcStatus => ({
  status: 'pending',
  progress: 10,
  metadata: {
    calcId: 'report-year-98746-2-us-2027',
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: RUN_STARTED_AT,
  },
  ...overrides,
});

/** A society-wide run's cached status once it failed. */
export const mockFailedEconomyStatus = (): CalcStatus => ({
  status: 'error',
  error: { code: 'SOCIETY_WIDE_CALC_ERROR', message: 'The run failed', retryable: true },
  metadata: {
    calcId: 'report-year-98746-2-us-2027',
    calcType: 'societyWide',
    targetType: 'report',
    startedAt: RUN_STARTED_AT,
  },
});
