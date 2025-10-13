import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Mock data for PopulationSubPage tests
 */

// Test IDs
export const TEST_HOUSEHOLD_IDS = {
  FAMILY_OF_FOUR: 'hh-family-four-123',
} as const;

export const TEST_GEOGRAPHY_IDS = {
  CALIFORNIA: 'geo-us-ca',
} as const;

export const TEST_USER_ID = 'user-xyz-789';

// Mock Household
export const mockHousehold: Household = {
  id: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  countryId: 'us',
  householdData: {
    people: {
      person1: {
        age: { '2024': 35 },
        employment_income: { '2024': 50000 },
      },
      person2: {
        age: { '2024': 33 },
        employment_income: { '2024': 45000 },
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
      },
    },
    taxUnits: {
      taxUnit1: {
        members: ['person1', 'person2'],
        state: { '2024': 'CA' },
      },
    },
  },
};

// Mock User Household
export const mockUserHousehold: UserHouseholdPopulation = {
  id: 'user-hh-123',
  type: 'household',
  userId: TEST_USER_ID,
  householdId: TEST_HOUSEHOLD_IDS.FAMILY_OF_FOUR,
  label: 'Family of Four',
  createdAt: '2025-01-15T14:00:00Z',
};

// Mock Geography
export const mockGeography: Geography = {
  id: TEST_GEOGRAPHY_IDS.CALIFORNIA,
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'ca',
  name: 'California',
};
