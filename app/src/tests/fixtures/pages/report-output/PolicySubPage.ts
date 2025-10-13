import { Policy } from '@/types/ingredients/Policy';
import { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * Mock data for PolicySubPage tests
 */

// Test IDs and constants
export const TEST_POLICY_IDS = {
  BASELINE: 'pol-baseline-123',
  REFORM: 'pol-reform-456',
  CURRENT_LAW: 'pol-current-law-789',
} as const;

export const TEST_USER_ID = 'user-xyz-789';

export const TEST_PARAMETER_NAMES = {
  EITC_MAX: 'gov.irs.credits.eitc.max[0]',
  TEST_RATE: 'test.rate',
} as const;

// Mock parameter metadata (for mocking Redux state)
export const mockParameterMetadata = {
  [TEST_PARAMETER_NAMES.EITC_MAX]: {
    label: 'Maximum EITC for 0 children',
    unit: 'currency-USD',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.EITC_MAX,
  },
  [TEST_PARAMETER_NAMES.TEST_RATE]: {
    label: 'Test Rate',
    unit: '%',
    type: 'parameter',
    parameter: TEST_PARAMETER_NAMES.TEST_RATE,
  },
};

// Mock Policies
export const mockBaselinePolicy: Policy = {
  id: TEST_POLICY_IDS.BASELINE,
  countryId: 'us',
  apiVersion: '1.0',
  label: 'Baseline Policy',
  parameters: [
    {
      name: TEST_PARAMETER_NAMES.EITC_MAX,
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
      name: TEST_PARAMETER_NAMES.EITC_MAX,
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

// Test prop configurations (helpers for common test scenarios)
export const createPolicySubPageProps = {
  empty: () => ({
    policies: [],
    userPolicies: [],
    reportType: 'economy' as const,
  }),
  undefined: () => ({
    policies: undefined,
    userPolicies: undefined,
    reportType: 'economy' as const,
  }),
  singlePolicy: () => ({
    policies: [mockBaselinePolicy],
    userPolicies: [mockUserBaselinePolicy],
    reportType: 'economy' as const,
  }),
  baselineOnly: () => ({
    policies: [mockBaselinePolicy],
    userPolicies: [],
    reportType: 'household' as const,
  }),
  baselineAndReform: () => ({
    policies: [mockBaselinePolicy, mockReformPolicy],
    userPolicies: [],
    reportType: 'household' as const,
  }),
  economyWithCurrentLaw: () => ({
    policies: [mockCurrentLawPolicy, mockBaselinePolicy, mockReformPolicy],
    userPolicies: [],
    reportType: 'economy' as const,
  }),
};
