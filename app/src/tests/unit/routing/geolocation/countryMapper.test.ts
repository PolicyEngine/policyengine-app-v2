import { describe, expect, test } from 'vitest';
import {
  getDefaultCountry,
  isSupportedCountry,
  mapIsoToRoute,
} from '@/routing/geolocation/countryMapper';
import {
  EXPECTED_ROUTES,
  REMOVED_ISO_CODES,
  SUPPORTED_ISO_CODES,
} from '@/tests/fixtures/routing/geolocation/countryMapperMocks';

describe('countryMapper', () => {
  test('given United States ISO code then maps to the US route', () => {
    expect(mapIsoToRoute(SUPPORTED_ISO_CODES.UNITED_STATES)).toBe(EXPECTED_ROUTES.US);
  });

  test('given British ISO codes then map to the UK route', () => {
    expect(mapIsoToRoute(SUPPORTED_ISO_CODES.GREAT_BRITAIN)).toBe(EXPECTED_ROUTES.UK);
    expect(mapIsoToRoute(SUPPORTED_ISO_CODES.UNITED_KINGDOM)).toBe(EXPECTED_ROUTES.UK);
  });

  test.each(Object.values(REMOVED_ISO_CODES))(
    'given removed country %s then maps to no route',
    (isoCode) => {
      expect(mapIsoToRoute(isoCode)).toBeNull();
      expect(isSupportedCountry(isoCode)).toBe(false);
    }
  );

  test('given any unsupported country then the default is the US', () => {
    expect(getDefaultCountry()).toBe(EXPECTED_ROUTES.US);
  });
});
