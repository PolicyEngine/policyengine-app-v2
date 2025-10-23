import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPolicy, fetchPolicyById } from '@/api/policy';
import { BASE_URL } from '@/constants';
import {
  mockErrorFetchResponse,
  mockPolicyCreateResponse,
  mockPolicyData,
  mockPolicyPayload,
  mockSuccessFetchResponse,
  TEST_COUNTRIES,
  TEST_POLICY_IDS,
} from '@/tests/fixtures/api/policyMocks';

// Mock fetch
global.fetch = vi.fn();

describe('policy API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchPolicyById', () => {
    it('given valid policy ID then fetches policy metadata', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(mockPolicyData()));

      // When
      const result = await fetchPolicyById(TEST_COUNTRIES.US, TEST_POLICY_IDS.POLICY_123);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${TEST_COUNTRIES.US}/policy/${TEST_POLICY_IDS.POLICY_123}`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
      );
      expect(result).toEqual(mockPolicyData().result);
    });

    it('given fetch error then throws error', async () => {
      // Given
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(404));

      // When/Then
      await expect(fetchPolicyById(TEST_COUNTRIES.US, TEST_POLICY_IDS.NONEXISTENT)).rejects.toThrow(
        `Failed to fetch policy ${TEST_POLICY_IDS.NONEXISTENT}`
      );
    });
  });

  describe('createPolicy', () => {
    it('given valid policy data then creates policy', async () => {
      // Given
      const payload = mockPolicyPayload();
      const response = mockPolicyCreateResponse();

      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(response));

      // When
      const result = await createPolicy(TEST_COUNTRIES.US, payload);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `${BASE_URL}/${TEST_COUNTRIES.US}/policy`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      );
      expect(result).toEqual(response);
    });

    it('given API error then throws error', async () => {
      // Given
      const payload = mockPolicyPayload();

      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(500));

      // When/Then
      await expect(createPolicy(TEST_COUNTRIES.US, payload)).rejects.toThrow(
        'Failed to create policy'
      );
    });
  });
});
