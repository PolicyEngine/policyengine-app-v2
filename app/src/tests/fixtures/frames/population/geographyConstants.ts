/**
 * Test constants for geography-related tests
 */

// Countries
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  UNKNOWN: 'unknown',
} as const;

// Scope types
export const TEST_SCOPES = {
  NATIONAL: 'national',
  SUBNATIONAL: 'subnational',
} as const;

// US State examples
export const US_STATES = {
  CALIFORNIA_WITH_PREFIX: 'state/ca',
  CALIFORNIA_WITHOUT_PREFIX: 'ca',
  NEW_YORK_WITH_PREFIX: 'state/ny',
  NEW_YORK_WITHOUT_PREFIX: 'ny',
  TEXAS_WITH_PREFIX: 'state/tx',
  TEXAS_WITHOUT_PREFIX: 'tx',
} as const;

// UK Region examples
export const UK_REGIONS = {
  CONSTITUENCY_BRIGHTON: 'constituency/Brighton Kemptown and Peacehaven',
  CONSTITUENCY_ALDERSHOT: 'constituency/Aldershot',
  COUNTRY_ENGLAND: 'country/england',
  COUNTRY_SCOTLAND: 'country/scotland',
  COUNTRY_WALES: 'country/wales',
  COUNTRY_NI: 'country/ni',
} as const;

// Expected formatted IDs
export const EXPECTED_GEOGRAPHY_IDS = {
  US_NATIONAL: 'us',
  UK_NATIONAL: 'uk',
  US_CALIFORNIA: 'ca',
  US_NEW_YORK: 'ny',
  UK_CONSTITUENCY_BRIGHTON: 'constituency/Brighton Kemptown and Peacehaven',
  UK_CONSTITUENCY_ALDERSHOT: 'constituency/Aldershot',
  UK_COUNTRY_SCOTLAND: 'country/scotland',
} as const;

// Expected display IDs
export const EXPECTED_DISPLAY_IDS = {
  US_NATIONAL: 'us',
  UK_NATIONAL: 'uk',
  US_CALIFORNIA: 'us-ca',
  US_NEW_YORK: 'us-ny',
  UK_CONSTITUENCY_BRIGHTON: 'uk-constituency-Brighton Kemptown and Peacehaven',
  UK_CONSTITUENCY_ALDERSHOT: 'uk-constituency-Aldershot',
  UK_COUNTRY_SCOTLAND: 'uk-country-scotland',
} as const;

// Edge cases
export const EDGE_CASES = {
  EMPTY_STRING: '',
  TRAILING_SLASH: 'state/',
  JUST_SLASH: '/',
  MULTIPLE_SLASHES: 'country/region/subregion',
} as const;
