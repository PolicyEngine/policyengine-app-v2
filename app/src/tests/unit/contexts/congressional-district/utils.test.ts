/**
 * Tests for congressional district utility functions
 */

import { describe, expect, test } from 'vitest';
import {
  congressionalDistrictScope,
  extractStateCode,
  isStateLevelRegion,
} from '@/contexts/congressional-district/utils';
import {
  TEST_REGION_FORMATS,
  TEST_STRIPPED_STATE_CODES,
} from '@/tests/fixtures/contexts/congressional-district/congressionalDistrictMocks';

describe('congressionalDistrictScope', () => {
  test.each([
    ['no region', undefined],
    ['the US', TEST_REGION_FORMATS.NATIONAL],
    ['the US in capitals', TEST_REGION_FORMATS.NATIONAL_UPPERCASE],
  ])('given %s then the scope is nationwide', (_label, region) => {
    expect(congressionalDistrictScope(region)).toBe('nationwide');
  });

  test.each([TEST_REGION_FORMATS.STATE_CA, TEST_REGION_FORMATS.STATE_UPPERCASE])(
    'given %s then the scope is a state',
    (region) => {
      expect(congressionalDistrictScope(region)).toBe('state');
    }
  );

  test.each([
    TEST_REGION_FORMATS.CONGRESSIONAL_DISTRICT,
    TEST_REGION_FORMATS.PLACE,
    TEST_REGION_FORMATS.LEGACY_CA,
  ])('given %s then there is no district scope', (region) => {
    expect(congressionalDistrictScope(region)).toBeNull();
  });
});

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
