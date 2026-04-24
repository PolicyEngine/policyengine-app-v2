import { describe, expect, test } from 'vitest';
import {
  fromV1SimulationMetadata,
  fromV2EconomySimulationResponse,
  fromV2HouseholdSimulationResponse,
  parseSimulationOutput,
  toSimulationStatus,
} from '@/models/simulationDomain';
import {
  mockSimulationMetadata,
  mockSimulationMetadataGeography,
  mockSimulationMetadataStringifiedOutput,
} from '@/tests/fixtures/adapters/SimulationAdapterMocks';
import {
  createMockEconomySimulationResponse,
  createMockHouseholdSimulationResponse,
} from '@/tests/fixtures/api/v2/shared';

describe('simulationDomain', () => {
  describe('toSimulationStatus', () => {
    test('given v1 and v2 backend statuses then it maps them to the app status', () => {
      expect(toSimulationStatus('ok')).toBe('complete');
      expect(toSimulationStatus('completed')).toBe('complete');
      expect(toSimulationStatus('computing')).toBe('pending');
      expect(toSimulationStatus('running')).toBe('pending');
      expect(toSimulationStatus('failed')).toBe('error');
    });
  });

  describe('parseSimulationOutput', () => {
    test('given stringified JSON then it parses the value', () => {
      expect(parseSimulationOutput('{"net_income":45000}')).toEqual({ net_income: 45000 });
    });

    test('given an invalid JSON string then it preserves the raw value', () => {
      expect(parseSimulationOutput('invalid-json')).toBe('invalid-json');
    });
  });

  describe('fromV1SimulationMetadata', () => {
    test('given household metadata then it adds shared v1 simulation provenance', () => {
      const simulation = fromV1SimulationMetadata(mockSimulationMetadata());

      expect(simulation).toMatchObject({
        simulationType: 'household',
        populationType: 'household',
        source: 'v1_api',
        backendStatus: 'complete',
        regionCode: null,
        datasetId: null,
      });
    });

    test('given geography metadata then it infers an economy simulation and carries regionCode', () => {
      const simulation = fromV1SimulationMetadata(mockSimulationMetadataGeography());

      expect(simulation).toMatchObject({
        simulationType: 'economy',
        populationType: 'geography',
        populationId: 'us',
        regionCode: 'us',
        source: 'v1_api',
      });
    });

    test('given stringified output then it parses through the shared domain helper', () => {
      const simulation = fromV1SimulationMetadata(mockSimulationMetadataStringifiedOutput());

      expect(simulation.output).toEqual({ household_net_income: { 2024: 60000 } });
    });
  });

  describe('fromV2HouseholdSimulationResponse', () => {
    test('given a household response then it keeps the household simulation provenance', () => {
      const simulation = fromV2HouseholdSimulationResponse(createMockHouseholdSimulationResponse());

      expect(simulation).toMatchObject({
        simulationType: 'household',
        populationType: 'household',
        source: 'v2_household_api',
        backendStatus: 'completed',
        populationId: '770e8400-e29b-41d4-a716-446655440002',
      });
    });
  });

  describe('fromV2EconomySimulationResponse', () => {
    test('given an economy response then it keeps region and dataset provenance', () => {
      const simulation = fromV2EconomySimulationResponse(createMockEconomySimulationResponse());

      expect(simulation).toMatchObject({
        simulationType: 'economy',
        populationType: 'geography',
        source: 'v2_economy_api',
        backendStatus: 'completed',
        populationId: 'state/ca',
        regionCode: 'state/ca',
        datasetId: 'bb0e8400-e29b-41d4-a716-446655440006',
        outputDatasetId: null,
      });
    });

    test('given a response without region then it falls back to dataset identity', () => {
      const simulation = fromV2EconomySimulationResponse({
        ...createMockEconomySimulationResponse(),
        region: null,
      });

      expect(simulation.populationId).toBe('bb0e8400-e29b-41d4-a716-446655440006');
      expect(simulation.regionCode).toBeNull();
      expect(simulation.datasetId).toBe('bb0e8400-e29b-41d4-a716-446655440006');
    });
  });
});
