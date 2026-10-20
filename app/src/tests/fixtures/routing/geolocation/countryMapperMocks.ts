// ISO 3166-1 alpha-2 codes the geolocation providers can report
export const SUPPORTED_ISO_CODES = {
  UNITED_STATES: 'US',
  GREAT_BRITAIN: 'GB',
  UNITED_KINGDOM: 'UK',
} as const;

// Countries the app no longer serves; they fall back to the default country
export const REMOVED_ISO_CODES = {
  CANADA: 'CA',
  NIGERIA: 'NG',
  ISRAEL: 'IL',
} as const;

export const EXPECTED_ROUTES = {
  US: 'us',
  UK: 'uk',
} as const;
