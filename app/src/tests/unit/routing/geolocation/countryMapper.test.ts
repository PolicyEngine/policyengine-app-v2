import { describe, expect, test } from 'vitest';
import { countryIds } from '@/libs/countries';
import { isSupportedCountry, mapIsoToRoute } from '@/routing/geolocation/countryMapper';
import {
  OFFERED_COUNTRY_ISO_CODES,
  REMOVED_COUNTRY_ISO_CODES,
} from '@/tests/fixtures/routing/geolocation/countryMapperMocks';

describe('countryMapper', () => {
  test.each(Object.entries(OFFERED_COUNTRY_ISO_CODES))(
    'given the ISO code %s then it maps to the %s calculator',
    (isoCode, route) => {
      expect(mapIsoToRoute(isoCode)).toBe(route);
      expect(isSupportedCountry(isoCode)).toBe(true);
    }
  );

  test.each(REMOVED_COUNTRY_ISO_CODES)(
    'given %s, a country the app no longer offers, then it maps to no calculator',
    (isoCode) => {
      expect(mapIsoToRoute(isoCode)).toBeNull();
      expect(isSupportedCountry(isoCode)).toBe(false);
    }
  );

  test('given every mapped ISO code then its calculator is in the country list', () => {
    for (const route of Object.values(OFFERED_COUNTRY_ISO_CODES)) {
      expect(countryIds).toContain(route);
    }
  });
});
