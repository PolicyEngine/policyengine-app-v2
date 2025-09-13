import { vi } from 'vitest';
import type { Policy } from '@/types/ingredients/Policy';
import type { PolicyCreationPayload } from '@/types/payloads';

// Test policy IDs - descriptive names for clarity
export const EXISTING_POLICY_ID = 'policy-12345';
export const NON_EXISTENT_POLICY_ID = 'policy-99999';
export const NEW_POLICY_ID = 'policy-new-123';
export const BASELINE_POLICY_ID = 'baseline-policy';
export const REFORM_POLICY_ID = 'reform-policy-456';

// Country codes used in tests
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// Policy types for testing
export const POLICY_TYPES = {
  TAX_REFORM: 'tax_reform',
  BENEFIT_REFORM: 'benefit_reform',
  BASELINE: 'baseline',
  CUSTOM: 'custom',
} as const;

// Parameter names used in tests
export const TEST_PARAMETERS = {
  TAX_RATE: 'tax_rate',
  INCOME_TAX_RATE: 'income_tax_rate',
  BENEFIT_AMOUNT: 'benefit_amount',
  THRESHOLD: 'income_threshold',
  PERSONAL_ALLOWANCE: 'personal_allowance',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages that match the actual implementation
export const ERROR_MESSAGES = {
  FETCH_POLICY_FAILED: (id: string) => `Failed to fetch policy ${id}`,
  CREATE_POLICY_FAILED: 'Failed to create policy',
  UPDATE_POLICY_FAILED: (id: string) => `Failed to update policy ${id}`,
  DELETE_POLICY_FAILED: (id: string) => `Failed to delete policy ${id}`,
  INVALID_POLICY_DATA: 'Invalid policy data',
  NETWORK_ERROR: 'Network error',
  FAILED_TO_FETCH: 'Failed to fetch',
} as const;

// Base mock policy data
export const mockPolicyData: Policy = {
  id: EXISTING_POLICY_ID,
  name: 'Test Policy',
  label: 'Test Policy Label',
  country_id: TEST_COUNTRIES.US,
  parameters: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Policy with parameters
export const mockPolicyWithParameters: Policy = {
  ...mockPolicyData,
  id: REFORM_POLICY_ID,
  name: 'Reform Policy with Parameters',
  label: 'Tax Reform 2024',
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
    [TEST_PARAMETERS.INCOME_TAX_RATE]: {
      values: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          value: 0.2,
        },
      ],
    },
  },
};

// UK policy variant
export const mockUKPolicy: Policy = {
  ...mockPolicyData,
  id: 'uk-policy-123',
  name: 'UK Tax Policy',
  label: 'UK Tax Reform',
  country_id: TEST_COUNTRIES.UK,
  parameters: {
    [TEST_PARAMETERS.PERSONAL_ALLOWANCE]: {
      values: [
        {
          startDate: '2024-04-06',
          endDate: '2025-04-05',
          value: 12570,
        },
      ],
    },
  },
};

// Invalid policy for error testing
export const mockInvalidPolicy: Partial<PolicyData> = {
  // Missing required fields
  name: 'Invalid Policy',
  parameters: {},
};

// Policy list for testing collections
export const mockPolicyList: PolicyData[] = [
  mockPolicyData,
  mockPolicyWithParameters,
  mockUKPolicy,
];

// Policy creation payload
export const mockPolicyCreationPayload: PolicyCreationPayload = {
  label: 'New Policy Label',
  data: {
    [TEST_PARAMETERS.TAX_RATE]: {
      '2024-01-01.2024-12-31': 0.22,
    },
  },
};

// Complex policy with multiple year parameters
export const mockComplexPolicy: Policy = {
  id: 'complex-policy-789',
  name: 'Multi-Year Policy',
  label: 'Complex Tax Reform 2024-2030',
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
        {
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          value: 0.24,
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
        {
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          value: 5500,
        },
      ],
    },
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-15T10:30:00Z',
};

// Helper functions for mock responses - matching population branch pattern
export const mockSuccessResponse = (data: { result?: PolicyData; message?: string }) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue(data),
});

export const mockErrorResponse = (status: number) => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
});

export const mockNetworkError = () => new Error(ERROR_MESSAGES.NETWORK_ERROR);

export const mockFetchError = () => Promise.reject(new TypeError(ERROR_MESSAGES.FAILED_TO_FETCH));

// Deprecated - use mockSuccessResponse instead
export const mockPolicySuccessResponse = (data: PolicyData) =>
  mockSuccessResponse({ result: data });

// Deprecated - use mockErrorResponse instead
export const mockPolicyErrorResponse = (status: number) => mockErrorResponse(status);

// Helper function to create mock policy with specific parameters
export const createMockPolicy = (overrides?: Partial<PolicyData>): PolicyData => ({
  ...mockPolicyData,
  ...overrides,
});

// Helper function to create policy with specific country
export const createMockPolicyForCountry = (country: keyof typeof TEST_COUNTRIES): PolicyData => ({
  ...mockPolicyData,
  id: `${country.toLowerCase()}-policy-${Date.now()}`,
  country_id: TEST_COUNTRIES[country],
  name: `${country} Policy`,
  label: `${country} Policy Label`,
});

// Mock API fetch function
export const mockFetchPolicy = vi.fn();
export const mockCreatePolicy = vi.fn();
export const mockUpdatePolicy = vi.fn();
export const mockDeletePolicy = vi.fn();
