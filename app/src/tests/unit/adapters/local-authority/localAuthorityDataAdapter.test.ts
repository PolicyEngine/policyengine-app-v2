import { describe, expect, test } from 'vitest';
import {
  transformLocalAuthorityAverageChange,
  transformLocalAuthorityData,
  transformLocalAuthorityRelativeChange,
} from '@/adapters/local-authority/localAuthorityDataAdapter';
import {
  EMPTY_LOCAL_AUTHORITY_DATA,
  EXPECTED_AVERAGE_CHANGE_DATA,
  EXPECTED_RELATIVE_CHANGE_DATA,
  LARGE_LOCAL_AUTHORITY_DATA,
  MOCK_LOCAL_AUTHORITY_DATA,
  SINGLE_LOCAL_AUTHORITY_DATA,
} from '@/tests/fixtures/adapters/local-authority/localAuthorityMocks';

describe('localAuthorityDataAdapter', () => {
  describe('transformLocalAuthorityData', () => {
    test('given average change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;
      const valueField = 'average_household_income_change';

      // When
      const result = transformLocalAuthorityData(apiData, valueField);

      // Then
      expect(result).toEqual(EXPECTED_AVERAGE_CHANGE_DATA);
    });

    test('given relative change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;
      const valueField = 'relative_household_income_change';

      // When
      const result = transformLocalAuthorityData(apiData, valueField);

      // Then
      expect(result).toEqual(EXPECTED_RELATIVE_CHANGE_DATA);
    });

    test('given data then preserves x and y coordinates', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      expect(result[0].x).toBe(0);
      expect(result[0].y).toBe(0);
      expect(result[1].x).toBe(1);
      expect(result[1].y).toBe(0);
    });

    test('given local authority names then creates unique IDs', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      const ids = result.map((point) => point.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    test('given local authority names then uses as labels', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      expect(result[0].label).toBe('Maidstone');
      expect(result[1].label).toBe('Westminster');
      expect(result[2].label).toBe('Edinburgh');
    });

    test('given empty data object then returns empty array', () => {
      // Given
      const apiData = EMPTY_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      expect(result).toEqual([]);
    });

    test('given single local authority then returns single point', () => {
      // Given
      const apiData = SINGLE_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('Test Authority');
      expect(result[0].value).toBe(500.0);
      expect(result[0].x).toBe(5);
      expect(result[0].y).toBe(10);
    });

    test('given large dataset then transforms all local authorities', () => {
      // Given
      const apiData = LARGE_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      expect(result).toHaveLength(Object.keys(apiData).length);
      expect(result.length).toBe(10); // Our test dataset has 10 local authorities
    });
  });

  describe('transformLocalAuthorityAverageChange', () => {
    test('given local authority data then extracts average change values', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityAverageChange(apiData);

      // Then
      expect(result).toEqual(EXPECTED_AVERAGE_CHANGE_DATA);
    });

    test('given data then uses average_household_income_change field', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityAverageChange(apiData);

      // Then
      expect(result[0].value).toBe(1234.56); // average_household_income_change
      expect(result[1].value).toBe(-567.89);
    });

    test('given positive and negative values then preserves signs', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityAverageChange(apiData);

      // Then
      expect(result[0].value).toBeGreaterThan(0); // Maidstone
      expect(result[1].value).toBeLessThan(0); // Westminster
      expect(result[2].value).toBe(0); // Edinburgh
    });
  });

  describe('transformLocalAuthorityRelativeChange', () => {
    test('given local authority data then extracts relative change values', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityRelativeChange(apiData);

      // Then
      expect(result).toEqual(EXPECTED_RELATIVE_CHANGE_DATA);
    });

    test('given data then uses relative_household_income_change field', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityRelativeChange(apiData);

      // Then
      expect(result[0].value).toBe(0.025); // relative_household_income_change
      expect(result[1].value).toBe(-0.015);
    });

    test('given percentage values then preserves decimal precision', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityRelativeChange(apiData);

      // Then
      expect(result[0].value).toBe(0.025); // Exact match
      expect(result[1].value).toBe(-0.015); // Exact match
      expect(result[3].value).toBe(0.018); // Cardiff
    });

    test('given positive and negative percentages then preserves signs', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityRelativeChange(apiData);

      // Then
      expect(result[0].value).toBeGreaterThan(0); // Maidstone
      expect(result[1].value).toBeLessThan(0); // Westminster
      expect(result[2].value).toBe(0); // Edinburgh
    });
  });
});
