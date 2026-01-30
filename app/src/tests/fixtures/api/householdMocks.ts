import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCalculatePayload } from '@/types/payloads';

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
  household: {
    tax_benefit_model_name: 'policyengine_us',
    year: parseInt(CURRENT_YEAR),
    people: [
      {
        person_id: 0,
        name: 'person1',
        age: 30,
        employment_income: 50000,
        person_tax_unit_id: 0,
        person_household_id: 0,
      },
      {
        person_id: 1,
        name: 'person2',
        age: 28,
        employment_income: 45000,
        person_tax_unit_id: 0,
        person_household_id: 0,
      },
    ],
    tax_unit: [{ tax_unit_id: 0 }],
    household: [{ household_id: 0 }],
  },
};

export const mockHouseholdCalculatePayload: HouseholdCalculatePayload = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 25,
    },
  ],
};

// UK variant for testing different countries
export const mockHouseholdCalculatePayloadUK: HouseholdCalculatePayload = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 25,
    },
  ],
};

// Large household payload for testing complex data handling
export const mockLargeHouseholdPayload: HouseholdCalculatePayload = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 30,
      employment_income: 50000,
      person_tax_unit_id: 0,
    },
    {
      person_id: 1,
      name: 'person2',
      age: 28,
      employment_income: 45000,
      person_tax_unit_id: 0,
    },
    {
      person_id: 2,
      name: 'person3',
      age: 5,
      person_tax_unit_id: 0,
    },
    {
      person_id: 3,
      name: 'person4',
      age: 3,
      person_tax_unit_id: 0,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
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
