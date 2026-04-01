import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createUserHouseholdAssociationV2,
  deleteUserHouseholdAssociationV2,
  fetchUserHouseholdAssociationByIdV2,
  fetchUserHouseholdAssociationsV2,
  fromV2Response,
  toV2CreateRequest,
  updateUserHouseholdAssociationV2,
} from '@/api/v2/userHouseholdAssociations';
import {
  createMockUserHouseholdAssociationV2Response,
  mockFetch404,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
  TEST_TIMESTAMP,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('userHouseholdAssociations', () => {
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
        householdId: TEST_IDS.HOUSEHOLD_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My household',
      };

      // When
      const request = toV2CreateRequest(input);

      // Then
      expect(request).toEqual({
        user_id: TEST_IDS.USER_ID,
        household_id: TEST_IDS.HOUSEHOLD_ID,
        country_id: TEST_COUNTRY_ID,
        label: 'My household',
      });
    });

    test('given undefined label then it maps to null', () => {
      // Given
      const input = {
        userId: TEST_IDS.USER_ID,
        householdId: TEST_IDS.HOUSEHOLD_ID,
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
      const response = createMockUserHouseholdAssociationV2Response();

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(association.userId).toBe(TEST_IDS.USER_ID);
      expect(association.householdId).toBe(TEST_IDS.HOUSEHOLD_ID);
      expect(association.countryId).toBe(TEST_COUNTRY_ID);
      expect(association.label).toBe('My household');
      expect(association.createdAt).toBe(TEST_TIMESTAMP);
      expect(association.updatedAt).toBe(TEST_TIMESTAMP);
    });

    test('given response then type is "household" and isCreated is true', () => {
      // Given
      const response = createMockUserHouseholdAssociationV2Response();

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.type).toBe('household');
      expect(association.isCreated).toBe(true);
    });

    test('given null label then it maps to undefined', () => {
      // Given
      const response = { ...createMockUserHouseholdAssociationV2Response(), label: null };

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.label).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserHouseholdAssociationV2
  // ==========================================================================

  describe('createUserHouseholdAssociationV2', () => {
    test('given a successful POST then it returns the converted association', async () => {
      // Given
      const mockResponse = createMockUserHouseholdAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createUserHouseholdAssociationV2({
        userId: TEST_IDS.USER_ID,
        householdId: TEST_IDS.HOUSEHOLD_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My household',
      });

      // Then
      expect(result.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(result.type).toBe('household');
      expect(result.isCreated).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user-household-associations/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ==========================================================================
  // fetchUserHouseholdAssociationsV2
  // ==========================================================================

  describe('fetchUserHouseholdAssociationsV2', () => {
    test('given userId then it fetches from the user endpoint', async () => {
      // Given
      const mockResponse = [createMockUserHouseholdAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserHouseholdAssociationsV2(TEST_IDS.USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(TEST_IDS.USER_ID);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/user-household-associations/user/${TEST_IDS.USER_ID}`),
        expect.any(Object)
      );
    });

    test('given userId and countryId then it includes country_id query param', async () => {
      // Given
      const mockResponse = [createMockUserHouseholdAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserHouseholdAssociationsV2(TEST_IDS.USER_ID, TEST_COUNTRY_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`country_id=${TEST_COUNTRY_ID}`),
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // fetchUserHouseholdAssociationByIdV2
  // ==========================================================================

  describe('fetchUserHouseholdAssociationByIdV2', () => {
    test('given a successful GET then it returns the first association', async () => {
      // Given
      const mockResponse = [createMockUserHouseholdAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserHouseholdAssociationByIdV2(
        TEST_IDS.USER_ID,
        TEST_IDS.HOUSEHOLD_ID
      );

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_IDS.ASSOCIATION_ID);
    });

    test('given a 404 response then it returns null', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When
      const result = await fetchUserHouseholdAssociationByIdV2(
        TEST_IDS.USER_ID,
        TEST_IDS.HOUSEHOLD_ID
      );

      // Then
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // updateUserHouseholdAssociationV2
  // ==========================================================================

  describe('updateUserHouseholdAssociationV2', () => {
    test('given a successful PUT then it returns the updated association', async () => {
      // Given
      const mockResponse = {
        ...createMockUserHouseholdAssociationV2Response(),
        label: 'Updated household',
      };
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await updateUserHouseholdAssociationV2(TEST_IDS.ASSOCIATION_ID, {
        label: 'Updated household',
      });

      // Then
      expect(result.label).toBe('Updated household');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/user-household-associations/${TEST_IDS.ASSOCIATION_ID}`),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // ==========================================================================
  // deleteUserHouseholdAssociationV2
  // ==========================================================================

  describe('deleteUserHouseholdAssociationV2', () => {
    test('given a successful DELETE then it resolves without error', async () => {
      // Given
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

      // When / Then
      await expect(
        deleteUserHouseholdAssociationV2(TEST_IDS.ASSOCIATION_ID)
      ).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/user-household-associations/${TEST_IDS.ASSOCIATION_ID}`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('given a 404 response then it does not throw', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(
        deleteUserHouseholdAssociationV2(TEST_IDS.ASSOCIATION_ID)
      ).resolves.toBeUndefined();
    });
  });
});
