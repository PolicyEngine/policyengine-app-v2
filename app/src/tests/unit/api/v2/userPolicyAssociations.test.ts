import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createUserPolicyAssociationV2,
  deleteUserPolicyAssociationV2,
  fetchUserPolicyAssociationByIdV2,
  fetchUserPolicyAssociationsV2,
  fromV2Response,
  toV2CreateRequest,
  updateUserPolicyAssociationV2,
} from '@/api/v2/userPolicyAssociations';
import {
  mockDeleteSuccessResponse,
  mockErrorResponse,
  mockNotFoundResponse,
  mockPolicyAssociationV2Response,
  mockSuccessResponse,
  TEST_ASSOCIATION_IDS,
} from '@/tests/fixtures/api/v2/userAssociationMocks';
import {
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_POLICY_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
  getModelName: (countryId: string) => `policyengine-${countryId}`,
}));

describe('userPolicyAssociations', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  // ==========================================================================
  // toV2CreateRequest
  // ==========================================================================

  describe('toV2CreateRequest', () => {
    test('given association then converts camelCase to snake_case', () => {
      // Given
      const userPolicy = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        isCreated: true,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = toV2CreateRequest(userPolicy);

      // Then
      expect(result).toEqual({
        user_id: TEST_USER_IDS.USER_123,
        policy_id: TEST_POLICY_IDS.POLICY_789,
        country_id: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
      });
    });

    test('given undefined label then converts to null', () => {
      // Given
      const userPolicy = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: undefined,
        isCreated: true,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = toV2CreateRequest(userPolicy);

      // Then
      expect(result.label).toBeNull();
    });
  });

  // ==========================================================================
  // fromV2Response
  // ==========================================================================

  describe('fromV2Response', () => {
    test('given API response then converts to app format with isCreated true', () => {
      // Given
      const response = mockPolicyAssociationV2Response();

      // When
      const result = fromV2Response(response);

      // Then
      expect(result).toEqual({
        id: TEST_ASSOCIATION_IDS.POLICY_ASSOC,
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        createdAt: TEST_TIMESTAMPS.CREATED_AT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
        isCreated: true,
      });
    });

    test('given null label then converts to undefined', () => {
      // Given
      const response = mockPolicyAssociationV2Response({ label: null });

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.label).toBeUndefined();
    });

    test('given null updated_at then converts to undefined', () => {
      // Given
      const response = mockPolicyAssociationV2Response({
        updated_at: null as unknown as string,
      });

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.updatedAt).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserPolicyAssociationV2
  // ==========================================================================

  describe('createUserPolicyAssociationV2', () => {
    test('given success then returns converted UserPolicy', async () => {
      // Given
      const apiResponse = mockPolicyAssociationV2Response();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      const userPolicy = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        isCreated: true,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = await createUserPolicyAssociationV2(userPolicy);

      // Then
      expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/user-policies/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_id: TEST_USER_IDS.USER_123,
          policy_id: TEST_POLICY_IDS.POLICY_789,
          country_id: TEST_COUNTRIES.US,
          label: TEST_LABELS.MY_POLICY,
        }),
      });
      expect(result.isCreated).toBe(true);
      expect(result.id).toBe(TEST_ASSOCIATION_IDS.POLICY_ASSOC);
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      const userPolicy = {
        userId: TEST_USER_IDS.USER_123,
        policyId: TEST_POLICY_IDS.POLICY_789,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_POLICY,
        isCreated: true,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When / Then
      await expect(createUserPolicyAssociationV2(userPolicy)).rejects.toThrow(
        'Failed to create policy association: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // fetchUserPolicyAssociationsV2
  // ==========================================================================

  describe('fetchUserPolicyAssociationsV2', () => {
    test('given success then returns array of converted policies', async () => {
      // Given
      const apiResponses = [mockPolicyAssociationV2Response()];
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponses) as unknown as Response);

      // When
      const result = await fetchUserPolicyAssociationsV2(TEST_USER_IDS.USER_123);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_ASSOCIATION_IDS.POLICY_ASSOC);
      expect(result[0].isCreated).toBe(true);
    });

    test('given countryId filter then appends to query params', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse([]) as unknown as Response);

      // When
      await fetchUserPolicyAssociationsV2(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('user_id=user-123');
      expect(calledUrl).toContain('country_id=us');
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(fetchUserPolicyAssociationsV2(TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Failed to fetch user policy associations: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // fetchUserPolicyAssociationByIdV2
  // ==========================================================================

  describe('fetchUserPolicyAssociationByIdV2', () => {
    test('given success then returns converted policy', async () => {
      // Given
      const apiResponse = mockPolicyAssociationV2Response();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      // When
      const result = await fetchUserPolicyAssociationByIdV2(TEST_ASSOCIATION_IDS.POLICY_ASSOC);

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_ASSOCIATION_IDS.POLICY_ASSOC);
      expect(result!.isCreated).toBe(true);
    });

    test('given 404 then returns null', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

      // When
      const result = await fetchUserPolicyAssociationByIdV2('nonexistent-id');

      // Then
      expect(result).toBeNull();
    });

    test('given other error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(fetchUserPolicyAssociationByIdV2('some-id')).rejects.toThrow(
        'Failed to fetch policy association: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // updateUserPolicyAssociationV2
  // ==========================================================================

  describe('updateUserPolicyAssociationV2', () => {
    test('given success then returns updated policy', async () => {
      // Given
      const updatedResponse = mockPolicyAssociationV2Response({ label: 'Updated Label' });
      vi.mocked(fetch).mockResolvedValue(
        mockSuccessResponse(updatedResponse) as unknown as Response
      );

      // When
      const result = await updateUserPolicyAssociationV2(
        TEST_ASSOCIATION_IDS.POLICY_ASSOC,
        TEST_USER_IDS.USER_123,
        { label: 'Updated Label' }
      );

      // Then
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://test-api.example.com/user-policies/${TEST_ASSOCIATION_IDS.POLICY_ASSOC}?user_id=${TEST_USER_IDS.USER_123}`
        ),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ label: 'Updated Label' }),
        }
      );
      expect(result.label).toBe('Updated Label');
      expect(result.isCreated).toBe(true);
    });
  });

  // ==========================================================================
  // deleteUserPolicyAssociationV2
  // ==========================================================================

  describe('deleteUserPolicyAssociationV2', () => {
    test('given 204 success then resolves', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockDeleteSuccessResponse() as unknown as Response);

      // When / Then
      await expect(
        deleteUserPolicyAssociationV2(TEST_ASSOCIATION_IDS.POLICY_ASSOC, TEST_USER_IDS.USER_123)
      ).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://test-api.example.com/user-policies/${TEST_ASSOCIATION_IDS.POLICY_ASSOC}?user_id=${TEST_USER_IDS.USER_123}`
        ),
        { method: 'DELETE' }
      );
    });

    test('given 404 then resolves (accepts as success)', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

      // When / Then
      await expect(
        deleteUserPolicyAssociationV2(TEST_ASSOCIATION_IDS.POLICY_ASSOC, TEST_USER_IDS.USER_123)
      ).resolves.toBeUndefined();
    });

    test('given other error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(
        deleteUserPolicyAssociationV2(TEST_ASSOCIATION_IDS.POLICY_ASSOC, TEST_USER_IDS.USER_123)
      ).rejects.toThrow('Failed to delete policy association: 500 Server error');
    });
  });
});
