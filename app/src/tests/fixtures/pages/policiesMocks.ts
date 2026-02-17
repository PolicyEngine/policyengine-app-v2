import { vi } from 'vitest';
import { UserPolicyWithAssociation } from '@/hooks/useUserPolicy';

export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch policies',
  RENAME_FAILED: 'Failed to rename policy. Please try again.',
} as const;

// Mock mutation return values
export const createMockUpdateAssociationSuccess = () => ({
  mutateAsync: vi.fn().mockResolvedValue({ label: 'Updated Label' }),
  isPending: false,
});

export const createMockUpdateAssociationFailure = () => ({
  mutateAsync: vi.fn().mockRejectedValue(new Error('API Error')),
  isPending: false,
});

export const createMockUpdateAssociationPending = () => ({
  mutateAsync: vi.fn(),
  isPending: true,
});

// Mock data uses the transformed Policy type (camelCase, with parameters array)
export const mockPolicyData: UserPolicyWithAssociation[] = [
  {
    association: {
      id: 'assoc-1',
      userId: '1',
      policyId: '101',
      label: 'Test Policy 1',
      createdAt: '2024-01-15T10:00:00Z',
    },
    policy: {
      id: '101',
      countryId: 'us',
      apiVersion: 'v1',
      parameters: [
        {
          name: 'gov.irs.credits.ctc.amount.base',
          values: [
            { startDate: '2024-01-01', endDate: '2024-12-31', value: 3000 },
            { startDate: '2025-01-01', endDate: '2025-12-31', value: 3500 },
          ],
        },
        {
          name: 'gov.irs.credits.eitc.max',
          values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 6000 }],
        },
      ],
    },
    isLoading: false,
    error: null,
    isError: false,
  },
  {
    association: {
      id: 'assoc-2',
      userId: '1',
      policyId: '102',
      label: 'Test Policy 2',
      createdAt: '2024-02-20T14:30:00Z',
    },
    policy: {
      id: '102',
      countryId: 'us',
      apiVersion: 'v1',
      parameters: [
        {
          name: 'gov.irs.income.standard_deduction',
          values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 13850 }],
        },
      ],
    },
    isLoading: false,
    error: null,
    isError: false,
  },
];

export const mockDefaultHookReturn = {
  data: mockPolicyData,
  isLoading: false,
  isError: false,
  error: null,
  associations: mockPolicyData.map((item) => item.association),
};

export const mockLoadingHookReturn = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
  associations: undefined,
};

export const mockErrorHookReturn = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: new Error(ERROR_MESSAGES.FETCH_FAILED),
  associations: undefined,
};

export const mockEmptyHookReturn = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  associations: [],
};

export const createMockDispatch = () => vi.fn();
