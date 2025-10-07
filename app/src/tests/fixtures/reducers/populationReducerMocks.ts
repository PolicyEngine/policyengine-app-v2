import { CURRENT_YEAR } from '@/constants';
import { vi } from 'vitest';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Population } from '@/types/ingredients/Population';

// ============= TEST CONSTANTS =============

// IDs and identifiers
export const POPULATION_IDS = {
  HOUSEHOLD_ID: '123',
  HOUSEHOLD_ID_NEW: '456',
  GEOGRAPHY_ID: 'test-geography',
  GEOGRAPHY_ID_NEW: 'test-geography-2',
  PERSON_ID_1: 'person-001',
  PERSON_ID_2: 'person-002',
  FAMILY_ID: 'family-001',
  TAX_UNIT_ID: 'taxunit-001',
  SPM_UNIT_ID: 'spmunit-001',
  MARITAL_UNIT_ID: 'maritalunit-001',
  BENEFIT_UNIT_ID: 'benunit-001',
} as const;

// Labels
export const POPULATION_LABELS = {
  DEFAULT: 'Test Population',
  UPDATED: 'Updated Population Label',
  HOUSEHOLD: 'My Household Configuration',
  GEOGRAPHY: 'California State Population',
} as const;

// Countries and regions
export const POPULATION_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  NG: 'ng',
  IL: 'il',
} as const;

export const POPULATION_REGIONS = {
  CALIFORNIA: 'ca',
  NEW_YORK: 'ny',
  ENGLAND: 'england',
  SCOTLAND: 'scotland',
} as const;

// Years
export const POPULATION_YEARS = {
  DEFAULT: CURRENT_YEAR,
  PAST: '2023',
  FUTURE: CURRENT_YEAR,
} as const;

// Action types (for testing action creators)
export const POPULATION_ACTION_TYPES = {
  CLEAR: 'population/clearPopulation',
  UPDATE_ID: 'population/updatePopulationId',
  UPDATE_LABEL: 'population/updatePopulationLabel',
  MARK_CREATED: 'population/markPopulationAsCreated',
  SET_HOUSEHOLD: 'population/setHousehold',
  INITIALIZE_HOUSEHOLD: 'population/initializeHousehold',
  SET_GEOGRAPHY: 'population/setGeography',
} as const;

// ============= MOCK DATA OBJECTS =============

// Mock household data
export const mockHousehold: Household = {
  id: POPULATION_IDS.HOUSEHOLD_ID,
  countryId: POPULATION_COUNTRIES.US as any,
  householdData: {
    people: {
      [POPULATION_IDS.PERSON_ID_1]: {
        age: {
          [POPULATION_YEARS.DEFAULT]: 30,
        },
        employment_income: {
          [POPULATION_YEARS.DEFAULT]: 50000,
        },
      },
      [POPULATION_IDS.PERSON_ID_2]: {
        age: {
          [POPULATION_YEARS.DEFAULT]: 28,
        },
        employment_income: {
          [POPULATION_YEARS.DEFAULT]: 45000,
        },
      },
    },
    families: {
      [POPULATION_IDS.FAMILY_ID]: {
        members: [POPULATION_IDS.PERSON_ID_1, POPULATION_IDS.PERSON_ID_2],
      },
    },
    households: {
      'your household': {
        members: [POPULATION_IDS.PERSON_ID_1, POPULATION_IDS.PERSON_ID_2],
      },
    },
  },
};

export const mockHouseholdUK: Household = {
  id: POPULATION_IDS.HOUSEHOLD_ID,
  countryId: POPULATION_COUNTRIES.UK as any,
  householdData: {
    people: {
      [POPULATION_IDS.PERSON_ID_1]: {
        age: {
          [POPULATION_YEARS.DEFAULT]: 35,
        },
      },
    },
    benunits: {
      [POPULATION_IDS.BENEFIT_UNIT_ID]: {
        members: [POPULATION_IDS.PERSON_ID_1],
      },
    },
    households: {
      'your household': {
        members: [POPULATION_IDS.PERSON_ID_1],
      },
    },
  },
};

// Mock geography data
export const mockGeography: Geography = {
  id: POPULATION_IDS.GEOGRAPHY_ID,
  countryId: POPULATION_COUNTRIES.US as any,
  scope: 'subnational',
  geographyId: `${POPULATION_COUNTRIES.US}-${POPULATION_REGIONS.CALIFORNIA}`,
  name: 'California',
};

export const mockGeographyNational: Geography = {
  id: POPULATION_IDS.GEOGRAPHY_ID,
  countryId: POPULATION_COUNTRIES.UK as any,
  scope: 'national',
  geographyId: POPULATION_COUNTRIES.UK,
  name: 'United Kingdom',
};

// Initial state variations
export const mockInitialState: Population = {
  label: null,
  isCreated: false,
  household: null,
  geography: null,
};

export const mockStateWithHousehold: Population = {
  label: POPULATION_LABELS.HOUSEHOLD,
  isCreated: false,
  household: mockHousehold,
  geography: null,
};

export const mockStateWithGeography: Population = {
  label: POPULATION_LABELS.GEOGRAPHY,
  isCreated: false,
  household: null,
  geography: mockGeography,
};

export const mockStateCreated: Population = {
  label: POPULATION_LABELS.DEFAULT,
  isCreated: true,
  household: mockHousehold,
  geography: null,
};

export const mockStateComplete: Population = {
  label: POPULATION_LABELS.DEFAULT,
  isCreated: true,
  household: mockHousehold,
  geography: null,
};

// ============= MOCK FUNCTIONS =============

// Mock HouseholdBuilder
export const mockHouseholdBuilderBuild = vi.fn();
export const mockHouseholdBuilder = vi.fn(() => ({
  build: mockHouseholdBuilderBuild,
}));

// Default mock implementation for HouseholdBuilder
export const setupMockHouseholdBuilder = (returnValue: Household = mockHousehold) => {
  mockHouseholdBuilderBuild.mockReturnValue(returnValue);
  return mockHouseholdBuilder;
};

// ============= TEST HELPERS =============

// Helper to create a new household for a specific country
export const createMockHouseholdForCountry = (countryId: string): Household => {
  const baseHousehold: Household = {
    id: `household-${countryId}`,
    countryId: countryId as any,
    householdData: {
      people: {
        [POPULATION_IDS.PERSON_ID_1]: {
          age: {
            [POPULATION_YEARS.DEFAULT]: 30,
          },
        },
      },
      households: {
        'your household': {
          members: [POPULATION_IDS.PERSON_ID_1],
        },
      },
    },
  };

  // Add country-specific entities
  switch (countryId) {
    case POPULATION_COUNTRIES.US:
      baseHousehold.householdData.families = {
        [POPULATION_IDS.FAMILY_ID]: {
          members: [POPULATION_IDS.PERSON_ID_1],
        },
      };
      baseHousehold.householdData.taxUnits = {
        [POPULATION_IDS.TAX_UNIT_ID]: {
          members: [POPULATION_IDS.PERSON_ID_1],
        },
      };
      baseHousehold.householdData.spmUnits = {
        [POPULATION_IDS.SPM_UNIT_ID]: {
          members: [POPULATION_IDS.PERSON_ID_1],
        },
      };
      baseHousehold.householdData.maritalUnits = {
        [POPULATION_IDS.MARITAL_UNIT_ID]: {
          members: [POPULATION_IDS.PERSON_ID_1],
        },
      };
      break;
    case POPULATION_COUNTRIES.UK:
      baseHousehold.householdData.benunits = {
        [POPULATION_IDS.BENEFIT_UNIT_ID]: {
          members: [POPULATION_IDS.PERSON_ID_1],
        },
      };
      break;
    // Other countries just have people and households
  }

  return baseHousehold;
};

// Helper to create a geography for testing
export const createMockGeography = (
  countryCode: string,
  scope: 'national' | 'subnational' = 'national',
  regionCode?: string
): Geography => {
  const geography: Geography = {
    id: `geo-${countryCode}`,
    countryId: countryCode as any,
    scope,
    geographyId: scope === 'national' ? countryCode : `${countryCode}-${regionCode}`,
    name: `Test ${countryCode.toUpperCase()} Geography`,
  };

  return geography;
};

// Helper to verify state matches expected
export const expectStateToMatch = (actualState: Population, expectedState: Population): void => {
  expect(actualState.label).toBe(expectedState.label);
  expect(actualState.isCreated).toBe(expectedState.isCreated);
  expect(actualState.household).toEqual(expectedState.household);
  expect(actualState.geography).toEqual(expectedState.geography);
};

// Helper to create an action payload
export const createAction = <T>(type: string, payload?: T) => ({
  type,
  payload,
});

// Reset all mocks
export const resetAllMocks = () => {
  mockHouseholdBuilderBuild.mockReset();
  mockHouseholdBuilder.mockClear();
};
