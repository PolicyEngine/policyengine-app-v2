import { vi } from 'vitest';
import type { StateDistrictRuns } from '@/hooks/useStateDistrictRuns';

export const COMPUTE_DISTRICTS_LABEL = 'Compute district impacts';
export const COMPUTING_DISTRICTS_MESSAGE = 'Computing district impacts…';
export const CHECKING_DISTRICTS_LABEL = 'Checking for saved state results';
export const DISTRICTS_ERROR_MESSAGE = 'District impacts are not in.';
export const NONE_COMPUTED_INTRO =
  'Congressional district impacts come from a separate run for each state and DC, on its own state data. They take a few minutes.';
export const RUN_FAILURE = 'The simulation ran out of memory';
export const OTHER_RUN_FAILURE = 'The calculation failed';
export const TIME_LIMIT_FAILURE =
  'Taking much longer than expected. The run may still finish on the server: retry to check it again.';

/** The state runs with spies for start and retry. */
export function stateRuns(overrides: Partial<StateDistrictRuns> = {}): StateDistrictRuns {
  return {
    status: 'idle',
    districts: [],
    pendingStates: [],
    failedStates: [],
    failedStateLabels: [],
    calculationFailures: [],
    noDistrictStateLabels: [],
    completedCount: 0,
    totalStates: 51,
    progress: 0,
    canStart: true,
    canRetry: false,
    start: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

export const CHECKING_RUNS = () => stateRuns({ status: 'checking' });
export const NONE_COMPUTED_RUNS = () => stateRuns();
export const SOME_SAVED_RUNS = () => stateRuns({ completedCount: 12 });
export const NOT_READY_RUNS = () => stateRuns({ canStart: false });
export const RUNNING_RUNS = () =>
  stateRuns({ status: 'computing', completedCount: 12, progress: 40.2 });
export const FAILED_STATES_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 49,
    failedStates: ['state/tx', 'state/ut'],
    failedStateLabels: ['Texas', 'Utah'],
    calculationFailures: [
      { label: 'Texas', error: RUN_FAILURE },
      { label: 'Utah', error: RUN_FAILURE },
    ],
    error: RUN_FAILURE,
    canRetry: true,
  });
export const NO_DISTRICTS_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 50,
    failedStates: ['state/oh'],
    failedStateLabels: ['Ohio'],
    noDistrictStateLabels: ['Ohio'],
    error: 'The result has no congressional districts.',
    canRetry: false,
  });
export const MANY_FAILED_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 44,
    failedStates: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    failedStateLabels: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Colorado', 'Delaware', 'Iowa'],
    calculationFailures: [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'Colorado',
      'Delaware',
      'Iowa',
    ].map((label) => ({ label, error: RUN_FAILURE })),
    error: RUN_FAILURE,
    canRetry: true,
  });
/** Two states failed for different reasons, and one state's result has no districts. */
export const MIXED_FAILURES_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 48,
    failedStates: ['state/tx', 'state/fl', 'state/oh'],
    failedStateLabels: ['Texas', 'Florida', 'Ohio'],
    calculationFailures: [
      { label: 'Texas', error: RUN_FAILURE },
      { label: 'Florida', error: OTHER_RUN_FAILURE },
    ],
    noDistrictStateLabels: ['Ohio'],
    error: RUN_FAILURE,
    canRetry: true,
  });
export const ALL_FAILED_RUNS = () =>
  stateRuns({
    status: 'error',
    failedStates: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    failedStateLabels: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Colorado', 'Delaware', 'Iowa'],
    calculationFailures: [
      'Alabama',
      'Alaska',
      'Arizona',
      'Arkansas',
      'Colorado',
      'Delaware',
      'Iowa',
    ].map((label) => ({ label, error: RUN_FAILURE })),
    error: RUN_FAILURE,
    canRetry: true,
  });
/** Five states failed, each for its own reason. */
export const MANY_REASONS_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 46,
    failedStates: ['state/ak', 'state/az', 'state/co', 'state/de', 'state/ia'],
    failedStateLabels: ['Alaska', 'Arizona', 'Colorado', 'Delaware', 'Iowa'],
    calculationFailures: ['Alaska', 'Arizona', 'Colorado', 'Delaware', 'Iowa'].map((label) => ({
      label,
      error: `The simulation for ${label} ran out of memory`,
    })),
    error: 'The simulation for Alaska ran out of memory',
    canRetry: true,
  });
/** Every state but one saved. */
export const ONE_LEFT_RUNS = () => stateRuns({ completedCount: 50 });
/** Two states passed the time limit. */
export const TIMED_OUT_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 49,
    failedStates: ['state/oh', 'state/tx'],
    failedStateLabels: ['Ohio', 'Texas'],
    calculationFailures: [
      { label: 'Ohio', error: TIME_LIMIT_FAILURE },
      { label: 'Texas', error: TIME_LIMIT_FAILURE },
    ],
    error: TIME_LIMIT_FAILURE,
    canRetry: true,
  });
export const COMPLETE_RUNS = () => stateRuns({ status: 'complete', completedCount: 51 });
