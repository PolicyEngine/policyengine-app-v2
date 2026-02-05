/**
 * Test fixtures for regionTypes
 */

// Expected US region type values
export const EXPECTED_US_REGION_TYPES = {
  NATIONAL: 'national',
  STATE: 'state',
  CONGRESSIONAL_DISTRICT: 'congressional_district',
  PLACE: 'place',
} as const;

// Expected UK region type values
export const EXPECTED_UK_REGION_TYPES = {
  NATIONAL: 'national',
  COUNTRY: 'country',
  CONSTITUENCY: 'constituency',
  LOCAL_AUTHORITY: 'local_authority',
} as const;

// Valid US scope values for type guards
export const VALID_US_SCOPE_VALUES = [
  'national',
  'state',
  'congressional_district',
  'place',
  'household',
] as const;

// Valid UK scope values for type guards
export const VALID_UK_SCOPE_VALUES = [
  'national',
  'country',
  'constituency',
  'local_authority',
  'household',
] as const;

// Invalid scope values for type guards
export const INVALID_SCOPE_VALUES = ['invalid', 'city', 'county', '', 'NATIONAL', 'State'] as const;
