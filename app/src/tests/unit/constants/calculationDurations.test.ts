import { describe, expect, it } from 'vitest';
import {
  getDurationForCalcType,
  getDurationForCountry,
  getDurationForRegion,
  HOUSEHOLD_DURATION_MS,
  UK_SOCIETY_WIDE_DURATION_MS,
  US_DISTRICT_SOCIETY_WIDE_DURATION_MS,
  US_SOCIETY_WIDE_DURATION_MS,
  US_STATE_SOCIETY_WIDE_DURATION_MS,
} from '@/constants/calculationDurations';

describe('calculationDurations', () => {
  describe('getDurationForRegion', () => {
    it.each([
      ['us', undefined, US_SOCIETY_WIDE_DURATION_MS],
      ['us', 'us', US_SOCIETY_WIDE_DURATION_MS],
      ['us', 'state/ca', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['us', 'place/CA-57000', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['us', 'congressional_district/CA-46', US_DISTRICT_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'uk', UK_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'constituency/Sheffield Central', UK_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'country/england', UK_SOCIETY_WIDE_DURATION_MS],
    ])('given %s and region %s then returns %i ms', (countryId, region, expected) => {
      expect(getDurationForRegion(countryId, region)).toBe(expected);
    });

    it('given a US state then the estimate is shorter than a nationwide run', () => {
      expect(getDurationForRegion('us', 'state/ny')).toBeLessThan(getDurationForRegion('us'));
    });

    it('given an unknown country then falls back to the country default', () => {
      expect(getDurationForRegion('ca', 'state/ca')).toBe(getDurationForCountry('ca'));
    });
  });

  describe('getDurationForCalcType', () => {
    it('given household then returns the household duration', () => {
      expect(getDurationForCalcType('household', 'us', 'state/ca')).toBe(HOUSEHOLD_DURATION_MS);
    });

    it('given society-wide with a region then returns the region duration', () => {
      expect(getDurationForCalcType('societyWide', 'us', 'state/ca')).toBe(
        US_STATE_SOCIETY_WIDE_DURATION_MS
      );
    });
  });
});
