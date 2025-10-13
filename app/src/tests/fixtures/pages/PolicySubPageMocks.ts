import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * Mock data for PolicySubPage tests
 */

// Test IDs
export const TEST_POLICY_IDS = {
  BASELINE: 'pol-baseline-123',
  REFORM: 'pol-reform-456',
  CURRENT_LAW: 'pol-current-law-789',
} as const;

export const TEST_USER_ID = 'user-xyz-789';

// Mock Policies
export const mockBaselinePolicy: Policy = {
  id: TEST_POLICY_IDS.BASELINE,
  countryId: 'us',
  apiVersion: '1.0',
  label: 'Baseline Policy',
  parameters: [
    {
      name: 'gov.irs.credits.eitc.max[0]',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 1000,
        },
      ],
    },
  ],
  isCreated: true,
};

export const mockReformPolicy: Policy = {
  id: TEST_POLICY_IDS.REFORM,
  countryId: 'us',
  apiVersion: '1.0',
  label: 'Reform Policy',
  parameters: [
    {
      name: 'gov.irs.credits.eitc.max[0]',
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 1500,
        },
      ],
    },
  ],
  isCreated: true,
};

export const mockCurrentLawPolicy: Policy = {
  id: TEST_POLICY_IDS.CURRENT_LAW,
  countryId: 'us',
  apiVersion: '1.0',
  label: 'Current Law',
  parameters: [],
  isCreated: true,
};

// Mock User Policies
export const mockUserBaselinePolicy: UserPolicy = {
  id: 'user-pol-baseline-123',
  userId: TEST_USER_ID,
  policyId: TEST_POLICY_IDS.BASELINE,
  label: 'My Baseline Policy',
  createdAt: '2025-01-15T10:00:00Z',
};

export const mockUserReformPolicy: UserPolicy = {
  id: 'user-pol-reform-456',
  userId: TEST_USER_ID,
  policyId: TEST_POLICY_IDS.REFORM,
  label: 'My Reform Policy',
  createdAt: '2025-01-15T11:00:00Z',
};
