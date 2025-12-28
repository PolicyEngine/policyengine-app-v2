export const countryIds = ['us', 'uk', 'ca', 'ng', 'il'] as const;

/**
 * Default country used as fallback when country hasn't loaded from URL yet.
 * This is necessary for initial state before useCurrentCountry() hook provides the actual country.
 */
export const DEFAULT_COUNTRY = 'us' as const;

export type CountryId = (typeof countryIds)[number];

/**
 * Display labels for each country
 */
export const countryLabels: Record<CountryId, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  ng: 'Nigeria',
  il: 'Israel',
};

/**
 * Country object with id and label for dropdowns
 */
export interface Country {
  id: CountryId;
  label: string;
}

/**
 * All countries as array for dropdowns
 */
export const COUNTRIES: Country[] = countryIds.map((id) => ({
  id,
  label: countryLabels[id],
}));

/**
 * Subset of countries for website (only countries with full org support)
 */
export const WEBSITE_COUNTRIES: Country[] = COUNTRIES.filter((c) =>
  (['us', 'uk'] as CountryId[]).includes(c.id)
);
