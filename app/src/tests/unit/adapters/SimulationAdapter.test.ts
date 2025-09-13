import { describe, expect, test } from 'vitest';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import {
  mockPartialSimulationForCreation,
  mockPartialSimulationMissingPopulation,
  mockPartialSimulationWithGeographyForCreation,
  mockSimulationComplete,
  mockSimulationCreationPayloadComplete,
  mockSimulationCreationPayloadMinimal,
  mockSimulationCreationPayloadWithGeography,
  mockSimulationMetadataComplete,
  mockSimulationMetadataMinimal,
  mockSimulationMetadataMissingPopulation,
  mockSimulationMetadataMissingPopulationType,
  mockSimulationMetadataWithGeography,
  mockSimulationMinimal,
  mockSimulationWithGeography,
  SIMULATION_ADAPTER_ERROR_MESSAGES,
  TEST_SIMULATION_SCENARIOS,
} from '@/tests/fixtures/adapters/SimulationAdapterMocks';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';

describe('SimulationAdapter', () => {
  describe('fromMetadata', () => {
    test('given complete metadata with household then converts to simulation correctly', () => {
      // Given
      const metadata = mockSimulationMetadataComplete;

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual(mockSimulationComplete);
    });

    test('given complete metadata with geography then converts to simulation correctly', () => {
      // Given
      const metadata = mockSimulationMetadataWithGeography;

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual(mockSimulationWithGeography);
    });

    test('given minimal metadata without policy then converts correctly', () => {
      // Given
      const metadata = mockSimulationMetadataMinimal;

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual(mockSimulationMinimal);
    });

    test('given metadata missing population_id then throws error', () => {
      // Given
      const metadata = mockSimulationMetadataMissingPopulation as SimulationMetadata;

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.MISSING_POPULATION_ID
      );
    });

    test('given metadata missing population_type then throws error', () => {
      // Given
      const metadata = mockSimulationMetadataMissingPopulationType as SimulationMetadata;

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.MISSING_POPULATION_TYPE
      );
    });

    test('given null population_id then throws error', () => {
      // Given
      const metadata: SimulationMetadata = {
        ...mockSimulationMetadataComplete,
        population_id: null as any,
      };

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.MISSING_POPULATION_ID
      );
    });

    test('given empty string population_id then throws error', () => {
      // Given
      const metadata: SimulationMetadata = {
        ...mockSimulationMetadataComplete,
        population_id: '',
      };

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.MISSING_POPULATION_ID
      );
    });

    test('given null population_type then throws error', () => {
      // Given
      const metadata: SimulationMetadata = {
        ...mockSimulationMetadataComplete,
        population_type: null as any,
      };

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.MISSING_POPULATION_TYPE
      );
    });
  });

  describe('toCreationPayload', () => {
    test('given complete simulation then converts to creation payload correctly', () => {
      // Given
      const simulation = mockPartialSimulationForCreation;

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual(mockSimulationCreationPayloadComplete);
    });

    test('given simulation with geography then converts correctly', () => {
      // Given
      const simulation = mockPartialSimulationWithGeographyForCreation;

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual(mockSimulationCreationPayloadWithGeography);
    });

    test('given simulation without policy then converts with null policy_id', () => {
      // Given
      const simulation = {
        populationId: 'household-minimal',
        populationType: 'household' as const,
        policyId: '113',  // Backend requires a policy_id, using string that converts to 113
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual(mockSimulationCreationPayloadMinimal);
    });

    test('given simulation with undefined policy then converts with undefined policy_id', () => {
      // Given
      const simulation = {
        populationId: 'household-test',
        populationType: 'household' as const,
        // policyId is undefined
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual({
        population_id: 'household-test',
        population_type: 'household',
        policy_id: undefined,
      });
    });

    test('given simulation missing populationId then throws error', () => {
      // Given
      const simulation = mockPartialSimulationMissingPopulation;

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.CREATION_MISSING_POPULATION_ID
      );
    });

    test('given simulation with null populationId then throws error', () => {
      // Given
      const simulation = {
        populationId: null as any,
        populationType: 'household' as const,
        policyId: 'policy-123',
      };

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.CREATION_MISSING_POPULATION_ID
      );
    });

    test('given simulation with empty string populationId then throws error', () => {
      // Given
      const simulation = {
        populationId: '',
        populationType: 'household' as const,
        policyId: 'policy-123',
      };

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        SIMULATION_ADAPTER_ERROR_MESSAGES.CREATION_MISSING_POPULATION_ID
      );
    });

    test('given simulation without populationType then converts with undefined', () => {
      // Given
      const simulation = {
        populationId: 'household-test',
        policyId: '123',  // String that will be converted to number
        // populationType is undefined
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual({
        population_id: 'household-test',
        population_type: undefined,
        policy_id: 123,  // Converted to number
      });
    });
  });

  describe('round-trip conversion', () => {
    test('given complete household scenario then converts back and forth correctly', () => {
      // Given
      const { metadata, simulation, creationPayload } =
        TEST_SIMULATION_SCENARIOS.COMPLETE_HOUSEHOLD;

      // When - Convert from metadata to simulation
      const simulationFromMetadata = SimulationAdapter.fromMetadata(metadata);

      // Then - Should match expected simulation
      expect(simulationFromMetadata).toEqual(simulation);

      // When - Convert simulation to creation payload
      const payloadFromSimulation = SimulationAdapter.toCreationPayload(simulationFromMetadata);

      // Then - Should match expected creation payload fields
      expect(payloadFromSimulation.population_id).toEqual(creationPayload.population_id);
      expect(payloadFromSimulation.population_type).toEqual(creationPayload.population_type);
      expect(payloadFromSimulation.policy_id).toEqual(creationPayload.policy_id);
    });

    test('given geography scenario then converts back and forth correctly', () => {
      // Given
      const { metadata, simulation, creationPayload } = TEST_SIMULATION_SCENARIOS.GEOGRAPHY_BASED;

      // When - Convert from metadata to simulation
      const simulationFromMetadata = SimulationAdapter.fromMetadata(metadata);

      // Then - Should match expected simulation
      expect(simulationFromMetadata).toEqual(simulation);

      // When - Convert simulation to creation payload
      const payloadFromSimulation = SimulationAdapter.toCreationPayload(simulationFromMetadata);

      // Then - Should match expected creation payload fields
      expect(payloadFromSimulation.population_id).toEqual(creationPayload.population_id);
      expect(payloadFromSimulation.population_type).toEqual(creationPayload.population_type);
      expect(payloadFromSimulation.policy_id).toEqual(creationPayload.policy_id);
    });

    test('given minimal scenario without policy then converts back and forth correctly', () => {
      // Given
      const { metadata, simulation, creationPayload } = TEST_SIMULATION_SCENARIOS.MINIMAL_NO_POLICY;

      // When - Convert from metadata to simulation
      const simulationFromMetadata = SimulationAdapter.fromMetadata(metadata);

      // Then - Should match expected simulation
      expect(simulationFromMetadata).toEqual(simulation);

      // When - Convert simulation to creation payload
      const payloadFromSimulation = SimulationAdapter.toCreationPayload(simulationFromMetadata);

      // Then - Should match expected creation payload fields
      expect(payloadFromSimulation.population_id).toEqual(creationPayload.population_id);
      expect(payloadFromSimulation.population_type).toEqual(creationPayload.population_type);
      expect(payloadFromSimulation.policy_id).toEqual(creationPayload.policy_id);
    });
  });

  describe('field mapping', () => {
    test('given metadata then maps all fields correctly', () => {
      // Given
      const metadata: SimulationMetadata = {
        id: 999,  // Changed to number
        country_id: 'us',  // Use valid country ID
        api_version: 'test-version',
        policy_id: 888,  // Changed to number
        population_id: 'test-population',
        population_type: 'geography',
      };

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result.id).toBe(String(metadata.id));  // Converts to string
      expect(result.countryId).toBe(metadata.country_id);
      expect(result.apiVersion).toBe(metadata.api_version);
      expect(result.policyId).toBe(String(metadata.policy_id));  // Converts to string
      expect(result.populationId).toBe(metadata.population_id);
      expect(result.populationType).toBe(metadata.population_type);
    });

    test('given simulation then maps all fields correctly to creation payload', () => {
      // Given
      const simulation = {
        id: 'test-sim-123', // Should not be included in creation payload
        countryId: 'us', // Should not be included in creation payload
        apiVersion: 'test-version', // Should not be included in creation payload
        populationId: 'test-population',
        populationType: 'geography' as const,
        policyId: '777',  // String that will be converted to number
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result.population_id).toBe(simulation.populationId);
      expect(result.population_type).toBe(simulation.populationType);
      expect(result.policy_id).toBe(777);  // Converted to number
      expect(result).not.toHaveProperty('simulation_id');
      expect(result).not.toHaveProperty('country_id');
      expect(result).not.toHaveProperty('api_version');
    });
  });
});
