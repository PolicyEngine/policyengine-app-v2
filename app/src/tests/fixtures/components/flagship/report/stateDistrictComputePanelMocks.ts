import { vi } from 'vitest';
import type { StateDistrictRuns } from '@/hooks/useStateDistrictRuns';

export const COMPUTE_DISTRICTS_LABEL = 'Compute district impacts';
export const COMPUTING_DISTRICTS_MESSAGE = 'Computing district impacts…';
export const CHECKING_DISTRICTS_LABEL = 'Checking for saved state results';
export const DISTRICTS_ERROR_MESSAGE = 'District impacts could not be calculated.';
export const NONE_COMPUTED_INTRO =
  'Congressional district impacts come from a separate run for each state and DC, on its own state data. They take a few minutes.';
export const RUN_FAILURE = 'The simulation ran out of memory';

/** The state runs with spies for start and retry. */
export function stateRuns(overrides: Partial<StateDistrictRuns> = {}): StateDistrictRuns {
  return {
    status: 'idle',
    districts: [],
    pendingStates: [],
    failedStates: [],
    failedStateLabels: [],
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
    error: RUN_FAILURE,
    canRetry: true,
  });
export const NO_DISTRICTS_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 50,
    failedStates: ['state/oh'],
    failedStateLabels: ['Ohio'],
    error: "This state's result has no congressional districts.",
    canRetry: false,
  });
export const MANY_FAILED_RUNS = () =>
  stateRuns({
    status: 'partial',
    completedCount: 44,
    failedStates: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    failedStateLabels: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Colorado', 'Delaware', 'Iowa'],
    error: RUN_FAILURE,
    canRetry: true,
  });
export const ALL_FAILED_RUNS = () =>
  stateRuns({ status: 'error', error: RUN_FAILURE, canRetry: true });
export const COMPLETE_RUNS = () => stateRuns({ status: 'complete', completedCount: 51 });
