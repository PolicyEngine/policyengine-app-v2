import { describe, expect, it } from 'vitest';
import {
  getDurationForCalcType,
  getDurationForCountry,
  getDurationForRegion,
  HOUSEHOLD_DURATION_MS,
  UK_REGION_SOCIETY_WIDE_DURATION_MS,
  US_DISTRICT_SOCIETY_WIDE_DURATION_MS,
  US_SOCIETY_WIDE_DURATION_MS,
  US_STATE_SOCIETY_WIDE_DURATION_MS,
} from '@/constants/calculationDurations';

// The country estimates that legacy (v2) progress bars use
const THREE_MINUTES_MS = 3 * 60 * 1000;
const SIX_MINUTES_MS = 6 * 60 * 1000;

describe('calculationDurations', () => {
  describe('getDurationForCountry', () => {
    it.each([
      ['us', SIX_MINUTES_MS],
      ['uk', THREE_MINUTES_MS],
      ['ca', SIX_MINUTES_MS],
    ])('given %s then keeps the %i ms country estimate', (countryId, expected) => {
      expect(getDurationForCountry(countryId)).toBe(expected);
    });
  });

  describe('getDurationForRegion', () => {
    it.each([
      ['us', undefined, US_SOCIETY_WIDE_DURATION_MS],
      ['us', 'us', US_SOCIETY_WIDE_DURATION_MS],
      ['us', 'state/ca', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['us', 'place/CA-57000', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['us', 'congressional_district/CA-46', US_DISTRICT_SOCIETY_WIDE_DURATION_MS],
      ['uk', undefined, UK_REGION_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'uk', UK_REGION_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'constituency/Sheffield Central', UK_REGION_SOCIETY_WIDE_DURATION_MS],
      ['uk', 'country/england', UK_REGION_SOCIETY_WIDE_DURATION_MS],
    ])('given %s and region %s then returns %i ms', (countryId, region, expected) => {
      expect(getDurationForRegion(countryId, region)).toBe(expected);
    });

    it.each([
      ['ca', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['us-ca', US_STATE_SOCIETY_WIDE_DURATION_MS],
      ['CA-12', US_DISTRICT_SOCIETY_WIDE_DURATION_MS],
      ['us-ca-12', US_DISTRICT_SOCIETY_WIDE_DURATION_MS],
    ])('given the legacy US region code %s then returns %i ms', (region, expected) => {
      expect(getDurationForRegion('us', region)).toBe(expected);
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
      expect(getDurationForCalcType('household', 'us')).toBe(HOUSEHOLD_DURATION_MS);
    });

    it('given society-wide then keeps the country estimate', () => {
      expect(getDurationForCalcType('societyWide', 'uk')).toBe(THREE_MINUTES_MS);
    });
  });
});
