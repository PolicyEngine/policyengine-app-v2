import { describe, expect, it } from 'vitest';
import type { UserGeographicMetadataWithAssociation } from '@/hooks/useUserGeographic';
import type { UserHouseholdMetadataWithAssociation } from '@/hooks/useUserHousehold';
import {
  createMockSimulation,
  mockGeographicData,
  mockGeographicDataWithNumericMismatch,
  mockHouseholdData,
  mockHouseholdDataWithNumericMismatch,
  TEST_GEOGRAPHY_IDS,
  TEST_HOUSEHOLD_IDS,
} from '@/tests/fixtures/utils/populationMatchingMocks';
import { findMatchingPopulation } from '@/utils/populationMatching';

describe('populationMatching', () => {
  describe('findMatchingPopulation', () => {
    it('given null simulation then returns null', () => {
      // Given
      const simulation = null;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given simulation without populationId then returns null', () => {
      // Given
      const simulation = createMockSimulation(); // No populationId

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given household simulation with matching populationId then returns matched household', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'household',
        populationId: TEST_HOUSEHOLD_IDS.HOUSEHOLD_123,
      });

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect('household' in result).toBe(true);
        expect((result as UserHouseholdMetadataWithAssociation).household?.id).toBe(
          TEST_HOUSEHOLD_IDS.HOUSEHOLD_123
        );
      }
    });

    it('given household simulation with non-matching populationId then returns null', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'household',
        populationId: TEST_HOUSEHOLD_IDS.NON_EXISTENT,
      });

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given geography simulation with matching populationId then returns matched geography', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'geography',
        populationId: TEST_GEOGRAPHY_IDS.CALIFORNIA,
      });

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect('geography' in result).toBe(true);
        expect((result as UserGeographicMetadataWithAssociation).geography?.id).toBe(
          TEST_GEOGRAPHY_IDS.CALIFORNIA
        );
      }
    });

    it('given geography simulation with non-matching populationId then returns null', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'geography',
        populationId: TEST_GEOGRAPHY_IDS.NON_EXISTENT,
      });

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given household simulation with undefined household data then returns null', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'household',
        populationId: TEST_HOUSEHOLD_IDS.HOUSEHOLD_123,
      });

      // When
      const result = findMatchingPopulation(simulation, undefined, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given geography simulation with undefined geographic data then returns null', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'geography',
        populationId: TEST_GEOGRAPHY_IDS.CALIFORNIA,
      });

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, undefined);

      // Then
      expect(result).toBeNull();
    });

    it('given simulation with empty household data array then returns null', () => {
      // Given
      const simulation = createMockSimulation({
        populationType: 'household',
        populationId: TEST_HOUSEHOLD_IDS.HOUSEHOLD_123,
      });

      // When
      const result = findMatchingPopulation(simulation, [], mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given household simulation with numeric populationId matching string household id then returns matched household', () => {
      // Given - Simulate the type mismatch that occurred in production
      // API sometimes returns populationId as number, but household.id is always string
      const simulation = createMockSimulation({
        populationType: 'household',
        populationId: TEST_HOUSEHOLD_IDS.NUMERIC_VALUE as any, // Force number type to simulate the bug
      });

      // When
      const result = findMatchingPopulation(
        simulation,
        mockHouseholdDataWithNumericMismatch,
        mockGeographicData
      );

      // Then - Should match despite type mismatch (number vs string)
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect('household' in result).toBe(true);
        expect((result as UserHouseholdMetadataWithAssociation).household?.id).toBe(
          TEST_HOUSEHOLD_IDS.NUMERIC_STRING_MATCH
        );
      }
    });

    it('given geography simulation with numeric populationId matching string geography id then returns matched geography', () => {
      // Given - Simulate the type mismatch for geography
      const simulation = createMockSimulation({
        populationType: 'geography',
        populationId: TEST_GEOGRAPHY_IDS.NUMERIC_VALUE as any, // Force number type
      });

      // When
      const result = findMatchingPopulation(
        simulation,
        mockHouseholdData,
        mockGeographicDataWithNumericMismatch
      );

      // Then - Should match despite type mismatch (number vs string)
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect('geography' in result).toBe(true);
        expect((result as UserGeographicMetadataWithAssociation).geography?.id).toBe(
          TEST_GEOGRAPHY_IDS.NUMERIC_STRING_MATCH
        );
      }
    });
  });
});
