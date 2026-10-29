import { vi } from 'vitest';
import type {
  BreakdownComputeCopy,
  BreakdownComputePanelProps,
} from '@/components/flagship/report/BreakdownComputePanel';

/** A breakdown's words, as a caller of the generic panel gives them. */
export const TEST_COPY: BreakdownComputeCopy = {
  intro: 'Area impacts are calculated in a separate run, which takes a few minutes.',
  computeLabel: 'Compute area impacts',
  computingMessage: 'Computing area impacts…',
  progressLabel: 'Computing area impacts',
  errorMessage: 'Area impacts could not be calculated.',
};

export const PARTIAL_SUMMARY = '49 of 51 areas are in.';
export const FAILURE_REASON = 'Texas and Utah could not be calculated.';
export const COMPUTING_DETAIL = '12 of 51 areas';

/** The panel's props with spies for start and retry. */
export function panelProps(
  overrides: Partial<BreakdownComputePanelProps> = {}
): BreakdownComputePanelProps {
  return {
    status: 'idle',
    copy: TEST_COPY,
    canStart: true,
    onStart: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
}
