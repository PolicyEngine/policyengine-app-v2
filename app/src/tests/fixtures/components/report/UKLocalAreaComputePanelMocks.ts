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
