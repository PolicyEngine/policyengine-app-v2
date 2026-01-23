/**
 * Tests for choropleth utility functions
 */

import { describe, expect, test } from 'vitest';
import {
  buildDivergingColorscale,
  buildGeoConfig,
  calculateColorRange,
  createDataLookupMap,
  DEFAULT_CHOROPLETH_CONFIG,
  mergeConfig,
  processGeoJSONFeatures,
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
  MOCK_GEOJSON_FEATURE_COLLECTION,
  MOCK_GEOJSON_WITH_MISSING_IDS,
  TEST_DISTRICT_IDS,
  TEST_FOCUS_STATES,
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

describe('buildDivergingColorscale', () => {
  test('given call then returns array with 5 entries', () => {
    // When
    const result = buildDivergingColorscale();

    // Then
    expect(result).toHaveLength(5);
  });

  test('given call then first entry is at position 0', () => {
    // When
    const result = buildDivergingColorscale();

    // Then
    expect(result[0][0]).toBe(0);
  });

  test('given call then last entry is at position 1', () => {
    // When
    const result = buildDivergingColorscale();

    // Then
    expect(result[4][0]).toBe(1);
  });

  test('given call then middle entry is at position 0.5', () => {
    // When
    const result = buildDivergingColorscale();

    // Then
    expect(result[2][0]).toBe(0.5);
  });

  test('given call then entries around zero have tight band', () => {
    // When
    const result = buildDivergingColorscale();

    // Then
    expect(result[1][0]).toBe(0.4999);
    expect(result[3][0]).toBe(0.5001);
  });
});

describe('processGeoJSONFeatures', () => {
  test('given geoJSON and data then returns matching features only', () => {
    // Given
    const dataMap = createDataLookupMap(MOCK_CHOROPLETH_DATA_POINTS);
    const formatValue = (val: number) => `$${val.toFixed(2)}`;

    // When
    const result = processGeoJSONFeatures(MOCK_GEOJSON_FEATURE_COLLECTION, dataMap, formatValue);

    // Then
    expect(result.locations).toHaveLength(5);
    expect(result.values).toHaveLength(5);
    expect(result.hoverText).toHaveLength(5);
    expect(result.features).toHaveLength(5);
  });

  test('given geoJSON with features missing IDs then skips those features', () => {
    // Given
    const dataMap = createDataLookupMap(MOCK_CHOROPLETH_DATA_POINTS);
    const formatValue = (val: number) => val.toString();

    // When
    const result = processGeoJSONFeatures(MOCK_GEOJSON_WITH_MISSING_IDS, dataMap, formatValue);

    // Then
    // Only AL-01 and CA-52 have both IDs in geoJSON and data in dataMap
    expect(result.locations).toHaveLength(2);
    expect(result.locations).toContain(TEST_DISTRICT_IDS.ALABAMA_1);
    expect(result.locations).toContain(TEST_DISTRICT_IDS.CALIFORNIA_52);
  });

  test('given geoJSON with no matching data then returns empty arrays', () => {
    // Given
    const emptyDataMap = createDataLookupMap(MOCK_EMPTY_DATA_POINTS);
    const formatValue = (val: number) => val.toString();

    // When
    const result = processGeoJSONFeatures(
      MOCK_GEOJSON_FEATURE_COLLECTION,
      emptyDataMap,
      formatValue
    );

    // Then
    expect(result.locations).toHaveLength(0);
    expect(result.values).toHaveLength(0);
  });

  test('given geoJSON and data then hover text contains label and formatted value', () => {
    // Given
    const dataMap = createDataLookupMap(MOCK_CHOROPLETH_DATA_POINTS);
    const formatValue = (val: number) => `$${val.toFixed(2)}`;

    // When
    const result = processGeoJSONFeatures(MOCK_GEOJSON_FEATURE_COLLECTION, dataMap, formatValue);

    // Then
    const alabama1Index = result.locations.indexOf(TEST_DISTRICT_IDS.ALABAMA_1);
    expect(result.hoverText[alabama1Index]).toContain("Alabama's 1st congressional district");
    expect(result.hoverText[alabama1Index]).toContain('$312.45');
  });
});

describe('buildGeoConfig', () => {
  test('given no focus state then returns config without fitbounds', () => {
    // When
    const result = buildGeoConfig();

    // Then
    expect(result.scope).toBe('usa');
    expect(result.projection.type).toBe('albers usa');
    expect(result.fitbounds).toBeUndefined();
  });

  test('given focus state then config includes fitbounds geojson', () => {
    // Given
    const focusState = TEST_FOCUS_STATES.CALIFORNIA;

    // When
    const result = buildGeoConfig(focusState);

    // Then
    expect(result.fitbounds).toBe('geojson');
  });

  test('given any focus state then same fitbounds config', () => {
    // Given
    const focusStates = [TEST_FOCUS_STATES.DC, TEST_FOCUS_STATES.NEW_YORK, TEST_FOCUS_STATES.TEXAS];

    // When/Then
    focusStates.forEach((state) => {
      const result = buildGeoConfig(state);
      expect(result.fitbounds).toBe('geojson');
    });
  });

  test('given no focus state then coastal and border settings are false', () => {
    // When
    const result = buildGeoConfig();

    // Then
    expect(result.showcoastlines).toBe(false);
    expect(result.showcountries).toBe(false);
    expect(result.showsubunits).toBe(false);
    expect(result.showframe).toBe(false);
  });
});
