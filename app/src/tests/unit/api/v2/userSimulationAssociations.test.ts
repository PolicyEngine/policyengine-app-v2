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
  mockDeleteSuccessResponse,
  mockErrorResponse,
  mockNotFoundResponse,
  mockSimulationAssociationV2Response,
  mockSuccessResponse,
  TEST_ASSOCIATION_IDS,
} from '@/tests/fixtures/api/v2/userAssociationMocks';
import {
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_SIMULATION_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '@/tests/fixtures/constants';

vi.mock('@/api/v2/taxBenefitModels', () => ({
  API_V2_BASE_URL: 'https://test-api.example.com',
  getModelName: (countryId: string) => 'policyengine-' + countryId,
}));

describe('userSimulationAssociations', () => {
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
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
      };

      // When
      const result = toV2CreateRequest(association);

      // Then
      expect(result).toEqual({
        user_id: TEST_USER_IDS.USER_123,
        simulation_id: TEST_SIMULATION_IDS.SIM_DEF,
        country_id: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
      });
    });

    test('given undefined label then converts to null', () => {
      // Given
      const association = {
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: undefined,
      };

      // When
      const result = toV2CreateRequest(association);

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
      const response = mockSimulationAssociationV2Response();

      // When
      const result = fromV2Response(response);

      // Then
      expect(result).toEqual({
        id: TEST_ASSOCIATION_IDS.SIMULATION_ASSOC,
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
        createdAt: TEST_TIMESTAMPS.CREATED_AT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
        isCreated: true,
      });
    });

    test('given null label then converts to undefined', () => {
      // Given
      const response = mockSimulationAssociationV2Response({ label: null });

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.label).toBeUndefined();
    });

    test('given null updated_at then converts to undefined', () => {
      // Given
      const response = mockSimulationAssociationV2Response({
        updated_at: null as unknown as string,
      });

      // When
      const result = fromV2Response(response);

      // Then
      expect(result.updatedAt).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserSimulationAssociationV2
  // ==========================================================================

  describe('createUserSimulationAssociationV2', () => {
    test('given success then returns converted UserSimulation', async () => {
      // Given
      const apiResponse = mockSimulationAssociationV2Response();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      const association = {
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
      };

      // When
      const result = await createUserSimulationAssociationV2(association);

      // Then
      expect(fetch).toHaveBeenCalledWith('https://test-api.example.com/user-simulations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_id: TEST_USER_IDS.USER_123,
          simulation_id: TEST_SIMULATION_IDS.SIM_DEF,
          country_id: TEST_COUNTRIES.US,
          label: TEST_LABELS.MY_SIMULATION,
        }),
      });
      expect(result.isCreated).toBe(true);
      expect(result.id).toBe(TEST_ASSOCIATION_IDS.SIMULATION_ASSOC);
    });

    test('given error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      const association = {
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
      };

      // When / Then
      await expect(createUserSimulationAssociationV2(association)).rejects.toThrow(
        'Failed to create simulation association: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // fetchUserSimulationAssociationsV2
  // ==========================================================================

  describe('fetchUserSimulationAssociationsV2', () => {
    test('given success then returns array of converted simulations', async () => {
      // Given
      const apiResponses = [mockSimulationAssociationV2Response()];
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponses) as unknown as Response);

      // When
      const result = await fetchUserSimulationAssociationsV2(TEST_USER_IDS.USER_123);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(TEST_ASSOCIATION_IDS.SIMULATION_ASSOC);
      expect(result[0].isCreated).toBe(true);
    });

    test('given countryId filter then appends to query params', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse([]) as unknown as Response);

      // When
      await fetchUserSimulationAssociationsV2(TEST_USER_IDS.USER_123, TEST_COUNTRIES.US);

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
      await expect(fetchUserSimulationAssociationsV2(TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Failed to fetch simulation associations: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // fetchUserSimulationAssociationByIdV2
  // ==========================================================================

  describe('fetchUserSimulationAssociationByIdV2', () => {
    test('given success then returns converted simulation', async () => {
      // Given
      const apiResponse = mockSimulationAssociationV2Response();
      vi.mocked(fetch).mockResolvedValue(mockSuccessResponse(apiResponse) as unknown as Response);

      // When
      const result = await fetchUserSimulationAssociationByIdV2(
        TEST_ASSOCIATION_IDS.SIMULATION_ASSOC
      );

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_ASSOCIATION_IDS.SIMULATION_ASSOC);
      expect(result!.isCreated).toBe(true);
    });

    test('given 404 then returns null', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

      // When
      const result = await fetchUserSimulationAssociationByIdV2('nonexistent-id');

      // Then
      expect(result).toBeNull();
    });

    test('given other error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(fetchUserSimulationAssociationByIdV2('some-id')).rejects.toThrow(
        'Failed to fetch simulation association: 500 Server error'
      );
    });
  });

  // ==========================================================================
  // updateUserSimulationAssociationV2
  // ==========================================================================

  describe('updateUserSimulationAssociationV2', () => {
    test('given success then returns updated simulation', async () => {
      // Given
      const updatedResponse = mockSimulationAssociationV2Response({ label: 'Updated Label' });
      vi.mocked(fetch).mockResolvedValue(
        mockSuccessResponse(updatedResponse) as unknown as Response
      );

      // When
      const result = await updateUserSimulationAssociationV2(
        TEST_ASSOCIATION_IDS.SIMULATION_ASSOC,
        TEST_USER_IDS.USER_123,
        { label: 'Updated Label' }
      );

      // Then
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://test-api.example.com/user-simulations/${TEST_ASSOCIATION_IDS.SIMULATION_ASSOC}?user_id=${TEST_USER_IDS.USER_123}`
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
  // deleteUserSimulationAssociationV2
  // ==========================================================================

  describe('deleteUserSimulationAssociationV2', () => {
    test('given 204 success then resolves', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockDeleteSuccessResponse() as unknown as Response);

      // When / Then
      await expect(
        deleteUserSimulationAssociationV2(
          TEST_ASSOCIATION_IDS.SIMULATION_ASSOC,
          TEST_USER_IDS.USER_123
        )
      ).resolves.toBeUndefined();

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://test-api.example.com/user-simulations/${TEST_ASSOCIATION_IDS.SIMULATION_ASSOC}?user_id=${TEST_USER_IDS.USER_123}`
        ),
        { method: 'DELETE' }
      );
    });

    test('given 404 then resolves (accepts as success)', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(mockNotFoundResponse() as unknown as Response);

      // When / Then
      await expect(
        deleteUserSimulationAssociationV2(
          TEST_ASSOCIATION_IDS.SIMULATION_ASSOC,
          TEST_USER_IDS.USER_123
        )
      ).resolves.toBeUndefined();
    });

    test('given other error then throws', async () => {
      // Given
      vi.mocked(fetch).mockResolvedValue(
        mockErrorResponse(500, 'Server error') as unknown as Response
      );

      // When / Then
      await expect(
        deleteUserSimulationAssociationV2(
          TEST_ASSOCIATION_IDS.SIMULATION_ASSOC,
          TEST_USER_IDS.USER_123
        )
      ).rejects.toThrow('Failed to delete simulation association: 500 Server error');
    });
  });
});
