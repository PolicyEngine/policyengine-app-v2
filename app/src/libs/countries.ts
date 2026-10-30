/**
 * The countries the calculator offers: the one country list in this
 * repository. The website imports this module by relative path (its
 * `isCalculatorCountry`), so it must not import anything through the `@/`
 * alias, which the website resolves against its own source tree.
 */
export const countryIds = ['us', 'uk'] as const;

export type CountryId = (typeof countryIds)[number];

/**
 * Whether a value, such as the first segment of a URL path, is a supported
 * country ID. Exact match only: `'US'` and `' us'` are not countries.
 */
export function isCountryId(value: unknown): value is CountryId {
  return (countryIds as readonly unknown[]).includes(value);
}

/**
 * Default country used as fallback when country hasn't loaded from URL yet.
 * This is necessary for initial state before useCurrentCountry() hook provides the actual country.
 */
export const DEFAULT_COUNTRY = 'us' as const;
