/**
 * Test constants for reportRouting utility
 */

export const TEST_COUNTRY = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_REPORT_IDS = {
  NUMERIC: 12345,
  STRING: 'report-abc-123',
  WITH_SPECIAL_CHARS: 'report_id-123',
  GENERIC: '999',
} as const;

export const EXPECTED_PATHS = {
  US_NUMERIC: '/us/report-output/12345',
  UK_STRING: '/uk/report-output/report-abc-123',
  US_SPECIAL_CHARS: '/us/report-output/report_id-123',
  UK_GENERIC: '/uk/report-output/999',
} as const;
