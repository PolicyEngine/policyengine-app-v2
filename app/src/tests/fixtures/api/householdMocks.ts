import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCreationPayload } from '@/types/payloads';

// Test household IDs - descriptive names for clarity
export const EXISTING_HOUSEHOLD_ID = '12345';
export const NON_EXISTENT_HOUSEHOLD_ID = '99999';
export const NEW_HOUSEHOLD_ID = '123';

// Country codes used in tests
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Error messages that match the actual implementation
export const ERROR_MESSAGES = {
  FETCH_HOUSEHOLD_FAILED: (id: string) => `Failed to fetch household ${id}`,
  CREATE_HOUSEHOLD_FAILED: 'Failed to create household',
  NETWORK_ERROR: 'Network error',
  FAILED_TO_FETCH: 'Failed to fetch',
} as const;

export const mockHouseholdMetadata: HouseholdMetadata = {
  id: '12345',
  country_id: 'us',
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
    families: {},
    tax_units: {
      tax_unit1: {
        members: ['person1', 'person2'],
      },
    },
    spm_units: {},
    households: {
      household1: {
        members: ['person1', 'person2'],
      },
    },
    marital_units: {},
  },
  api_version: 'v1',
  household_hash: '<household_hash>',
};

export const mockHouseholdCreationPayload: HouseholdCreationPayload = {
  country_id: 'us',
  data: {
    people: {
      person1: {
        age: { [CURRENT_YEAR]: 25 },
      },
    },
    families: {},
    tax_units: {},
    spm_units: {},
    households: {},
    marital_units: {},
  },
};

// UK variant for testing different countries
export const mockHouseholdCreationPayloadUK: HouseholdCreationPayload = {
  ...mockHouseholdCreationPayload,
  country_id: 'uk',
};

// Large household payload for testing complex data handling
export const mockLargeHouseholdPayload: HouseholdCreationPayload = {
  country_id: 'us',
  data: {
    people: {
      person1: { age: { [CURRENT_YEAR]: 30 }, employment_income: { [CURRENT_YEAR]: 50000 } },
      person2: { age: { [CURRENT_YEAR]: 28 }, employment_income: { [CURRENT_YEAR]: 45000 } },
      person3: { age: { [CURRENT_YEAR]: 5 } },
      person4: { age: { [CURRENT_YEAR]: 3 } },
    },
    families: {},
    spm_units: {},
    households: {},
    marital_units: {},
    tax_units: {
      unit1: { members: ['person1', 'person2', 'person3', 'person4'] },
    },
  },
};

export const mockCreateHouseholdResponse = {
  result: {
    household_id: NEW_HOUSEHOLD_ID,
  },
};

// Mock fetch responses
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: HTTP_STATUS.OK,
  json: vi.fn().mockResolvedValue(data),
});

export const mockErrorResponse = (status: number) => ({
  ok: false,
  status,
  statusText: status === HTTP_STATUS.NOT_FOUND ? 'Not Found' : 'Error',
});

export const mockNetworkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);
export const mockFetchError = new Error(ERROR_MESSAGES.FAILED_TO_FETCH);
