import { vi } from 'vitest';
import { V2PolicyCreatePayload, V2PolicyResponse } from '@/api/policy';

export const TEST_POLICY_IDS = {
  POLICY_123: 'policy-123',
  POLICY_456: 'policy-456',
  NONEXISTENT: 'nonexistent',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_TAX_BENEFIT_MODEL_ID = 'test-tbm-id-123';

/**
 * V2 Policy response mock
 */
export const mockV2PolicyResponse = (overrides?: Partial<V2PolicyResponse>): V2PolicyResponse => ({
  id: TEST_POLICY_IDS.POLICY_123,
  name: 'Test Policy',
  description: null,
  tax_benefit_model_id: TEST_TAX_BENEFIT_MODEL_ID,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

/**
 * V2 Policy creation payload mock
 */
export const mockV2PolicyPayload = (overrides?: Partial<V2PolicyCreatePayload>): V2PolicyCreatePayload => ({
  name: 'New Policy',
  tax_benefit_model_id: TEST_TAX_BENEFIT_MODEL_ID,
  parameter_values: [],
  ...overrides,
});

/**
 * @deprecated Use mockV2PolicyResponse for v2 API
 */
export const mockPolicyData = (overrides?: any) => ({
  result: {
    id: TEST_POLICY_IDS.POLICY_123,
    label: 'Test Policy',
    data: { param1: 100 },
    ...overrides,
  },
});

/**
 * @deprecated Use mockV2PolicyPayload for v2 API
 */
export const mockPolicyPayload = (overrides?: any) => ({
  data: { param1: 100, param2: 200 },
  label: 'New Policy',
  ...overrides,
});

/**
 * @deprecated Use mockV2PolicyResponse for v2 API
 */
export const mockPolicyCreateResponse = (policyId = TEST_POLICY_IDS.POLICY_456) => ({
  result: { policy_id: policyId },
});

export const mockSuccessFetchResponse = (data: any) => ({
  ok: true,
  json: vi.fn().mockResolvedValue(data),
});

export const mockErrorFetchResponse = (status: number) => ({
  ok: false,
  status,
});
