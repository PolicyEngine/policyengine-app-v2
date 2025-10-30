// Fixtures for useUserHouseholds and useUserGeographics hooks
import { HouseholdMetadata } from '@/types/ingredients/UserPopulation';
import { GeographicMetadata } from '@/types/ingredients/UserPopulation';

// Test household IDs
export const TEST_HOUSEHOLD_ID_1 = 'household-123';
export const TEST_HOUSEHOLD_ID_2 = 'household-456';

// Test geography IDs
export const TEST_GEOGRAPHY_ID_1 = 'geography-789';
export const TEST_GEOGRAPHY_ID_2 = 'geography-012';

// Test labels
export const TEST_HOUSEHOLD_LABEL = 'Test Household Population';
export const TEST_GEOGRAPHY_LABEL = 'Test Geography Population';

// Mock household metadata
export const mockHouseholdMetadata: HouseholdMetadata = {
  type: 'household',
  household: {
    id: TEST_HOUSEHOLD_ID_1,
    countryId: 'us' as any,
    householdData: {
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
  },
  association: {
    id: 'association-1',
    type: 'household',
    userId: 'user-123',
    label: TEST_HOUSEHOLD_LABEL,
    householdId: TEST_HOUSEHOLD_ID_1,
    createdAt: '2025-01-01T00:00:00Z',
  },
};

export const mockHouseholdMetadata2: HouseholdMetadata = {
  type: 'household',
  household: {
    id: TEST_HOUSEHOLD_ID_2,
    countryId: 'us' as any,
    householdData: {
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
  },
  association: {
    id: 'association-2',
    type: 'household',
    userId: 'user-123',
    label: 'Second Household',
    householdId: TEST_HOUSEHOLD_ID_2,
    createdAt: '2025-01-02T00:00:00Z',
  },
};

// Mock geographic metadata
export const mockGeographicMetadata: GeographicMetadata = {
  type: 'geography',
  geography: {
    id: TEST_GEOGRAPHY_ID_1,
    countryId: 'us' as any,
    scope: 'national',
    geographyId: 'us',
  },
  association: {
    id: 'association-3',
    type: 'geography',
    userId: 'user-123',
    label: TEST_GEOGRAPHY_LABEL,
    countryId: 'us',
    scope: 'national',
    geographyId: 'us',
    createdAt: '2025-01-03T00:00:00Z',
  },
};

export const mockGeographicMetadata2: GeographicMetadata = {
  type: 'geography',
  geography: {
    id: TEST_GEOGRAPHY_ID_2,
    countryId: 'us' as any,
    scope: 'subnational',
    geographyId: 'ca',
  },
  association: {
    id: 'association-4',
    type: 'geography',
    userId: 'user-123',
    label: 'California Population',
    countryId: 'us',
    scope: 'subnational',
    geographyId: 'ca',
    createdAt: '2025-01-04T00:00:00Z',
  },
};

// Mock hook return values
export const mockUseUserHouseholdsSuccess = {
  data: [mockHouseholdMetadata, mockHouseholdMetadata2],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockUseUserHouseholdsLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
};

export const mockUseUserHouseholdsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockUseUserGeographicsSuccess = {
  data: [mockGeographicMetadata, mockGeographicMetadata2],
  isLoading: false,
  isError: false,
  error: null,
};

export const mockUseUserGeographicsLoading = {
  data: undefined,
  isLoading: true,
  isError: false,
  error: null,
};

export const mockUseUserGeographicsEmpty = {
  data: [],
  isLoading: false,
  isError: false,
  error: null,
};
