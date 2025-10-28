import { describe, expect, it } from 'vitest';
import {
  mockPopulationEmpty,
  mockPopulationWithGeography,
  mockPopulationWithHousehold,
  mockPopulationWithLabel,
  mockSimulationWithId,
  mockSimulationWithLabel,
  TEST_POPULATION_IDS,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/utils/populationCompatibilityMocks';
import {
  arePopulationsCompatible,
  getPopulationLabel,
  getSimulationLabel,
} from '@/utils/populationCompatibility';

describe('populationCompatibility', () => {
  describe('arePopulationsCompatible', () => {
    it('given both population IDs are undefined then returns true', () => {
      // When
      const result = arePopulationsCompatible(undefined, undefined);

      // Then
      expect(result).toBe(true);
    });

    it('given first population ID is undefined then returns true', () => {
      // When
      const result = arePopulationsCompatible(undefined, TEST_POPULATION_IDS.HOUSEHOLD_1);

      // Then
      expect(result).toBe(true);
    });

    it('given second population ID is undefined then returns true', () => {
      // When
      const result = arePopulationsCompatible(TEST_POPULATION_IDS.HOUSEHOLD_1, undefined);

      // Then
      expect(result).toBe(true);
    });

    it('given both population IDs match then returns true', () => {
      // When
      const result = arePopulationsCompatible(
        TEST_POPULATION_IDS.HOUSEHOLD_1,
        TEST_POPULATION_IDS.HOUSEHOLD_1
      );

      // Then
      expect(result).toBe(true);
    });

    it('given population IDs do not match then returns false', () => {
      // When
      const result = arePopulationsCompatible(
        TEST_POPULATION_IDS.HOUSEHOLD_1,
        TEST_POPULATION_IDS.HOUSEHOLD_2
      );

      // Then
      expect(result).toBe(false);
    });

    it('given household ID and geography ID then returns false', () => {
      // When
      const result = arePopulationsCompatible(
        TEST_POPULATION_IDS.HOUSEHOLD_1,
        TEST_POPULATION_IDS.GEOGRAPHY_US
      );

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getPopulationLabel', () => {
    it('given null population then returns Unknown Population', () => {
      // When
      const result = getPopulationLabel(null);

      // Then
      expect(result).toBe('Unknown Population');
    });

    it('given population with label then returns label', () => {
      // Given
      const population = mockPopulationWithLabel('My Test Household');

      // When
      const result = getPopulationLabel(population);

      // Then
      expect(result).toBe('My Test Household');
    });

    it('given population with household ID but no label then returns household ID format', () => {
      // Given
      const population = mockPopulationWithHousehold(TEST_POPULATION_IDS.HOUSEHOLD_1);

      // When
      const result = getPopulationLabel(population);

      // Then
      expect(result).toBe(`Household #${TEST_POPULATION_IDS.HOUSEHOLD_1}`);
    });

    it('given population with geography name but no label then returns geography name', () => {
      // Given
      const population = mockPopulationWithGeography('California', 'us-ca');

      // When
      const result = getPopulationLabel(population);

      // Then
      expect(result).toBe('California');
    });

    it('given population with geography ID but no name then returns geography ID', () => {
      // Given
      const population = mockPopulationWithGeography(undefined, 'us-ca');

      // When
      const result = getPopulationLabel(population);

      // Then
      expect(result).toBe('us-ca');
    });

    it('given population with label prioritizes label over household ID', () => {
      // Given
      const population = mockPopulationWithLabel('Custom Label');
      population.household = {
        id: TEST_POPULATION_IDS.HOUSEHOLD_1,
        countryId: 'us',
        householdData: { people: {} },
      };

      // When
      const result = getPopulationLabel(population);

      // Then
      expect(result).toBe('Custom Label');
    });

    it('given empty population then returns Unknown Population', () => {
      // Given
      const population = mockPopulationEmpty();

      // When
      const result = getPopulationLabel(population);

      // Then
      expect(result).toBe('Unknown Population');
    });
  });

  describe('getSimulationLabel', () => {
    it('given null simulation then returns Unknown Simulation', () => {
      // When
      const result = getSimulationLabel(null);

      // Then
      expect(result).toBe('Unknown Simulation');
    });

    it('given simulation with label then returns label', () => {
      // Given
      const simulation = mockSimulationWithLabel('My Policy Analysis');

      // When
      const result = getSimulationLabel(simulation);

      // Then
      expect(result).toBe('My Policy Analysis');
    });

    it('given simulation with ID but no label then returns simulation ID format', () => {
      // Given
      const simulation = mockSimulationWithId(TEST_SIMULATION_IDS.SIMULATION_1);

      // When
      const result = getSimulationLabel(simulation);

      // Then
      expect(result).toBe(`Simulation #${TEST_SIMULATION_IDS.SIMULATION_1}`);
    });

    it('given simulation with label prioritizes label over ID', () => {
      // Given
      const simulation = mockSimulationWithLabel('Custom Simulation');
      simulation.id = TEST_SIMULATION_IDS.SIMULATION_1;

      // When
      const result = getSimulationLabel(simulation);

      // Then
      expect(result).toBe('Custom Simulation');
    });

    it('given simulation with no label or ID then returns Unknown Simulation', () => {
      // Given
      const simulation = mockSimulationWithId(undefined);

      // When
      const result = getSimulationLabel(simulation);

      // Then
      expect(result).toBe('Unknown Simulation');
    });
  });
});
