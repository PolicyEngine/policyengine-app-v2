import { vi } from 'vitest';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { UserPolicyCreationPayload } from '@/types/payloads';
import {
  EXISTING_POLICY_ID,
  HTTP_STATUS,
  NON_EXISTENT_POLICY_ID,
  TEST_COUNTRIES,
} from './policyMocks';

// User IDs for testing
export const TEST_USER_IDS = {
  EXISTING_USER: 'user-123',
  NEW_USER: 'user-456',
  ADMIN_USER: 'admin-789',
  UNAUTHORIZED_USER: 'unauth-999',
} as const;

// Association IDs
export const ASSOCIATION_IDS = {
  EXISTING: 'assoc-001',
  NEW: 'assoc-002',
  TO_DELETE: 'assoc-003',
} as const;

// Error messages for associations
export const ASSOCIATION_ERROR_MESSAGES = {
  CREATE_FAILED: 'Failed to create user policy association',
  FETCH_FAILED: 'Failed to fetch user policies',
  UPDATE_FAILED: 'Failed to update user policy',
  DELETE_FAILED: 'Failed to delete user policy',
  UNAUTHORIZED: 'Unauthorized access to policy',
  DUPLICATE: 'Policy already associated with user',
} as const;

// Mock user policy association
export const mockUserPolicy: UserPolicy = {
  id: ASSOCIATION_IDS.EXISTING,
  userId: TEST_USER_IDS.EXISTING_USER,
  policyId: EXISTING_POLICY_ID,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  isCreated: true,
};

// Mock user policy for shared access
export const mockSharedUserPolicy: UserPolicy = {
  id: ASSOCIATION_IDS.NEW,
  userId: TEST_USER_IDS.NEW_USER,
  policyId: EXISTING_POLICY_ID,
  createdAt: '2024-02-01T00:00:00Z',
  updatedAt: '2024-02-01T00:00:00Z',
  isCreated: true,
};

// Mock user policy list
export const mockUserPolicyList: UserPolicy[] = [
  mockUserPolicy,
  mockSharedUserPolicy,
  {
    id: 'assoc-004',
    userId: TEST_USER_IDS.EXISTING_USER,
    policyId: 'policy-002',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
    isCreated: true,
  },
];

// Creation payload
export const mockUserPolicyCreationPayload: UserPolicyCreationPayload = {
  userId: TEST_USER_IDS.NEW_USER,
  policyId: EXISTING_POLICY_ID,
  label: 'Test Policy',
};

// Helper to create association response
export const mockAssociationSuccessResponse = (data: UserPolicy | UserPolicy[]) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue(data),
  headers: new Headers({ 'content-type': 'application/json' }),
});

// Helper to create association error response
export const mockAssociationErrorResponse = (status: number, message?: string) => ({
  ok: false,
  status,
  statusText: message || 'Error',
  json: vi.fn().mockResolvedValue({
    error: message || ASSOCIATION_ERROR_MESSAGES.FETCH_FAILED,
  }),
});

// Mock functions
export const mockFetchUserPolicies = vi.fn();
export const mockCreateUserPolicy = vi.fn();
export const mockUpdateUserPolicy = vi.fn();
export const mockDeleteUserPolicy = vi.fn();
export const mockSharePolicy = vi.fn();
