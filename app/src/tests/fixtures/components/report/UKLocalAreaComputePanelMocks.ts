import { vi } from 'vitest';
import type { UKLocalAreaBreakdownState } from '@/hooks/useUKLocalAreaBreakdown';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

export const COMPUTE_BUTTON_LABEL = 'Compute local-area impacts';
export const COMPUTING_MESSAGE = 'Computing local-area impacts…';
export const ERROR_MESSAGE = 'Local-area impacts could not be calculated.';

/** A breakdown state with spies for start and retry. */
export function breakdownState(
  overrides: Partial<UKLocalAreaBreakdownState> = {}
): UKLocalAreaBreakdownState {
  return {
    status: 'idle',
    breakdown: null,
    canStart: true,
    start: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

export const IDLE_STATE = () => breakdownState();
export const QUEUED_STATE = () =>
  breakdownState({ status: 'computing', progress: 12, queuePosition: 4 });
export const LOADING_DATA_STATE = () =>
  breakdownState({ status: 'computing', progress: 30, stage: 'loading_data' });
export const ERROR_STATE = () => breakdownState({ status: 'error', error: 'The run failed' });
export const COMPLETE_STATE = () =>
  breakdownState({ status: 'complete', breakdown: NORMALIZED_BREAKDOWN });

/** Withheld counts for the note's wording: some, and every one of the UK's constituencies. */
export const SOME_WITHHELD_CONSTITUENCIES = { withheld: 12, total: 650 };
export const ONE_WITHHELD_CONSTITUENCY = { withheld: 1, total: 650 };
export const NO_WITHHELD_CONSTITUENCIES = { withheld: 0, total: 650 };
export const ALL_WITHHELD_CONSTITUENCIES = { withheld: 650, total: 650 };

/** Withheld counts for the note's wording: some of the UK's 361 local authorities. */
export const SOME_WITHHELD_LOCAL_AUTHORITIES = { withheld: 2, total: 361 };
