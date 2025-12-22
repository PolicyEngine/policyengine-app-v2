import { vi } from 'vitest';

export const TEST_POLICY_LABEL = 'Test Policy';
export const TEST_COUNTRY_ID = 'us';

// Error messages matching implementation
export const ERROR_MESSAGES = {
  LOAD_FAILED: 'Failed to load policies. Please refresh and try again.',
} as const;

export const mockOnUpdateLabel = vi.fn();
export const mockOnNext = vi.fn();
export const mockOnBack = vi.fn();
export const mockOnCancel = vi.fn();
export const mockOnSelectPolicy = vi.fn();

export const mockUserPolicyAssociation = {
  association: {
    id: '1',
    userId: '1',
    policyId: '456',
    label: 'My Policy',
    countryId: TEST_COUNTRY_ID,
  },
  policy: { id: '456', countryId: TEST_COUNTRY_ID, parameters: [] },
};

export const mockUseUserPoliciesEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockUseUserPoliciesWithData = {
  data: [mockUserPolicyAssociation],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockUseUserPoliciesLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
};

export const mockUseUserPoliciesError = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: new Error('Failed to load policies'),
};

// Error without message to test fallback
export const mockUseUserPoliciesErrorNoMessage = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: null,
};

// Policy with missing ID to test null-safe handling
export const mockUserPolicyWithMissingId = {
  association: {
    id: '2',
    userId: '1',
    policyId: '789',
    label: 'Policy Without ID',
    countryId: TEST_COUNTRY_ID,
  },
  policy: { id: undefined, countryId: TEST_COUNTRY_ID, parameters: [] },
};

export const mockUseUserPoliciesWithMissingId = {
  data: [mockUserPolicyWithMissingId],
  isLoading: false,
  isError: false,
  error: null,
};

export function resetAllMocks() {
  mockOnUpdateLabel.mockClear();
  mockOnNext.mockClear();
  mockOnBack.mockClear();
  mockOnCancel.mockClear();
  mockOnSelectPolicy.mockClear();
}
