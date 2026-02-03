/**
 * Centralized region type definitions for US and UK
 * These values are used both in the UI and match the API metadata
 */

/**
 * US region types - used as prefixes in region names and scope selection
 */
export const US_REGION_TYPES = {
  NATIONAL: 'national',
  STATE: 'state',
  CONGRESSIONAL_DISTRICT: 'congressional_district',
  CITY: 'city',
  PLACE: 'place',
} as const;

/**
 * UK region types - used as prefixes in region names and scope selection
 */
export const UK_REGION_TYPES = {
  NATIONAL: 'national',
  COUNTRY: 'country',
  CONSTITUENCY: 'constituency',
  LOCAL_AUTHORITY: 'local_authority',
} as const;

/**
 * US scope types for geographic selection
 * Includes 'household' for custom household scope (not a geographic region)
 */
export type USScopeType = (typeof US_REGION_TYPES)[keyof typeof US_REGION_TYPES] | 'household';

/**
 * UK scope types for geographic selection
 * Includes 'household' for custom household scope (not a geographic region)
 */
export type UKScopeType = (typeof UK_REGION_TYPES)[keyof typeof UK_REGION_TYPES] | 'household';

/**
 * Combined scope type for all countries
 */
export type ScopeType = USScopeType | UKScopeType;

/**
 * Type guard to check if a scope is a US scope type
 */
export function isUSScopeType(scope: string): scope is USScopeType {
  return (
    scope === 'household' ||
    Object.values(US_REGION_TYPES).includes(
      scope as (typeof US_REGION_TYPES)[keyof typeof US_REGION_TYPES]
    )
  );
}

/**
 * Type guard to check if a scope is a UK scope type
 */
export function isUKScopeType(scope: string): scope is UKScopeType {
  return (
    scope === 'household' ||
    Object.values(UK_REGION_TYPES).includes(
      scope as (typeof UK_REGION_TYPES)[keyof typeof UK_REGION_TYPES]
    )
  );
}
