import { countryIds } from '@/libs/countries';

/**
 * Common types used throughout the application
 */

/**
 * Type representing valid country IDs
 * Derived from the countryIds array to ensure type safety
 */
export type CountryId = (typeof countryIds)[number];
