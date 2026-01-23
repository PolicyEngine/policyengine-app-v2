/**
 * Tests for congressional district utility functions
 */

import { describe, test, expect } from 'vitest';
import {
  isStateLevelRegion,
  extractStateCode,
  getStateCodesToFetch,
  calculateTotalDistrictsLoaded,
  computeFetchStatus,
  validateAllStatesLoaded,
} from '@/contexts/congressional-district/utils';
import {
  TEST_REGION_FORMATS,
  TEST_STATE_CODES,
  TEST_STRIPPED_STATE_CODES,
  MOCK_INITIAL_FETCH_STATE,
  MOCK_LOADING_FETCH_STATE,
  MOCK_COMPLETE_FETCH_STATE,
  MOCK_ERROR_FETCH_STATE,
  MOCK_ALABAMA_DISTRICT_DATA,
  MOCK_CALIFORNIA_DISTRICT_DATA,
  ALL_US_STATE_CODES,
} from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';
import type { StateDistrictData } from '@/contexts/congressional-district/types';

describe('isStateLevelRegion', () => {
  test('given state/ca region then returns true', () => {
    // When
    const result = isStateLevelRegion(TEST_REGION_FORMATS.STATE_CA);

    // Then
    expect(result).toBe(true);
  });

  test('given state/dc region then returns true', () => {
    // When
    const result = isStateLevelRegion(TEST_REGION_FORMATS.STATE_DC);

    // Then
    expect(result).toBe(true);
  });

  test('given uppercase STATE/CA region then returns true', () => {
    // When
    const result = isStateLevelRegion(TEST_REGION_FORMATS.STATE_UPPERCASE);

    // Then
    expect(result).toBe(true);
  });

  test('given legacy state code (ca) then returns false', () => {
    // When
    const result = isStateLevelRegion(TEST_REGION_FORMATS.LEGACY_CA);

    // Then
    expect(result).toBe(false);
  });

  test('given national region (us) then returns false', () => {
    // When
    const result = isStateLevelRegion(TEST_REGION_FORMATS.NATIONAL);

    // Then
    expect(result).toBe(false);
  });

  test('given congressional_district region then returns false', () => {
    // When
    const result = isStateLevelRegion(TEST_REGION_FORMATS.CONGRESSIONAL_DISTRICT);

    // Then
    expect(result).toBe(false);
  });

  test('given undefined region then returns false', () => {
    // When
    const result = isStateLevelRegion(undefined);

    // Then
    expect(result).toBe(false);
  });

  test('given empty string then returns false', () => {
    // When
    const result = isStateLevelRegion('');

    // Then
    expect(result).toBe(false);
  });
});

describe('extractStateCode', () => {
  test('given state/ca region then returns ca', () => {
    // When
    const result = extractStateCode(TEST_REGION_FORMATS.STATE_CA);

    // Then
    expect(result).toBe(TEST_STRIPPED_STATE_CODES.CALIFORNIA);
  });

  test('given state/dc region then returns dc', () => {
    // When
    const result = extractStateCode(TEST_REGION_FORMATS.STATE_DC);

    // Then
    expect(result).toBe(TEST_STRIPPED_STATE_CODES.DC);
  });

  test('given STATE/CA (uppercase) then returns ca (lowercase)', () => {
    // When
    const result = extractStateCode(TEST_REGION_FORMATS.STATE_UPPERCASE);

    // Then
    expect(result).toBe(TEST_STRIPPED_STATE_CODES.CALIFORNIA);
  });

  test('given legacy state code (ca) then returns ca as-is', () => {
    // When
    const result = extractStateCode(TEST_REGION_FORMATS.LEGACY_CA);

    // Then
    expect(result).toBe(TEST_STRIPPED_STATE_CODES.CALIFORNIA);
  });

  test('given undefined region then returns null', () => {
    // When
    const result = extractStateCode(undefined);

    // Then
    expect(result).toBeNull();
  });

  test('given empty string then returns null', () => {
    // When
    const result = extractStateCode('');

    // Then
    expect(result).toBeNull();
  });
});

describe('getStateCodesToFetch', () => {
  test('given state-level report then returns single state code', () => {
    // Given
    const isStateLevelReport = true;
    const region = TEST_STATE_CODES.CALIFORNIA;
    const allStateCodes = ALL_US_STATE_CODES;

    // When
    const result = getStateCodesToFetch(isStateLevelReport, region, allStateCodes);

    // Then
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(TEST_STATE_CODES.CALIFORNIA.toLowerCase());
  });

  test('given national report then returns all state codes', () => {
    // Given
    const isStateLevelReport = false;
    const region = TEST_REGION_FORMATS.NATIONAL;
    const allStateCodes = ALL_US_STATE_CODES;

    // When
    const result = getStateCodesToFetch(isStateLevelReport, region, allStateCodes);

    // Then
    expect(result).toHaveLength(51);
    expect(result).toEqual(allStateCodes);
  });

  test('given state-level report with undefined region then returns all codes', () => {
    // Given
    const isStateLevelReport = true;
    const region = undefined;
    const allStateCodes = ALL_US_STATE_CODES;

    // When
    const result = getStateCodesToFetch(isStateLevelReport, region, allStateCodes);

    // Then
    expect(result).toEqual(allStateCodes);
  });
});

describe('calculateTotalDistrictsLoaded', () => {
  test('given empty map then returns 0', () => {
    // Given
    const stateResponses = new Map<string, StateDistrictData>();

    // When
    const result = calculateTotalDistrictsLoaded(stateResponses);

    // Then
    expect(result).toBe(0);
  });

  test('given single state response then returns district count', () => {
    // Given
    const stateResponses = new Map<string, StateDistrictData>([
      [TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA],
    ]);

    // When
    const result = calculateTotalDistrictsLoaded(stateResponses);

    // Then
    expect(result).toBe(7); // Alabama has 7 districts in mock
  });

  test('given multiple state responses then returns total district count', () => {
    // Given
    const stateResponses = new Map<string, StateDistrictData>([
      [TEST_STATE_CODES.ALABAMA, MOCK_ALABAMA_DISTRICT_DATA],
      [TEST_STATE_CODES.CALIFORNIA, MOCK_CALIFORNIA_DISTRICT_DATA],
    ]);

    // When
    const result = calculateTotalDistrictsLoaded(stateResponses);

    // Then
    expect(result).toBe(10); // 7 (AL) + 3 (CA in mock)
  });
});

describe('computeFetchStatus', () => {
  test('given initial state then all counts are 0 and booleans are false', () => {
    // Given
    const state = MOCK_INITIAL_FETCH_STATE;

    // When
    const result = computeFetchStatus(state);

    // Then
    expect(result.completedCount).toBe(0);
    expect(result.loadingCount).toBe(0);
    expect(result.errorCount).toBe(0);
    expect(result.isLoading).toBe(false);
    expect(result.isComplete).toBe(false);
  });

  test('given loading state then isLoading is true', () => {
    // Given
    const state = MOCK_LOADING_FETCH_STATE;

    // When
    const result = computeFetchStatus(state);

    // Then
    expect(result.isLoading).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.loadingCount).toBe(2);
    expect(result.completedCount).toBe(1);
  });

  test('given complete state then isComplete is true', () => {
    // Given
    const state = MOCK_COMPLETE_FETCH_STATE;

    // When
    const result = computeFetchStatus(state);

    // Then
    expect(result.isComplete).toBe(true);
    expect(result.isLoading).toBe(false);
    expect(result.loadingCount).toBe(0);
    expect(result.completedCount).toBe(2);
  });

  test('given error state then errorCount is correct', () => {
    // Given
    const state = MOCK_ERROR_FETCH_STATE;

    // When
    const result = computeFetchStatus(state);

    // Then
    expect(result.errorCount).toBe(1);
    expect(result.isComplete).toBe(true); // No more loading
    expect(result.completedCount).toBe(1);
  });
});

describe('validateAllStatesLoaded', () => {
  test('given all states completed then returns true', () => {
    // Given
    const completedStates = new Set(['state/al', 'state/ca']);
    const expectedCount = 2;

    // When
    const result = validateAllStatesLoaded(completedStates, expectedCount);

    // Then
    expect(result).toBe(true);
  });

  test('given more completed than expected then returns true', () => {
    // Given
    const completedStates = new Set(['state/al', 'state/ca', 'state/dc']);
    const expectedCount = 2;

    // When
    const result = validateAllStatesLoaded(completedStates, expectedCount);

    // Then
    expect(result).toBe(true);
  });

  test('given fewer completed than expected then returns false', () => {
    // Given
    const completedStates = new Set(['state/al']);
    const expectedCount = 51;

    // When
    const result = validateAllStatesLoaded(completedStates, expectedCount);

    // Then
    expect(result).toBe(false);
  });

  test('given empty completed set then returns false for non-zero expected', () => {
    // Given
    const completedStates = new Set<string>();
    const expectedCount = 51;

    // When
    const result = validateAllStatesLoaded(completedStates, expectedCount);

    // Then
    expect(result).toBe(false);
  });

  test('given empty completed set then returns true for zero expected', () => {
    // Given
    const completedStates = new Set<string>();
    const expectedCount = 0;

    // When
    const result = validateAllStatesLoaded(completedStates, expectedCount);

    // Then
    expect(result).toBe(true);
  });
});
