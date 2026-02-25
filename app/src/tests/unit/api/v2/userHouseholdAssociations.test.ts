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
  mockDeleteSuccessResponse,
  mockErrorResponse,
  mockHouseholdAssociationV2Response,
  mockNotFoundResponse,
  mockSuccessResponse,
  TEST_ASSOCIATION_IDS,
  TEST_HOUSEHOLD_IDS,
} from '@/tests/fixtures/api/v2/userAssociationMocks';
import { TEST_COUNTRIES, TEST_TIMESTAMPS, TEST_USER_IDS } from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
  getModelName: (countryId: string) => 'policyengine-' + countryId,
}));

describe('userHouseholdAssociations', () => {
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
      const association = {
        userId: TEST_USER_IDS.USER_123,
        householdId: TEST_HOUSEHOLD_IDS.HH_001,
        countryId: TEST_COUNTRIES.US,
        label: 'My Household',
      };

      // When
      const result = toV2CreateRequest(association);

      // Then
      expect(result).toEqual({
        user_id: TEST_USER_IDS.USER_123,
        household_id: TEST_HOUSEHOLD_IDS.HH_001,
        country_id: TEST_COUNTRIES.US,
        label: 'My Household',
      });
    });

    test('given undefined label then converts to null', () => {
      // Given
      const association = {
        userId: TEST_USER_IDS.USER_123,
        householdId: TEST_HOUSEHOLD_IDS.HH_001,
        countryId: TEST_COUNTRIES.US,
        label: undefined,
      };

      // When
      const result = toV2CreateRequest(association);

      // Then
      expect(result.label).toBeNull();
    });

    test('given association then omits id, type, createdAt, updatedAt, and isCreated', () => {
      // Given
      const association = {
        userId: TEST_USER_IDS.USER_123,
        householdId: TEST_HOUSEHOLD_IDS.HH_001,
        countryId: TEST_COUNTRIES.US,
        label: 'My Household',
      };

      // When
      const result = toV2CreateRequest(association);

      // Then
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('type');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).not.toHaveProperty('isCreated');
    });
  });

  // ==========================================================================
  // fromV2Response
  // ==========================================================================

  describe('fromV2Response', () => {
    test('given API response then converts to app format with type household and isCreated true', () => {
      // Given
      const response = mockHouseholdAssociationV2Response();

      // When
      const result = fromV2Response(response);

      // Then
      expect(result).toEqual({
        type: 'household',
        id: TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC,
        userId: TEST_USER_IDS.USER_123,
        householdId: TEST_HOUSEHOLD_IDS.HH_001,
        countryId: TEST_COUNTRIES.US,
        label: 'My Household',
        createdAt: TEST_TIMESTAMPS.CREATED_AT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
        isCreated: true,
      });
    });

    test('given response then includes type household', () => {
      // Given
      const response = mockHouseholdAssociationV2Response();

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.type).toBe('household');
    });

    test('given null label then converts to undefined', () => {
      // Given
      const response = mockHouseholdAssociationV2Response({ label: null });

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.label).toBeUndefined();
    });

    test('given null updated_at then converts to undefined', () => {
      // Given
      const response = mockHouseholdAssociationV2Response({
        updated_at: null as unknown as string,
      });

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.updatedAt).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserHouseholdAssociationV2
  // ==========================================================================

  describe('createUserHouseholdAssociationV2', () => {
    test('given success then returns converted UserHouseholdPopulation', async () => {
      // Given
      const apiResponse = mockHouseholdAssociationV2Response();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      const association = {
        userId: TEST_USER_IDS.USER_123,
        householdId: TEST_HOUSEHOLD_IDS.HH_001,
        countryId: TEST_COUNTRIES.US,
        label: 'My Household',
      };

      // When
      const result = await createUserHouseholdAssociationV2(association);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        'https://test-api.example.com/user-household-associations/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            user_id: TEST_USER_IDS.USER_123,
            household_id: TEST_HOUSEHOLD_IDS.HH_001,
            country_id: TEST_COUNTRIES.US,
            label: 'My Household',
          }),
        }
      );
      expect(result.type).toBe('household');
      expect(result.isCreated).toBe(true);
      expect(result.id).toBe(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC);
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      const association = {
        userId: TEST_USER_IDS.USER_123,
        householdId: TEST_HOUSEHOLD_IDS.HH_001,
        countryId: TEST_COUNTRIES.US,
        label: 'My Household',
      };

      // When / Then
      await expect(createUserHouseholdAssociationV2(association)).rejects.toThrow(
        'Failed to create household association: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // fetchUserHouseholdAssociationsV2
  // ==========================================================================

  describe('fetchUserHouseholdAssociationsV2', () => {
    test('given success then returns array of converted households', async () => {
      // Given
      const apiResponses = [mockHouseholdAssociationV2Response()];
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponses) as unknown as Response);

      // When
      const result = await fetchUserHouseholdAssociationsV2(TEST_USER_IDS.USER_123);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC);
      expect(result[0].type).toBe('household');
      expect(result[0].isCreated).toBe(true);
    });

    test('given countryId filter then appends to query params', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse([]) as unknown as Response);

      // When
      await fetchUserHouseholdAssociationsV2(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain(`/user/${TEST_USER_IDS.USER_123}`);
      expect(calledUrl).toContain('country_id=us');
    });

    test('given no countryId then fetches without country param', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse([]) as unknown as Response);

      // When
      await fetchUserHouseholdAssociationsV2(TEST_USER_IDS.USER_123);

      // Then
      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        `https://test-api.example.com/user-household-associations/user/${TEST_USER_IDS.USER_123}`
      );
      expect(calledUrl).not.toContain('country_id');
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(fetchUserHouseholdAssociationsV2(TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Failed to fetch household associations: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // fetchUserHouseholdAssociationByIdV2
  // ==========================================================================

  describe('fetchUserHouseholdAssociationByIdV2', () => {
    test('given success then returns first element from response array', async () => {
      // Given
      const apiResponse = [mockHouseholdAssociationV2Response()];
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      // When
      const result = await fetchUserHouseholdAssociationByIdV2(
        TEST_USER_IDS.USER_123,
        TEST_HOUSEHOLD_IDS.HH_001
      );

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC);
      expect(result!.type).toBe('household');
    });

    test('given success then fetches with userId and householdId in path', async () => {
      // Given
      const apiResponse = [mockHouseholdAssociationV2Response()];
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      // When
      await fetchUserHouseholdAssociationByIdV2(TEST_USER_IDS.USER_123, TEST_HOUSEHOLD_IDS.HH_001);

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `https://test-api.example.com/user-household-associations/${TEST_USER_IDS.USER_123}/${TEST_HOUSEHOLD_IDS.HH_001}`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );
    });

    test('given empty array then returns null', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse([]) as unknown as Response);

      // When
      const result = await fetchUserHouseholdAssociationByIdV2(
        TEST_USER_IDS.USER_123,
        TEST_HOUSEHOLD_IDS.HH_001
      );

      // Then
      expect(result).toBeNull();
    });

    test('given 404 then returns null', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

      // When
      const result = await fetchUserHouseholdAssociationByIdV2(
        TEST_USER_IDS.USER_123,
        'nonexistent-id'
      );

      // Then
      expect(result).toBeNull();
    });

    test('given other error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(
        fetchUserHouseholdAssociationByIdV2(TEST_USER_IDS.USER_123, TEST_HOUSEHOLD_IDS.HH_001)
      ).rejects.toThrow('Failed to fetch household association: 500 Server error');
    });
  });

  // ==========================================================================
  // updateUserHouseholdAssociationV2
  // ==========================================================================

  describe('updateUserHouseholdAssociationV2', () => {
    test('given success then returns updated household via PUT', async () => {
      // Given
      const updatedResponse = mockHouseholdAssociationV2Response({ label: 'Updated Label' });
      vi.mocked(fetch).mockResolvedValue(
        mockSuccessResponse(updatedResponse) as unknown as Response
      );

      // When
      const result = await updateUserHouseholdAssociationV2(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC, {
        label: 'Updated Label',
      });

      // Then
      expect(fetch).toHaveBeenCalledWith(
        `https://test-api.example.com/user-household-associations/${TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ label: 'Updated Label' }),
        }
      );
      expect(result.label).toBe('Updated Label');
      expect(result.type).toBe('household');
      expect(result.isCreated).toBe(true);
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(
        updateUserHouseholdAssociationV2(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC, {
          label: 'Updated',
        })
      ).rejects.toThrow('Failed to update household association: 500 Server error');
    });
  });

  // ==========================================================================
  // deleteUserHouseholdAssociationV2
  // ==========================================================================

  describe('deleteUserHouseholdAssociationV2', () => {
    test('given 204 success then resolves', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockDeleteSuccessResponse() as unknown as Response);

      // When / Then
      await expect(
        deleteUserHouseholdAssociationV2(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC)
      ).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        `https://test-api.example.com/user-household-associations/${TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC}`,
        { method: 'DELETE' }
      );
    });

    test('given 404 then resolves (accepts as success)', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

      // When / Then
      await expect(
        deleteUserHouseholdAssociationV2(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC)
      ).resolves.toBeUndefined();
    });

    test('given other error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(
        deleteUserHouseholdAssociationV2(TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC)
      ).rejects.toThrow('Failed to delete household association: 500 Server error');
    });
  });
});
