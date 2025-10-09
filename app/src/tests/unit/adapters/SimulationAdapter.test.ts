import { describe, expect, test, vi } from 'vitest';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import {
  mockHouseholdData,
  mockSimulationMetadata,
  mockSimulationMetadataWithOutput,
} from '@/tests/fixtures/api/simulationMocks';
import { Simulation } from '@/types/ingredients/Simulation';
import { SimulationMetadata } from '@/types/metadata/simulationMetadata';

describe('SimulationAdapter', () => {
  describe('fromMetadata', () => {
    test('given metadata without output then converts to Simulation correctly', () => {
      // Given
      const metadata = mockSimulationMetadata;

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        id: String(metadata.id),
        countryId: metadata.country_id,
        apiVersion: metadata.api_version,
        policyId: metadata.policy_id,
        populationId: metadata.population_id,
        populationType: metadata.population_type,
        label: null,
        isCreated: true,
        output: null,
      });
    });

    test('given metadata with household output then parses output correctly', () => {
      // Given
      const metadata = mockSimulationMetadataWithOutput;

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result.output).not.toBeNull();
      expect(result.output).toEqual({
        countryId: metadata.country_id,
        householdData: mockHouseholdData,
      });
    });

    test('given metadata with output then preserves other fields', () => {
      // Given
      const metadata = mockSimulationMetadataWithOutput;

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result.id).toBe(String(metadata.id));
      expect(result.countryId).toBe(metadata.country_id);
      expect(result.policyId).toBe(metadata.policy_id);
      expect(result.populationId).toBe(metadata.population_id);
      expect(result.populationType).toBe(metadata.population_type);
    });

    test('given metadata with invalid JSON output then logs error and sets output to null', () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const metadataWithInvalidJson: SimulationMetadata = {
        ...mockSimulationMetadata,
        output_json: 'invalid json {{{',
      };

      // When
      const result = SimulationAdapter.fromMetadata(metadataWithInvalidJson);

      // Then
      expect(result.output).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SimulationAdapter] Failed to parse output_json:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    test('given metadata with empty string output then sets output to null', () => {
      // Given
      const metadataWithEmptyOutput: SimulationMetadata = {
        ...mockSimulationMetadata,
        output_json: '',
      };

      // When
      const result = SimulationAdapter.fromMetadata(metadataWithEmptyOutput);

      // Then
      expect(result.output).toBeNull();
    });

    test('given metadata with null output_json then sets output to null', () => {
      // Given
      const metadataWithNullOutput: SimulationMetadata = {
        ...mockSimulationMetadata,
        output_json: null,
      };

      // When
      const result = SimulationAdapter.fromMetadata(metadataWithNullOutput);

      // Then
      expect(result.output).toBeNull();
    });

    test('given metadata with undefined output_json then sets output to null', () => {
      // Given
      const metadataWithUndefinedOutput: SimulationMetadata = {
        ...mockSimulationMetadata,
        output_json: undefined,
      };

      // When
      const result = SimulationAdapter.fromMetadata(metadataWithUndefinedOutput);

      // Then
      expect(result.output).toBeNull();
    });

    test('given metadata without population_id then throws error', () => {
      // Given
      const invalidMetadata = {
        ...mockSimulationMetadata,
        population_id: '',
      } as SimulationMetadata;

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(invalidMetadata)).toThrow(
        'Simulation metadata missing population_id'
      );
    });

    test('given metadata without population_type then throws error', () => {
      // Given
      const invalidMetadata = {
        ...mockSimulationMetadata,
        population_type: undefined,
      } as any;

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(invalidMetadata)).toThrow(
        'Simulation metadata missing population_type'
      );
    });

    test('given geography simulation metadata then converts correctly', () => {
      // Given
      const geographyMetadata: SimulationMetadata = {
        ...mockSimulationMetadata,
        population_type: 'geography',
        population_id: 'california',
      };

      // When
      const result = SimulationAdapter.fromMetadata(geographyMetadata);

      // Then
      expect(result.populationType).toBe('geography');
      expect(result.populationId).toBe('california');
      expect(result.output).toBeNull(); // Geography simulations don't have outputs
    });
  });

  describe('toCreationPayload', () => {
    test('given valid simulation then converts to creation payload', () => {
      // Given
      const simulation: Partial<Simulation> = {
        populationId: '123',
        populationType: 'household',
        policyId: '456',
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual({
        population_id: '123',
        population_type: 'household',
        policy_id: 456,
      });
    });

    test('given simulation without populationId then throws error', () => {
      // Given
      const simulation: Partial<Simulation> = {
        populationType: 'household',
        policyId: '456',
      };

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        'Simulation must have a populationId'
      );
    });

    test('given simulation without policyId then throws error', () => {
      // Given
      const simulation: Partial<Simulation> = {
        populationId: '123',
        populationType: 'household',
      };

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        'Simulation must have a policyId'
      );
    });

    test('given simulation without populationType then throws error', () => {
      // Given
      const simulation: Partial<Simulation> = {
        populationId: '123',
        policyId: '456',
      };

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        'Simulation must have a populationType'
      );
    });

    test('given geography simulation then converts correctly', () => {
      // Given
      const simulation: Partial<Simulation> = {
        populationId: 'california',
        populationType: 'geography',
        policyId: '789',
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result).toEqual({
        population_id: 'california',
        population_type: 'geography',
        policy_id: 789,
      });
    });

    test('given policyId as string then converts to integer', () => {
      // Given
      const simulation: Partial<Simulation> = {
        populationId: '123',
        populationType: 'household',
        policyId: '999',
      };

      // When
      const result = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(result.policy_id).toBe(999);
      expect(typeof result.policy_id).toBe('number');
    });
  });
});
