/**
 * Mock data for constituency utility tests
 */

export const MOCK_GEOGRAPHY_IDS = {
  UK_NATIONAL: 'uk',
  CONSTITUENCY_BRIGHTON: 'constituency/Brighton Kemptown and Peacehaven',
  CONSTITUENCY_ALDERSHOT: 'constituency/Aldershot',
  COUNTRY_ENGLAND: 'country/england',
  COUNTRY_SCOTLAND: 'country/scotland',
  COUNTRY_WALES: 'country/wales',
  COUNTRY_WITH_UNDERSCORE: 'country/northern_ireland',
  US_STATE: 'ca',
  INVALID: 'invalid-format',
} as const;

export const EXPECTED_NAMES = {
  CONSTITUENCY_BRIGHTON: 'Brighton Kemptown and Peacehaven',
  CONSTITUENCY_ALDERSHOT: 'Aldershot',
  COUNTRY_ENGLAND: 'england',
  COUNTRY_SCOTLAND: 'scotland',
  COUNTRY_WALES: 'wales',
  COUNTRY_NI_WITH_SPACE: 'northern ireland',
} as const;

export const EXPECTED_REGION_KEYS = {
  COUNTRY_ENGLAND: 'england',
  COUNTRY_SCOTLAND: 'scotland',
  CONSTITUENCY_BRIGHTON: 'Brighton Kemptown and Peacehaven',
} as const;
