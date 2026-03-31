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
  createMockUserPolicyAssociationV2Response,
  mockFetch404,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
  TEST_TIMESTAMP,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('userPolicyAssociations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // toV2CreateRequest
  // ==========================================================================

  describe('toV2CreateRequest', () => {
    test('given camelCase app input then it maps to snake_case API request', () => {
      // Given
      const input = {
        userId: TEST_IDS.USER_ID,
        policyId: TEST_IDS.POLICY_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My reform',
      };

      // When
      const request = toV2CreateRequest(input);

      // Then
      expect(request).toEqual({
        user_id: TEST_IDS.USER_ID,
        policy_id: TEST_IDS.POLICY_ID,
        country_id: TEST_COUNTRY_ID,
        label: 'My reform',
      });
    });

    test('given undefined label then it maps to null', () => {
      // Given
      const input = {
        userId: TEST_IDS.USER_ID,
        policyId: TEST_IDS.POLICY_ID,
        countryId: TEST_COUNTRY_ID as 'us',
      };

      // When
      const request = toV2CreateRequest(input);

      // Then
      expect(request.label).toBeNull();
    });
  });

  // ==========================================================================
  // fromV2Response
  // ==========================================================================

  describe('fromV2Response', () => {
    test('given snake_case API response then it maps to camelCase app format', () => {
      // Given
      const response = createMockUserPolicyAssociationV2Response();

      // When
      const userPolicy = fromV2Response(response);

      // Then
      expect(userPolicy.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(userPolicy.userId).toBe(TEST_IDS.USER_ID);
      expect(userPolicy.policyId).toBe(TEST_IDS.POLICY_ID);
      expect(userPolicy.countryId).toBe(TEST_COUNTRY_ID);
      expect(userPolicy.label).toBe('My reform');
      expect(userPolicy.createdAt).toBe(TEST_TIMESTAMP);
      expect(userPolicy.updatedAt).toBe(TEST_TIMESTAMP);
    });

    test('given response then isCreated is set to true', () => {
      // Given
      const response = createMockUserPolicyAssociationV2Response();

      // When
      const userPolicy = fromV2Response(response);

      // Then
      expect(userPolicy.isCreated).toBe(true);
    });

    test('given null label then it maps to undefined', () => {
      // Given
      const response = { ...createMockUserPolicyAssociationV2Response(), label: null };

      // When
      const userPolicy = fromV2Response(response);

      // Then
      expect(userPolicy.label).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserPolicyAssociationV2
  // ==========================================================================

  describe('createUserPolicyAssociationV2', () => {
    test('given a successful POST then it returns the converted UserPolicy', async () => {
      // Given
      const mockResponse = createMockUserPolicyAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createUserPolicyAssociationV2({
        userId: TEST_IDS.USER_ID,
        policyId: TEST_IDS.POLICY_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My reform',
      });

      // Then
      expect(result.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(result.isCreated).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user-policies/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ==========================================================================
  // fetchUserPolicyAssociationsV2
  // ==========================================================================

  describe('fetchUserPolicyAssociationsV2', () => {
    test('given userId then it fetches with user_id query param', async () => {
      // Given
      const mockResponse = [createMockUserPolicyAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserPolicyAssociationsV2(TEST_IDS.USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(TEST_IDS.USER_ID);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.any(Object)
      );
    });

    test('given userId and countryId then it fetches with both query params', async () => {
      // Given
      const mockResponse = [createMockUserPolicyAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserPolicyAssociationsV2(TEST_IDS.USER_ID, TEST_COUNTRY_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`country_id=${TEST_COUNTRY_ID}`),
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // fetchUserPolicyAssociationByIdV2
  // ==========================================================================

  describe('fetchUserPolicyAssociationByIdV2', () => {
    test('given a successful GET then it returns the UserPolicy', async () => {
      // Given
      const mockResponse = createMockUserPolicyAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserPolicyAssociationByIdV2(TEST_IDS.ASSOCIATION_ID);

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_IDS.ASSOCIATION_ID);
    });

    test('given a 404 response then it returns null', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When
      const result = await fetchUserPolicyAssociationByIdV2(TEST_IDS.ASSOCIATION_ID);

      // Then
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // updateUserPolicyAssociationV2
  // ==========================================================================

  describe('updateUserPolicyAssociationV2', () => {
    test('given a successful PATCH then it returns the updated UserPolicy with user_id query param', async () => {
      // Given
      const mockResponse = {
        ...createMockUserPolicyAssociationV2Response(),
        label: 'Updated reform',
      };
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await updateUserPolicyAssociationV2(
        TEST_IDS.ASSOCIATION_ID,
        TEST_IDS.USER_ID,
        { label: 'Updated reform' }
      );

      // Then
      expect(result.label).toBe('Updated reform');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // ==========================================================================
  // deleteUserPolicyAssociationV2
  // ==========================================================================

  describe('deleteUserPolicyAssociationV2', () => {
    test('given a successful DELETE then it resolves without error', async () => {
      // Given
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

      // When / Then
      await expect(
        deleteUserPolicyAssociationV2(TEST_IDS.ASSOCIATION_ID, TEST_IDS.USER_ID)
      ).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('given a 404 response then it does not throw', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(
        deleteUserPolicyAssociationV2(TEST_IDS.ASSOCIATION_ID, TEST_IDS.USER_ID)
      ).resolves.toBeUndefined();
    });
  });
});
