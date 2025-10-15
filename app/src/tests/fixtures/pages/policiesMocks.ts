import { vi } from 'vitest';
import { UserPolicyMetadataWithAssociation } from '@/hooks/useUserPolicy';

export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch policies',
} as const;

export const mockPolicyData: UserPolicyMetadataWithAssociation[] = [
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
      country_id: 'us',
      api_version: 'v1',
      policy_json: {
        'gov.irs.credits.ctc.amount.base': {
          '2024-01-01.2024-12-31': 3000,
          '2025-01-01.2025-12-31': 3500,
        },
        'gov.irs.credits.eitc.max': {
          '2024-01-01.2024-12-31': 6000,
        },
      },
      policy_hash: 'hash-101',
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
      country_id: 'us',
      api_version: 'v1',
      policy_json: {
        'gov.irs.income.standard_deduction': {
          '2024-01-01.2024-12-31': 13850,
        },
      },
      policy_hash: 'hash-102',
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
