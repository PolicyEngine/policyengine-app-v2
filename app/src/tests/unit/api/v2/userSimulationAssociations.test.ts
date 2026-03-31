import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createUserSimulationAssociationV2,
  deleteUserSimulationAssociationV2,
  fetchUserSimulationAssociationByIdV2,
  fetchUserSimulationAssociationsV2,
  fromV2Response,
  toV2CreateRequest,
  updateUserSimulationAssociationV2,
} from '@/api/v2/userSimulationAssociations';
import {
  createMockUserSimulationAssociationV2Response,
  mockFetch404,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
  TEST_TIMESTAMP,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('userSimulationAssociations', () => {
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
        simulationId: TEST_IDS.SIMULATION_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My simulation',
      };

      // When
      const request = toV2CreateRequest(input);

      // Then
      expect(request).toEqual({
        user_id: TEST_IDS.USER_ID,
        simulation_id: TEST_IDS.SIMULATION_ID,
        country_id: TEST_COUNTRY_ID,
        label: 'My simulation',
      });
    });

    test('given undefined label then it maps to null', () => {
      // Given
      const input = {
        userId: TEST_IDS.USER_ID,
        simulationId: TEST_IDS.SIMULATION_ID,
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
      const response = createMockUserSimulationAssociationV2Response();

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(association.userId).toBe(TEST_IDS.USER_ID);
      expect(association.simulationId).toBe(TEST_IDS.SIMULATION_ID);
      expect(association.countryId).toBe(TEST_COUNTRY_ID);
      expect(association.label).toBe('My simulation');
      expect(association.createdAt).toBe(TEST_TIMESTAMP);
      expect(association.updatedAt).toBe(TEST_TIMESTAMP);
    });

    test('given response then isCreated is set to true', () => {
      // Given
      const response = createMockUserSimulationAssociationV2Response();

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.isCreated).toBe(true);
    });

    test('given null label then it maps to undefined', () => {
      // Given
      const response = { ...createMockUserSimulationAssociationV2Response(), label: null };

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.label).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserSimulationAssociationV2
  // ==========================================================================

  describe('createUserSimulationAssociationV2', () => {
    test('given a successful POST then it returns the converted association', async () => {
      // Given
      const mockResponse = createMockUserSimulationAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createUserSimulationAssociationV2({
        userId: TEST_IDS.USER_ID,
        simulationId: TEST_IDS.SIMULATION_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My simulation',
      });

      // Then
      expect(result.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(result.isCreated).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user-simulations/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ==========================================================================
  // fetchUserSimulationAssociationsV2
  // ==========================================================================

  describe('fetchUserSimulationAssociationsV2', () => {
    test('given userId then it fetches with user_id query param', async () => {
      // Given
      const mockResponse = [createMockUserSimulationAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserSimulationAssociationsV2(TEST_IDS.USER_ID);

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
      const mockResponse = [createMockUserSimulationAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserSimulationAssociationsV2(TEST_IDS.USER_ID, TEST_COUNTRY_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`country_id=${TEST_COUNTRY_ID}`),
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // fetchUserSimulationAssociationByIdV2
  // ==========================================================================

  describe('fetchUserSimulationAssociationByIdV2', () => {
    test('given a successful GET then it returns the association', async () => {
      // Given
      const mockResponse = createMockUserSimulationAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserSimulationAssociationByIdV2(TEST_IDS.ASSOCIATION_ID);

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_IDS.ASSOCIATION_ID);
    });

    test('given a 404 response then it returns null', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When
      const result = await fetchUserSimulationAssociationByIdV2(TEST_IDS.ASSOCIATION_ID);

      // Then
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // updateUserSimulationAssociationV2
  // ==========================================================================

  describe('updateUserSimulationAssociationV2', () => {
    test('given a successful PATCH then it returns the updated association with user_id query param', async () => {
      // Given
      const mockResponse = {
        ...createMockUserSimulationAssociationV2Response(),
        label: 'Updated simulation',
      };
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await updateUserSimulationAssociationV2(
        TEST_IDS.ASSOCIATION_ID,
        TEST_IDS.USER_ID,
        { label: 'Updated simulation' }
      );

      // Then
      expect(result.label).toBe('Updated simulation');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // ==========================================================================
  // deleteUserSimulationAssociationV2
  // ==========================================================================

  describe('deleteUserSimulationAssociationV2', () => {
    test('given a successful DELETE then it resolves without error', async () => {
      // Given
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

      // When / Then
      await expect(
        deleteUserSimulationAssociationV2(TEST_IDS.ASSOCIATION_ID, TEST_IDS.USER_ID)
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
        deleteUserSimulationAssociationV2(TEST_IDS.ASSOCIATION_ID, TEST_IDS.USER_ID)
      ).resolves.toBeUndefined();
    });
  });
});
