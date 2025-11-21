import { describe, expect, test } from 'vitest';
import {
  EXPECTED_LABELS,
  mockCustomPolicySimulation,
  mockDefaultBaselineSimulation,
  mockHouseholdSimulation,
  mockIncompleteSimulation,
  mockSubnationalSimulation,
  mockUKDefaultBaselineSimulation,
  mockWrongLabelSimulation,
  TEST_COUNTRIES,
  TEST_CURRENT_LAW_ID,
} from '@/tests/fixtures/utils/isDefaultBaselineSimulationMocks';
import {
  countryNames,
  getDefaultBaselineLabel,
  isDefaultBaselineSimulation,
} from '@/utils/isDefaultBaselineSimulation';

describe('isDefaultBaselineSimulation', () => {
  describe('Matching default baseline', () => {
    test('given simulation matches all criteria then returns true', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockDefaultBaselineSimulation,
        TEST_COUNTRIES.US,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(true);
    });

    test('given UK default baseline then returns true for UK', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockUKDefaultBaselineSimulation,
        TEST_COUNTRIES.UK,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(true);
    });
  });

  describe('Non-matching policy', () => {
    test('given custom policy then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockCustomPolicySimulation,
        TEST_COUNTRIES.US,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(false);
    });

    test('given different current law ID then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockDefaultBaselineSimulation,
        TEST_COUNTRIES.US,
        999 // Different current law ID
      );

      // Then
      expect(result).toBe(false);
    });
  });

  describe('Non-matching geography', () => {
    test('given subnational geography then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockSubnationalSimulation,
        TEST_COUNTRIES.US,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(false);
    });

    test('given wrong country then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockDefaultBaselineSimulation,
        TEST_COUNTRIES.UK, // Wrong country
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(false);
    });
  });

  describe('Non-matching population type', () => {
    test('given household population then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockHouseholdSimulation,
        TEST_COUNTRIES.US,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(false);
    });
  });

  describe('Non-matching label', () => {
    test('given wrong label then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockWrongLabelSimulation,
        TEST_COUNTRIES.US,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(false);
    });
  });

  describe('Incomplete data', () => {
    test('given missing simulation data then returns false', () => {
      // When
      const result = isDefaultBaselineSimulation(
        mockIncompleteSimulation,
        TEST_COUNTRIES.US,
        TEST_CURRENT_LAW_ID
      );

      // Then
      expect(result).toBe(false);
    });
  });
});

describe('getDefaultBaselineLabel', () => {
  describe('Known countries', () => {
    test('given US country code then returns US label', () => {
      // When
      const result = getDefaultBaselineLabel(TEST_COUNTRIES.US);

      // Then
      expect(result).toBe(EXPECTED_LABELS.US);
    });

    test('given UK country code then returns UK label', () => {
      // When
      const result = getDefaultBaselineLabel(TEST_COUNTRIES.UK);

      // Then
      expect(result).toBe(EXPECTED_LABELS.UK);
    });

    test('given CA country code then returns Canada label', () => {
      // When
      const result = getDefaultBaselineLabel(TEST_COUNTRIES.CA);

      // Then
      expect(result).toBe(EXPECTED_LABELS.CA);
    });

    test('given NG country code then returns Nigeria label', () => {
      // When
      const result = getDefaultBaselineLabel(TEST_COUNTRIES.NG);

      // Then
      expect(result).toBe(EXPECTED_LABELS.NG);
    });

    test('given IL country code then returns Israel label', () => {
      // When
      const result = getDefaultBaselineLabel(TEST_COUNTRIES.IL);

      // Then
      expect(result).toBe(EXPECTED_LABELS.IL);
    });
  });

  describe('Unknown countries', () => {
    test('given unknown country code then returns uppercase code in label', () => {
      // When
      const result = getDefaultBaselineLabel(TEST_COUNTRIES.UNKNOWN);

      // Then
      expect(result).toBe(EXPECTED_LABELS.UNKNOWN);
    });
  });
});

describe('countryNames', () => {
  test('given object then contains expected country mappings', () => {
    // Then
    expect(countryNames).toEqual({
      us: 'United States',
      uk: 'United Kingdom',
      ca: 'Canada',
      ng: 'Nigeria',
      il: 'Israel',
    });
  });

  test('given known country code then returns full name', () => {
    // Then
    expect(countryNames[TEST_COUNTRIES.US]).toBe('United States');
    expect(countryNames[TEST_COUNTRIES.UK]).toBe('United Kingdom');
    expect(countryNames[TEST_COUNTRIES.CA]).toBe('Canada');
    expect(countryNames[TEST_COUNTRIES.NG]).toBe('Nigeria');
    expect(countryNames[TEST_COUNTRIES.IL]).toBe('Israel');
  });

  test('given unknown country code then returns undefined', () => {
    // Then
    expect(countryNames[TEST_COUNTRIES.UNKNOWN]).toBeUndefined();
  });
});
