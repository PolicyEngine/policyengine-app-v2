import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPolicy, fetchPolicyById } from '@/api/policy';
import { API_V2_BASE_URL } from '@/api/v2/taxBenefitModels';
import {
  mockErrorFetchResponse,
  mockSuccessFetchResponse,
  mockV2PolicyPayload,
  mockV2PolicyResponse,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/policyMocks';

// Mock fetch
global.fetch = vi.fn();

describe('policy API (v2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPolicyById', () => {
    it('given valid policy ID then fetches policy from v2 API', async () => {
      // Given
      const mockResponse = mockV2PolicyResponse();
      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(mockResponse));

      // When
      const result = await fetchPolicyById(TEST_POLICY_IDS.POLICY_123);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/policies/${TEST_POLICY_IDS.POLICY_123}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('given fetch error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(404));

      // When/Then
      await expect(fetchPolicyById(TEST_POLICY_IDS.NONEXISTENT)).rejects.toThrow(
        `Failed to fetch policy ${TEST_POLICY_IDS.NONEXISTENT}`
      );
    });
  });

  describe('createPolicy', () => {
    it('given valid v2 payload then creates policy', async () => {
      // Given
      const payload = mockV2PolicyPayload();
      const response = mockV2PolicyResponse({ id: TEST_POLICY_IDS.POLICY_456 });

      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(response));

      // When
      const result = await createPolicy(payload);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `${API_V2_BASE_URL}/policies/`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );
      expect(result).toEqual(response);
    });

    it('given API error then throws error with status', async () => {
      // Given
      const payload = mockV2PolicyPayload();

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue('Internal Server Error'),
      });

      // When/Then
      await expect(createPolicy(payload)).rejects.toThrow('Failed to create policy: 500');
    });
  });
});
