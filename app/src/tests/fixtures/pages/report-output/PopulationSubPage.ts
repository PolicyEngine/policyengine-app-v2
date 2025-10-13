import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Mock data for PopulationSubPage tests
 */

// Test IDs
export const TEST_HOUSEHOLD_IDS = {
  FAMILY_OF_FOUR: 'hh-family-four-123',
  SINGLE_PERSON: 'hh-single-person-456',
} as const;

export const TEST_GEOGRAPHY_IDS = {
  CALIFORNIA: 'geo-us-ca',
  NEW_YORK: 'geo-us-ny',
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

// Mock second household for multiple household tests
export const mockHouseholdSinglePerson: Household = {
  id: TEST_HOUSEHOLD_IDS.SINGLE_PERSON,
  countryId: 'us',
  householdData: {
    people: {
      person1: {
        age: { '2024': 28 },
        employment_income: { '2024': 60000 },
      },
    },
    families: {
      family1: {
        members: ['person1'],
      },
    },
    taxUnits: {
      taxUnit1: {
        members: ['person1'],
        state: { '2024': 'NY' },
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

// Mock second geography for multiple geography tests
export const mockGeographyNewYork: Geography = {
  id: TEST_GEOGRAPHY_IDS.NEW_YORK,
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'ny',
  name: 'New York',
};

// Test prop configurations (helpers for common test scenarios)
export const createPopulationSubPageProps = {
  emptyHousehold: () => ({
    households: [],
    geographies: [],
    userHouseholds: [],
    populationType: 'household' as const,
  }),
  undefinedHousehold: () => ({
    households: undefined,
    geographies: undefined,
    userHouseholds: undefined,
    populationType: 'household' as const,
  }),
  emptyGeography: () => ({
    households: [],
    geographies: [],
    userHouseholds: [],
    populationType: 'geography' as const,
  }),
  undefinedGeography: () => ({
    households: undefined,
    geographies: undefined,
    userHouseholds: undefined,
    populationType: 'geography' as const,
  }),
  singleHousehold: () => ({
    households: [mockHousehold],
    geographies: [],
    userHouseholds: [mockUserHousehold],
    populationType: 'household' as const,
  }),
  multipleHouseholds: () => ({
    households: [mockHousehold, mockHouseholdSinglePerson],
    geographies: [],
    userHouseholds: [mockUserHousehold],
    populationType: 'household' as const,
  }),
  singleGeography: () => ({
    households: [],
    geographies: [mockGeography],
    userHouseholds: [],
    populationType: 'geography' as const,
  }),
  multipleGeographies: () => ({
    households: [],
    geographies: [mockGeography, mockGeographyNewYork],
    userHouseholds: [],
    populationType: 'geography' as const,
  }),
};
