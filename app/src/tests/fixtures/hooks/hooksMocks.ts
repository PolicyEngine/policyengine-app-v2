import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { UserGeographicAssociation } from '@/types/userIngredientAssociations';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCreationPayload } from '@/types/payloads';

// ============= TEST CONSTANTS =============

// User and ID constants
export const TEST_IDS = {
  USER_ID: 'test-user-123',
  HOUSEHOLD_ID: 'household-456',
  HOUSEHOLD_ID_2: 'household-789',
  GEOGRAPHY_ID: 'geography-123',
  GEOGRAPHY_ID_2: 'geography-456',
  TIMESTAMP: '2024-01-15T10:00:00Z',
} as const;

// Labels and descriptions
export const TEST_LABELS = {
  HOUSEHOLD: 'Test Household 2024',
  HOUSEHOLD_2: 'Second Test Household',
  GEOGRAPHY: 'California Region',
  GEOGRAPHY_2: 'New York Region',
  DEFAULT: 'Default Label',
} as const;

// Geographic constants
export const GEO_CONSTANTS = {
  COUNTRY_US: 'us',
  COUNTRY_UK: 'uk',
  REGION_CA: 'ca',
  REGION_NY: 'ny',
  TYPE_NATIONAL: 'national' as const,
  TYPE_SUBNATIONAL: 'subnational' as const,
  REGION_TYPE_STATE: 'state' as const,
  REGION_TYPE_CONSTITUENCY: 'constituency' as const,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  CREATE_FAILED: 'Failed to create household',
  ASSOCIATION_FAILED: 'Household created but association failed:',
  FETCH_FAILED: 'Failed to fetch',
  NETWORK_ERROR: 'Network error',
  NOT_FOUND: 'Not found',
} as const;

// Console log messages for assertions
export const CONSOLE_MESSAGES = {
  ASSOCIATION_ERROR: 'Household created but association failed:',
  USER_ID_LOG: 'userId',
  STORE_LOG: 'store',
  LOGGED_IN_LOG: 'isLoggedIn',
  CONFIG_LOG: 'config',
  ASSOCIATIONS_LOG: 'associations',
  HOUSEHOLD_IDS_LOG: 'householdIds',
  NEW_ASSOCIATION_LOG: 'new association',
  HOUSEHOLD_LOG: 'household in useCreateHouseholdAssociation',
} as const;

// Query key patterns
export const QUERY_KEY_PATTERNS = {
  HOUSEHOLD_ALL: ['households'],
  HOUSEHOLD_BY_ID: (id: string) => ['households', 'byId', id],
  ASSOCIATION_BY_USER: (userId: string) => ['household-associations', 'byUser', userId],
  ASSOCIATION_BY_HOUSEHOLD: (id: string) => ['household-associations', 'byHousehold', id],
  ASSOCIATION_SPECIFIC: (userId: string, id: string) => ['household-associations', 'specific', userId, id],
  GEO_ASSOCIATION_BY_USER: (userId: string) => ['geographic-associations', 'byUser', userId],
  GEO_ASSOCIATION_BY_GEOGRAPHY: (id: string) => ['geographic-associations', 'byGeography', id],
  GEO_ASSOCIATION_SPECIFIC: (userId: string, id: string) => ['geographic-associations', 'specific', userId, id],
} as const;

// Numeric values
export const TEST_VALUES = {
  AGE: 30,
  INCOME: 50000,
  STALE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

// ============= MOCK DATA OBJECTS =============

export const mockHouseholdMetadata: HouseholdMetadata = {
  id: TEST_IDS.HOUSEHOLD_ID.split('-')[1],
  country_id: GEO_CONSTANTS.COUNTRY_US,
  household_json: {
    people: {
      person1: {
        age: { 2024: TEST_VALUES.AGE },
        employment_income: { 2024: TEST_VALUES.INCOME },
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
    },
    marital_units: {
    },
    families: {
    },
  },
  api_version: "v1",
  household_hash: "<household_hash>"
};

export const mockUserHouseholdPopulation: UserHouseholdPopulation = {
  type: 'household',
  id: TEST_IDS.HOUSEHOLD_ID,
  householdId: TEST_IDS.HOUSEHOLD_ID,
  userId: TEST_IDS.USER_ID,
  label: TEST_LABELS.HOUSEHOLD,
  createdAt: TEST_IDS.TIMESTAMP,
  updatedAt: TEST_IDS.TIMESTAMP,
  isCreated: true,
};

export const mockUserHouseholdPopulationList: UserHouseholdPopulation[] = [
  mockUserHouseholdPopulation,
  {
    ...mockUserHouseholdPopulation,
    id: TEST_IDS.HOUSEHOLD_ID_2,
    householdId: TEST_IDS.HOUSEHOLD_ID_2,
    label: TEST_LABELS.HOUSEHOLD_2,
  },
];

export const mockUserGeographicAssociation: UserGeographicAssociation = {
  id: TEST_IDS.GEOGRAPHY_ID,
  userId: TEST_IDS.USER_ID,
  countryCode: GEO_CONSTANTS.COUNTRY_US,
  geographyType: GEO_CONSTANTS.TYPE_SUBNATIONAL,
  geographyIdentifier: `${GEO_CONSTANTS.COUNTRY_US}-${GEO_CONSTANTS.REGION_CA}`,
  regionCode: GEO_CONSTANTS.REGION_CA,
  regionType: GEO_CONSTANTS.REGION_TYPE_STATE,
  label: TEST_LABELS.GEOGRAPHY,
  createdAt: TEST_IDS.TIMESTAMP,
};

export const mockUserGeographicAssociationList: UserGeographicAssociation[] = [
  mockUserGeographicAssociation,
  {
    ...mockUserGeographicAssociation,
    id: TEST_IDS.GEOGRAPHY_ID_2,
    geographyIdentifier: `${GEO_CONSTANTS.COUNTRY_US}-${GEO_CONSTANTS.REGION_NY}`,
    regionCode: GEO_CONSTANTS.REGION_NY,
    label: TEST_LABELS.GEOGRAPHY_2,
  },
];

export const mockHouseholdCreationPayload: HouseholdCreationPayload = {
  country_id: GEO_CONSTANTS.COUNTRY_US,
  data: {
    people: {
      person1: {
        age: { 2024: TEST_VALUES.AGE },
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
        members: ['person1', 'person2'],
      },
    },
    marital_units: {
      unit1: {
        members: ['person1', 'person2'],
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
      },
    }
  },
};

export const mockCreateHouseholdResponse = {
  result: {
    household_id: TEST_IDS.HOUSEHOLD_ID,
  },
};

// ============= MOCK FUNCTIONS =============

// API mocks
export const mockCreateHousehold = vi.fn();
export const mockFetchHouseholdById = vi.fn();

// Store mocks
export const mockHouseholdStoreCreate = vi.fn();
export const mockHouseholdStoreFindByUser = vi.fn();
export const mockHouseholdStoreFindById = vi.fn();

export const mockGeographicStoreCreate = vi.fn();
export const mockGeographicStoreFindByUser = vi.fn();
export const mockGeographicStoreFindById = vi.fn();

// Hook mocks
export const mockCreateHouseholdAssociationMutateAsync = vi.fn();
export const mockUseCreateHouseholdAssociation = {
  mutateAsync: mockCreateHouseholdAssociationMutateAsync,
};

// Query client mock
export const createMockQueryClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  // Spy on methods we'll assert against
  vi.spyOn(queryClient, 'invalidateQueries');
  vi.spyOn(queryClient, 'setQueryData');
  
  return queryClient;
};

// Redux state mock
export const mockReduxState = {
  metadata: {
    currentCountry: GEO_CONSTANTS.COUNTRY_US,
  },
};

// ============= MOCK MODULES =============

// Mock constants module
export const mockConstants = {
  MOCK_USER_ID: TEST_IDS.USER_ID,
};

// Mock query keys
export const mockHouseholdKeys = {
  all: QUERY_KEY_PATTERNS.HOUSEHOLD_ALL,
  byId: QUERY_KEY_PATTERNS.HOUSEHOLD_BY_ID,
};

export const mockHouseholdAssociationKeys = {
  byUser: QUERY_KEY_PATTERNS.ASSOCIATION_BY_USER,
  byHousehold: QUERY_KEY_PATTERNS.ASSOCIATION_BY_HOUSEHOLD,
  specific: QUERY_KEY_PATTERNS.ASSOCIATION_SPECIFIC,
};

export const mockGeographicAssociationKeys = {
  byUser: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_USER,
  byGeography: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_BY_GEOGRAPHY,
  specific: QUERY_KEY_PATTERNS.GEO_ASSOCIATION_SPECIFIC,
};

// Mock stores
export const mockApiHouseholdStore = {
  create: mockHouseholdStoreCreate,
  findByUser: mockHouseholdStoreFindByUser,
  findById: mockHouseholdStoreFindById,
};

export const mockSessionStorageHouseholdStore = {
  create: mockHouseholdStoreCreate,
  findByUser: mockHouseholdStoreFindByUser,
  findById: mockHouseholdStoreFindById,
};

export const mockApiGeographicStore = {
  create: mockGeographicStoreCreate,
  findByUser: mockGeographicStoreFindByUser,
  findById: mockGeographicStoreFindById,
};

export const mockSessionStorageGeographicStore = {
  create: mockGeographicStoreCreate,
  findByUser: mockGeographicStoreFindByUser,
  findById: mockGeographicStoreFindById,
};

// Mock query config
export const mockQueryConfig = {
  api: {
    staleTime: TEST_VALUES.STALE_TIME,
    cacheTime: TEST_VALUES.STALE_TIME * 2,
  },
  sessionStorage: {
    staleTime: 0,
    cacheTime: 0,
  },
};

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

export const resetAllMocks = () => {
  mockCreateHousehold.mockReset();
  mockFetchHouseholdById.mockReset();
  mockHouseholdStoreCreate.mockReset();
  mockHouseholdStoreFindByUser.mockReset();
  mockHouseholdStoreFindById.mockReset();
  mockGeographicStoreCreate.mockReset();
  mockGeographicStoreFindByUser.mockReset();
  mockGeographicStoreFindById.mockReset();
  mockCreateHouseholdAssociationMutateAsync.mockReset();
};