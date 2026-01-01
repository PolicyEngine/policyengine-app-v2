import { describe, expect, test } from 'vitest';
import { expandUserAssociations } from '@/hooks/utils/useFetchReportIngredients';
import {
  createExpectedExpandedSocietyWide,
  createExpectedExpandedWithoutId,
  HOUSEHOLD_INPUT,
  INPUT_WITHOUT_ID,
  MINIMAL_INPUT,
  SOCIETY_WIDE_INPUT,
  TEST_IDS,
  TEST_USER_IDS,
} from '@/tests/fixtures/hooks/useFetchReportIngredientsMocks';

describe('useFetchReportIngredients', () => {
  describe('expandUserAssociations', () => {
    test('given society-wide input then adds userId to all associations', () => {
      // When
      const result = expandUserAssociations(SOCIETY_WIDE_INPUT);

      // Then
      const expected = createExpectedExpandedSocietyWide(TEST_USER_IDS.SHARED);
      expect(result).toEqual(expected);
    });

    test('given custom userId then uses that userId', () => {
      // When
      const result = expandUserAssociations(SOCIETY_WIDE_INPUT, TEST_USER_IDS.CUSTOM);

      // Then
      expect(result.userReport.userId).toBe(TEST_USER_IDS.CUSTOM);
      expect(result.userSimulations[0].userId).toBe(TEST_USER_IDS.CUSTOM);
      expect(result.userPolicies[0].userId).toBe(TEST_USER_IDS.CUSTOM);
      expect(result.userGeographies[0].userId).toBe(TEST_USER_IDS.CUSTOM);
    });

    test('given input without userReport.id then falls back to reportId', () => {
      // When
      const result = expandUserAssociations(INPUT_WITHOUT_ID);

      // Then
      const expected = createExpectedExpandedWithoutId();
      expect(result.userReport.id).toBe(TEST_IDS.REPORT.BASE_ID);
      expect(result).toEqual(expected);
    });

    test('given household input then adds userId to household associations', () => {
      // When
      const result = expandUserAssociations(HOUSEHOLD_INPUT);

      // Then
      expect(result.userHouseholds).toHaveLength(1);
      expect(result.userHouseholds[0].userId).toBe(TEST_USER_IDS.SHARED);
      expect(result.userHouseholds[0].householdId).toBe(TEST_IDS.HOUSEHOLDS.SINGLE);
    });

    test('given minimal input with empty arrays then returns empty arrays with userId', () => {
      // When
      const result = expandUserAssociations(MINIMAL_INPUT);

      // Then
      expect(result.userReport.userId).toBe(TEST_USER_IDS.SHARED);
      expect(result.userSimulations).toEqual([]);
      expect(result.userPolicies).toEqual([]);
      expect(result.userHouseholds).toEqual([]);
      expect(result.userGeographies).toEqual([]);
    });

    test('given input then preserves all original fields', () => {
      // When
      const result = expandUserAssociations(SOCIETY_WIDE_INPUT);

      // Then - verify original fields are preserved
      expect(result.userReport.reportId).toBe(SOCIETY_WIDE_INPUT.userReport.reportId);
      expect(result.userReport.countryId).toBe(SOCIETY_WIDE_INPUT.userReport.countryId);
      expect(result.userReport.label).toBe(SOCIETY_WIDE_INPUT.userReport.label);
      expect(result.userSimulations[0].simulationId).toBe(
        SOCIETY_WIDE_INPUT.userSimulations[0].simulationId
      );
      expect(result.userSimulations[0].label).toBe(SOCIETY_WIDE_INPUT.userSimulations[0].label);
    });

    test('given multiple simulations then adds userId to each', () => {
      // When
      const result = expandUserAssociations(SOCIETY_WIDE_INPUT);

      // Then
      expect(result.userSimulations).toHaveLength(2);
      expect(result.userSimulations[0].userId).toBe(TEST_USER_IDS.SHARED);
      expect(result.userSimulations[1].userId).toBe(TEST_USER_IDS.SHARED);
    });

    test('given multiple policies then adds userId to each', () => {
      // When
      const result = expandUserAssociations(SOCIETY_WIDE_INPUT);

      // Then
      expect(result.userPolicies).toHaveLength(2);
      expect(result.userPolicies[0].userId).toBe(TEST_USER_IDS.SHARED);
      expect(result.userPolicies[1].userId).toBe(TEST_USER_IDS.SHARED);
    });

    test('given geography with all fields then preserves scope and type', () => {
      // When
      const result = expandUserAssociations(SOCIETY_WIDE_INPUT);

      // Then
      const geography = result.userGeographies[0];
      expect(geography.type).toBe('geography');
      expect(geography.scope).toBe('national');
      expect(geography.geographyId).toBe(TEST_IDS.GEOGRAPHIES.NATIONAL);
    });
  });
});
