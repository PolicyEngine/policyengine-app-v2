import { vi } from 'vitest';

export const TEST_POLICY_IDS = {
  POLICY_123: 'policy-123',
  POLICY_456: 'policy-456',
  NONEXISTENT: 'nonexistent',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const mockPolicyData = (overrides?: any) => ({
  result: {
    id: TEST_POLICY_IDS.POLICY_123,
    label: 'Test Policy',
    data: { param1: 100 },
    ...overrides,
  },
});

export const mockPolicyPayload = (overrides?: any) => ({
  data: { param1: 100, param2: 200 },
  label: 'New Policy',
  ...overrides,
});

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
