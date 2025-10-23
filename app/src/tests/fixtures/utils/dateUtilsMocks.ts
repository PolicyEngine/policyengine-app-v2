export const TEST_DATES = {
  ISO_2024_01_01: '2024-01-01',
  ISO_2024_06_15: '2024-06-15',
  ISO_2024_12_31: '2024-12-31',
  ISO_WITH_TIME: '2024-03-15T14:30:00Z',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const EXPECTED_FORMATS = {
  SHORT_MONTH_US: 'Jan 1, 2024',
  FULL_DATE_US: 'January 1, 2024',
  NUMERIC_DATE_US: '1/1/2024',
  YEAR_ONLY: '2024',
} as const;
