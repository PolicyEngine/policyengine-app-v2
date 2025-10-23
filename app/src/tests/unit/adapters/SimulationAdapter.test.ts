import { describe, it, expect } from 'vitest';
import { SimulationAdapter } from '@/adapters/SimulationAdapter';
import {
  mockSimulationMetadata,
  mockSimulationMetadataGeography,
  mockSimulationMetadataStringifiedOutput,
  mockSimulation,
  mockSimulationOutput,
  mockErrorMessage,
  TEST_SIMULATION_IDS,
  TEST_POLICY_IDS,
  TEST_POPULATION_IDS,
  TEST_COUNTRIES,
} from '@/tests/fixtures/adapters/SimulationAdapterMocks';

describe('SimulationAdapter', () => {
  describe('fromMetadata', () => {
    it('given household simulation metadata then converts to Simulation', () => {
      // Given
      const metadata = mockSimulationMetadata();

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        id: String(TEST_SIMULATION_IDS.SIM_123),
        countryId: TEST_COUNTRIES.US,
        apiVersion: '1.0.0',
        policyId: TEST_POLICY_IDS.POLICY_1,
        populationId: TEST_POPULATION_IDS.HOUSEHOLD_1,
        populationType: 'household',
        label: null,
        isCreated: true,
        output: { household_net_income: { 2024: 50000 } },
        status: 'complete',
      });
    });

    it('given geography simulation metadata then converts to Simulation', () => {
      // Given
      const metadata = mockSimulationMetadataGeography();

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result.populationType).toBe('geography');
      expect(result.populationId).toBe(TEST_POPULATION_IDS.GEOGRAPHY_US);
      expect(result.status).toBe('pending');
      expect(result.output).toBeNull();
    });

    it('given stringified output then parses JSON', () => {
      // Given
      const metadata = mockSimulationMetadataStringifiedOutput();

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result.output).toEqual({ household_net_income: { 2024: 60000 } });
      expect(typeof result.output).toBe('object');
    });

    it('given missing population_id then throws error', () => {
      // Given
      const metadata = mockSimulationMetadata({ population_id: undefined as any });

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        'Simulation metadata missing population_id'
      );
    });

    it('given missing population_type then throws error', () => {
      // Given
      const metadata = mockSimulationMetadata({ population_type: undefined as any });

      // When/Then
      expect(() => SimulationAdapter.fromMetadata(metadata)).toThrow(
        'Simulation metadata missing population_type'
      );
    });

    it('given invalid JSON string in output then keeps original value', () => {
      // Given
      const metadata = mockSimulationMetadata({ output: 'invalid-json' as any });

      // When
      const result = SimulationAdapter.fromMetadata(metadata);

      // Then
      expect(result.output).toBe('invalid-json');
    });
  });

  describe('toCreationPayload', () => {
    it('given valid simulation then creates payload', () => {
      // Given
      const simulation = mockSimulation();

      // When
      const payload = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(payload).toEqual({
        population_id: TEST_POPULATION_IDS.HOUSEHOLD_1,
        population_type: 'household',
        policy_id: 1,
      });
    });

    it('given geography simulation then creates payload', () => {
      // Given
      const simulation = mockSimulation({
        populationType: 'geography',
        populationId: TEST_POPULATION_IDS.GEOGRAPHY_US,
      });

      // When
      const payload = SimulationAdapter.toCreationPayload(simulation);

      // Then
      expect(payload).toEqual({
        population_id: TEST_POPULATION_IDS.GEOGRAPHY_US,
        population_type: 'geography',
        policy_id: 1,
      });
    });

    it('given missing populationId then throws error', () => {
      // Given
      const simulation = mockSimulation({ populationId: undefined as any });

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        'Simulation must have a populationId'
      );
    });

    it('given missing policyId then throws error', () => {
      // Given
      const simulation = mockSimulation({ policyId: undefined as any });

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        'Simulation must have a policyId'
      );
    });

    it('given missing populationType then throws error', () => {
      // Given
      const simulation = mockSimulation({ populationType: undefined as any });

      // When/Then
      expect(() => SimulationAdapter.toCreationPayload(simulation)).toThrow(
        'Simulation must have a populationType'
      );
    });
  });

  describe('toUpdatePayload', () => {
    it('given simulation with output then creates update payload', () => {
      // Given
      const output = mockSimulationOutput();

      // When
      const payload = SimulationAdapter.toUpdatePayload(output, 'complete');

      // Then
      expect(payload).toEqual({
        output,
        status: 'complete',
      });
    });

    it('given null output then includes null in payload', () => {
      // When
      const payload = SimulationAdapter.toUpdatePayload(null, 'pending');

      // Then
      expect(payload).toEqual({
        output: null,
        status: 'pending',
      });
    });

    it('given error status then creates payload', () => {
      // When
      const payload = SimulationAdapter.toUpdatePayload(null, 'error');

      // Then
      expect(payload).toEqual({
        output: null,
        status: 'error',
      });
    });
  });

  describe('toCompletedPayload', () => {
    it('given output then creates completed payload', () => {
      // Given
      const output = mockSimulationOutput();

      // When
      const payload = SimulationAdapter.toCompletedPayload(output);

      // Then
      expect(payload).toEqual({
        output,
        status: 'complete',
      });
    });
  });

  describe('toErrorPayload', () => {
    it('given error message then creates error payload', () => {
      // Given
      const errorMessage = mockErrorMessage();

      // When
      const payload = SimulationAdapter.toErrorPayload(errorMessage);

      // Then
      expect(payload).toEqual({
        output: null,
        status: 'error',
        error_message: errorMessage,
      });
    });

    it('given no error message then omits error_message field', () => {
      // When
      const payload = SimulationAdapter.toErrorPayload();

      // Then
      expect(payload).toEqual({
        output: null,
        status: 'error',
      });
    });
  });

  describe('toEconomyPlaceholderPayload', () => {
    it('given no params then creates economy placeholder payload', () => {
      // When
      const payload = SimulationAdapter.toEconomyPlaceholderPayload();

      // Then
      expect(payload).toEqual({
        output: {
          message: "Economy-wide reports do not save simulation-level results at this time"
        },
        status: 'complete',
      });
    });
  });
});
