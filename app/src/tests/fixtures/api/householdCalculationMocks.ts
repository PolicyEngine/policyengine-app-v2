import { vi } from 'vitest';
import { HouseholdCalculationResponse } from '@/api/householdCalculation';
import { Household } from '@/types/ingredients/Household';

// Test IDs and constants
export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  EXISTING: '12345',
  NON_EXISTENT: '99999',
  LARGE_HOUSEHOLD: '67890',
} as const;

export const TEST_POLICY_IDS = {
  BASELINE: 'baseline-001',
  REFORM: 'reform-002',
  INVALID: 'invalid-999',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ERROR_MESSAGES = {
  CALCULATION_FAILED: (statusText: string) => `Household calculation failed: ${statusText}`,
  TIMEOUT: 'Household calculation timed out after 50 seconds (client-side timeout)',
  API_ERROR: 'Household calculation failed',
  NETWORK_ERROR: 'Network error',
  INVALID_PARAMETERS: 'Invalid parameters provided for household calculation',
} as const;

// Mock response helpers
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

// Mock household result
export const mockHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  countryId: 'us',
  householdData: {
    people: {
      person1: {
        age: { 2024: 30 },
        employment_income: { 2024: 50000 },
        capital_gains: { 2024: 5000 },
      },
      person2: {
        age: { 2024: 28 },
        employment_income: { 2024: 45000 },
        dividend_income: { 2024: 2000 },
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
        family_size: { 2024: 2 },
      },
    },
    tax_units: {
      tax_unit1: {
        members: ['person1', 'person2'],
        adjusted_gross_income: { 2024: 102000 },
      },
    },
    households: {
      household1: {
        members: ['person1', 'person2'],
        household_size: { 2024: 2 },
      },
    },
  },
};

// UK variant for testing different countries
export const mockHouseholdResultUK: Household = {
  id: TEST_HOUSEHOLD_IDS.EXISTING,
  countryId: 'uk',
  householdData: {
    people: {
      person1: {
        age: { 2024: 35 },
        employment_income: { 2024: 40000 },
      },
      person2: {
        age: { 2024: 33 },
        employment_income: { 2024: 35000 },
      },
    },
    benunits: {
      benunit1: {
        members: ['person1', 'person2'],
      },
    },
    households: {
      household1: {
        members: ['person1', 'person2'],
      },
    },
  },
};

// Large household for testing complex scenarios
export const mockLargeHouseholdResult: Household = {
  id: TEST_HOUSEHOLD_IDS.LARGE_HOUSEHOLD,
  countryId: 'us',
  householdData: {
    people: {
      person1: { age: { 2024: 40 }, employment_income: { 2024: 75000 } },
      person2: { age: { 2024: 38 }, employment_income: { 2024: 65000 } },
      person3: { age: { 2024: 16 } },
      person4: { age: { 2024: 14 } },
      person5: { age: { 2024: 10 } },
    },
    families: {
      family1: {
        members: ['person1', 'person2', 'person3', 'person4', 'person5'],
        family_size: { 2024: 5 },
      },
    },
    tax_units: {
      tax_unit1: {
        members: ['person1', 'person2', 'person3', 'person4', 'person5'],
        adjusted_gross_income: { 2024: 140000 },
      },
    },
    households: {
      household1: {
        members: ['person1', 'person2', 'person3', 'person4', 'person5'],
        household_size: { 2024: 5 },
      },
    },
  },
};

// Mock API responses
export const mockSuccessfulCalculationResponse: HouseholdCalculationResponse = {
  status: 'ok',
  result: mockHouseholdResult,
};

export const mockErrorCalculationResponse: HouseholdCalculationResponse = {
  status: 'error',
  result: null,
  error: ERROR_MESSAGES.INVALID_PARAMETERS,
};

export const mockUKCalculationResponse: HouseholdCalculationResponse = {
  status: 'ok',
  result: mockHouseholdResultUK,
};

// Network error mock
export const mockNetworkError = new Error(ERROR_MESSAGES.NETWORK_ERROR);

// Abort error mock for timeout testing
export const mockAbortError = (() => {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
})();
