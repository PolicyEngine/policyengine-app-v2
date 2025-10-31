import type { UserGeographicMetadataWithAssociation } from '@/hooks/useUserGeographic';
import type { UserHouseholdMetadataWithAssociation } from '@/hooks/useUserHousehold';
import type { Simulation } from '@/types/ingredients/Simulation';

/**
 * Test constants for populationMatching utility
 */

export const TEST_HOUSEHOLD_IDS = {
  HOUSEHOLD_123: 'hh-123',
  HOUSEHOLD_456: 'hh-456',
  NON_EXISTENT: 'hh-999',
} as const;

export const TEST_GEOGRAPHY_IDS = {
  CALIFORNIA: 'geo-abc',
  LONDON: 'geo-xyz',
  NON_EXISTENT: 'geo-999',
} as const;

export const TEST_SIMULATION_ID = 'sim-1';
export const TEST_USER_ID = '1';

/**
 * Mock household population data for testing
 */
export const mockHouseholdData: UserHouseholdMetadataWithAssociation[] = [
  {
    association: {
      id: 'user-hh-1',
      userId: TEST_USER_ID,
      householdId: TEST_HOUSEHOLD_IDS.HOUSEHOLD_123,
      countryId: 'us',
      type: 'household',
    },
    household: {
      id: TEST_HOUSEHOLD_IDS.HOUSEHOLD_123,
      country_id: 'us',
      api_version: '1.0.0',
      household_json: '{}' as any,
      household_hash: 'hash123',
    },
    isLoading: false,
    error: null,
  },
  {
    association: {
      id: 'user-hh-2',
      userId: TEST_USER_ID,
      householdId: TEST_HOUSEHOLD_IDS.HOUSEHOLD_456,
      countryId: 'us',
      type: 'household',
    },
    household: {
      id: TEST_HOUSEHOLD_IDS.HOUSEHOLD_456,
      country_id: 'us',
      api_version: '1.0.0',
      household_json: '{}' as any,
      household_hash: 'hash456',
    },
    isLoading: false,
    error: null,
  },
];

/**
 * Mock geographic population data for testing
 */
export const mockGeographicData: UserGeographicMetadataWithAssociation[] = [
  {
    association: {
      id: 'user-geo-1',
      userId: TEST_USER_ID,
      geographyId: TEST_GEOGRAPHY_IDS.CALIFORNIA,
      countryId: 'us',
      type: 'geography',
      scope: 'national',
    },
    geography: {
      id: TEST_GEOGRAPHY_IDS.CALIFORNIA,
      name: 'California',
      countryId: 'us',
      scope: 'national',
      geographyId: 'ca',
    },
    isLoading: false,
    error: null,
  },
  {
    association: {
      id: 'user-geo-2',
      userId: TEST_USER_ID,
      geographyId: TEST_GEOGRAPHY_IDS.LONDON,
      countryId: 'uk',
      type: 'geography',
      scope: 'national',
    },
    geography: {
      id: TEST_GEOGRAPHY_IDS.LONDON,
      name: 'London',
      countryId: 'uk',
      scope: 'national',
      geographyId: 'london',
    },
    isLoading: false,
    error: null,
  },
];

/**
 * Helper to create a mock simulation
 */
export function createMockSimulation(overrides: Partial<Simulation> = {}): Simulation {
  return {
    id: TEST_SIMULATION_ID,
    countryId: 'us',
    policyId: 'policy-1',
    populationType: 'household',
    ...overrides,
  } as Simulation;
}
