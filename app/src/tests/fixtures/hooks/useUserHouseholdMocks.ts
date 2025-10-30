// Fixtures for useUserHouseholds and useUserGeographics hooks
import { Geography } from '@/types/ingredients/Geography';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';

// Test household IDs
export const TEST_HOUSEHOLD_ID_1 = 'household-123';
export const TEST_HOUSEHOLD_ID_2 = 'household-456';

// Test geography IDs
export const TEST_GEOGRAPHY_ID_1 = 'geography-789';
export const TEST_GEOGRAPHY_ID_2 = 'geography-012';

// Test labels
export const TEST_HOUSEHOLD_LABEL = 'Test Household Population';
export const TEST_GEOGRAPHY_LABEL = 'Test Geography Population';

// Mock household metadata (API format)
export const mockApiHouseholdMetadata1: HouseholdMetadata = {
  id: TEST_HOUSEHOLD_ID_1,
  country_id: 'us',
  label: TEST_HOUSEHOLD_LABEL,
  api_version: '1.0.0',
  household_hash: 'hash-123',
  household_json: {
    people: {
      you: {
        age: { '2025': 30 },
        employment_income: { '2025': 50000 },
      },
    },
    families: {},
    spm_units: {},
    households: {
      'your household': {
        members: ['you'],
      },
    },
    marital_units: {},
    tax_units: {
      'your tax unit': {
        members: ['you'],
      },
    },
  },
};

// Mock association
export const mockHouseholdAssociation1: UserHouseholdPopulation = {
  id: 'association-1',
  type: 'household',
  userId: 'user-123',
  label: TEST_HOUSEHOLD_LABEL,
  householdId: TEST_HOUSEHOLD_ID_1,
  countryId: 'us',
  createdAt: '2025-01-01T00:00:00Z',
};

// Combined metadata with association (returned by useUserHouseholds)
export const mockHouseholdMetadata = {
  association: mockHouseholdAssociation1,
  household: mockApiHouseholdMetadata1,
  isLoading: false,
  error: null,
  isError: false,
};

export const mockApiHouseholdMetadata2: HouseholdMetadata = {
  id: TEST_HOUSEHOLD_ID_2,
  country_id: 'us',
  label: 'Second Household',
  api_version: '1.0.0',
  household_hash: 'hash-456',
  household_json: {
    people: {
      you: {
        age: { '2025': 35 },
        employment_income: { '2025': 60000 },
      },
    },
    families: {},
    spm_units: {},
    households: {
      'your household': {
        members: ['you'],
      },
    },
    marital_units: {},
    tax_units: {
      'your tax unit': {
        members: ['you'],
      },
    },
  },
};

export const mockHouseholdAssociation2: UserHouseholdPopulation = {
  id: 'association-2',
  type: 'household',
  userId: 'user-123',
  label: 'Second Household',
  householdId: TEST_HOUSEHOLD_ID_2,
  countryId: 'us',
  createdAt: '2025-01-02T00:00:00Z',
};

export const mockHouseholdMetadata2 = {
  association: mockHouseholdAssociation2,
  household: mockApiHouseholdMetadata2,
  isLoading: false,
  error: null,
  isError: false,
};

// Mock geographic metadata
export const mockGeography1: Geography = {
  id: TEST_GEOGRAPHY_ID_1,
  countryId: 'us' as any,
  scope: 'national',
  geographyId: 'us',
};

export const mockGeographyAssociation1: UserGeographyPopulation = {
  id: 'association-3',
  type: 'geography',
  userId: 'user-123',
  label: TEST_GEOGRAPHY_LABEL,
  countryId: 'us',
  scope: 'national',
  geographyId: 'us',
  createdAt: '2025-01-03T00:00:00Z',
};

export const mockGeographicMetadata = {
  association: mockGeographyAssociation1,
  geography: mockGeography1,
  isLoading: false,
  error: null,
  isError: false,
};

export const mockGeography2: Geography = {
  id: TEST_GEOGRAPHY_ID_2,
  countryId: 'us' as any,
  scope: 'subnational',
  geographyId: 'ca',
};

export const mockGeographyAssociation2: UserGeographyPopulation = {
  id: 'association-4',
  type: 'geography',
  userId: 'user-123',
  label: 'California Population',
  countryId: 'us',
  scope: 'subnational',
  geographyId: 'ca',
  createdAt: '2025-01-04T00:00:00Z',
};

export const mockGeographicMetadata2 = {
  association: mockGeographyAssociation2,
  geography: mockGeography2,
  isLoading: false,
  error: null,
  isError: false,
};

// Mock hook return values
export const mockUseUserHouseholdsSuccess = {
  data: [mockHouseholdMetadata, mockHouseholdMetadata2],
  isLoading: false,
  isError: false,
  error: null,
  associations: [mockHouseholdAssociation1, mockHouseholdAssociation2],
};

export const mockUseUserHouseholdsLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
  associations: undefined,
};

export const mockUseUserHouseholdsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  associations: [],
};

export const mockUseUserGeographicsSuccess = {
  data: [mockGeographicMetadata, mockGeographicMetadata2],
  isLoading: false,
  isError: false,
  error: null,
  associations: [mockGeographyAssociation1, mockGeographyAssociation2],
};

export const mockUseUserGeographicsLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
  associations: undefined,
};

export const mockUseUserGeographicsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
  associations: [],
};
