import { vi } from 'vitest';

// Test constants for ingredient types
export const INGREDIENT_TYPES = {
  REPORT: 'report',
  SIMULATION: 'simulation',
  POLICY: 'policy',
  HOUSEHOLD: 'household',
  GEOGRAPHY: 'geography',
} as const;

// Test labels
export const TEST_LABELS = {
  CURRENT: 'My Current Label',
  NEW: 'My New Label',
  EMPTY: '',
  TOO_LONG: 'a'.repeat(101), // 101 characters, exceeds 100 limit
  WITH_SPACES: '  Label with spaces  ',
  TRIMMED: 'Label with spaces',
} as const;

// Error messages for submission errors
export const SUBMISSION_ERRORS = {
  API_FAILURE: 'Failed to rename. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
} as const;

// Mock handlers
export const createMockOnClose = () => vi.fn();
export const createMockOnRename = () => vi.fn();

// Default modal props
export const createDefaultModalProps = () => ({
  opened: true,
  onClose: createMockOnClose(),
  currentLabel: TEST_LABELS.CURRENT,
  onRename: createMockOnRename(),
  isLoading: false,
  ingredientType: INGREDIENT_TYPES.REPORT as 'report',
  submissionError: null as string | null,
});

// Modal props variants
export const createLoadingModalProps = () => ({
  ...createDefaultModalProps(),
  isLoading: true,
});

export const createClosedModalProps = () => ({
  ...createDefaultModalProps(),
  opened: false,
});

export const createModalPropsWithSubmissionError = () => ({
  ...createDefaultModalProps(),
  submissionError: SUBMISSION_ERRORS.API_FAILURE,
});
