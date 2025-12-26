export const countryIds = ['us', 'uk', 'ca', 'ng', 'il'] as const;

/**
 * Default country used as fallback when country hasn't loaded from URL yet.
 * This is necessary for initial state before useCurrentCountry() hook provides the actual country.
 */
export const DEFAULT_COUNTRY = 'us' as const;
