import { vi } from 'vitest';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

// Test constants
export const TEST_USER_ID = 'user-123';
export const TEST_COUNTRY_ID = 'us';
export const TEST_POLICY_ID_1 = 'policy-456';
export const TEST_POLICY_ID_2 = 'policy-789';

// Error messages matching implementation
export const ERROR_MESSAGES = {
  LOAD_POLICY_FAILED: (id: string) => `Failed to load policy ${id}`,
  FETCH_FAILED: 'Failed to fetch policies',
} as const;

// Mock user policy associations
export const mockUserPolicyAssociation1: UserPolicy = {
  id: 'assoc-1',
  userId: TEST_USER_ID,
  policyId: TEST_POLICY_ID_1,
  countryId: TEST_COUNTRY_ID,
  label: 'Test Policy 1',
  createdAt: '2024-01-15T10:00:00Z',
  isCreated: true,
};

export const mockUserPolicyAssociation2: UserPolicy = {
  id: 'assoc-2',
  userId: TEST_USER_ID,
  policyId: TEST_POLICY_ID_2,
  countryId: TEST_COUNTRY_ID,
  label: 'Test Policy 2',
  createdAt: '2024-02-20T14:30:00Z',
  isCreated: true,
};

export const mockUserPolicyAssociations = [mockUserPolicyAssociation1, mockUserPolicyAssociation2];

// Mock hook return values
export const createMockAssociationsHookReturn = () => ({
  data: mockUserPolicyAssociations,
  isLoading: false,
  error: null,
});

export const createMockAssociationsLoadingReturn = () => ({
  data: undefined,
  isLoading: true,
  error: null,
});

export const createMockAssociationsErrorReturn = () => ({
  data: undefined,
  isLoading: false,
  error: new Error(ERROR_MESSAGES.FETCH_FAILED),
});

// Mock fetch function
export const createMockFetchPolicyById = () => vi.fn();
