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
} as const;
