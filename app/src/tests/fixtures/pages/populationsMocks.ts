import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { Household as HouseholdModel } from '@/models/Household';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

// ============= TEST CONSTANTS =============

// IDs and identifiers
export const POPULATION_TEST_IDS = {
  USER_ID: 'test-user-123',
  HOUSEHOLD_ID_1: '1',
  HOUSEHOLD_ID_2: '2',
  GEOGRAPHIC_ID_1: '1',
  GEOGRAPHIC_ID_2: '2',
  TIMESTAMP_1: `${CURRENT_YEAR}-01-15T10:00:00Z`,
  TIMESTAMP_2: `${CURRENT_YEAR}-01-20T14:30:00Z`,
} as const;

// Labels and display text
export const POPULATION_LABELS = {
  HOUSEHOLD_1: 'My Test Household',
  HOUSEHOLD_2: `Family Household ${CURRENT_YEAR}`,
  GEOGRAPHIC_1: 'California Population',
  GEOGRAPHIC_2: 'United Kingdom National',
  PAGE_TITLE: 'Your saved households',
  PAGE_SUBTITLE:
    'Configure one or a collection of households to use in your simulation configurations.',
  BUILD_BUTTON: 'New household(s)',
  SEARCH_PLACEHOLDER: 'Search households',
  MORE_FILTERS: 'More filters',
  LOADING_TEXT: 'Loading...',
  ERROR_TEXT: 'Error loading data',
} as const;

// Geographic constants
export const POPULATION_GEO = {
  COUNTRY_US: 'us',
  COUNTRY_UK: 'uk',
  STATE_CA: 'ca',
  STATE_NY: 'ny',
  TYPE_NATIONAL: 'national' as const,
  TYPE_SUBNATIONAL: 'subnational' as const,
  REGION_TYPE_STATE: 'state' as const,
  REGION_TYPE_CONSTITUENCY: 'constituency' as const,
} as const;

// Menu actions
export const POPULATION_ACTIONS = {
  VIEW_DETAILS: 'view-population',
  BOOKMARK: 'bookmark',
  EDIT: 'edit',
  SHARE: 'share',
  DELETE: 'delete',
} as const;

// Action labels
export const POPULATION_ACTION_LABELS = {
  VIEW_DETAILS: 'View details',
  BOOKMARK: 'Bookmark',
  EDIT: 'Edit',
  SHARE: 'Share',
  DELETE: 'Delete',
} as const;

// Column headers
export const POPULATION_COLUMNS = {
  NAME: 'Household name',
  DATE: 'Date created',
  DETAILS: 'Details',
  CONNECTIONS: 'Connections',
} as const;

// Detail text patterns
export const POPULATION_DETAILS = {
  PERSON_SINGULAR: '1 person',
  PERSON_PLURAL: (count: number) => `${count} persons`,
  HOUSEHOLD_SINGULAR: '1 household',
  HOUSEHOLD_PLURAL: (count: number) => `${count} households`,
  NATIONAL: 'National',
  SUBNATIONAL: 'Subnational',
  STATE_PREFIX: 'State:',
  CONSTITUENCY_PREFIX: 'Constituency:',
  SAMPLE_SIMULATION: 'Sample simulation',
  SAMPLE_REPORT: 'Sample report',
  AVAILABLE_FOR_SIMULATIONS: 'Available for simulations',
} as const;

// Console log messages
export const POPULATION_CONSOLE = {
  MORE_FILTERS: 'More filters clicked',
  VIEW_DETAILS: (id: string) => `View details: ${id}`,
  BOOKMARK: (id: string) => `Bookmark population: ${id}`,
  EDIT: (id: string) => `Edit population: ${id}`,
  SHARE: (id: string) => `Share population: ${id}`,
  DELETE: (id: string) => `Delete population: ${id}`,
  UNKNOWN_ACTION: (action: string) => `Unknown action: ${action}`,
} as const;

// Error messages
export const POPULATION_ERRORS = {
  HOUSEHOLD_FETCH_FAILED: 'Failed to fetch household data',
  GEOGRAPHIC_FETCH_FAILED: 'Failed to fetch geographic data',
  COMBINED_ERROR: 'Error loading population data',
} as const;

// ============= MOCK DATA OBJECTS =============

// Mock household metadata
export const mockHouseholdMetadata1: HouseholdMetadata = {
  id: POPULATION_TEST_IDS.HOUSEHOLD_ID_1.split('-')[1],
  country_id: POPULATION_GEO.COUNTRY_US,
  household_json: {
    people: {
      person1: {
        age: { [CURRENT_YEAR]: 30 },
        employment_income: { [CURRENT_YEAR]: 50000 },
      },
      person2: {
        age: { [CURRENT_YEAR]: 28 },
        employment_income: { [CURRENT_YEAR]: 45000 },
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
      },
    },
    tax_units: {
      unit1: {
        members: ['person1'],
      },
    },
    spm_units: {
      unit1: {
        members: ['person1'],
      },
    },
    households: {
      household1: {
        members: ['person1'],
      },
    },
    marital_units: {
      unit1: {
        members: ['person1'],
      },
    },
  },
  api_version: 'v1',
  household_hash: '<household_hash>',
};

export const mockHouseholdMetadata2: HouseholdMetadata = {
  id: POPULATION_TEST_IDS.HOUSEHOLD_ID_2.split('-')[1],
  country_id: POPULATION_GEO.COUNTRY_US,
  household_json: {
    people: {
      person1: {
        age: { [CURRENT_YEAR]: 45 },
      },
    },
    families: {},
    tax_units: {
      unit1: {
        members: ['person1'],
      },
    },
    spm_units: {
      unit1: {
        members: ['person1'],
      },
    },
    households: {
      household1: {
        members: ['person1'],
      },
    },
    marital_units: {
      unit1: {
        members: ['person1'],
      },
    },
  },
  api_version: 'v1',
  household_hash: '<household_hash>',
};

// Mock household associations
export const mockHouseholdAssociation1: UserHouseholdPopulation = {
  type: 'household',
  id: POPULATION_TEST_IDS.HOUSEHOLD_ID_1,
  householdId: POPULATION_TEST_IDS.HOUSEHOLD_ID_1,
  userId: POPULATION_TEST_IDS.USER_ID,
  countryId: POPULATION_GEO.COUNTRY_US,
  label: POPULATION_LABELS.HOUSEHOLD_1,
  createdAt: POPULATION_TEST_IDS.TIMESTAMP_1,
  updatedAt: POPULATION_TEST_IDS.TIMESTAMP_1,
  isCreated: true,
};

export const mockHouseholdAssociation2: UserHouseholdPopulation = {
  type: 'household',
  id: POPULATION_TEST_IDS.HOUSEHOLD_ID_2,
  householdId: POPULATION_TEST_IDS.HOUSEHOLD_ID_2,
  userId: POPULATION_TEST_IDS.USER_ID,
  countryId: POPULATION_GEO.COUNTRY_US,
  label: POPULATION_LABELS.HOUSEHOLD_2,
  createdAt: POPULATION_TEST_IDS.TIMESTAMP_2,
  updatedAt: POPULATION_TEST_IDS.TIMESTAMP_2,
  isCreated: true,
};

export const mockHousehold1 = HouseholdModel.fromV1Metadata(mockHouseholdMetadata1);

export const mockHousehold2 = HouseholdModel.fromV1Metadata(mockHouseholdMetadata2);

// Mock geographic associations
export const mockGeographicAssociation1: UserGeographyPopulation = {
  type: 'geography',
  id: POPULATION_TEST_IDS.GEOGRAPHIC_ID_1,
  userId: POPULATION_TEST_IDS.USER_ID,
  countryId: POPULATION_GEO.COUNTRY_US,
  scope: POPULATION_GEO.TYPE_SUBNATIONAL,
  geographyId: POPULATION_GEO.STATE_CA,
  label: POPULATION_LABELS.GEOGRAPHIC_1,
  createdAt: POPULATION_TEST_IDS.TIMESTAMP_1,
};

export const mockGeographicAssociation2: UserGeographyPopulation = {
  type: 'geography',
  id: POPULATION_TEST_IDS.GEOGRAPHIC_ID_2,
  userId: POPULATION_TEST_IDS.USER_ID,
  countryId: POPULATION_GEO.COUNTRY_UK,
  scope: POPULATION_GEO.TYPE_NATIONAL,
  geographyId: POPULATION_GEO.COUNTRY_UK,
  label: POPULATION_LABELS.GEOGRAPHIC_2,
  createdAt: POPULATION_TEST_IDS.TIMESTAMP_2,
};

export const createMockHousehold1 = (): HouseholdModel =>
  HouseholdModel.fromCanonicalInput(mockHousehold1.toCanonicalInput());

export const createMockHousehold2 = (): HouseholdModel =>
  HouseholdModel.fromCanonicalInput(mockHousehold2.toCanonicalInput());

export const createMockHouseholdAssociation1 = (): UserHouseholdPopulation =>
  cloneValue(mockHouseholdAssociation1);

export const createMockHouseholdAssociation2 = (): UserHouseholdPopulation =>
  cloneValue(mockHouseholdAssociation2);

export const createMockGeographicAssociation1 = (): UserGeographyPopulation =>
  cloneValue(mockGeographicAssociation1);

export const createMockGeographicAssociation2 = (): UserGeographyPopulation =>
  cloneValue(mockGeographicAssociation2);

export const createMockUserHouseholdsData = () => [
  {
    association: createMockHouseholdAssociation1(),
    household: createMockHousehold1(),
    isLoading: false,
    error: null,
  },
  {
    association: createMockHouseholdAssociation2(),
    household: createMockHousehold2(),
    isLoading: false,
    error: null,
  },
];

export const createMockGeographicAssociationsData = () => [
  createMockGeographicAssociation1(),
  createMockGeographicAssociation2(),
];

// Combined mock data for useUserHouseholds hook
export const mockUserHouseholdsData = createMockUserHouseholdsData();

export const mockGeographicAssociationsData = createMockGeographicAssociationsData();

// ============= MOCK FUNCTIONS =============

// Redux dispatch mock
export const mockDispatch = vi.fn();

// Hook mocks
export const mockUseUserHouseholds = vi.fn(() => ({
  data: createMockUserHouseholdsData(),
  isLoading: false,
  isError: false,
  error: null,
}));

export const mockUseGeographicAssociationsByUser = vi.fn(() => ({
  data: createMockGeographicAssociationsData(),
  isLoading: false,
  isError: false,
  error: null,
}));

// ============= TEST HELPERS =============

export const setupMockConsole = () => {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  };

  return {
    consoleSpy,
    restore: () => {
      consoleSpy.log.mockRestore();
      consoleSpy.error.mockRestore();
      consoleSpy.warn.mockRestore();
    },
  };
};

// Helper to create loading states
export const createLoadingState = (householdLoading = true, geographicLoading = false) => ({
  household: {
    data: householdLoading ? undefined : createMockUserHouseholdsData(),
    isLoading: householdLoading,
    isError: false,
    error: null,
  },
  geographic: {
    data: geographicLoading ? undefined : createMockGeographicAssociationsData(),
    isLoading: geographicLoading,
    isError: false,
    error: null,
  },
});

// Helper to create error states
export const createErrorState = (householdError = false, geographicError = false) => ({
  household: {
    data: householdError ? undefined : createMockUserHouseholdsData(),
    isLoading: false,
    isError: householdError,
    error: householdError ? new Error(POPULATION_ERRORS.HOUSEHOLD_FETCH_FAILED) : null,
  },
  geographic: {
    data: geographicError ? undefined : createMockGeographicAssociationsData(),
    isLoading: false,
    isError: geographicError,
    error: geographicError ? new Error(POPULATION_ERRORS.GEOGRAPHIC_FETCH_FAILED) : null,
  },
});

// Helper to create empty data states
export const createEmptyDataState = () => ({
  household: {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  },
  geographic: {
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  },
});
