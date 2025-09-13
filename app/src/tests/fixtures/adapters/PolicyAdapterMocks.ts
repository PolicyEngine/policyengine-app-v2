import { vi } from 'vitest';
import type { Policy } from '@/types/ingredients/Policy';
import { EXISTING_POLICY_ID, TEST_COUNTRIES, TEST_PARAMETERS } from '../api/policyMocks';

// Mock adapter input (from API)
export const mockPolicyAPIResponse: Policy = {
  id: EXISTING_POLICY_ID,
  name: 'Tax Policy 2024',
  label: 'Annual Tax Reform',
  country_id: TEST_COUNTRIES.US,
  parameters: {
    [TEST_PARAMETERS.TAX_RATE]: {
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 0.25,
        },
      ],
    },
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock adapter output (transformed for app)
export const mockPolicyTransformed: Policy = {
  id: EXISTING_POLICY_ID,
  label: 'Annual Tax Reform',
  parameters: [
    {
      name: TEST_PARAMETERS.TAX_RATE,
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 0.25,
        },
      ],
    },
  ],
  isCreated: true,
};

// Complex policy API response
export const mockComplexPolicyAPIResponse: Policy = {
  id: 'complex-policy-001',
  name: 'Multi-Parameter Policy',
  label: 'Comprehensive Reform 2024-2026',
  country_id: TEST_COUNTRIES.US,
  parameters: {
    [TEST_PARAMETERS.TAX_RATE]: {
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 0.22,
        },
        {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          value: 0.23,
        },
      ],
    },
    [TEST_PARAMETERS.BENEFIT_AMOUNT]: {
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 5000,
        },
      ],
    },
    [TEST_PARAMETERS.THRESHOLD]: {
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2026-12-31',
          value: 50000,
        },
      ],
    },
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

// Complex policy transformed
export const mockComplexPolicyTransformed: Policy = {
  id: 'complex-policy-001',
  label: 'Comprehensive Reform 2024-2026',
  parameters: [
    {
      name: TEST_PARAMETERS.TAX_RATE,
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 0.22,
        },
        {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          value: 0.23,
        },
      ],
    },
    {
      name: TEST_PARAMETERS.BENEFIT_AMOUNT,
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 5000,
        },
      ],
    },
    {
      name: TEST_PARAMETERS.THRESHOLD,
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2026-12-31',
          value: 50000,
        },
      ],
    },
  ],
  isCreated: true,
};

// Empty policy (no parameters)
export const mockEmptyPolicyAPIResponse: Policy = {
  id: 'empty-policy-001',
  name: 'Baseline Policy',
  label: 'No Changes',
  country_id: TEST_COUNTRIES.US,
  parameters: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockEmptyPolicyTransformed: Policy = {
  id: 'empty-policy-001',
  label: 'No Changes',
  parameters: [],
  isCreated: true,
};

// Invalid/malformed data for error testing
export const mockMalformedAPIResponse = {
  // Missing required fields
  id: 'malformed-001',
  parameters: 'invalid', // Should be object
};

// Helper to create adapter test cases
export const createAdapterTestCase = (
  input: Policy,
  expectedOutput: Policy,
  description: string
) => ({
  input,
  expectedOutput,
  description,
});

// Test cases for adapter
export const adapterTestCases = [
  createAdapterTestCase(
    mockPolicyAPIResponse,
    mockPolicyTransformed,
    'should transform simple policy'
  ),
  createAdapterTestCase(
    mockComplexPolicyAPIResponse,
    mockComplexPolicyTransformed,
    'should transform complex policy with multiple parameters'
  ),
  createAdapterTestCase(
    mockEmptyPolicyAPIResponse,
    mockEmptyPolicyTransformed,
    'should transform empty policy'
  ),
];

// Mock adapter functions
export const mockTransformPolicy = vi.fn();
export const mockTransformPolicyList = vi.fn();
export const mockTransformPolicyForAPI = vi.fn();
