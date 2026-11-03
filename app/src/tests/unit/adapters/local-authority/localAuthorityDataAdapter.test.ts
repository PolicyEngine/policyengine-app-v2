import { describe, expect, test } from 'vitest';
import {
  transformLocalAuthorityAbsoluteChange,
  transformLocalAuthorityData,
  transformLocalAuthorityRelativeChange,
} from '@/adapters/local-authority/localAuthorityDataAdapter';
import {
  EMPTY_LOCAL_AUTHORITY_DATA,
  EXPECTED_ABSOLUTE_CHANGE_DATA,
  EXPECTED_RELATIVE_CHANGE_DATA,
  LARGE_LOCAL_AUTHORITY_DATA,
  MOCK_LOCAL_AUTHORITY_DATA,
  SAVED_LOCAL_AUTHORITY_DATA_WITH_POSITIONS,
  SINGLE_LOCAL_AUTHORITY_DATA,
} from '@/tests/fixtures/adapters/local-authority/localAuthorityMocks';
import { BREAKDOWN_LOCAL_AUTHORITY_NAME } from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

describe('localAuthorityDataAdapter', () => {
  describe('transformLocalAuthorityData', () => {
    test('given average change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;
      const valueField = 'average_household_income_change';

      // When
      const result = transformLocalAuthorityData(apiData, valueField);

      // Then
      expect(result).toEqual(EXPECTED_ABSOLUTE_CHANGE_DATA);
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

    test('given saved areas that still carry x and y then the points leave them out', () => {
      // Given
      const apiData = SAVED_LOCAL_AUTHORITY_DATA_WITH_POSITIONS;

      // When
      const result = transformLocalAuthorityData(apiData, 'average_household_income_change');

      // Then
      expect(result.some((point) => 'x' in point || 'y' in point)).toBe(false);
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

  describe('transformLocalAuthorityAbsoluteChange', () => {
    test('given local authority data then extracts average change values', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityAbsoluteChange(apiData);

      // Then
      expect(result).toEqual(EXPECTED_ABSOLUTE_CHANGE_DATA);
    });

    test('given data then uses average_household_income_change field', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityAbsoluteChange(apiData);

      // Then
      expect(result[0].value).toBe(1234.56); // average_household_income_change
      expect(result[1].value).toBe(-567.89);
    });

    test('given positive and negative values then preserves signs', () => {
      // Given
      const apiData = MOCK_LOCAL_AUTHORITY_DATA;

      // When
      const result = transformLocalAuthorityAbsoluteChange(apiData);

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

  test('given a breakdown area then its absolute points carry the tier and the 90% range', () => {
    // When
    const [point] = transformLocalAuthorityAbsoluteChange(
      NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority
    );

    // Then
    expect(point).toMatchObject({ id: BREAKDOWN_LOCAL_AUTHORITY_NAME, lower: 480, upper: 530 });
  });

  test('given a breakdown area then its relative points carry the relative 90% range', () => {
    // When
    const [point] = transformLocalAuthorityRelativeChange(
      NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority
    );

    // Then
    expect(point).toMatchObject({
      id: BREAKDOWN_LOCAL_AUTHORITY_NAME,
      lower: 0.0125,
      upper: 0.0139,
    });
  });

  test('given a reported area then its points are not marked approximate', () => {
    // When
    const [point] = transformLocalAuthorityAbsoluteChange(
      NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority
    );

    // Then
    expect(point.approximate).toBeUndefined();
  });

  test('given an area with an ONS code then its point carries the code, which joins it to its boundary', () => {
    // When
    const [point] = transformLocalAuthorityAbsoluteChange(
      NORMALIZED_BREAKDOWN.local_authority_impact.by_local_authority
    );

    // Then
    expect(point).toMatchObject({ id: BREAKDOWN_LOCAL_AUTHORITY_NAME, code: 'E06000001' });
  });

  test('given areas without codes then their points have none', () => {
    // When
    const points = transformLocalAuthorityAbsoluteChange(MOCK_LOCAL_AUTHORITY_DATA);

    // Then
    expect(points.every((point) => !('code' in point))).toBe(true);
  });
});
