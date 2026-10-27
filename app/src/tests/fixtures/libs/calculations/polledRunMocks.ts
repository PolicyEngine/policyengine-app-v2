import type { EconomyCalculationResponse } from '@/api/societyWideCalculation';
import type { PolledRun, PollRunOptions } from '@/libs/calculations/polledRun';

/** A run's result as the tests read it. */
export interface TestResult {
  value: number;
}

export const EXPECTED_MS = 100_000;
export const TIME_LIMIT_MS = 30 * 60 * 1000;
export const TIME_LIMIT_MESSAGE = 'The run is taking much longer than expected.';
export const FAILURE_MESSAGE = 'The run failed';
export const UNREADABLE_MESSAGE = 'The result is not what was asked for';

/** When the tests' run was first sent. */
export const STARTED_AT = Date.UTC(2026, 9, 27, 12, 0, 0);

export const POLL_OPTIONS: PollRunOptions<TestResult, TestResult> = {
  expectedMs: EXPECTED_MS,
  timeLimitMs: TIME_LIMIT_MS,
  timeLimitMessage: TIME_LIMIT_MESSAGE,
  failureMessage: FAILURE_MESSAGE,
  readResult: (result) => (result.value >= 0 ? { result } : { error: UNREADABLE_MESSAGE }),
};

export const COMPLETE_RESULT: TestResult = { value: 42 };
export const UNREADABLE_RESULT: TestResult = { value: -1 };

export const QUEUED_RESPONSE: EconomyCalculationResponse<TestResult> = {
  status: 'computing',
  queue_position: 2,
  result: null,
};

/** A run in its data-loading stage, which spans 10–40%. */
export const LOADING_DATA_RESPONSE: EconomyCalculationResponse<TestResult> = {
  status: 'computing',
  stage: 'loading_data',
  progress: 10,
  progress_max: 40,
  result: null,
};

export const OK_RESPONSE: EconomyCalculationResponse<TestResult> = {
  status: 'ok',
  result: COMPLETE_RESULT,
};

export const UNREADABLE_RESPONSE: EconomyCalculationResponse<TestResult> = {
  status: 'ok',
  result: UNREADABLE_RESULT,
};

export const ERROR_RESPONSE: EconomyCalculationResponse<TestResult> = {
  status: 'error',
  result: null,
  error: 'The simulation ran out of memory',
};

export const POLL_FAILURE = new Error('Society-wide calculation failed (502): Bad Gateway');

/** A run that was computing when last polled. */
export function computingRun(
  overrides: Partial<PolledRun<TestResult>> = {}
): PolledRun<TestResult> {
  return { status: 'computing', startedAt: STARTED_AT, result: null, progress: 20, ...overrides };
}

/** A run that failed when last polled. */
export function failedRun(): PolledRun<TestResult> {
  return { status: 'error', startedAt: STARTED_AT, result: null, error: FAILURE_MESSAGE };
}
