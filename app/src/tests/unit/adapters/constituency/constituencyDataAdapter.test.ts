import { describe, expect, test } from 'vitest';
import {
  transformConstituencyAbsoluteChange,
  transformConstituencyData,
  transformConstituencyRelativeChange,
} from '@/adapters/constituency/constituencyDataAdapter';
import {
  EMPTY_CONSTITUENCY_DATA,
  EXPECTED_ABSOLUTE_CHANGE_DATA,
  EXPECTED_RELATIVE_CHANGE_DATA,
  LARGE_CONSTITUENCY_DATA,
  MOCK_CONSTITUENCY_DATA,
  SAVED_CONSTITUENCY_DATA_WITH_POSITIONS,
  SINGLE_CONSTITUENCY_DATA,
} from '@/tests/fixtures/adapters/constituency/constituencyMocks';
import { NORMALIZED_BREAKDOWN } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';

describe('constituencyDataAdapter', () => {
  describe('transformConstituencyData', () => {
    test('given average change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;
      const valueField = 'average_household_income_change';

      // When
      const result = transformConstituencyData(apiData, valueField);

      // Then
      expect(result).toEqual(EXPECTED_ABSOLUTE_CHANGE_DATA);
    });

    test('given relative change field then transforms data correctly', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;
      const valueField = 'relative_household_income_change';

      // When
      const result = transformConstituencyData(apiData, valueField);

      // Then
      expect(result).toEqual(EXPECTED_RELATIVE_CHANGE_DATA);
    });

    test('given saved areas that still carry x and y then the points leave them out', () => {
      // Given
      const apiData = SAVED_CONSTITUENCY_DATA_WITH_POSITIONS;

      // When
      const result = transformConstituencyData(apiData, 'average_household_income_change');

      // Then
      expect(result.some((point) => 'x' in point || 'y' in point)).toBe(false);
    });

    test('given constituency names then creates unique IDs', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyData(apiData, 'average_household_income_change');

      // Then
      const ids = result.map((point) => point.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    test('given constituency names then uses as labels', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyData(apiData, 'average_household_income_change');

      // Then
      expect(result[0].label).toBe('Westminster North');
      expect(result[1].label).toBe('Edinburgh Central');
      expect(result[2].label).toBe('Cardiff South');
    });

    test('given empty data object then returns empty array', () => {
      // Given
      const apiData = EMPTY_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyData(apiData, 'average_household_income_change');

      // Then
      expect(result).toEqual([]);
    });

    test('given single constituency then returns single point', () => {
      // Given
      const apiData = SINGLE_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyData(apiData, 'average_household_income_change');

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('Test Constituency');
      expect(result[0].value).toBe(500.0);
    });

    test('given large dataset then transforms all constituencies', () => {
      // Given
      const apiData = LARGE_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyData(apiData, 'average_household_income_change');

      // Then
      expect(result).toHaveLength(Object.keys(apiData).length);
      expect(result.length).toBe(10); // Our test dataset has 10 constituencies
    });
  });

  describe('transformConstituencyAbsoluteChange', () => {
    test('given constituency data then extracts average change values', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyAbsoluteChange(apiData);

      // Then
      expect(result).toEqual(EXPECTED_ABSOLUTE_CHANGE_DATA);
    });

    test('given data then uses average_household_income_change field', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyAbsoluteChange(apiData);

      // Then
      expect(result[0].value).toBe(1234.56); // average_household_income_change
      expect(result[1].value).toBe(-567.89);
    });

    test('given positive and negative values then preserves signs', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyAbsoluteChange(apiData);

      // Then
      expect(result[0].value).toBeGreaterThan(0); // Westminster North
      expect(result[1].value).toBeLessThan(0); // Edinburgh Central
      expect(result[2].value).toBe(0); // Cardiff South
    });
  });

  describe('transformConstituencyRelativeChange', () => {
    test('given constituency data then extracts relative change values', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyRelativeChange(apiData);

      // Then
      expect(result).toEqual(EXPECTED_RELATIVE_CHANGE_DATA);
    });

    test('given data then uses relative_household_income_change field', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyRelativeChange(apiData);

      // Then
      expect(result[0].value).toBe(0.025); // relative_household_income_change
      expect(result[1].value).toBe(-0.015);
    });

    test('given percentage values then preserves decimal precision', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyRelativeChange(apiData);

      // Then
      expect(result[0].value).toBe(0.025); // Exact match
      expect(result[1].value).toBe(-0.015); // Exact match
      expect(result[3].value).toBe(0.018); // Belfast East
    });

    test('given positive and negative percentages then preserves signs', () => {
      // Given
      const apiData = MOCK_CONSTITUENCY_DATA;

      // When
      const result = transformConstituencyRelativeChange(apiData);

      // Then
      expect(result[0].value).toBeGreaterThan(0); // Westminster North
      expect(result[1].value).toBeLessThan(0); // Edinburgh Central
      expect(result[2].value).toBe(0); // Cardiff South
    });
  });

  test('given a breakdown area then its absolute points carry the tier and the 90% range', () => {
    // When
    const [point] = transformConstituencyAbsoluteChange(
      NORMALIZED_BREAKDOWN.constituency_impact.by_constituency
    );

    // Then
    expect(point).toMatchObject({
      id: 'East Kilbride and Strathaven',
      approximate: true,
      lower: 40,
      upper: 210,
    });
  });

  test('given a breakdown area then its relative points carry the relative 90% range', () => {
    // When
    const [point] = transformConstituencyRelativeChange(
      NORMALIZED_BREAKDOWN.constituency_impact.by_constituency
    );

    // Then
    expect(point).toMatchObject({
      id: 'East Kilbride and Strathaven',
      approximate: true,
      lower: 0.001,
      upper: 0.007,
    });
  });

  test('given an area with an ONS code then its point carries the code, which joins it to its boundary', () => {
    // When
    const [point] = transformConstituencyAbsoluteChange(
      NORMALIZED_BREAKDOWN.constituency_impact.by_constituency
    );

    // Then
    expect(point).toMatchObject({ id: 'East Kilbride and Strathaven', code: 'S14000021' });
  });

  test('given areas without codes then their points have none', () => {
    // When
    const points = transformConstituencyAbsoluteChange(MOCK_CONSTITUENCY_DATA);

    // Then
    expect(points.every((point) => !('code' in point))).toBe(true);
  });
});
