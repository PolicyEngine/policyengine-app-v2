import { describe, expect, test } from 'vitest';
import { UserSimulationAdapter } from '@/adapters/UserSimulationAdapter';
import {
  mockUserSimulationApiResponse,
  mockUserSimulationCreationPayload,
  mockUserSimulationUS,
  mockUserSimulationWithoutOptionalFields,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_SIMULATION_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '@/tests/fixtures';
import { UserSimulation } from '@/types/ingredients/UserSimulation';

describe('UserSimulationAdapter', () => {
  describe('toCreationPayload', () => {
    test('given UserSimulation with all fields then creates proper payload', () => {
      // Given
      const userSimulation: Omit<UserSimulation, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
        isCreated: true,
      };

      // When
      const result = UserSimulationAdapter.toCreationPayload(userSimulation);

      // Then
      expect(result).toEqual(mockUserSimulationCreationPayload);
    });

    test('given UserSimulation without updatedAt then generates timestamp', () => {
      // Given
      const userSimulation: Omit<UserSimulation, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
        isCreated: true,
      };

      // When
      const result = UserSimulationAdapter.toCreationPayload(userSimulation);

      // Then
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.simulationId).toBe(TEST_SIMULATION_IDS.SIM_DEF);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBe(TEST_LABELS.MY_SIMULATION);
      expect(result.updatedAt).toBeDefined();
      expect(new Date(result.updatedAt as string).toISOString()).toBe(result.updatedAt);
    });

    test('given UserSimulation with numeric IDs then converts to strings', () => {
      // Given
      const userSimulation: Omit<UserSimulation, 'id' | 'createdAt'> = {
        userId: 123 as any,
        simulationId: 456 as any,
        countryId: TEST_COUNTRIES.US,
        label: TEST_LABELS.MY_SIMULATION,
        isCreated: true,
      };

      // When
      const result = UserSimulationAdapter.toCreationPayload(userSimulation);

      // Then
      expect(result.userId).toBe('123');
      expect(result.simulationId).toBe('456');
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given UserSimulation without label then includes undefined label', () => {
      // Given
      const userSimulation = mockUserSimulationWithoutOptionalFields;

      // When
      const result = UserSimulationAdapter.toCreationPayload(userSimulation);

      // Then
      expect(result.label).toBeUndefined();
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given UserSimulation with UK country then preserves country ID', () => {
      // Given
      const userSimulation: Omit<UserSimulation, 'id' | 'createdAt'> = {
        userId: TEST_USER_IDS.USER_123,
        simulationId: TEST_SIMULATION_IDS.SIM_GHI,
        countryId: TEST_COUNTRIES.UK,
        label: TEST_LABELS.MY_SIMULATION,
        isCreated: true,
      };

      // When
      const result = UserSimulationAdapter.toCreationPayload(userSimulation);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });
  });

  describe('fromApiResponse', () => {
    test('given API response with all fields then creates UserSimulation', () => {
      // Given
      const apiData = mockUserSimulationApiResponse;

      // When
      const result = UserSimulationAdapter.fromApiResponse(apiData);

      // Then
      expect(result).toEqual(mockUserSimulationUS);
    });

    test('given API response without optional fields then creates UserSimulation with defaults', () => {
      // Given
      const apiData = {
        id: 'us-sim-def',
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        userId: TEST_USER_IDS.USER_123,
        countryId: TEST_COUNTRIES.US,
      };

      // When
      const result = UserSimulationAdapter.fromApiResponse(apiData);

      // Then
      expect(result.id).toBe('us-sim-def');
      expect(result.userId).toBe(TEST_USER_IDS.USER_123);
      expect(result.simulationId).toBe(TEST_SIMULATION_IDS.SIM_DEF);
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
      expect(result.label).toBeUndefined();
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
      expect(result.isCreated).toBe(true);
    });

    test('given API response with null label then preserves null', () => {
      // Given
      const apiData = {
        id: 'us-sim-def',
        simulationId: TEST_SIMULATION_IDS.SIM_DEF,
        userId: TEST_USER_IDS.USER_123,
        countryId: TEST_COUNTRIES.US,
        label: null,
        createdAt: TEST_TIMESTAMPS.CREATED_AT,
        updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
      };

      // When
      const result = UserSimulationAdapter.fromApiResponse(apiData);

      // Then
      expect(result.label).toBeNull();
      expect(result.countryId).toBe(TEST_COUNTRIES.US);
    });

    test('given API response with UK country then preserves country ID', () => {
      // Given
      const apiData = {
        ...mockUserSimulationApiResponse,
        countryId: TEST_COUNTRIES.UK,
      };

      // When
      const result = UserSimulationAdapter.fromApiResponse(apiData);

      // Then
      expect(result.countryId).toBe(TEST_COUNTRIES.UK);
    });
  });
});
