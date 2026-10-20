import { describe, expect, test } from 'vitest';
import { countryIds, DEFAULT_COUNTRY } from '@/libs/countries';

describe('countries', () => {
  test('given the app then it has code for the US and the UK only', () => {
    expect(countryIds).toEqual(['us', 'uk']);
  });

  test('given no country in the URL then the default is a supported country', () => {
    expect(countryIds).toContain(DEFAULT_COUNTRY);
  });
});
