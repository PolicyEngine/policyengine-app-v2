import type { CountryId } from '@/libs/countries';

/**
 * Canada, Nigeria and Israel: countries the app offered until it was limited
 * to the US and the UK. A URL, saved item or stored setting may still name
 * one of them.
 */
export const REMOVED_COUNTRY_IDS = ['ca', 'ng', 'il'] as const;

/**
 * Canada typed as a country ID, to exercise the runtime guards for a country
 * that arrives from a URL or storage without saved-work support.
 */
export const REMOVED_COUNTRY_AS_COUNTRY_ID = REMOVED_COUNTRY_IDS[0] as string as CountryId;
