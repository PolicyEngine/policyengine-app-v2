import { describe, expect, it } from 'vitest';
import { CHART_DISPLAY_EXTENSION_DATE } from '@/constants/chartConstants';
import {
  datesWithInfiniteValues,
  emptyDates,
  emptyValues,
  expectedAllUniqueDates,
  expectedFilteredDates,
  expectedFilteredFiniteDates,
  expectedFilteredFiniteValues,
  getExpectedBoundaryDates,
  mixedValidInvalidDates,
  overlappingDates,
  sampleBaseDates,
  sampleReformDates,
  sampleSingleValue,
  sampleValues,
  valuesAllFinite,
  valuesAllInfinite,
  valuesWithBothInfinities,
  valuesWithNaN,
  valuesWithNegativeInfinity,
  valuesWithPositiveInfinity,
} from '@/tests/fixtures/utils/chartDateUtilsMocks';
import {
  extendForDisplay,
  filterInfiniteValues,
  filterValidChartDates,
  getAllChartDates,
  getChartBoundaryDates,
} from '@/utils/chartDateUtils';

describe('chartDateUtils', () => {
  describe('filterInfiniteValues', () => {
    it('given values with positive infinity then filters out infinite value and corresponding date', () => {
      // Given & When
      const result = filterInfiniteValues(datesWithInfiniteValues, valuesWithPositiveInfinity);

      // Then
      expect(result.filteredDates).toEqual(expectedFilteredFiniteDates);
      expect(result.filteredValues).toEqual(expectedFilteredFiniteValues);
    });

    it('given values with negative infinity then filters out infinite value and corresponding date', () => {
      // Given & When
      const result = filterInfiniteValues(datesWithInfiniteValues, valuesWithNegativeInfinity);

      // Then
      expect(result.filteredDates).toEqual(expectedFilteredFiniteDates);
      expect(result.filteredValues).toEqual(expectedFilteredFiniteValues);
    });

    it('given values with both infinities then filters out both infinite values and corresponding dates', () => {
      // Given & When
      const result = filterInfiniteValues(datesWithInfiniteValues, valuesWithBothInfinities);

      // Then
      expect(result.filteredDates).toEqual(['2021-01-01', '2023-01-01']);
      expect(result.filteredValues).toEqual([200, 400]);
    });

    it('given all infinite values then returns empty arrays', () => {
      // Given & When
      const result = filterInfiniteValues(datesWithInfiniteValues, valuesAllInfinite);

      // Then
      expect(result.filteredDates).toEqual([]);
      expect(result.filteredValues).toEqual([]);
    });

    it('given all finite values then returns all dates and values unchanged', () => {
      // Given & When
      const result = filterInfiniteValues(datesWithInfiniteValues, valuesAllFinite);

      // Then
      expect(result.filteredDates).toEqual(datesWithInfiniteValues);
      expect(result.filteredValues).toEqual(valuesAllFinite);
    });

    it('given values with NaN then filters out NaN value and corresponding date', () => {
      // Given & When
      const result = filterInfiniteValues(datesWithInfiniteValues, valuesWithNaN);

      // Then
      expect(result.filteredDates).toEqual(expectedFilteredFiniteDates);
      expect(result.filteredValues).toEqual(expectedFilteredFiniteValues);
    });

    it('given empty arrays then returns empty arrays', () => {
      // Given & When
      const result = filterInfiniteValues([], []);

      // Then
      expect(result.filteredDates).toEqual([]);
      expect(result.filteredValues).toEqual([]);
    });

    it('given string values then converts to numbers and filters correctly', () => {
      // Given
      const stringValues = ['100', 'Infinity', '300', '400'];

      // When
      const result = filterInfiniteValues(datesWithInfiniteValues, stringValues);

      // Then
      expect(result.filteredDates).toEqual(expectedFilteredFiniteDates);
      expect(result.filteredValues).toEqual(stringValues.filter((_, i) => i !== 1));
    });
  });

  describe('filterValidChartDates', () => {
    it('should filter out invalid dates (0000-01-01)', () => {
      const result = filterValidChartDates(mixedValidInvalidDates);
      expect(result).toEqual(expectedFilteredDates);
    });

    it('should filter out dates >= CHART_DISPLAY_EXTENSION_DATE', () => {
      const result = filterValidChartDates(mixedValidInvalidDates);
      expect(result).not.toContain('2099-12-31');
      expect(result).not.toContain('2100-01-01');
    });

    it('should return empty array for empty input', () => {
      const result = filterValidChartDates([]);
      expect(result).toEqual([]);
    });

    it('should keep valid dates in range', () => {
      const validDates = ['2015-01-01', '2020-06-15', '2023-12-31'];
      const result = filterValidChartDates(validDates);
      expect(result).toEqual(validDates);
    });

    it('should handle all invalid dates', () => {
      const allInvalid = ['0000-01-01', '2099-12-31', '2100-01-01'];
      const result = filterValidChartDates(allInvalid);
      expect(result).toEqual([]);
    });
  });

  describe('getAllChartDates', () => {
    it('should combine base and reform dates', () => {
      const result = getAllChartDates(sampleBaseDates, sampleReformDates);
      expect(result).toEqual(expectedAllUniqueDates);
    });

    it('should remove duplicate dates', () => {
      const result = getAllChartDates(overlappingDates.base, overlappingDates.reform);
      // Should have unique dates only
      const uniqueCount = new Set([...overlappingDates.base, ...overlappingDates.reform]).size;
      expect(result.length).toBe(uniqueCount);
    });

    it('should sort dates chronologically', () => {
      const unsortedBase = ['2025-01-01', '2020-01-01'];
      const unsortedReform = ['2023-01-01', '2021-01-01'];
      const result = getAllChartDates(unsortedBase, unsortedReform);

      // Check if sorted
      for (let i = 1; i < result.length; i++) {
        expect(result[i] >= result[i - 1]).toBe(true);
      }
    });

    it('should handle empty base dates', () => {
      const result = getAllChartDates(emptyDates.base, sampleReformDates);
      expect(result).toEqual([...sampleReformDates].sort());
    });

    it('should handle empty reform dates', () => {
      const result = getAllChartDates(sampleBaseDates, emptyDates.reform);
      expect(result).toEqual([...sampleBaseDates].sort());
    });

    it('should handle both empty arrays', () => {
      const result = getAllChartDates(emptyDates.base, emptyDates.reform);
      expect(result).toEqual([]);
    });
  });

  describe('extendForDisplay', () => {
    it('should add extension date to x array', () => {
      const x = [...sampleBaseDates];
      const y = [...sampleValues];
      extendForDisplay(x, y);

      expect(x[x.length - 1]).toBe(CHART_DISPLAY_EXTENSION_DATE);
    });

    it('should repeat last value in y array', () => {
      const x = [...sampleBaseDates];
      const y = [...sampleValues];
      const lastValue = y[y.length - 1];

      extendForDisplay(x, y);

      expect(y[y.length - 1]).toBe(lastValue);
    });

    it('should mutate both arrays', () => {
      const x = [...sampleBaseDates];
      const y = [...sampleValues];
      const originalXLength = x.length;
      const originalYLength = y.length;

      extendForDisplay(x, y);

      expect(x.length).toBe(originalXLength + 1);
      expect(y.length).toBe(originalYLength + 1);
    });

    it('should handle single value arrays', () => {
      const x = ['2023-01-01'];
      const y = [...sampleSingleValue];

      extendForDisplay(x, y);

      expect(x).toEqual(['2023-01-01', CHART_DISPLAY_EXTENSION_DATE]);
      expect(y).toEqual([150, 150]);
    });

    it('should handle empty arrays gracefully', () => {
      const x: string[] = [];
      const y = [...emptyValues];

      // Should not throw
      expect(() => extendForDisplay(x, y)).not.toThrow();

      // Should not modify empty arrays
      expect(x.length).toBe(0);
      expect(y.length).toBe(0);
    });

    it('should work with different value types', () => {
      const x = ['2023-01-01'];
      const yStrings = ['value1'];
      extendForDisplay(x, yStrings);
      expect(yStrings).toEqual(['value1', 'value1']);

      const x2 = ['2023-01-01'];
      const yBooleans = [true];
      extendForDisplay(x2, yBooleans);
      expect(yBooleans).toEqual([true, true]);
    });
  });

  describe('getChartBoundaryDates', () => {
    it('should return minDate as DEFAULT_CHART_START_DATE', () => {
      const result = getChartBoundaryDates();
      expect(result.minDate).toBe('2015-01-01');
    });

    it('should return maxDate as current year + 10 years', () => {
      const result = getChartBoundaryDates();
      const expected = getExpectedBoundaryDates();
      expect(result.maxDate).toBe(expected.maxDate);
    });

    it('should return consistent results on multiple calls', () => {
      const result1 = getChartBoundaryDates();
      const result2 = getChartBoundaryDates();

      expect(result1.minDate).toBe(result2.minDate);
      expect(result1.maxDate).toBe(result2.maxDate);
    });

    it('should return object with both minDate and maxDate', () => {
      const result = getChartBoundaryDates();

      expect(result).toHaveProperty('minDate');
      expect(result).toHaveProperty('maxDate');
      expect(typeof result.minDate).toBe('string');
      expect(typeof result.maxDate).toBe('string');
    });

    it('should return maxDate greater than minDate', () => {
      const result = getChartBoundaryDates();
      expect(result.maxDate > result.minDate).toBe(true);
    });
  });
});
