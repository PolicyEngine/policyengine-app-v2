export const TEST_DATES = {
  POLICYENGINE_BEGINNING_OF_TIME: '0000-01-01',
  POLICYENGINE_FIRST_YEAR: '0001-01-01',
  POLICYENGINE_YEAR_ZERO_LEAP_DAY: '0000-02-29',
  POLICYENGINE_FIRST_YEAR_INVALID_LEAP_DAY: '0001-02-29',
  ISO_2024_01_01: '2024-01-01',
  ISO_2024_06_15: '2024-06-15',
  ISO_2024_12_31: '2024-12-31',
  ISO_2026_US_DST_START: '2026-03-08',
  ISO_2026_DAY_AFTER_US_DST_START: '2026-03-09',
  ISO_2026_INVALID_LEAP_DAY: '2026-02-29',
  ISO_2024_VALID_LEAP_DAY: '2024-02-29',
  ISO_WITH_TIME: '2024-03-15T14:30:00Z',
} as const;

// Date objects at midnight local time — used to test timezone-safe conversions
export const TEST_DATE_OBJECTS = {
  JAN_1_2025_MIDNIGHT_LOCAL: new Date(2025, 0, 1),
  DEC_31_2024_MIDNIGHT_LOCAL: new Date(2024, 11, 31),
  JUL_4_2025_MIDNIGHT_LOCAL: new Date(2025, 6, 4),
} as const;

// Expected local date strings for the above Date objects
export const EXPECTED_LOCAL_DATE_STRINGS = {
  JAN_1_2025: '2025-01-01',
  DEC_31_2024: '2024-12-31',
  JUL_4_2025: '2025-07-04',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const EXPECTED_FORMATS = {
  POLICYENGINE_BEGINNING_OF_TIME_PERIOD: 'Jun 15, 0000 onward',
  SHORT_MONTH_US: 'Jan 1, 2024',
  FULL_DATE_US: 'January 1, 2024',
  NUMERIC_DATE_US: '1/1/2024',
  YEAR_ONLY: '2024',
} as const;
