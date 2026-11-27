export const MOCK_COUNTRIES = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
] as const;

export const TEST_COUNTRY_IDS = {
  US: 'us',
  UK: 'uk',
} as const;

export const MOCK_PATHS = {
  US_HOME: '/us',
  UK_HOME: '/uk',
  US_POLICY: '/us/policy/123',
  UK_POLICY: '/uk/policy/456',
  /** A v3 saved report, whose ID belongs to the US. */
  US_REPORT: '/us/report/sur-123',
  /** A v3 bill report; the bill tracker holds US bills only. */
  US_BILL_REPORT: '/us/report/bill/hr-1',
} as const;
