import { CountryId } from '@/types/common';

/**
 * Utility for filtering user ingredients by country
 * Provides centralized, reusable filtering logic to enforce
 * country-based separation throughout the application.
 *
 * This ensures users only see items (policies, households, geographies)
 * that belong to their currently selected country.
 */

/**
 * Generic filter for any item with countryId property
 * Returns empty array if items or currentCountry is null/undefined
 *
 * @param items - Array of items to filter (can be undefined)
 * @param currentCountry - Current country ID from Redux state
 * @returns Filtered array containing only items matching currentCountry
 */
export function filterByCountry<T extends { countryId: string }>(
  items: T[] | undefined,
  currentCountry: CountryId | null
): T[] {
  if (!items || !currentCountry) return [];
  return items.filter((item) => item.countryId === currentCountry);
}

/**
 * Filter user policies by country
 * Convenience wrapper around filterByCountry for better semantics
 */
export function filterPoliciesByCountry<T extends { countryId: string }>(
  items: T[] | undefined,
  currentCountry: CountryId | null
): T[] {
  return filterByCountry(items, currentCountry);
}

/**
 * Filter user households by country
 * Convenience wrapper around filterByCountry for better semantics
 */
export function filterHouseholdsByCountry<T extends { countryId: string }>(
  items: T[] | undefined,
  currentCountry: CountryId | null
): T[] {
  return filterByCountry(items, currentCountry);
}

/**
 * Filter user geographies by country
 * Convenience wrapper around filterByCountry for better semantics
 */
export function filterGeographiesByCountry<T extends { countryId: string }>(
  items: T[] | undefined,
  currentCountry: CountryId | null
): T[] {
  return filterByCountry(items, currentCountry);
}
