import { beforeEach, describe, expect, test } from 'vitest';
import { geographyUsageStore, UsageTrackingStore } from '@/api/usageTracking';
import {
  GEOGRAPHY_USAGE_STORAGE_KEY,
  POLICY_USAGE_STORAGE_KEY,
  USAGE_TIMESTAMPS,
  WALES_REGION_CODE,
} from '@/tests/fixtures/api/usageTrackingMocks';
import {
  LEGACY_NORTHERN_IRELAND_REGION_CODE,
  NORTHERN_IRELAND_REGION_CODE,
} from '@/tests/fixtures/models/regionMocks';

function storeGeographyUsage(usage: Record<string, string>) {
  localStorage.setItem(GEOGRAPHY_USAGE_STORAGE_KEY, JSON.stringify(usage));
}

function storedGeographyUsage(): Record<string, string> {
  return JSON.parse(localStorage.getItem(GEOGRAPHY_USAGE_STORAGE_KEY) ?? '{}');
}

describe('geographyUsageStore Northern Ireland region', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('given a recent country/ni entry then it reads as country/northern_ireland', () => {
    // Given
    storeGeographyUsage({ [LEGACY_NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.EARLIER });

    // Then
    expect(geographyUsageStore.getRecentIds()).toEqual([NORTHERN_IRELAND_REGION_CODE]);
    expect(geographyUsageStore.getAll()).toEqual({
      [NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.EARLIER,
    });
  });

  test.each([LEGACY_NORTHERN_IRELAND_REGION_CODE, NORTHERN_IRELAND_REGION_CODE])(
    'given a recent country/ni entry then asking for %s finds its last use',
    (requestedRegionCode) => {
      // Given
      storeGeographyUsage({ [LEGACY_NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.EARLIER });

      // Then
      expect(geographyUsageStore.getLastUsed(requestedRegionCode)).toBe(USAGE_TIMESTAMPS.EARLIER);
      expect(geographyUsageStore.hasUsage(requestedRegionCode)).toBe(true);
    }
  );

  test.each([
    ['country/ni', USAGE_TIMESTAMPS.LATER, USAGE_TIMESTAMPS.EARLIER],
    ['country/northern_ireland', USAGE_TIMESTAMPS.EARLIER, USAGE_TIMESTAMPS.LATER],
  ])(
    'given entries for both codes, %s used last, then one entry keeps the later use',
    (_usedLast, legacyTimestamp, currentTimestamp) => {
      // Given
      storeGeographyUsage({
        [LEGACY_NORTHERN_IRELAND_REGION_CODE]: legacyTimestamp,
        [NORTHERN_IRELAND_REGION_CODE]: currentTimestamp,
        [WALES_REGION_CODE]: USAGE_TIMESTAMPS.WALES,
      });

      // Then
      expect(geographyUsageStore.getAll()).toEqual({
        [NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.LATER,
        [WALES_REGION_CODE]: USAGE_TIMESTAMPS.WALES,
      });
      expect(geographyUsageStore.getRecentIds()).toEqual([
        NORTHERN_IRELAND_REGION_CODE,
        WALES_REGION_CODE,
      ]);
    }
  );

  test('given a recent country/ni entry then recording another use stores country/northern_ireland only', () => {
    // Given
    storeGeographyUsage({ [LEGACY_NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.EARLIER });

    // When
    geographyUsageStore.recordUsage(WALES_REGION_CODE);

    // Then
    expect(Object.keys(storedGeographyUsage()).sort()).toEqual([
      NORTHERN_IRELAND_REGION_CODE,
      WALES_REGION_CODE,
    ]);
  });

  test('given a use recorded for country/ni then it is stored as country/northern_ireland', () => {
    // When
    geographyUsageStore.recordUsage(LEGACY_NORTHERN_IRELAND_REGION_CODE);

    // Then
    expect(Object.keys(storedGeographyUsage())).toEqual([NORTHERN_IRELAND_REGION_CODE]);
  });

  test('given entries for both codes then removing Northern Ireland removes both', () => {
    // Given
    storeGeographyUsage({
      [LEGACY_NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.EARLIER,
      [NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.LATER,
    });

    // When
    geographyUsageStore.removeUsage(NORTHERN_IRELAND_REGION_CODE);

    // Then
    expect(storedGeographyUsage()).toEqual({});
  });

  test('given a store for something other than regions then its IDs are kept as they are', () => {
    // Given
    const policyUsageStore = new UsageTrackingStore(POLICY_USAGE_STORAGE_KEY);
    localStorage.setItem(
      POLICY_USAGE_STORAGE_KEY,
      JSON.stringify({ [LEGACY_NORTHERN_IRELAND_REGION_CODE]: USAGE_TIMESTAMPS.EARLIER })
    );

    // Then
    expect(policyUsageStore.getRecentIds()).toEqual([LEGACY_NORTHERN_IRELAND_REGION_CODE]);
  });
});
