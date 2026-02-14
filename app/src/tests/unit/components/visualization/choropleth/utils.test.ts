/**
 * Tests for choropleth utility functions
 */

import { describe, expect, test } from 'vitest';
import {
  calculateColorRange,
  createDataLookupMap,
  DEFAULT_CHOROPLETH_CONFIG,
  getDistrictColor,
  mergeConfig,
} from '@/components/visualization/choropleth/utils';
import {
  EXPECTED_ASYMMETRIC_NEGATIVE_RANGE,
  EXPECTED_ASYMMETRIC_POSITIVE_RANGE,
  EXPECTED_EMPTY_DATA_RANGE,
  MOCK_ALL_NEGATIVE_DATA_POINTS,
  MOCK_ALL_POSITIVE_DATA_POINTS,
  MOCK_CHOROPLETH_DATA_POINTS,
  MOCK_CUSTOM_HEIGHT_CONFIG,
  MOCK_EMPTY_DATA_POINTS,
  MOCK_FULL_CUSTOM_CONFIG,
  TEST_DISTRICT_IDS,
  TEST_VALUES,
} from '@/tests/fixtures/components/visualization/choropleth/choroplethMocks';

describe('mergeConfig', () => {
  test('given empty config then returns default values', () => {
    // Given
    const partialConfig = {};

    // When
    const result = mergeConfig(partialConfig);

    // Then
    expect(result.height).toBe(DEFAULT_CHOROPLETH_CONFIG.height);
    expect(result.showColorBar).toBe(DEFAULT_CHOROPLETH_CONFIG.showColorBar);
    expect(result.colorScale.symmetric).toBe(DEFAULT_CHOROPLETH_CONFIG.colorScale.symmetric);
  });

  test('given custom height then overrides default height', () => {
    // Given
    const partialConfig = MOCK_CUSTOM_HEIGHT_CONFIG;

    // When
    const result = mergeConfig(partialConfig);

    // Then
    expect(result.height).toBe(600);
    expect(result.showColorBar).toBe(DEFAULT_CHOROPLETH_CONFIG.showColorBar);
  });

  test('given full custom config then all values are overridden', () => {
    // Given
    const partialConfig = MOCK_FULL_CUSTOM_CONFIG;

    // When
    const result = mergeConfig(partialConfig);

    // Then
    expect(result.height).toBe(700);
    expect(result.showColorBar).toBe(false);
    expect(result.colorScale.tickFormat).toBe('$,.2f');
    expect(result.colorScale.symmetric).toBe(true);
  });
});

describe('createDataLookupMap', () => {
  test('given data points then creates Map with geoId keys', () => {
    // Given
    const dataPoints = MOCK_CHOROPLETH_DATA_POINTS;

    // When
    const result = createDataLookupMap(dataPoints);

    // Then
    expect(result.size).toBe(5);
    expect(result.has(TEST_DISTRICT_IDS.ALABAMA_1)).toBe(true);
    expect(result.has(TEST_DISTRICT_IDS.CALIFORNIA_52)).toBe(true);
  });

  test('given data points then Map values contain correct data', () => {
    // Given
    const dataPoints = MOCK_CHOROPLETH_DATA_POINTS;

    // When
    const result = createDataLookupMap(dataPoints);

    // Then
    const alabama1 = result.get(TEST_DISTRICT_IDS.ALABAMA_1);
    expect(alabama1?.value).toBe(TEST_VALUES.POSITIVE_SMALL);
    expect(alabama1?.label).toBe("Alabama's 1st congressional district");
  });

  test('given empty data points then returns empty Map', () => {
    // Given
    const dataPoints = MOCK_EMPTY_DATA_POINTS;

    // When
    const result = createDataLookupMap(dataPoints);

    // Then
    expect(result.size).toBe(0);
  });
});

describe('calculateColorRange', () => {
  test('given data with symmetric true then range is symmetric around zero', () => {
    // Given
    const dataPoints = MOCK_CHOROPLETH_DATA_POINTS;
    const symmetric = true;

    // When
    const result = calculateColorRange(dataPoints, symmetric);

    // Then
    expect(result.min).toBe(-result.max);
    expect(result.max).toBe(TEST_VALUES.POSITIVE_LARGE); // Max absolute value
  });

  test('given data with symmetric false then range uses actual min/max', () => {
    // Given
    const dataPoints = MOCK_ALL_POSITIVE_DATA_POINTS;
    const symmetric = false;

    // When
    const result = calculateColorRange(dataPoints, symmetric);

    // Then
    expect(result.min).toBe(EXPECTED_ASYMMETRIC_POSITIVE_RANGE.min);
    expect(result.max).toBe(EXPECTED_ASYMMETRIC_POSITIVE_RANGE.max);
  });

  test('given all negative data with symmetric false then range is negative', () => {
    // Given
    const dataPoints = MOCK_ALL_NEGATIVE_DATA_POINTS;
    const symmetric = false;

    // When
    const result = calculateColorRange(dataPoints, symmetric);

    // Then
    expect(result.min).toBe(EXPECTED_ASYMMETRIC_NEGATIVE_RANGE.min);
    expect(result.max).toBe(EXPECTED_ASYMMETRIC_NEGATIVE_RANGE.max);
  });

  test('given empty data then returns default range', () => {
    // Given
    const dataPoints = MOCK_EMPTY_DATA_POINTS;
    const symmetric = true;

    // When
    const result = calculateColorRange(dataPoints, symmetric);

    // Then
    expect(result.min).toBe(EXPECTED_EMPTY_DATA_RANGE.min);
    expect(result.max).toBe(EXPECTED_EMPTY_DATA_RANGE.max);
  });
});

describe('getDistrictColor', () => {
  test('given value at minimum then returns first color', () => {
    // Given
    const scaleColors = ['#000000', '#888888', '#ffffff'];
    const colorRange = { min: -100, max: 100 };

    // When
    const result = getDistrictColor(-100, colorRange, scaleColors);

    // Then
    expect(result).toBe('#000000');
  });

  test('given value at maximum then returns last color', () => {
    // Given
    const scaleColors = ['#000000', '#888888', '#ffffff'];
    const colorRange = { min: -100, max: 100 };

    // When
    const result = getDistrictColor(100, colorRange, scaleColors);

    // Then
    expect(result).toBe('#ffffff');
  });

  test('given value at midpoint then returns middle color', () => {
    // Given
    const scaleColors = ['#000000', '#888888', '#ffffff'];
    const colorRange = { min: -100, max: 100 };

    // When
    const result = getDistrictColor(0, colorRange, scaleColors);

    // Then
    expect(result).toBe('#888888');
  });

  test('given zero range then returns middle color', () => {
    // Given
    const scaleColors = ['#000000', '#888888', '#ffffff'];
    const colorRange = { min: 50, max: 50 };

    // When
    const result = getDistrictColor(50, colorRange, scaleColors);

    // Then
    expect(result).toBe('#888888');
  });
});
