import { describe, expect, test } from 'vitest';
import {
  CalculationType,
  determineCalculationType,
  extractPopulationId,
  extractRegion,
} from '@/libs/calculations/types';
import {
  ERROR_MESSAGES,
  GEOGRAPHY_SIMULATION,
  GEOGRAPHY_WITH_ONLY_ID,
  GEOGRAPHY_WITHOUT_IDS,
  HOUSEHOLD_SIMULATION,
  HOUSEHOLD_WITHOUT_ID,
  NATIONAL_GEOGRAPHY,
  SUBNATIONAL_GEOGRAPHY,
  UNKNOWN_SIMULATION,
  VALID_HOUSEHOLD,
} from '@/tests/fixtures/libs/calculations/calculationMocks';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Simulation } from '@/types/ingredients/Simulation';

describe('determineCalculationType', () => {
  test('given household simulation then returns household type', () => {
    // Given
    const simulation = HOUSEHOLD_SIMULATION as Simulation;

    // When
    const result = determineCalculationType(simulation);

    // Then
    expect(result).toBe('household');
  });

  test('given geography simulation then returns economy type', () => {
    // Given
    const simulation = GEOGRAPHY_SIMULATION as Simulation;

    // When
    const result = determineCalculationType(simulation);

    // Then
    expect(result).toBe('economy');
  });

  test('given null simulation then throws error', () => {
    // Given
    const simulation = null;

    // When/Then
    expect(() => determineCalculationType(simulation)).toThrow(
      ERROR_MESSAGES.UNKNOWN_POPULATION_TYPE(undefined)
    );
  });

  test('given unknown population type then throws error', () => {
    // Given
    const simulation = UNKNOWN_SIMULATION as Simulation;

    // When/Then
    expect(() => determineCalculationType(simulation)).toThrow(
      ERROR_MESSAGES.UNKNOWN_POPULATION_TYPE('unknown')
    );
  });
});

describe('extractPopulationId', () => {
  describe('household type', () => {
    test('given household with id then returns household id', () => {
      // Given
      const type: CalculationType = 'household';
      const household = VALID_HOUSEHOLD as Household;

      // When
      const result = extractPopulationId(type, household, null);

      // Then
      expect(result).toBe('household-123');
    });

    test('given household without id then throws error', () => {
      // Given
      const type: CalculationType = 'household';
      const household = HOUSEHOLD_WITHOUT_ID as Household;

      // When/Then
      expect(() => extractPopulationId(type, household, null)).toThrow(
        ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED
      );
    });

    test('given null household then throws error', () => {
      // Given
      const type: CalculationType = 'household';

      // When/Then
      expect(() => extractPopulationId(type, null, null)).toThrow(
        ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED
      );
    });

    test('given undefined household then throws error', () => {
      // Given
      const type: CalculationType = 'household';

      // When/Then
      expect(() => extractPopulationId(type, undefined, null)).toThrow(
        ERROR_MESSAGES.HOUSEHOLD_ID_REQUIRED
      );
    });
  });

  describe('economy type', () => {
    test('given geography with geographyId then returns geographyId', () => {
      // Given
      const type: CalculationType = 'economy';
      const geography = SUBNATIONAL_GEOGRAPHY as Geography;

      // When
      const result = extractPopulationId(type, null, geography);

      // Then
      expect(result).toBe('ca');
    });

    test('given geography with only id then returns id', () => {
      // Given
      const type: CalculationType = 'economy';
      const geography = GEOGRAPHY_WITH_ONLY_ID as Geography;

      // When
      const result = extractPopulationId(type, null, geography);

      // Then
      expect(result).toBe('geo-789');
    });

    test('given geography without any ids then returns empty string', () => {
      // Given
      const type: CalculationType = 'economy';
      const geography = GEOGRAPHY_WITHOUT_IDS as Geography;

      // When
      const result = extractPopulationId(type, null, geography);

      // Then
      expect(result).toBe('');
    });

    test('given null geography then throws error', () => {
      // Given
      const type: CalculationType = 'economy';

      // When/Then
      expect(() => extractPopulationId(type, null, null)).toThrow(
        ERROR_MESSAGES.GEOGRAPHY_REQUIRED
      );
    });

    test('given undefined geography then throws error', () => {
      // Given
      const type: CalculationType = 'economy';

      // When/Then
      expect(() => extractPopulationId(type, null, undefined)).toThrow(
        ERROR_MESSAGES.GEOGRAPHY_REQUIRED
      );
    });
  });
});

describe('extractRegion', () => {
  test('given subnational geography with geographyId then returns geographyId', () => {
    // Given
    const geography = SUBNATIONAL_GEOGRAPHY as Geography;

    // When
    const result = extractRegion(geography);

    // Then
    expect(result).toBe('ca');
  });

  test('given national geography then returns undefined', () => {
    // Given
    const geography = NATIONAL_GEOGRAPHY as Geography;

    // When
    const result = extractRegion(geography);

    // Then
    expect(result).toBeUndefined();
  });

  test('given subnational geography without geographyId then returns undefined', () => {
    // Given
    const geography = {
      ...GEOGRAPHY_WITHOUT_IDS,
      scope: 'subnational',
    } as Geography;

    // When
    const result = extractRegion(geography);

    // Then
    expect(result).toBeUndefined();
  });

  test('given null geography then returns undefined', () => {
    // Given
    const geography = null;

    // When
    const result = extractRegion(geography);

    // Then
    expect(result).toBeUndefined();
  });

  test('given undefined geography then returns undefined', () => {
    // Given
    const geography = undefined;

    // When
    const result = extractRegion(geography);

    // Then
    expect(result).toBeUndefined();
  });

  test('given geography with undefined scope then returns undefined', () => {
    // Given
    const geography = {
      geographyId: 'ca',
    } as Geography;

    // When
    const result = extractRegion(geography);

    // Then
    expect(result).toBeUndefined();
  });
});
