import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { countryIds, isCountryId } from '@/libs/countries';

describe('isCountryId', () => {
  test.each(countryIds)('given the supported country %s then it is a country ID', (countryId) => {
    expect(isCountryId(countryId)).toBe(true);
  });

  test.each([undefined, null, 0, {}, ['us'], 'US', 'usa', 'llms.txt', ''])(
    'given %j then it is not a country ID',
    (value) => {
      expect(isCountryId(value)).toBe(false);
    }
  );

  test('given any value then it is a country ID only when it is one of countryIds', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        if (isCountryId(value)) {
          expect(countryIds).toContain(value);
        }
      })
    );
  });

  // Every country ID is two lower-case letters, so padding one never yields another.
  test('given every supported country then it is two lower-case letters', () => {
    for (const countryId of countryIds) {
      expect(countryId).toMatch(/^[a-z]{2}$/);
    }
  });

  test('given a supported country with anything added around it then it is not a country ID', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...countryIds),
        fc.string({ unit: 'binary' }),
        fc.string({ unit: 'binary' }),
        (countryId, before, after) => {
          fc.pre(before.length + after.length > 0);
          expect(isCountryId(`${before}${countryId}${after}`)).toBe(false);
        }
      )
    );
  });

  test('given a supported country in upper case then it is not a country ID', () => {
    for (const countryId of countryIds) {
      expect(isCountryId(countryId.toUpperCase())).toBe(false);
    }
  });
});
