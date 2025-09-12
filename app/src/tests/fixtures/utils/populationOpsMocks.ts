import { vi } from 'vitest';
import {
  UserGeographyPopulation,
  UserHouseholdPopulation,
} from '@/types/ingredients/UserPopulation';
import { GeographyPopulationRef, HouseholdPopulationRef } from '@/utils/PopulationOps';

// ============= TEST CONSTANTS =============

// IDs
export const POPULATION_IDS = {
  HOUSEHOLD_1: 'household-123',
  HOUSEHOLD_2: 'household-456',
  HOUSEHOLD_EMPTY: '',
  GEOGRAPHY_1: 'us-ca',
  GEOGRAPHY_2: 'uk-england',
  GEOGRAPHY_EMPTY: '',
  USER_1: 'user-123',
  USER_2: 'user-456',
} as const;

// Labels
export const POPULATION_LABELS = {
  CUSTOM_LABEL: 'My Custom Population',
  HOUSEHOLD_LABEL: 'My Household Configuration',
  GEOGRAPHY_LABEL: 'California State',
} as const;

// Countries
export const POPULATION_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// Scopes
export const POPULATION_SCOPES = {
  NATIONAL: 'national',
  SUBNATIONAL: 'subnational',
} as const;

// Expected strings
export const EXPECTED_LABELS = {
  HOUSEHOLD_DEFAULT: (id: string) => `Household ${id}`,
  GEOGRAPHY_DEFAULT: (id: string) => `Geography: ${id}`,
  HOUSEHOLD_TYPE: 'Household',
  GEOGRAPHY_TYPE: 'Geography',
  NATIONAL_PREFIX: 'National',
  REGIONAL_PREFIX: 'Regional',
} as const;

// Cache keys
export const EXPECTED_CACHE_KEYS = {
  HOUSEHOLD: (id: string) => `household:${id}`,
  GEOGRAPHY: (id: string) => `geography:${id}`,
} as const;

// API payload keys
export const API_PAYLOAD_KEYS = {
  POPULATION_ID: 'population_id',
  HOUSEHOLD_ID: 'household_id',
  GEOGRAPHY_ID: 'geography_id',
  REGION: 'region',
} as const;

// ============= MOCK DATA OBJECTS =============

// Household population references
export const mockHouseholdPopRef1: HouseholdPopulationRef = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_1,
};

export const mockHouseholdPopRef2: HouseholdPopulationRef = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_2,
};

export const mockHouseholdPopRefEmpty: HouseholdPopulationRef = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_EMPTY,
};

// Geography population references
export const mockGeographyPopRef1: GeographyPopulationRef = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_1,
};

export const mockGeographyPopRef2: GeographyPopulationRef = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_2,
};

export const mockGeographyPopRefEmpty: GeographyPopulationRef = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_EMPTY,
};

// User household populations
export const mockUserHouseholdPop: UserHouseholdPopulation = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_1,
  userId: POPULATION_IDS.USER_1,
  label: POPULATION_LABELS.HOUSEHOLD_LABEL,
  isCreated: true,
};

export const mockUserHouseholdPopNoLabel: UserHouseholdPopulation = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_2,
  userId: POPULATION_IDS.USER_2,
};

export const mockUserHouseholdPopInvalid: UserHouseholdPopulation = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_EMPTY,
  userId: POPULATION_IDS.USER_1,
};

export const mockUserHouseholdPopNoUser: UserHouseholdPopulation = {
  type: 'household',
  householdId: POPULATION_IDS.HOUSEHOLD_1,
  userId: '',
};

// User geography populations
export const mockUserGeographyPop: UserGeographyPopulation = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_1,
  countryId: POPULATION_COUNTRIES.US,
  scope: POPULATION_SCOPES.SUBNATIONAL as any,
  userId: POPULATION_IDS.USER_1,
  label: POPULATION_LABELS.GEOGRAPHY_LABEL,
};

export const mockUserGeographyPopNational: UserGeographyPopulation = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_2,
  countryId: POPULATION_COUNTRIES.UK,
  scope: POPULATION_SCOPES.NATIONAL as any,
  userId: POPULATION_IDS.USER_2,
};

export const mockUserGeographyPopInvalid: UserGeographyPopulation = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_EMPTY,
  countryId: POPULATION_COUNTRIES.US,
  scope: POPULATION_SCOPES.NATIONAL as any,
  userId: POPULATION_IDS.USER_1,
};

export const mockUserGeographyPopNoCountry: UserGeographyPopulation = {
  type: 'geography',
  geographyId: POPULATION_IDS.GEOGRAPHY_1,
  countryId: '',
  scope: POPULATION_SCOPES.NATIONAL as any,
  userId: POPULATION_IDS.USER_1,
};

// ============= EXPECTED RESULTS =============

// Expected API payloads
export const expectedHouseholdAPIPayload = {
  [API_PAYLOAD_KEYS.POPULATION_ID]: POPULATION_IDS.HOUSEHOLD_1,
  [API_PAYLOAD_KEYS.HOUSEHOLD_ID]: POPULATION_IDS.HOUSEHOLD_1,
};

export const expectedGeographyAPIPayload = {
  [API_PAYLOAD_KEYS.GEOGRAPHY_ID]: POPULATION_IDS.GEOGRAPHY_1,
  [API_PAYLOAD_KEYS.REGION]: POPULATION_IDS.GEOGRAPHY_1,
};

// Expected labels
export const expectedHouseholdLabel = EXPECTED_LABELS.HOUSEHOLD_DEFAULT(POPULATION_IDS.HOUSEHOLD_1);
export const expectedGeographyLabel = EXPECTED_LABELS.GEOGRAPHY_DEFAULT(POPULATION_IDS.GEOGRAPHY_1);

// Expected cache keys
export const expectedHouseholdCacheKey = EXPECTED_CACHE_KEYS.HOUSEHOLD(POPULATION_IDS.HOUSEHOLD_1);
export const expectedGeographyCacheKey = EXPECTED_CACHE_KEYS.GEOGRAPHY(POPULATION_IDS.GEOGRAPHY_1);

// Expected user population labels
export const expectedUserHouseholdLabel = POPULATION_LABELS.HOUSEHOLD_LABEL;
export const expectedUserHouseholdDefaultLabel = EXPECTED_LABELS.HOUSEHOLD_DEFAULT(
  POPULATION_IDS.HOUSEHOLD_2
);
export const expectedUserGeographyLabel = POPULATION_LABELS.GEOGRAPHY_LABEL;
export const expectedUserGeographyNationalLabel = `${EXPECTED_LABELS.NATIONAL_PREFIX}: ${POPULATION_IDS.GEOGRAPHY_2}`;
export const expectedUserGeographyRegionalLabel = `${EXPECTED_LABELS.REGIONAL_PREFIX}: ${POPULATION_IDS.GEOGRAPHY_1}`;

// ============= TEST HELPERS =============

// Helper to create a household population ref
export const createHouseholdPopRef = (householdId: string): HouseholdPopulationRef => ({
  type: 'household',
  householdId,
});

// Helper to create a geography population ref
export const createGeographyPopRef = (geographyId: string): GeographyPopulationRef => ({
  type: 'geography',
  geographyId,
});

// Helper to create a user household population
export const createUserHouseholdPop = (
  householdId: string,
  userId: string,
  label?: string
): UserHouseholdPopulation => ({
  type: 'household',
  householdId,
  userId,
  ...(label && { label }),
});

// Helper to create a user geography population
export const createUserGeographyPop = (
  geographyId: string,
  countryId: string,
  scope: 'national' | 'subnational',
  userId: string,
  label?: string
): UserGeographyPopulation => ({
  type: 'geography',
  geographyId,
  countryId,
  scope,
  userId,
  ...(label && { label }),
});

// Helper to verify API payload
export const verifyAPIPayload = (
  payload: Record<string, any>,
  expectedKeys: string[],
  expectedValues: Record<string, any>
): void => {
  expectedKeys.forEach((key) => {
    expect(payload).toHaveProperty(key);
    expect(payload[key]).toBe(expectedValues[key]);
  });
};

// Mock handler functions for testing pattern matching
export const mockHandlers = {
  household: vi.fn(),
  geography: vi.fn(),
};

// Helper to reset mock handlers
export const resetMockHandlers = (): void => {
  mockHandlers.household.mockReset();
  mockHandlers.geography.mockReset();
};

// Helper to setup mock handler returns
export const setupMockHandlerReturns = <T>(householdReturn: T, geographyReturn: T): void => {
  mockHandlers.household.mockReturnValue(householdReturn);
  mockHandlers.geography.mockReturnValue(geographyReturn);
};
